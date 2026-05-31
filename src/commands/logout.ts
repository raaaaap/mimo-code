import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const logoutCommand: Command = {
  name: 'logout',
  description: 'Clear authentication',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_logout_instructions');
  },
};
