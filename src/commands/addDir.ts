import type { Command } from '../commands.js';
import { stat } from 'node:fs/promises';
import { t } from '../utils/i18n.js';

export const addDirCommand: Command = {
  name: 'add-dir',
  description: 'Add a working directory',
  arguments: [{ name: 'path', description: 'Directory path to add', required: true }],
  isEnabled: () => true,
  call: async (args, context) => {
    const dir = args.trim();
    if (!dir) return t(context.language, 'cmd_add_dir_usage');
    try {
      const s = await stat(dir);
      if (!s.isDirectory()) return t(context.language, 'cmd_add_dir_not_found') + dir;
      return t(context.language, 'cmd_add_dir_added') + dir;
    } catch {
      return t(context.language, 'cmd_add_dir_not_found') + dir;
    }
  },
};
