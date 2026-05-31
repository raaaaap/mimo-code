import type { Command } from '../commands.js';
import { stat } from 'node:fs/promises';

export const addDirCommand: Command = {
  name: 'add-dir',
  description: 'Add a working directory',
  arguments: [{ name: 'path', description: 'Directory path to add', required: true }],
  isEnabled: () => true,
  call: async (args) => {
    const dir = args.trim();
    if (!dir) return 'Usage: /add-dir <path>';
    try {
      const s = await stat(dir);
      if (!s.isDirectory()) return `Not a directory: ${dir}`;
      return `Added working directory: ${dir}`;
    } catch {
      return `Directory not found: ${dir}`;
    }
  },
};
