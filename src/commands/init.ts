import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize project configuration',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_init_instructions');
  },
};
