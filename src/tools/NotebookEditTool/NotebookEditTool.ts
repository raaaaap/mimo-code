import { z } from 'zod';
import { readFile, writeFile } from 'node:fs/promises';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  notebookPath: z.string().describe('Path to .ipynb file'),
  editMode: z.enum(['insert', 'delete', 'replace']).describe('Edit mode'),
  cellIndex: z.number().int().optional().describe('Cell index (0-based)'),
  cellType: z.enum(['code', 'markdown']).optional().describe('Cell type'),
  cellSource: z.string().optional().describe('Cell source content'),
});

interface NotebookCell {
  cell_type: string;
  source: string[];
  metadata: Record<string, unknown>;
  outputs?: unknown[];
  execution_count?: number | null;
}

interface Notebook {
  cells: NotebookCell[];
  metadata: Record<string, unknown>;
  nbformat: number;
  nbformat_minor: number;
}

function isNotebook(obj: unknown): obj is Notebook {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'cells' in obj &&
    Array.isArray((obj as Notebook).cells) &&
    'nbformat' in obj
  );
}

function sourceToLines(source: string): string[] {
  return source.split('\n').map((line, i, arr) =>
    i < arr.length - 1 ? line + '\n' : line,
  );
}

export const NotebookEditTool = () => buildTool({
  name: 'NotebookEditTool',
  aliases: ['notebook', 'ipynb'],
  inputSchema,
  isDestructive: () => true,
  description: async () => 'Edit Jupyter notebook cells (insert, delete, replace).',
  prompt: () => 'Edit .ipynb notebook files. Supports insert/delete/replace of code and markdown cells.',
  call: async (args) => {
    try {
      const raw: unknown = JSON.parse(await readFile(args.notebookPath, 'utf-8'));
      if (!isNotebook(raw)) {
        return { toolUseId: '', name: 'NotebookEditTool', result: '', error: 'Invalid notebook format: missing cells or nbformat', isError: true };
      }
      const notebook = raw;

      if (args.editMode === 'insert') {
        const cellIndex = args.cellIndex ?? notebook.cells.length;
        if (cellIndex < 0 || cellIndex > notebook.cells.length) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Cell index ${cellIndex} out of range (0-${notebook.cells.length})`, isError: true };
        }
        const newCell: NotebookCell = {
          cell_type: args.cellType ?? 'code',
          source: sourceToLines(args.cellSource ?? ''),
          metadata: {},
          ...(args.cellType !== 'markdown' ? { outputs: [], execution_count: null } : {}),
        };
        notebook.cells.splice(cellIndex, 0, newCell);
        await writeFile(args.notebookPath, JSON.stringify(notebook, null, 1), 'utf-8');
        return { toolUseId: '', name: 'NotebookEditTool', result: `Inserted ${args.cellType ?? 'code'} cell at index ${cellIndex}` };
      }

      if (args.editMode === 'delete') {
        if (args.cellIndex === undefined) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: 'cellIndex required for delete', isError: true };
        }
        if (args.cellIndex < 0 || args.cellIndex >= notebook.cells.length) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Cell index ${args.cellIndex} out of range (0-${notebook.cells.length - 1})`, isError: true };
        }
        notebook.cells.splice(args.cellIndex, 1);
        await writeFile(args.notebookPath, JSON.stringify(notebook, null, 1), 'utf-8');
        return { toolUseId: '', name: 'NotebookEditTool', result: `Deleted cell at index ${args.cellIndex}` };
      }

      if (args.editMode === 'replace') {
        if (args.cellIndex === undefined) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: 'cellIndex required for replace', isError: true };
        }
        if (args.cellIndex < 0 || args.cellIndex >= notebook.cells.length) {
          return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Cell index ${args.cellIndex} out of range (0-${notebook.cells.length - 1})`, isError: true };
        }
        const cell = notebook.cells[args.cellIndex]!;
        if (args.cellType) cell.cell_type = args.cellType;
        if (args.cellSource !== undefined) {
          cell.source = sourceToLines(args.cellSource);
        }
        await writeFile(args.notebookPath, JSON.stringify(notebook, null, 1), 'utf-8');
        return { toolUseId: '', name: 'NotebookEditTool', result: `Replaced cell at index ${args.cellIndex}` };
      }

      return { toolUseId: '', name: 'NotebookEditTool', result: '', error: `Unknown edit mode: ${args.editMode}`, isError: true };
    } catch (error) {
      return { toolUseId: '', name: 'NotebookEditTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
