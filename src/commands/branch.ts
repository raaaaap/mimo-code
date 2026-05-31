import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';
import { t } from '../utils/i18n.js';

export const branchCommand: Command = {
  name: 'branch',
  description: 'Show or switch git branches',
  arguments: [{ name: 'name', description: 'Branch name to switch to', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const branch = args.trim();
    if (!branch) {
      try {
        const current = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
        const branches = execSync('git branch --format="%(refname:short)"', { encoding: 'utf-8' }).trim();
        return t(context.language, 'cmd_branch_current') + current + '\n\nAll branches:\n' + branches;
      } catch {
        return t(context.language, 'cmd_branch_not_git');
      }
    }
    try {
      execSync(`git checkout ${branch}`, { encoding: 'utf-8', timeout: 5000 });
      return t(context.language, 'cmd_branch_switched') + branch;
    } catch (e: any) {
      return t(context.language, 'cmd_branch_failed') + e.message;
    }
  },
};
