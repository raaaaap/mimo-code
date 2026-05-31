import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const copyCommand: Command = {
  name: 'copy',
  description: 'Copy last response to clipboard',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_copy_unsupported');
  },
};
