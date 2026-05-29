import type { Command } from '../commands.js';

export const skillsCommand: Command = {
  name: 'skills',
  aliases: ['sk'],
  description: 'List available skills and slash commands',
  isEnabled: () => true,
  call: async () => {
    return [
      'Available Skills & Commands',
      '==========================',
      '',
      'Built-in commands:',
      '  /commit       — Git add + commit',
      '  /diff         — Show git diff',
      '  /doctor       — Environment health check',
      '  /model        — Show/switch model',
      '  /theme        — Show/switch theme',
      '  /usage        — Token usage stats',
      '  /status       — Session status',
      '  /permissions  — Permission mode',
      '  /plan         — Enter plan mode',
      '  /export       — Export conversation',
      '  /rename       — Rename session',
      '  /session      — Session management',
      '  /mcp          — MCP server management',
      '  /skills       — This list',
      '  /tasks        — Background tasks',
      '',
      'Type /help for general help.',
    ].join('\n');
  },
};
