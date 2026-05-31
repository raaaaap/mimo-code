import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

// Store effort level in memory (resets per session)
let currentEffort = 'medium';

export const effortCommand: Command = {
  name: 'effort',
  description: 'Adjust reasoning effort level',
  arguments: [{ name: 'level', description: 'low, medium, or high', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const level = args.trim().toLowerCase();
    if (!level) {
      return context.language === 'zh-CN' ? `当前推理努力程度：${currentEffort}\n用法：/effort <low|medium|high>` :
             context.language === 'ja' ? `現在の推論努力レベル：${currentEffort}\n使い方：/effort <low|medium|high>` :
             `Current reasoning effort: ${currentEffort}\nUsage: /effort <low|medium|high>`;
    }
    if (!['low', 'medium', 'high'].includes(level)) {
      return context.language === 'zh-CN' ? '无效级别。使用：low、medium 或 high' :
             context.language === 'ja' ? '無効なレベル。使用：low、medium、high' :
             'Invalid level. Use: low, medium, or high';
    }
    currentEffort = level;
    return context.language === 'zh-CN' ? `推理努力程度已设置为：${level}` :
           context.language === 'ja' ? `推論努力レベルが設定されました：${level}` :
           `Reasoning effort set to: ${level}`;
  },
};

export function getEffort(): string {
  return currentEffort;
}
