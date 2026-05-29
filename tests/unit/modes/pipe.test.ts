import { describe, it, expect } from 'vitest';
import { runPipeMode } from '../../../src/modes/pipe.js';

describe('runPipeMode', () => {
  it('reads from stdin and prints model response', async () => {
    const mockCallModel = async function* () {
      yield { type: 'text' as const, content: 'Response text' };
      yield { type: 'done' as const, finishReason: 'stop' };
    };
    const output: string[] = [];

    const exitCode = await runPipeMode({
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: mockCallModel as any,
      print: (text: string) => output.push(text),
      readStdin: async () => 'stdin content here',
    });

    expect(output.join('')).toContain('Response text');
    expect(exitCode).toBe(0);
  });

  it('returns 1 on empty stdin', async () => {
    const exitCode = await runPipeMode({
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: async function* () {} as any,
      print: () => {},
      readStdin: async () => '',
    });

    expect(exitCode).toBe(1);
  });
});
