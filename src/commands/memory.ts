import type { Command } from '../commands.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const MEMORY_PATH = join(homedir(), '.mimo', 'memory.md');

export const memoryCommand: Command = {
  name: 'memory',
  description: 'View or edit persistent memory',
  arguments: [{ name: 'action', description: 'show, add <text>, or clear', required: false }],
  isEnabled: () => true,
  call: async (args) => {
    const parts = args.trim().split(/\s+/);
    const action = parts[0] || 'show';

    if (action === 'show') {
      try {
        const content = await readFile(MEMORY_PATH, 'utf-8');
        return content ? `Memory:\n${content}` : 'Memory is empty.';
      } catch { return 'Memory is empty.'; }
    }

    if (action === 'add') {
      const text = parts.slice(1).join(' ');
      if (!text) return 'Usage: /memory add <text>';
      await mkdir(join(homedir(), '.mimo'), { recursive: true });
      let existing = '';
      try { existing = await readFile(MEMORY_PATH, 'utf-8'); } catch {}
      await writeFile(MEMORY_PATH, existing + (existing ? '\n' : '') + '- ' + text, 'utf-8');
      return `Added to memory: ${text}`;
    }

    if (action === 'clear') {
      await writeFile(MEMORY_PATH, '', 'utf-8');
      return 'Memory cleared.';
    }

    return 'Usage: /memory [show|add <text>|clear]';
  },
};
