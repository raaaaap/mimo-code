import type { Skill } from '../types.js';

export function createBatchSkill(): Skill {
  return {
    name: 'batch',
    description: 'Apply batch changes to multiple files',
    getPromptForCommand(args: string): string {
      return [
        'Apply batch changes to multiple files.',
        'Plan the changes first, then apply them systematically.',
        `Operation: ${args || 'no specific operation provided'}`,
        '',
        'For each file, show the planned change before applying it.',
      ].join('\n');
    },
  };
}
