import type { Skill } from '../types.js';

export function createReviewSkill(): Skill {
  return {
    name: 'review',
    description: 'Review code changes',
    getPromptForCommand(args: string): string {
      return [
        'Review the code changes for:',
        '- Correctness and logic errors',
        '- Code style and conventions',
        '- Performance implications',
        '- Security concerns',
        '- Test coverage',
        '',
        `Target: ${args || 'the current changes'}`,
        '',
        'Provide actionable feedback.',
      ].join('\n');
    },
  };
}
