import OpenAI from 'openai';
import { ChatCompletionMessage, ChatCompletionMessageParam } from 'openai/resources';

export interface AIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ProcessResult {
  success: boolean;
  result?: ChatCompletionMessage;
  error?: string;
}

export async function processWithAI(
  messages: ChatCompletionMessageParam[],
  config: AIConfig,
  tools: any = null
): Promise<ProcessResult> {
  try {
    const client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      temperature: 0.7,
      tools,
      tool_choice: 'auto'
    });

    const result = response.choices[0]?.message;

    if (!result) {
      return { success: false, error: 'No response from AI' };
    }

    // let parsedResult: Record<string, unknown>;
    // try {
    //   const jsonMatch = result.match(/```json\n([\s\S]*?)\n```/);
    //   if (jsonMatch) {
    //     parsedResult = JSON.parse(jsonMatch[1]);
    //   } else {
    //     parsedResult = { rawResponse: result };
    //   }
    // } catch {
    //   parsedResult = { rawResponse: result };
    // }

    return { success: true, result };
  } catch (error) {
    console.error('AI processing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
