import { readFile } from 'node:fs/promises';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  offset: z.number().optional().describe('Line number to start reading from (0-based)'),
  limit: z.number().optional().describe('Maximum number of lines to read'),
});

export const FileReadTool = () => buildTool({
  name: 'FileReadTool',
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Read the contents of a file. Supports reading with line offset and limit.',
  prompt: () => 'Read a file from disk. Use file_path for the absolute path, optional offset (0-based line number) and limit (max lines).',
  call: async (args) => {
    try {
      const content = await readFile(args.file_path, 'utf-8');
      const lines = content.split('\n');
      const offset = args.offset ?? 0;
      const limit = args.limit ?? lines.length;
      const selected = lines.slice(offset, offset + limit);
      const numbered = selected.map((line, i) => `${offset + i + 1}\t${line}`).join('\n');
      return { toolUseId: '', name: 'FileReadTool', result: numbered };
    } catch (error) {
      return { toolUseId: '', name: 'FileReadTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
