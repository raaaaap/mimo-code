import type { Skill } from '../types.js';

export function createLoopSkill(): Skill {
  return {
    name: 'loop',
    description: 'Run a task in a loop with intervals',
    getPromptForCommand(args: string): string {
      return [
        'Set up and run a recurring task.',
        'Define the task, interval, and stopping condition.',
        `Task: ${args || 'no specific task provided'}`,
        '',
        'Explain the loop plan and execute it.',
      ].join('\n');
    },
  };
}
