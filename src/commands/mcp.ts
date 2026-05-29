import type { Command } from '../commands.js';

export const mcpCommand: Command = {
  name: 'mcp',
  aliases: [],
  description: 'MCP server management — list, add, or remove servers',
  arguments: [
    { name: 'action', description: 'Action: list, add, remove, status', required: false },
  ],
  isEnabled: () => true,
  call: async (args) => {
    const action = args.trim().toLowerCase();

    if (!action || action === 'list' || action === 'status') {
      return [
        'MCP Servers',
        '===========',
        'No MCP servers configured.',
        '',
        'MCP server management is a stub — full implementation coming soon.',
        '',
        'Actions:',
        '  /mcp list    — List configured servers',
        '  /mcp add     — Add a server',
        '  /mcp remove  — Remove a server',
        '  /mcp status  — Show server status',
      ].join('\n');
    }

    if (action === 'add') {
      return 'MCP server add is not yet implemented.';
    }

    if (action === 'remove') {
      return 'MCP server remove is not yet implemented.';
    }

    return `Unknown action "${action}". Use: list, add, remove, status`;
  },
};
