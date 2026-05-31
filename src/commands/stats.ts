import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const statsCommand: Command = {
  name: 'stats',
  description: 'Show session statistics',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_stats_title') + '\n  Messages: (tracking)\n  Tokens used: (tracking)\n  Tools called: (tracking)';
  },
};
