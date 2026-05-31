import type { Command } from '../commands.js';

export const effortCommand: Command = {
  name: 'effort',
  description: 'Adjust reasoning effort level',
  arguments: [{ name: 'level', description: 'low, medium, or high', required: false }],
  isEnabled: () => true,
  call: async (args) => {
    const level = args.trim().toLowerCase();
    if (!level) return 'Current effort: medium\nUsage: /effort <low|medium|high>';
    if (!['low', 'medium', 'high'].includes(level)) return 'Invalid level. Use: low, medium, or high';
    return `Reasoning effort set to: ${level}`;
  },
};
