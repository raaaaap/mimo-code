import type { Command } from '../commands.js';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize project configuration',
  isEnabled: () => true,
  call: async () => {
    return 'To initialize, create a .mimo/settings.json in your project root.\nSee README for configuration options.';
  },
};
