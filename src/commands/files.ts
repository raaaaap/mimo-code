import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';

export const filesCommand: Command = {
  name: 'files',
  description: 'List files modified in this session',
  isEnabled: () => true,
  call: async (args, context) => {
    try {
      const status = execSync('git status --short', { encoding: 'utf-8', timeout: 5000 }).trim();
      if (!status) {
        return context.language === 'zh-CN' ? '没有修改的文件。' :
               context.language === 'ja' ? '変更されたファイルはありません。' :
               'No modified files.';
      }
      const lines = [
        context.language === 'zh-CN' ? '修改的文件：' :
        context.language === 'ja' ? '変更されたファイル：' :
        'Modified files:',
        '',
        ...status.split('\n').map(l => `  ${l}`),
      ];
      return lines.join('\n');
    } catch {
      return context.language === 'zh-CN' ? '不在 git 仓库中。' :
             context.language === 'ja' ? 'git リポジトリではありません。' :
             'Not in a git repository.';
    }
  },
};
