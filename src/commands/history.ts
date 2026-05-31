import type { Command } from '../commands.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { t } from '../utils/i18n.js';

export const historyCommand: Command = {
  name: 'history',
  description: 'Show session history',
  isEnabled: () => true,
  call: async (args, context) => {
    try {
      const sessionDir = join(homedir(), '.mimo', 'sessions');
      const files = await readdir(sessionDir);
      if (files.length === 0) return t(context.language, 'cmd_history_empty');
      const recent = files.slice(-5).reverse();
      return 'Recent sessions:\n  ' + recent.join('\n  ') + '\n\n' + t(context.language, 'cmd_history_hint');
    } catch {
      return t(context.language, 'cmd_history_empty');
    }
  },
};
