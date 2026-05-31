import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';

export const branchCommand: Command = {
  name: 'branch',
  description: 'Show or switch git branches',
  arguments: [{ name: 'name', description: 'Branch name to switch to', required: false }],
  isEnabled: () => true,
  call: async (args) => {
    const branch = args.trim();
    if (!branch) {
      try {
        const current = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
        const branches = execSync('git branch --format="%(refname:short)"', { encoding: 'utf-8' }).trim();
        return `Current branch: ${current}\n\nAll branches:\n${branches}`;
      } catch {
        return 'Not a git repository.';
      }
    }
    try {
      execSync(`git checkout ${branch}`, { encoding: 'utf-8', timeout: 5000 });
      return `Switched to branch: ${branch}`;
    } catch (e: any) {
      return `Failed to switch branch: ${e.message}`;
    }
  },
};
