import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const prCommentsCommand: Command = {
  name: 'pr_comments',
  description: 'Show PR comments',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_pr_comments_hint');
  },
};
