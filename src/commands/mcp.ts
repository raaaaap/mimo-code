import type { Command } from '../commands.js';
import type { Language } from '../utils/i18n.js';

export const mcpCommand: Command = {
  name: 'mcp',
  aliases: [],
  description: 'MCP server management — list, add, or remove servers',
  arguments: [
    { name: 'action', description: 'Action: list, add, remove, status', required: false },
  ],
  isEnabled: () => true,
  call: async (args, context) => {
    const action = args.trim().toLowerCase();

    if (!action || action === 'list' || action === 'status') {
      return [
        context.language === 'zh-CN' ? 'MCP 服务器' :
        context.language === 'ja' ? 'MCP サーバー' :
        'MCP Servers',
        '===========',
        context.language === 'zh-CN' ? '没有配置 MCP 服务器。' :
        context.language === 'ja' ? 'MCP サーバーは設定されていません。' :
        'No MCP servers configured.',
        '',
        context.language === 'zh-CN' ? '在 .mimo/settings.json 中添加 mcpServers 配置。' :
        context.language === 'ja' ? '.mimo/settings.json に mcpServers を追加してください。' :
        'Add mcpServers to .mimo/settings.json to configure.',
        '',
        context.language === 'zh-CN' ? '操作：' :
        context.language === 'ja' ? '操作：' :
        'Actions:',
        '  /mcp list    — ' + (context.language === 'zh-CN' ? '列出已配置的服务器' : context.language === 'ja' ? '設定されたサーバーを一覧表示' : 'List configured servers'),
        '  /mcp add     — ' + (context.language === 'zh-CN' ? '添加服务器' : context.language === 'ja' ? 'サーバーを追加' : 'Add a server'),
        '  /mcp remove  — ' + (context.language === 'zh-CN' ? '移除服务器' : context.language === 'ja' ? 'サーバーを削除' : 'Remove a server'),
        '  /mcp status  — ' + (context.language === 'zh-CN' ? '显示服务器状态' : context.language === 'ja' ? 'サーバーの状態を表示' : 'Show server status'),
      ].join('\n');
    }

    if (action === 'add') {
      return context.language === 'zh-CN' ? 'MCP 服务器添加功能尚未实现。' :
             context.language === 'ja' ? 'MCP サーバーの追加はまだ実装されていません。' :
             'MCP server add is not yet implemented.';
    }

    if (action === 'remove') {
      return context.language === 'zh-CN' ? 'MCP 服务器移除功能尚未实现。' :
             context.language === 'ja' ? 'MCP サーバーの削除はまだ実装されていません。' :
             'MCP server remove is not yet implemented.';
    }

    return context.language === 'zh-CN' ? `未知操作 "${action}"。使用：list、add、remove、status` :
           context.language === 'ja' ? `不明な操作 "${action}"。使用：list、add、remove、status` :
           `Unknown action "${action}". Use: list, add, remove, status`;
  },
};
