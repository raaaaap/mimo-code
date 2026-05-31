import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

const MODES = ['default', 'acceptEdits', 'bypassPermissions', 'plan', 'auto'];

export const permissionsCommand: Command = {
  name: 'permissions',
  aliases: ['perms', 'perm'],
  description: 'Show or set permission mode',
  arguments: [{ name: 'mode', description: 'Permission mode to set', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const mode = args.trim().toLowerCase();
    if (!mode) {
      const lines = [
        context.language === 'zh-CN' ? '当前权限模式：default' :
        context.language === 'ja' ? '現在の権限モード：default' :
        'Current permission mode: default',
        '',
        context.language === 'zh-CN' ? '可用模式：' :
        context.language === 'ja' ? '利用可能なモード：' :
        'Available modes:',
        ...MODES.map(m => `  ${m}`),
      ];
      return lines.join('\n');
    }
    if (!MODES.includes(mode)) {
      return context.language === 'zh-CN' ? `无效模式。可用：${MODES.join(', ')}` :
             context.language === 'ja' ? `無効なモード。利用可能：${MODES.join(', ')}` :
             `Invalid mode. Available: ${MODES.join(', ')}`;
    }
    return context.language === 'zh-CN' ? `权限模式已设置为：${mode}` :
           context.language === 'ja' ? `権限モードが設定されました：${mode}` :
           `Permission mode set to: ${mode}`;
  },
};
