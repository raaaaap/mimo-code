import type { Skill } from '../types.js';

export function createRememberSkill(): Skill {
  return {
    name: 'remember',
    description: 'Save a user preference or fact to memory for future sessions',
    aliases: ['rem', 'note'],
    getPromptForCommand(args: string): string {
      return [
        'The user wants you to remember something for future sessions.',
        `Remember this preference/fact: ${args}`,
        '',
        'Acknowledge that you have noted this, and briefly confirm what you will remember.',
      ].join('\n');
    },
  };
}
