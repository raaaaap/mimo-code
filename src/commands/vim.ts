import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

let vimEnabled = false;

export const vimCommand: Command = {
  name: 'vim',
  description: 'Toggle vim keybinding mode',
  isEnabled: () => true,
  call: async (args, context) => {
    vimEnabled = !vimEnabled;
    return context.language === 'zh-CN' ?
      `Vim 模式已${vimEnabled ? '启用' : '禁用'}。${vimEnabled ? 'Vim 键绑定现已激活。' : ''}\n使用 /keybindings 查看可用按键。` :
      context.language === 'ja' ?
      `Vim モードが${vimEnabled ? '有効' : '無効'}になりました。${vimEnabled ? 'Vim キーバインドが有効になりました。' : ''}\n/keybindings で利用可能なキーを確認。` :
      `Vim mode ${vimEnabled ? 'enabled' : 'disabled'}. ${vimEnabled ? 'Vim keybindings are now active.' : ''}\nUse /keybindings to see available keys.`;
  },
};

export function isVimEnabled(): boolean {
  return vimEnabled;
}
