import type { Command } from '../commands.js';

export const issueCommand: Command = {
  name: 'issue',
  description: 'Report an issue',
  isEnabled: () => true,
  call: async () => {
    return 'To report an issue, please visit:\nhttps://github.com/raaaaap/mimo-code/issues/new';
  },
};
