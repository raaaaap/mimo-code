import type { Skill } from '../types.js';

export function createSimplifySkill(): Skill {
  return {
    name: 'simplify',
    description: 'Simplify and refactor the given code for readability and maintainability',
    aliases: ['refactor', 'clean'],
    getPromptForCommand(args: string): string {
      return [
        'Simplify and refactor the following code.',
        'Focus on:',
        '- Reducing unnecessary complexity',
        '- Improving readability',
        '- Removing dead code',
        '- Using idiomatic patterns',
        '',
        `Target: ${args || 'the current file or selection'}`,
        '',
        'Explain each change briefly.',
      ].join('\n');
    },
  };
}
