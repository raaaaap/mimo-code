import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  content: z.string().describe('Content to write'),
});

export const FileWriteTool = () => buildTool({
  name: 'FileWriteTool',
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Write content to a file. Creates parent directories if needed.',
  prompt: () => 'Write content to a file at file_path. Overwrites existing content.',
  call: async (args) => {
    try {
      await mkdir(dirname(args.file_path), { recursive: true });
      await writeFile(args.file_path, args.content, 'utf-8');
      return { toolUseId: '', name: 'FileWriteTool', result: `File written: ${args.file_path}` };
    } catch (error) {
      return { toolUseId: '', name: 'FileWriteTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
