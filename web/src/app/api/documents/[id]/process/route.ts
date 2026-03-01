import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { processWithAI } from '@/lib/ai';
import { decrypt } from '@/lib/encryption';
import { MCP_SERVERS } from '@/lib/mcp/servers';
import { McpClient } from '@/lib/mcp/client';
import { TaskPlatform, Prisma } from '@prisma/client';
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role === 'USER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { platform, apiKeyId } = body;

    if (!apiKeyId) {
      return NextResponse.json({ error: 'API key selection is required' }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    await prisma.document.update({
      where: { id },
      data: { status: 'PROCESSING' },
    });

    const selectedKey = await prisma.apiKey.findFirst({
      where: { id: apiKeyId, userId: session.user.id },
    });

    if (!selectedKey) {
      await prisma.document.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'Selected API key not found' }, { status: 404 });
    }

    let apiKeyData: { apiKey: string; baseUrl: string; model: string } | null = null;

    if (selectedKey.provider === 'CUSTOM_MODEL') {
      try {
        const config = JSON.parse(decrypt(selectedKey.encryptedKey));
        apiKeyData = {
          apiKey: config.apiKey || decrypt(selectedKey.encryptedKey),
          baseUrl: config.baseUrl || 'https://api.deepseek.com',
          model: config.model || 'deepseek-chat'
        };
      } catch {
        apiKeyData = {
          apiKey: decrypt(selectedKey.encryptedKey),
          baseUrl: 'https://api.deepseek.com',
          model: 'deepseek-chat'
        };
      }
    } else if (selectedKey.provider === 'OPENAI') {
      apiKeyData = {
        apiKey: decrypt(selectedKey.encryptedKey),
        baseUrl: 'https://api.openai.com',
        model: 'gpt-4o'
      };
    } else {
      apiKeyData = {
        apiKey: decrypt(selectedKey.encryptedKey),
        baseUrl: 'https://api.openai.com',
        model: 'gpt-4o'
      };
    }

    console.log(`Using AI provider: ${selectedKey.provider} (key: ${selectedKey.name})`);

    const promptTemplate = await prisma.promptTemplate.findFirst({
      where: { userId: session.user.id, isDefault: true },
    });

    if (!promptTemplate) {
      await prisma.document.update({
        where: { id },
        data: { status: 'FAILED' },
      });
      return NextResponse.json({ error: 'No prompt template configured. Please create a prompt in Settings > Prompts.' }, { status: 400 });
    }

    const mcpConfig = await prisma.mcpConfig.findFirst({
      where: { userId: session.user.id, platform, isActive: true },
    });

    if (!mcpConfig) {
      return NextResponse.json({
        message: 'Document processed successfully',
        result: '',
        warning: 'MCP not configured for this platform',
      });
    }

    const envVars = mcpConfig.envVars as Record<string, string>;
    const mcpServerInfo = MCP_SERVERS[platform as keyof typeof MCP_SERVERS];

    if (!mcpServerInfo) {
      return NextResponse.json({
        message: 'Document processed successfully',
        result: '',
        warning: 'Unknown platform',
      });
    }

    const client = new McpClient();
    
    try {
      await client.connect({
        platform,
        package: mcpServerInfo.package,
        envVars,
      });

      const tools = client.getTools().map(tool => ({
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }));
      const messages:ChatCompletionMessageParam[] = [
        { role: 'system', content: promptTemplate.content },
        { role: 'user', content: `Document content:\n\n${document.content}` },
      ];
      while (true) {
        const aiCall = await processWithAI(
          messages,
          {
            apiKey: apiKeyData.apiKey,
            baseUrl: apiKeyData.baseUrl,
            model: apiKeyData.model,
          },
          tools
        );

        if (!aiCall.success) {
          await prisma.document.update({
            where: { id },
            data: { status: 'FAILED', result: { error: aiCall.error } },
          });
          return NextResponse.json({ error: aiCall.error }, { status: 500 });
        }
        
        // console.log('AI call result:', aiCall.result);

        // Build the assistant message; only include tool_calls when present to avoid API errors
        const new_msg: ChatCompletionMessageParam = {
          role: 'assistant',
          content: aiCall.result!.content || '',
          ...(aiCall.result!.tool_calls && aiCall.result!.tool_calls.length > 0 && {
            tool_calls: aiCall.result!.tool_calls,
          }),
        };
        messages.push(new_msg);

        // No more tool calls → agent finished
        if (!aiCall.result?.tool_calls || aiCall.result.tool_calls.length === 0) {
          break;
        }

        // Execute each tool call and feed the result back into the conversation
        for (const toolCall of aiCall.result.tool_calls) {
          // Narrow to standard function tool calls (ignores custom tool call variants)
          if (toolCall.type !== 'function') continue;
          
          let parsedArgs: any = {};
          try {
            parsedArgs = JSON.parse(toolCall.function.arguments);
          } catch (e) {
            console.error('Failed to parse args for tool:', toolCall.function.name);
          }

          const task = await prisma.task.create({
            data: {
              documentId: id,
              userId: session.user.id,
              platform: platform as TaskPlatform,
              status: 'PENDING',
              result: {
                action: toolCall.function.name,
                payload: parsedArgs,
              } as Prisma.JsonObject,
            },
          });

          // toolCall is ChatCompletionMessageToolCall: { id, type, function: { name, arguments } }
          // .function.arguments is a JSON string, so it must be parsed before passing to callTool
          const toolResult = await client.callTool(
            toolCall.function.name,
            parsedArgs
          );

          let externalId: string | undefined = undefined;
          if (toolResult.success && typeof toolResult.result === 'string') {
            // Attempt to extract issue ID like "PROJ-123" from result text for Jira/similar
            const match = toolResult.result.match(/[A-Z][A-Z0-9]+-\d+/);
            if (match) {
              externalId = match[0];
            }
          }

          await prisma.task.update({
            where: { id: task.id },
            data: {
              status: toolResult.success ? 'CREATED' : 'FAILED',
              externalId: externalId,
              result: {
                action: toolCall.function.name,
                payload: parsedArgs,
                response: toolResult.result || toolResult.error || 'No content provided by server',
              } as Prisma.JsonObject,
            },
          });

          messages.push({
            role: 'tool',
            tool_call_id: toolCall.id,   // required by ChatCompletionToolMessageParam
            content: JSON.stringify(toolResult),
          });
        }
      }

      await prisma.document.update({
        where: { id },
        data: { status: 'COMPLETED' },
      });

      return NextResponse.json({
        message: 'Document processed and tasks created by agent',
        result: 'Agent completed successfully',
      });
    } finally {
      await client.disconnect();
    }
  } catch (error) {
    console.error('Process error:', error);
    
    const { id } = await params;
    await prisma.document.update({
      where: { id },
      data: { status: 'FAILED' },
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
