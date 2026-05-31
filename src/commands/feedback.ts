import type { Command } from '../commands.js';

export const feedbackCommand: Command = {
  name: 'feedback',
  description: 'Send feedback about MiMo Code',
  isEnabled: () => true,
  call: async () => {
    return 'Thank you for your feedback! Please visit: https://github.com/raaaaap/mimo-code/issues';
  },
};
