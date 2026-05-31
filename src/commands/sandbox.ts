import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

let sandboxEnabled = false;

export const sandboxCommand: Command = {
  name: 'sandbox-toggle',
  description: 'Toggle sandbox mode',
  isEnabled: () => true,
  call: async (args, context) => {
    sandboxEnabled = !sandboxEnabled;
    return context.language === 'zh-CN' ?
      `沙箱模式已${sandboxEnabled ? '启用' : '禁用'}。${sandboxEnabled ? '破坏性操作将被限制。' : ''}` :
      context.language === 'ja' ?
      `サンドボックスモードが${sandboxEnabled ? '有効' : '無効'}になりました。${sandboxEnabled ? '破壊的な操作が制限されます。' : ''}` :
      `Sandbox mode ${sandboxEnabled ? 'enabled' : 'disabled'}. ${sandboxEnabled ? 'Destructive operations are restricted.' : ''}`;
  },
};

export function isSandboxEnabled(): boolean {
  return sandboxEnabled;
}
