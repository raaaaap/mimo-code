import { execSync } from 'child_process';
import type { Command } from '../commands.js';

export const diffCommand: Command = {
  name: 'diff',
  aliases: ['d'],
  description: 'Show git diff of working tree changes',
  options: [
    { name: 'staged', short: 's', description: 'Show staged changes', type: 'boolean', default: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const staged = args.trim().includes('--staged') || args.trim().includes('-s');
    const cmd = staged ? 'git diff --staged' : 'git diff';
    try {
      const result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 1024 * 1024 });
      return result.trim() || (staged ? 'No staged changes.' : 'No unstaged changes.');
    } catch (err: any) {
      return `Error running diff: ${err.message}`;
    }
  },
};
