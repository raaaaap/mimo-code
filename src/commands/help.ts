import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

const COMMAND_CATEGORIES_ZH = {
  '📋 常用': ['help', 'clear', 'compact', 'config', 'model', 'theme', 'language', 'permissions', 'status', 'usage'],
  '🛠️ 开发': ['diff', 'commit', 'review', 'branch', 'pr_comments', 'files', 'plan', 'tasks', 'skills'],
  '🧠 上下文': ['memory', 'context', 'stats', 'effort', 'fast', 'output-style', 'export'],
  '⚙️ 系统': ['doctor', 'env', 'init', 'upgrade', 'feedback', 'issue', 'sandbox-toggle', 'vim', 'keybindings'],
  '🔐 会话': ['session', 'resume', 'history', 'rename', 'copy', 'add-dir', 'mcp', 'login', 'logout'],
  '🐱 其他': ['buddy', 'cost'],
};

const COMMAND_CATEGORIES_EN = {
  '📋 Common': ['help', 'clear', 'compact', 'config', 'model', 'theme', 'language', 'permissions', 'status', 'usage'],
  '🛠️ Development': ['diff', 'commit', 'review', 'branch', 'pr_comments', 'files', 'plan', 'tasks', 'skills'],
  '🧠 Context': ['memory', 'context', 'stats', 'effort', 'fast', 'output-style', 'export'],
  '⚙️ System': ['doctor', 'env', 'init', 'upgrade', 'feedback', 'issue', 'sandbox-toggle', 'vim', 'keybindings'],
  '🔐 Session': ['session', 'resume', 'history', 'rename', 'copy', 'add-dir', 'mcp', 'login', 'logout'],
  '🐱 Other': ['buddy', 'cost'],
};

const COMMAND_CATEGORIES_JA = {
  '📋 一般': ['help', 'clear', 'compact', 'config', 'model', 'theme', 'language', 'permissions', 'status', 'usage'],
  '🛠️ 開発': ['diff', 'commit', 'review', 'branch', 'pr_comments', 'files', 'plan', 'tasks', 'skills'],
  '🧠 コンテキスト': ['memory', 'context', 'stats', 'effort', 'fast', 'output-style', 'export'],
  '⚙️ システム': ['doctor', 'env', 'init', 'upgrade', 'feedback', 'issue', 'sandbox-toggle', 'vim', 'keybindings'],
  '🔐 セッション': ['session', 'resume', 'history', 'rename', 'copy', 'add-dir', 'mcp', 'login', 'logout'],
  '🐱 その他': ['buddy', 'cost'],
};

function getCategories(lang: Language) {
  if (lang === 'zh-CN') return COMMAND_CATEGORIES_ZH;
  if (lang === 'ja') return COMMAND_CATEGORIES_JA;
  return COMMAND_CATEGORIES_EN;
}

export const helpCommand: Command = {
  name: 'help',
  aliases: ['h', '?'],
  description: 'Show all available commands by category',
  arguments: [{ name: 'category', description: 'Show commands in a specific category', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const lang: Language = context.language;
    const category = args.trim().toLowerCase();
    const categories = getCategories(lang);

    // If a specific category is requested
    if (category) {
      const matched = Object.entries(categories).find(([key]) =>
        key.toLowerCase().includes(category)
      );
      if (!matched) {
        const cats = Object.keys(categories).map(k => `  ${k}`).join('\n');
        return lang === 'zh-CN' ? `未找到类别。可用类别：\n${cats}` :
               lang === 'ja' ? `カテゴリが見つかりません。利用可能なカテゴリ：\n${cats}` :
               `Category not found. Available categories:\n${cats}`;
      }
      const [name, cmds] = matched;
      return `${name}\n${cmds.map(c => `  /${c}`).join('\n')}`;
    }

    // Show all categories
    const lines: string[] = [lang === 'zh-CN' ? '可用命令：' :
                              lang === 'ja' ? '利用可能なコマンド：' :
                              'Available Commands:', ''];

    for (const [cat, cmds] of Object.entries(categories)) {
      lines.push(`${cat}`);
      lines.push(`  ${cmds.join('  ')}`);
      lines.push('');
    }

    lines.push(lang === 'zh-CN' ? '按 Tab 查看常用命令' :
               lang === 'ja' ? 'Tab でよく使うコマンド' :
               'Press Tab for common commands');
    lines.push(lang === 'zh-CN' ? '输入 /help <类别> 查看分类详情' :
               lang === 'ja' ? '/help <カテゴリ> でカテゴリ詳細を表示' :
               'Type /help <category> for category details');

    return lines.join('\n');
  },
};
