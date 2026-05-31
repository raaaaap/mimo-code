import type { Command } from '../commands.js';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const historyCommand: Command = {
  name: 'history',
  description: 'Show session history',
  isEnabled: () => true,
  call: async () => {
    try {
      const sessionDir = join(homedir(), '.mimo', 'sessions');
      const files = await readdir(sessionDir);
      if (files.length === 0) return 'No session history found.';
      const recent = files.slice(-5).reverse();
      return 'Recent sessions:\n  ' + recent.join('\n  ') + '\n\nUse /resume to continue a session.';
    } catch {
      return 'No session history found.';
    }
  },
};
