import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

const AVAILABLE_MODELS = [
  'claude-sonnet-4-20250514',
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  'claude-3-opus-20240229',
];

export const modelCommand: Command = {
  name: 'model',
  aliases: ['m'],
  description: 'Show or switch the current model',
  arguments: [
    { name: 'model', description: 'Model name to switch to', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const lang: Language = context.language;
    const requested = args.trim();
    if (!requested) {
      return [
        lang === 'zh-CN' ? `当前模型：${context.model}` :
        lang === 'ja' ? `現在のモデル：${context.model}` :
        `Current model: ${context.model}`,
        '',
        lang === 'zh-CN' ? '可用模型：' :
        lang === 'ja' ? '利用可能なモデル：' :
        'Available models:',
        ...AVAILABLE_MODELS.map((m) => `  ${m === context.model ? '* ' : '  '}${m}`),
        '',
        lang === 'zh-CN' ? '用法：/model <名称>' :
        lang === 'ja' ? '使い方：/model <名前>' :
        'Usage: /model <name>',
      ].join('\n');
    }

    const match = AVAILABLE_MODELS.find(
      (m) => m === requested || m.includes(requested),
    );
    if (!match) {
      return lang === 'zh-CN' ? `未知模型"${requested}"。可用：\n${AVAILABLE_MODELS.join('\n')}` :
             lang === 'ja' ? `不明なモデル"${requested}"。利用可能：\n${AVAILABLE_MODELS.join('\n')}` :
             `Unknown model "${requested}". Available:\n${AVAILABLE_MODELS.join('\n')}`;
    }

    return lang === 'zh-CN' ? `模型切换请求：${match}\n（重启会话以应用。）` :
           lang === 'ja' ? `モデル切り替えリクエスト：${match}\n（適用するにはセッションを再起動してください。）` :
           `Model switch requested to: ${match}\n(Restart session to apply.)`;
  },
};
