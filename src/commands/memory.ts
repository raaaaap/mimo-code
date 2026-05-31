import type { Command } from '../commands.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { t } from '../utils/i18n.js';

const MEMORY_PATH = join(homedir(), '.mimo', 'memory.md');

export const memoryCommand: Command = {
  name: 'memory',
  description: 'View or edit persistent memory',
  arguments: [{ name: 'action', description: 'show, add <text>, or clear', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const parts = args.trim().split(/\s+/);
    const action = parts[0] || 'show';

    if (action === 'show') {
      try {
        const content = await readFile(MEMORY_PATH, 'utf-8');
        return content ? `Memory:\n${content}` : t(context.language, 'cmd_memory_empty');
      } catch { return t(context.language, 'cmd_memory_empty'); }
    }

    if (action === 'add') {
      const text = parts.slice(1).join(' ');
      if (!text) return t(context.language, 'cmd_memory_usage');
      await mkdir(join(homedir(), '.mimo'), { recursive: true });
      let existing = '';
      try { existing = await readFile(MEMORY_PATH, 'utf-8'); } catch {}
      await writeFile(MEMORY_PATH, existing + (existing ? '\n' : '') + '- ' + text, 'utf-8');
      return t(context.language, 'cmd_memory_added') + text;
    }

    if (action === 'clear') {
      await writeFile(MEMORY_PATH, '', 'utf-8');
      return t(context.language, 'cmd_memory_cleared');
    }

    return t(context.language, 'cmd_memory_usage');
  },
};
