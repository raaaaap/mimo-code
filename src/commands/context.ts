import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const contextCommand: Command = {
  name: 'context',
  description: 'Show current context window status',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_context_active') + '\n' + t(context.language, 'cmd_context_hint');
  },
};
