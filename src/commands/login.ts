import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const loginCommand: Command = {
  name: 'login',
  description: 'Authenticate with MiMo API',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_login_instructions');
  },
};
