import type { Command } from '../commands.js';
import { t } from '../utils/i18n.js';

export const feedbackCommand: Command = {
  name: 'feedback',
  description: 'Send feedback about MiMo Code',
  isEnabled: () => true,
  call: async (args, context) => {
    return t(context.language, 'cmd_feedback_url');
  },
};
