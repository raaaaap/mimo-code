import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

let currentStyle = 'text';

export const outputStyleCommand: Command = {
  name: 'output-style',
  description: 'Set output style',
  arguments: [{ name: 'style', description: 'text, json, or markdown', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const style = args.trim().toLowerCase();
    if (!style) {
      return context.language === 'zh-CN' ? `当前输出风格：${currentStyle}\n用法：/output-style <text|json|markdown>` :
             context.language === 'ja' ? `現在の出力スタイル：${currentStyle}\n使い方：/output-style <text|json|markdown>` :
             `Current output style: ${currentStyle}\nUsage: /output-style <text|json|markdown>`;
    }
    if (!['text', 'json', 'markdown'].includes(style)) {
      return context.language === 'zh-CN' ? '无效风格。使用：text、json 或 markdown' :
             context.language === 'ja' ? '無効なスタイル。使用：text、json、markdown' :
             'Invalid style. Use: text, json, or markdown';
    }
    currentStyle = style;
    return context.language === 'zh-CN' ? `输出风格已设置为：${style}` :
           context.language === 'ja' ? `出力スタイルが設定されました：${style}` :
           `Output style set to: ${style}`;
  },
};

export function getOutputStyle(): string {
  return currentStyle;
}
