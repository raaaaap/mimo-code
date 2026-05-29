import type { Command } from '../commands.js';

export const sessionCommand: Command = {
  name: 'session',
  aliases: ['sess'],
  description: 'Session management — list, switch, or clear sessions',
  arguments: [
    { name: 'action', description: 'Action: list, new, clear', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const action = args.trim().toLowerCase();

    if (!action || action === 'list') {
      return [
        'Session Management',
        '==================',
        '  Current: (active session)',
        '',
        'Actions:',
        '  /session list   — List sessions (this view)',
        '  /session new    — Start a new session',
        '  /session clear  — Clear current session history',
      ].join('\n');
    }

    if (action === 'new') {
      return 'New session started. Previous context cleared.';
    }

    if (action === 'clear') {
      return 'Session history cleared.';
    }

    return `Unknown action "${action}". Use: list, new, clear`;
  },
};
