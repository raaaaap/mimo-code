import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

interface BuddyCommandDeps {
  onPet?: () => void;
  onMute?: () => void;
  onUnmute?: () => void;
  onSetName?: (name: string) => void;
  isMuted?: () => boolean;
  getName?: () => string;
}

export function createBuddyCommand(deps: BuddyCommandDeps = {}): Command {
  return {
    name: 'buddy',
    aliases: ['pet'],
    description: 'Interact with your Xiaomi Cat companion',
    isEnabled: () => true,
    call: async (args, context) => {
      const lang: Language = context.language;
      const sub = args.trim().split(/\s+/)[0] || 'pet';
      const rest = args.trim().split(/\s+/).slice(1).join(' ');

      switch (sub) {
        case 'pet':
          deps.onPet?.();
          return lang === 'zh-CN' ? `\u{1F431} 你摸了摸小米猫！${deps.getName?.() ?? '小米猫'}开心地打起了呼噜。` :
                 lang === 'ja' ? `\u{1F431} ミャオ猫を撫でました！${deps.getName?.() ?? '小米猫'}は嬉しそうに喉を鳴らしています。` :
                 `\u{1F431} You pet the Xiaomi Cat! ${deps.getName?.() ?? '小米猫'} purrs happily.`;

        case 'mute':
          deps.onMute?.();
          return lang === 'zh-CN' ? '\u{1F507} 伙伴已静音。' :
                 lang === 'ja' ? '\u{1F507} コンパニオンをミュートしました。' :
                 '\u{1F507} Companion muted.';

        case 'unmute':
          deps.onUnmute?.();
          return lang === 'zh-CN' ? '\u{1F50A} 伙伴已取消静音。' :
                 lang === 'ja' ? '\u{1F50A} コンパニオンのミュートを解除しました。' :
                 '\u{1F50A} Companion unmuted.';

        case 'name':
          if (!rest) {
            return lang === 'zh-CN' ? `当前名称：${deps.getName?.() ?? '小米猫'}` :
                   lang === 'ja' ? `現在の名前：${deps.getName?.() ?? '小米猫'}` :
                   `Current name: ${deps.getName?.() ?? '小米猫'}`;
          }
          deps.onSetName?.(rest);
          return lang === 'zh-CN' ? `\u{1F431} 伙伴已重命名为：${rest}` :
                 lang === 'ja' ? `\u{1F431} コンパニオンの名前を変更：${rest}` :
                 `\u{1F431} Companion renamed to: ${rest}`;

        case 'status':
          return [
            lang === 'zh-CN' ? `\u{1F431} 伙伴：${deps.getName?.() ?? '小米猫'}` :
            lang === 'ja' ? `\u{1F431} コンパニオン：${deps.getName?.() ?? '小米猫'}` :
            `\u{1F431} Companion: ${deps.getName?.() ?? '小米猫'}`,
            lang === 'zh-CN' ? `   静音：${deps.isMuted?.() ? '是' : '否'}` :
            lang === 'ja' ? `   ミュート：${deps.isMuted?.() ? 'はい' : 'いいえ'}` :
            `   Muted: ${deps.isMuted?.() ? 'yes' : 'no'}`,
          ].join('\n');

        default:
          return lang === 'zh-CN' ? [
            '用法：/buddy <子命令>',
            '  pet     — 摸摸猫（默认）',
            '  mute    — 隐藏伙伴',
            '  unmute  — 显示伙伴',
            '  name <n> — 重命名伙伴',
            '  status  — 显示伙伴信息',
          ].join('\n') :
          lang === 'ja' ? [
            '使い方：/buddy <サブコマンド>',
            '  pet     — 猫を撫でる（デフォルト）',
            '  mute    — コンパニオンを非表示',
            '  unmute  — コンパニオンを表示',
            '  name <n> — コンパニオンの名前変更',
            '  status  — コンパニオン情報を表示',
          ].join('\n') :
          [
            'Usage: /buddy <subcommand>',
            '  pet     — Pet the cat (default)',
            '  mute    — Hide the companion',
            '  unmute  — Show the companion',
            '  name <n> — Rename the companion',
            '  status  — Show companion info',
          ].join('\n');
      }
    },
  };
}
