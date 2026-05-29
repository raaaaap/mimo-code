import type { Command } from '../commands.js';

export const planCommand: Command = {
  name: 'plan',
  aliases: ['p'],
  description: 'Enter plan mode — analyze and plan without executing',
  arguments: [
    { name: 'task', description: 'What to plan', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const task = args.trim();
    if (!task) {
      return [
        'Plan Mode',
        '=========',
        'Enter plan mode to analyze and plan without executing changes.',
        'Usage: /plan <task description>',
        '',
        'Example: /plan refactor the auth module to use JWT',
      ].join('\n');
    }

    return [
      `Planning: ${task}`,
      '',
      'Plan mode is a stub — full implementation coming soon.',
      'For now, describe your task in the prompt and I will plan it out.',
    ].join('\n');
  },
};
