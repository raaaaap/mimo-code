import { zodToJsonSchema } from 'zod-to-json-schema';
import type { Tool, ToolDefinition } from './types/tool.js';
import { FileReadTool } from './tools/FileReadTool/FileReadTool.js';
import { FileWriteTool } from './tools/FileWriteTool/FileWriteTool.js';
import { FileEditTool } from './tools/FileEditTool/FileEditTool.js';
import { GlobTool } from './tools/GlobTool/GlobTool.js';
import { GrepTool } from './tools/GrepTool/GrepTool.js';
import { BashTool } from './tools/BashTool/BashTool.js';
import { WebFetchTool } from './tools/WebFetchTool/WebFetchTool.js';
import { WebSearchTool } from './tools/WebSearchTool/WebSearchTool.js';
import { TodoWriteTool } from './tools/TodoWriteTool/TodoWriteTool.js';
import { NotebookEditTool } from './tools/NotebookEditTool/NotebookEditTool.js';
import { AskUserQuestionTool } from './tools/AskUserQuestionTool/AskUserQuestionTool.js';
import { PowerShellTool } from './tools/PowerShellTool/PowerShellTool.js';
import { AgentTool, type AgentToolDeps } from './tools/AgentTool/AgentTool.js';
import { ToolSearchTool } from './tools/ToolSearchTool/ToolSearchTool.js';
import { EnterPlanModeTool } from './tools/EnterPlanModeTool/EnterPlanModeTool.js';
import { ExitPlanModeTool } from './tools/ExitPlanModeTool/ExitPlanModeTool.js';
import { TaskStopTool } from './tools/TaskStopTool/TaskStopTool.js';
import { TaskOutputTool } from './tools/TaskOutputTool/TaskOutputTool.js';
import { SendMessageTool } from './tools/SendMessageTool/SendMessageTool.js';
import { ListMcpResourcesTool } from './tools/ListMcpResourcesTool/ListMcpResourcesTool.js';
import { ReadMcpResourceTool } from './tools/ReadMcpResourceTool/ReadMcpResourceTool.js';
import { EnterWorktreeTool } from './tools/EnterWorktreeTool/EnterWorktreeTool.js';
import { ExitWorktreeTool } from './tools/ExitWorktreeTool/ExitWorktreeTool.js';

export class ToolRegistry {
  private tools = new Map<string, Tool>();
  private aliasMap = new Map<string, string>();

  register(tool: Tool): void {
    this.tools.set(tool.name, tool);
    if (tool.aliases) {
      for (const alias of tool.aliases) {
        this.aliasMap.set(alias, tool.name);
      }
    }
  }

  get(name: string): Tool | undefined {
    const resolved = this.aliasMap.get(name) ?? name;
    return this.tools.get(resolved);
  }

  getAll(): Tool[] {
    return Array.from(this.tools.values());
  }

  toToolDefinitions(): ToolDefinition[] {
    return this.getAll().map(tool => {
      let parameters: Record<string, unknown> = {};
      try {
        const jsonSchema = zodToJsonSchema(tool.inputSchema, { target: 'openApi3' });
        // Extract just the properties part for OpenAI API
        parameters = {
          type: 'object',
          properties: (jsonSchema as any).properties ?? {},
          required: (jsonSchema as any).required ?? [],
        };
      } catch {
        parameters = { type: 'object', properties: {} };
      }
      return {
        type: 'function' as const,
        function: {
          name: tool.name,
          description: tool.prompt() || tool.name,
          parameters,
        },
      };
    });
  }

  has(name: string): boolean {
    return this.tools.has(name) || this.aliasMap.has(name);
  }
}

export function createDefaultRegistry(agentDeps?: AgentToolDeps): ToolRegistry {
  const registry = new ToolRegistry();
  registry.register(FileReadTool());
  registry.register(FileWriteTool());
  registry.register(FileEditTool());
  registry.register(GlobTool());
  registry.register(GrepTool());
  registry.register(BashTool());
  registry.register(WebFetchTool());
  registry.register(WebSearchTool());
  registry.register(TodoWriteTool());
  registry.register(NotebookEditTool());
  registry.register(PowerShellTool());
  registry.register(AskUserQuestionTool());
  if (agentDeps) {
    registry.register(AgentTool(agentDeps));
  }
  registry.register(ToolSearchTool(() => registry.getAll()));
  registry.register(EnterPlanModeTool);
  registry.register(ExitPlanModeTool);
  registry.register(TaskStopTool());
  registry.register(TaskOutputTool());
  registry.register(SendMessageTool());
  registry.register(ListMcpResourcesTool());
  registry.register(ReadMcpResourceTool());
  registry.register(EnterWorktreeTool);
  registry.register(ExitWorktreeTool);
  return registry;
}
