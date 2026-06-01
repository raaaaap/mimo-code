import type { Command } from '../commands.js';

export const shareCommand: Command = {
  name: 'share',
  description: 'Share current session',
  isEnabled: () => true,
  call: async (args, context) => {
    return context.language === 'zh-CN' ? '会话分享功能正在开发中。\n\n目前可以通过 /export 导出对话，然后手动分享。' :
           context.language === 'ja' ? 'セッション共有機能は開発中です。\n\n現在は /export で会話をエクスポートして手動で共有できます。' :
           'Session sharing is under development.\n\nFor now, use /export to export the conversation and share manually.';
  },
};
