import type { ModelRequest, StreamChunk } from '../types/api.js';

export interface SingleModeOptions {
  prompt: string;
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  print: (text: string) => void;
}

export async function runSingleMode(options: SingleModeOptions): Promise<number> {
  const { prompt, model, maxTokens, temperature, systemPrompt, callModel, print } = options;

  try {
    const request: ModelRequest = {
      model,
      messages: [{ role: 'user', content: prompt }],
      system: systemPrompt,
      maxTokens,
      temperature,
      stream: true,
    };

    for await (const chunk of callModel(request)) {
      if (chunk.type === 'text' && chunk.content) {
        print(chunk.content);
      }
      if (chunk.type === 'error') {
        print(`Error: ${chunk.content}`);
        return 1;
      }
      if (chunk.type === 'done') {
        break;
      }
    }

    return 0;
  } catch (error) {
    print(`Error: ${error instanceof Error ? error.message : String(error)}`);
    return 1;
  }
}
