import type { Command } from '../commands.js';
import { execSync } from 'node:child_process';
import { t } from '../utils/i18n.js';

function copyToClipboard(text: string): boolean {
  try {
    if (process.platform === 'win32') {
      // Windows: use clip command
      execSync('clip', { input: text });
      return true;
    } else if (process.platform === 'darwin') {
      // macOS: use pbcopy
      execSync('pbcopy', { input: text });
      return true;
    } else {
      // Linux: try xclip, then xsel
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
  description: 'Copy text to clipboard',
  arguments: [{ name: 'text', description: 'Text to copy (or last response if empty)', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const text = args.trim();

    if (!text) {
      return context.language === 'zh-CN' ? '用法：/copy <要复制的文本>\n\n示例：/copy Hello World' :
             context.language === 'ja' ? '使い方：/copy <コピーするテキスト>\n\n例：/copy Hello World' :
             'Usage: /copy <text to copy>\n\nExample: /copy Hello World';
    }

    const success = copyToClipboard(text);
    if (success) {
      const preview = text.length > 50 ? text.slice(0, 50) + '...' : text;
      return context.language === 'zh-CN' ? `已复制到剪贴板：${preview}` :
             context.language === 'ja' ? `クリップボードにコピーしました：${preview}` :
             `Copied to clipboard: ${preview}`;
    }

    return context.language === 'zh-CN' ? '复制失败。请确保系统支持剪贴板操作。' :
           context.language === 'ja' ? 'コピーに失敗しました。システムがクリップボード操作をサポートしていることを確認してください。' :
           'Copy failed. Please ensure your system supports clipboard operations.';
  },
};
