import type { Skill } from '../types.js';

export function createRefactorSkill(): Skill {
  return {
    name: 'refactor',
    description: 'Refactor code with best practices',
    getPromptForCommand(args: string): string {
      return [
        'Refactor the code following best practices.',
        'Focus on:',
        '- Single responsibility principle',
        '- Reducing duplication',
        '- Improving naming and readability',
        '- Extracting reusable components',
        '',
        `Target: ${args || 'the current file or selection'}`,
        '',
        'Explain each refactoring decision.',
      ].join('\n');
    },
  };
}
