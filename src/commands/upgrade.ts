import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const upgradeCommand: Command = {
  name: 'upgrade',
  description: 'Check for updates',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_upgrade_current') + '\n' + t(context.language, 'cmd_upgrade_url');
  },
};
