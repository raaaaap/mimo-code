import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import type { Tool } from '../../types/tool.js';

const inputSchema = z.object({
  query: z.string().describe('搜索关键词，或 "select:ToolName" 直接选择工具'),
  max_results: z.number().optional().default(5).describe('最大返回数量'),
});

export const ToolSearchTool = (getAllTools: () => Tool[]) => buildTool({
  name: 'ToolSearchTool',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => '搜索可用工具。用关键词搜索或 select:ToolName 直接选择。',
  prompt: () => '当不确定有哪些工具可用时，用关键词搜索。用 "select:ToolName" 直接加载特定工具。',
  call: async (args) => {
    const tools = getAllTools();
    const query = args.query.trim();

    if (query.startsWith('select:')) {
      const names = query.slice(7).split(',').map(n => n.trim());
      const matched = tools.filter(t => names.includes(t.name));
      return {
        toolUseId: '', name: 'ToolSearchTool',
        result: JSON.stringify({ matches: matched.map(t => t.name), query, total_tools: tools.length }),
      };
    }

    const terms = query.toLowerCase().split(/\s+/);
    const scored = tools.map(tool => {
      const name = tool.name.toLowerCase();
      const desc = (tool.prompt?.() ?? '').toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (name.includes(term)) score += 10;
        if (desc.includes(term)) score += 2;
      }
      return { tool, score };
    }).filter(t => t.score > 0);

    scored.sort((a, b) => b.score - a.score);
    const results = scored.slice(0, args.max_results).map(t => t.tool.name);

    return {
      toolUseId: '', name: 'ToolSearchTool',
      result: JSON.stringify({ matches: results, query, total_tools: tools.length }),
    };
  },
});
