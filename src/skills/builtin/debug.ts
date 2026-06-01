import type { Skill } from '../types.js';

export function createDebugSkill(): Skill {
  return {
    name: 'debug',
    description: 'Debug an issue systematically',
    aliases: ['dbg'],
    getPromptForCommand(args: string): string {
      return [
        'Debug the following issue systematically.',
        'Steps:',
        '1. Reproduce the issue',
        '2. Identify the root cause',
        '3. Propose and implement a fix',
        '4. Verify the fix works',
        '',
        `Issue: ${args || 'no specific issue provided'}`,
      ].join('\n');
    },
  };
}
