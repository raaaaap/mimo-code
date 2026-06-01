import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { t } from '../utils/i18n.js';

function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === 'win32') {
      // Use PowerShell with stdin pipe to handle all characters safely
      // Write text to temp file, then pipe to Set-Clipboard
      const tmpFile = join(tmpdir(), `mimo-clipboard-${Date.now()}.txt`);
      writeFileSync(tmpFile, text, 'utf-8');
      try {
        execSync(
          `powershell -NoProfile -Command "$content = Get-Content -Raw -Path '${tmpFile}'; Set-Clipboard -Value $content"`,
          { encoding: 'utf-8', timeout: 5000 }
        );
        return true;
      } finally {
        try { unlinkSync(tmpFile); } catch { /* ignore */ }
      }
    } else if (process.platform === 'darwin') {
      execSync('pbcopy', { input: text });
      return true;
    } else {
      try {
        execSync('xclip -selection clipboard', { input: text });
        return true;
      } catch {
        execSync('xsel --clipboard --input', { input: text });
        return true;
      }
    }
  } catch (error) {
    return false;
  }
}

export const copyCommand: Command = {
  name: 'copy',
  description: 'Copy last response to clipboard',
  isEnabled: () => true,
  call: async (args, context) => {
    // Find the last assistant message
    const messages = context.messages ?? [];
    const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

    if (!lastAssistant) {
      return context.language === 'zh-CN' ? '没有可复制的回复。' :
             context.language === 'ja' ? 'コピー可能な応答がありません。' :
             'No response to copy.';
    }

    const content = typeof lastAssistant.content === 'string'
      ? lastAssistant.content
      : JSON.stringify(lastAssistant.content);

    if (!content || content.trim().length === 0) {
      return context.language === 'zh-CN' ? '最后一条回复内容为空。' :
             context.language === 'ja' ? '最後の応答内容が空です。' :
             'Last response is empty.';
    }

    const success = copyToClipboard(content);
    if (success) {
      const preview = content.length > 80 ? content.slice(0, 80) + '...' : content;
      return context.language === 'zh-CN' ? `已复制到剪贴板：\n${preview}` :
             context.language === 'ja' ? `クリップボードにコピーしました：\n${preview}` :
             `Copied to clipboard:\n${preview}`;
    }

    return context.language === 'zh-CN' ? '复制失败。请确保系统支持剪贴板操作。' :
           context.language === 'ja' ? 'コピーに失敗しました。' :
           'Copy failed. Please ensure your system supports clipboard operations.';
  },
};
