import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const issueCommand: Command = {
  name: 'issue',
  description: 'Report an issue',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_issue_url');
  },
};
