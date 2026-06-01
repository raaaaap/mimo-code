import type { Skill } from '../types.js';

export function createTestSkill(): Skill {
  return {
    name: 'test',
    description: 'Write and run tests',
    getPromptForCommand(args: string): string {
      return [
        'Write and run tests for the specified code.',
        'Focus on:',
        '- Unit tests for core logic',
        '- Edge cases and error handling',
        '- Integration points',
        '',
        `Target: ${args || 'the current file or selection'}`,
        '',
        'Run the tests and report results.',
      ].join('\n');
    },
  };
}
