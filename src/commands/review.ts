import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';

export const reviewCommand: Command = {
  name: 'review',
  description: 'Review recent changes',
  isEnabled: () => true,
  call: async () => {
    try {
      const diff = execSync('git diff --stat HEAD~1', { encoding: 'utf-8', timeout: 5000 });
      return `Recent changes:\n${diff}\nUse /diff for full diff.`;
    } catch {
      return 'No recent changes found or not a git repository.';
    }
  },
};
