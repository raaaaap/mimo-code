import { execSync } from 'child_process';
import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const commitCommand: Command = {
  name: 'commit',
  aliases: ['ci'],
  description: 'Stage all changes and create a git commit',
  arguments: [
    { name: 'message', description: 'Commit message', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const lang: Language = context.language;
    const message = args.trim() || 'chore: auto-commit from mimo-code';
    try {
      execSync('git add -A', { encoding: 'utf-8', stdio: 'pipe' });
      const result = execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return result.trim() || (lang === 'zh-CN' ? '提交成功。' :
                                lang === 'ja' ? 'コミットが作成されました。' :
                                'Commit created successfully.');
    } catch (err: any) {
      const stderr = err.stderr?.toString?.() || err.message;
      if (stderr.includes('nothing to commit')) {
        return lang === 'zh-CN' ? '没有可提交的内容 — 工作树干净。' :
               lang === 'ja' ? 'コミットするものはありません — 作業ツリーはクリーンです。' :
               'Nothing to commit — working tree clean.';
      }
      return lang === 'zh-CN' ? `提交失败：${stderr}` :
             lang === 'ja' ? `コミット失敗：${stderr}` :
             `Commit failed: ${stderr}`;
    }
  },
};
