import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const sandboxCommand: Command = {
  name: 'sandbox-toggle',
  description: 'Toggle sandbox mode',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_sandbox_toggled') + '\n' + t(context.language, 'cmd_sandbox_hint');
  },
};
