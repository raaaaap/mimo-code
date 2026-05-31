import { execSync } from 'child_process';
import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const diffCommand: Command = {
  name: 'diff',
  aliases: ['d'],
  description: 'Show git diff of working tree changes',
  options: [
    { name: 'staged', short: 's', description: 'Show staged changes', type: 'boolean', default: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const lang: Language = context.language;
    const staged = args.trim().includes('--staged') || args.trim().includes('-s');
    const cmd = staged ? 'git diff --staged' : 'git diff';
    try {
      const result = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe', maxBuffer: 1024 * 1024 });
      return result.trim() || (staged
        ? (lang === 'zh-CN' ? '没有暂存的更改。' : lang === 'ja' ? 'ステージされた変更はありません。' : 'No staged changes.')
        : (lang === 'zh-CN' ? '没有未暂存的更改。' : lang === 'ja' ? 'ステージされていない変更はありません。' : 'No unstaged changes.'));
    } catch (err: any) {
      return lang === 'zh-CN' ? `运行 diff 出错：${err.message}` :
             lang === 'ja' ? `diff の実行エラー：${err.message}` :
             `Error running diff: ${err.message}`;
    }
  },
};
