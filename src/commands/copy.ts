import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';
import { t } from '../utils/i18n.js';

function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === 'win32') {
      // Use PowerShell Set-Clipboard to handle UTF-8 properly
      // The `clip` command expects UTF-16LE and corrupts non-ASCII characters
      const escaped = text.replace(/'/g, "''");
      execSync(`powershell -NoProfile -Command "Set-Clipboard -Value '${escaped}'"`, { encoding: 'utf-8' });
      return true;
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
  } catch {
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
           context.language === 'ja' ? 'コピーに失敗しました。システムがクリップボード操作をサポートしていることを確認してください。' :
           'Copy failed. Please ensure your system supports clipboard operations.';
  },
};
