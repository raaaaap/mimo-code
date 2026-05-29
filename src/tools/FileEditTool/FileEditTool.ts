import { readFile, writeFile } from 'node:fs/promises';
import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  file_path: z.string().describe('Absolute path to the file'),
  old_string: z.string().describe('Exact string to replace'),
  new_string: z.string().describe('Replacement string'),
  replace_all: z.boolean().optional().default(false).describe('Replace all occurrences'),
});

export const FileEditTool = () => buildTool({
  name: 'FileEditTool',
  inputSchema,
  description: async () => 'Replace an exact string in a file. By default replaces only the first occurrence.',
  prompt: () => 'Edit a file by replacing old_string with new_string. The old_string must be unique unless replace_all is true.',
  call: async (args) => {
    try {
      const content = await readFile(args.file_path, 'utf-8');
      const count = content.split(args.old_string).length - 1;
      if (count === 0) return { toolUseId: '', name: 'FileEditTool', result: '', error: `old_string not found in ${args.file_path}`, isError: true };
      if (!args.replace_all && count > 1) return { toolUseId: '', name: 'FileEditTool', result: '', error: `old_string found ${count} times. Use replace_all=true or provide a more specific string.`, isError: true };
      const newContent = args.replace_all ? content.replaceAll(args.old_string, args.new_string) : content.replace(args.old_string, args.new_string);
      await writeFile(args.file_path, newContent, 'utf-8');
      return { toolUseId: '', name: 'FileEditTool', result: `Edited ${args.file_path}` };
    } catch (error) {
      return { toolUseId: '', name: 'FileEditTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
