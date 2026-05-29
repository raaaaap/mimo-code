import type { Command } from '../commands.js';

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
    call: async (args) => {
      const sub = args.trim().split(/\s+/)[0] || 'pet';
      const rest = args.trim().split(/\s+/).slice(1).join(' ');

      switch (sub) {
        case 'pet':
          deps.onPet?.();
          return `\u{1F431} You pet the Xiaomi Cat! ${deps.getName?.() ?? '小米猫'} purrs happily.`;

        case 'mute':
          deps.onMute?.();
          return '\u{1F507} Companion muted.';

        case 'unmute':
          deps.onUnmute?.();
          return '\u{1F50A} Companion unmuted.';

        case 'name':
          if (!rest) return `Current name: ${deps.getName?.() ?? '小米猫'}`;
          deps.onSetName?.(rest);
          return `\u{1F431} Companion renamed to: ${rest}`;

        case 'status':
          return [
            `\u{1F431} Companion: ${deps.getName?.() ?? '小米猫'}`,
            `   Muted: ${deps.isMuted?.() ? 'yes' : 'no'}`,
          ].join('\n');

        default:
          return [
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
