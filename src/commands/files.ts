import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const filesCommand: Command = {
  name: 'files',
  description: 'List files modified in this session',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_files_none');
  },
};
