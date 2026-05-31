import { execSync } from 'child_process';
import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const statusCommand: Command = {
  name: 'status',
  aliases: ['st', 'info'],
  description: 'Show session and environment status',
  isEnabled: () => true,
  call: async (_args, context) => {
    const lang: Language = context.language;
    const lines: string[] = [lang === 'zh-CN' ? '会话状态' :
                             lang === 'ja' ? 'セッションステータス' :
                             'Session Status',
                             '==============', ''];

    // Model
    lines.push(`${lang === 'zh-CN' ? '模型' : lang === 'ja' ? 'モデル' : 'Model'}: ${context.model}`);
    lines.push(`${lang === 'zh-CN' ? '详细' : lang === 'ja' ? '詳細' : 'Verbose'}: ${context.verbose}`);
    lines.push(`Debug: ${context.debug}`);
    lines.push('');

    // Uptime
    const uptimeSec = Math.floor(process.uptime());
    const min = Math.floor(uptimeSec / 60);
    const sec = uptimeSec % 60;
    lines.push(`${lang === 'zh-CN' ? '运行时间' : lang === 'ja' ? '稼働時間' : 'Uptime'}: ${min}m ${sec}s`);
    lines.push(`Node PID: ${process.pid}`);
    lines.push('');

    // Git status
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      lines.push(`${lang === 'zh-CN' ? 'Git 分支' : lang === 'ja' ? 'Git ブランチ' : 'Git branch'}: ${branch}`);

      const statusOut = execSync('git status --porcelain', {
        encoding: 'utf-8',
        stdio: 'pipe',
      }).trim();
      const changed = statusOut ? statusOut.split('\n').length : 0;
      lines.push(`${lang === 'zh-CN' ? '已更改文件' : lang === 'ja' ? '変更されたファイル' : 'Changed files'}: ${changed}`);
    } catch {
      lines.push(lang === 'zh-CN' ? 'Git：不可用' :
                 lang === 'ja' ? 'Git：利用不可' :
                 'Git: not available');
    }

    return lines.join('\n');
  },
};
