import type { ModelRequest, StreamChunk } from '../types/api.js';

export interface PipeModeOptions {
  model: string;
  maxTokens: number;
  temperature: number;
  systemPrompt?: string;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  print: (text: string) => void;
  readStdin?: () => Promise<string>;
}

async function defaultReadStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8').trim();
}

export async function runPipeMode(options: PipeModeOptions): Promise<number> {
  const { model, maxTokens, temperature, systemPrompt, callModel, print, readStdin } = options;

  const input = await (readStdin ?? defaultReadStdin)();
  if (!input) {
    print('Error: No input from stdin');
    return 1;
  }

  try {
    const request: ModelRequest = {
      model,
      messages: [{ role: 'user', content: input }],
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
