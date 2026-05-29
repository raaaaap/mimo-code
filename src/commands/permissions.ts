import type { Command } from '../commands.js';

const MODES = ['default', 'yolo', 'plan', 'readonly'];

export const permissionsCommand: Command = {
  name: 'permissions',
  aliases: ['perms', 'perm'],
  description: 'Show or change the permission mode',
  arguments: [
    { name: 'mode', description: 'Permission mode to set', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const requested = args.trim();
    if (!requested) {
      return [
        'Permission Modes',
        '================',
        '  default  — Ask before writes and dangerous commands',
        '  yolo     — Auto-approve all actions',
        '  plan     — Read-only planning, no execution',
        '  readonly — Never modify anything',
        '',
        'Current mode: default',
        '',
        'Usage: /permissions <mode>',
      ].join('\n');
    }

    const match = MODES.find((m) => m === requested);
    if (!match) {
      return `Unknown mode "${requested}". Available: ${MODES.join(', ')}`;
    }

    return `Permission mode set to: ${match}`;
  },
};
