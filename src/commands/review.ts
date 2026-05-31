import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';
import { t } from '../utils/i18n.js';

export const reviewCommand: Command = {
  name: 'review',
  description: 'Review recent changes',
  isEnabled: () => true,
  call: async (args, context) => {
    try {
      const diff = execSync('git diff --stat HEAD~1', { encoding: 'utf-8', timeout: 5000 });
      return `Recent changes:\n${diff}\n` + t(context.language, 'cmd_review_hint');
    } catch {
      return t(context.language, 'cmd_review_no_changes');
    }
  },
};
