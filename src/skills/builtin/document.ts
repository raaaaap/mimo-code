import type { Skill } from '../types.js';

export function createDocumentSkill(): Skill {
  return {
    name: 'document',
    description: 'Generate documentation',
    aliases: ['doc'],
    getPromptForCommand(args: string): string {
      return [
        'Generate documentation for the specified code.',
        'Include:',
        '- Overview and purpose',
        '- API reference (parameters, return values)',
        '- Usage examples',
        '- Any important caveats',
        '',
        `Target: ${args || 'the current file or selection'}`,
      ].join('\n');
    },
  };
}
