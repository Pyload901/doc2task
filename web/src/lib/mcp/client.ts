import { spawn, ChildProcess } from 'child_process';
import { MCP_SERVERS } from './servers';

export interface McpServerConfig {
  platform: string;
  package: string;
  envVars: Record<string, string>;
}

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  success: boolean;
  result?: string;
  error?: string;
}

class McpClient {
  private process: ChildProcess | null = null;
  private requestId = 0;
  private pendingRequests = new Map<string, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private messageBuffer = '';
  private tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> = [];

  async connect(config: McpServerConfig): Promise<void> {
    const envVars: Record<string, string> = {};
    if (process.env) {
      for (const key of Object.keys(process.env)) {
        if (process.env[key]) {
          envVars[key] = process.env[key]!;
        }
      }
    }
    for (const key of Object.keys(config.envVars)) {
      envVars[key] = config.envVars[key];
    }

    const platformConfig = MCP_SERVERS[config.platform];
    const args = platformConfig?.getArgs ? platformConfig.getArgs(config.envVars) : ['stdio'];

    return new Promise((resolve, reject) => {
      this.process = spawn('uvx', [config.package, ...args], {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        env: envVars as any,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      this.process.stdout?.on('data', (data: Buffer) => {
        this.handleMessage(data.toString());
      });

      this.process.stderr?.on('data', (data: Buffer) => {
        console.error('MCP stderr:', data.toString());
      });

      this.process.on('error', (error) => {
        reject(error);
      });

      this.process.on('exit', (code) => {
        console.log('MCP process exited with code:', code);
      });

      setTimeout(() => {
        this.initialize().then(() => resolve()).catch(reject);
      }, 1000);
    });
  }

  private async initialize(): Promise<void> {
    await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'doc2task', version: '1.0.0' },
    });

    await this.sendNotification('notifications/initialized', {});
    
    const toolsResponse = await this.sendRequest('tools/list', {});
    this.tools = (toolsResponse as { tools: Array<{ name: string; description: string; inputSchema: Record<string, unknown> }> }).tools || [];
  }

  private handleMessage(data: string): void {
    this.messageBuffer += data;
    const messages = this.messageBuffer.split('\n');
    this.messageBuffer = messages.pop() || '';

    for (const msg of messages) {
      if (!msg.trim()) continue;
      
      try {
        const parsed = JSON.parse(msg);
        
        if (parsed.id && this.pendingRequests.has(parsed.id)) {
          const { resolve, reject } = this.pendingRequests.get(parsed.id)!;
          this.pendingRequests.delete(parsed.id);
          
          if (parsed.error) {
            reject(new Error(parsed.error.message || 'MCP error'));
          } else {
            resolve(parsed.result);
          }
        }
      } catch {
        console.error('Failed to parse MCP message:', msg);
      }
    }
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = String(++this.requestId);
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      const message = JSON.stringify({
        jsonrpc: '2.0',
        id,
        method,
        params,
      });

      this.process?.stdin?.write(message + '\n');

      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request ${method} timed out`));
        }
      }, 60000);
    });
  }

  private async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    const message = JSON.stringify({
      jsonrpc: '2.0',
      method,
      params,
    });

    this.process?.stdin?.write(message + '\n');
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const result = await this.sendRequest('tools/call', {
        name,
        arguments: args,
      });

      const response = result as { content?: Array<{ text?: string }> };
      
      if (response.content && response.content.length > 0) {
        return {
          success: true,
          result: response.content[0].text || '',
        };
      }

      return { success: true, result: '' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  getTools() {
    return this.tools;
  }

  async disconnect(): Promise<void> {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}

export async function executeMcpTool(
  config: McpServerConfig,
  toolName: string,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const client = new McpClient();
  
  try {
    await client.connect(config);
    return await client.callTool(toolName, args);
  } finally {
    await client.disconnect();
  }
}

export { McpClient };
