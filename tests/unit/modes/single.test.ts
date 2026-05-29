import { describe, it, expect } from 'vitest';
import { runSingleMode } from '../../../src/modes/single.js';

describe('runSingleMode', () => {
  it('calls model once and prints result', async () => {
    const mockCallModel = async function* () {
      yield { type: 'text' as const, content: 'Hello world' };
      yield { type: 'done' as const, finishReason: 'stop' };
    };
    const output: string[] = [];

    const exitCode = await runSingleMode({
      prompt: 'say hello',
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      systemPrompt: 'You are helpful.',
      callModel: mockCallModel as any,
      print: (text: string) => output.push(text),
    });

    expect(output.join('')).toContain('Hello world');
    expect(exitCode).toBe(0);
  });

  it('exits with code 1 on error', async () => {
    const mockCallModel = async function* () {
      yield { type: 'error' as const, content: 'API failed' };
    };

    const exitCode = await runSingleMode({
      prompt: 'test',
      model: 'mimo-large',
      maxTokens: 4096,
      temperature: 0.7,
      callModel: mockCallModel as any,
      print: () => {},
    });

    expect(exitCode).toBe(1);
  });
});
