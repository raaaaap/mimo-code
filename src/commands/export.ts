import { writeFileSync } from 'fs';
import { join } from 'path';
import type { Command } from '../commands.js';

export const exportCommand: Command = {
  name: 'export',
  aliases: ['exp'],
  description: 'Export the conversation to a markdown file',
  arguments: [
    { name: 'filename', description: 'Output filename (default: conversation.md)', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const filename = args.trim() || 'conversation.md';
    const outPath = join(process.cwd(), filename);

    const content = [
      '# Conversation Export',
      '',
      `> Exported on ${new Date().toISOString()}`,
      '',
      '---',
      '',
      '_Conversation content would be written here._',
      '',
    ].join('\n');

    try {
      writeFileSync(outPath, content, 'utf-8');
      return `Conversation exported to: ${outPath}`;
    } catch (err: any) {
      return `Export failed: ${err.message}`;
    }
  },
};
