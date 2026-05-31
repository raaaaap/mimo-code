import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const skillsCommand: Command = {
  name: 'skills',
  aliases: ['sk'],
  description: 'List available skills and slash commands',
  isEnabled: () => true,
  call: async (args, context) => {
    const lines = [
      context.language === 'zh-CN' ? '可用技能与命令：' :
      context.language === 'ja' ? '利用可能なスキルとコマンド：' :
      'Available Skills & Commands',
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
      context.language === 'zh-CN' ? '输入 /help 查看帮助。' :
      context.language === 'ja' ? '/help でヘルプを表示。' :
      'Type /help for general help.',
    ];
    return lines.join('\n');
  },
};
