import type { Command } from '../commands.js';

export const prCommentsCommand: Command = {
  name: 'pr_comments',
  description: 'Show PR comments',
  isEnabled: () => true,
  call: async () => {
    return 'PR comments viewing requires GitHub integration.\nUse: gh pr view --comments';
  },
};
