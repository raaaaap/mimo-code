import type { Command } from '../commands.js';

export const statsCommand: Command = {
  name: 'stats',
  description: 'Show session statistics',
  isEnabled: () => true,
  call: async () => {
    return 'Session statistics:\n  Messages: (tracking)\n  Tokens used: (tracking)\n  Tools called: (tracking)';
  },
};
