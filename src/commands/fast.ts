import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

/**
 * Factory that creates the `/fast` command, which toggles between the
 * default model and a lighter "fast" model.
 *
 * @param getModel   - returns the currently active model id
 * @param setModel   - sets the active model id
 * @param defaultModel - the full-featured model id
 * @param fastModel    - the lightweight / fast model id
 */
export function createFastCommand(
  getModel: () => string,
  setModel: (model: string) => void,
  defaultModel: string,
  fastModel: string,
): Command {
  return {
    name: 'fast',
    aliases: ['speed'],
    description: 'Toggle fast mode (lightweight model)',
    isEnabled: () => true,
    call: async (_args, context) => {
      const lang: Language = context.language;
      const current = getModel();
      if (current === fastModel) {
        setModel(defaultModel);
        return lang === 'zh-CN' ? `已切换到默认模型：${defaultModel}` :
               lang === 'ja' ? `デフォルトモデルに切り替え：${defaultModel}` :
               `Switched to default model: ${defaultModel}`;
      }
      setModel(fastModel);
      return lang === 'zh-CN' ? `已切换到快速模型：${fastModel}` :
             lang === 'ja' ? `高速モデルに切り替え：${fastModel}` :
             `Switched to fast model: ${fastModel}`;
    },
  };
}
