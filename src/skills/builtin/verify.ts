import type { Skill } from '../types.js';

export function createVerifySkill(): Skill {
  return {
    name: 'verify',
    description: 'Verify implementation against requirements',
    getPromptForCommand(args: string): string {
      return [
        'Verify the implementation against the stated requirements.',
        'Check for correctness, edge cases, and completeness.',
        `Requirements: ${args || 'no specific requirements provided'}`,
        '',
        'Report any gaps or issues found.',
      ].join('\n');
    },
  };
}
