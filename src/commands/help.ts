import type { Command } from '../commands.js';

const COMMAND_CATEGORIES = {
  '📋 常用 / Common': ['help', 'clear', 'compact', 'config', 'model', 'theme', 'language', 'permissions', 'status', 'usage'],
  '🛠️ 开发 / Development': ['diff', 'commit', 'review', 'branch', 'pr_comments', 'files', 'plan', 'tasks', 'skills'],
  '🧠 上下文 / Context': ['memory', 'context', 'stats', 'effort', 'fast', 'output-style', 'export'],
  '⚙️ 系统 / System': ['doctor', 'env', 'init', 'upgrade', 'feedback', 'issue', 'sandbox-toggle', 'vim', 'keybindings'],
  '🔐 会话 / Session': ['session', 'resume', 'history', 'rename', 'copy', 'add-dir', 'mcp', 'login', 'logout'],
  '🐱 其他 / Other': ['buddy', 'cost'],
};

export const helpCommand: Command = {
  name: 'help',
  aliases: ['h', '?'],
  description: 'Show all available commands by category',
  arguments: [{ name: 'category', description: 'Show commands in a specific category', required: false }],
  isEnabled: () => true,
  call: async (args) => {
    const category = args.trim().toLowerCase();

    // If a specific category is requested
    if (category) {
      const matched = Object.entries(COMMAND_CATEGORIES).find(([key]) =>
        key.toLowerCase().includes(category)
      );
      if (!matched) {
        const cats = Object.keys(COMMAND_CATEGORIES).map(k => `  ${k}`).join('\n');
        return `Category not found. Available categories:\n${cats}`;
      }
      const [name, cmds] = matched;
      return `${name}\n${cmds.map(c => `  /${c}`).join('\n')}`;
    }

    // Show all categories
    const lines: string[] = ['可用命令 / Available Commands:', ''];

    for (const [category, cmds] of Object.entries(COMMAND_CATEGORIES)) {
      lines.push(`${category}`);
      lines.push(`  ${cmds.join('  ')}`);
      lines.push('');
    }

    lines.push('按 Tab 查看常用命令');
    lines.push('输入 /help <类别> 查看分类详情');

    return lines.join('\n');
  },
};
