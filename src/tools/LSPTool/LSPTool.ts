import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { lspClient } from '../../services/lsp/client.js';

const inputSchema = z.object({
  action: z.enum(['definition', 'references', 'hover', 'diagnostics', 'format', 'symbols']).describe('LSP action'),
  file: z.string().describe('File path'),
  line: z.number().optional().describe('Line number (1-based)'),
  column: z.number().optional().describe('Column number (1-based)'),
});

export const LSPTool = () => buildTool({
  name: 'LSPTool',
  inputSchema,
  isConcurrencySafe: () => true,
  isReadOnly: () => true,
  description: async () => 'Language Server Protocol integration for code navigation and diagnostics.',
  prompt: () => 'Use LSP for go-to-definition, find-references, hover info, diagnostics, formatting, and symbol search.',
  call: async (args) => {
    try {
      switch (args.action) {
        case 'definition': {
          const result = await lspClient.getDefinition(args.file, args.line ?? 1, args.column ?? 1);
          return { toolUseId: '', name: 'LSPTool', result: result ? JSON.stringify(result) : 'No definition found' };
        }
        case 'references': {
          const refs = await lspClient.getReferences(args.file, args.line ?? 1, args.column ?? 1);
          return { toolUseId: '', name: 'LSPTool', result: refs.length > 0 ? JSON.stringify(refs) : 'No references found' };
        }
        case 'diagnostics': {
          const diags = await lspClient.getDiagnostics(args.file);
          return { toolUseId: '', name: 'LSPTool', result: diags.length > 0 ? JSON.stringify(diags) : 'No diagnostics' };
        }
        case 'format': {
          const formatted = await lspClient.format(args.file);
          return { toolUseId: '', name: 'LSPTool', result: formatted ?? 'Formatting not available' };
        }
        default:
          return { toolUseId: '', name: 'LSPTool', result: `Action "${args.action}" not yet implemented` };
      }
    } catch (error) {
      return { toolUseId: '', name: 'LSPTool', result: '', error: String(error), isError: true };
    }
  },
});
