export type WorkerRole = 'coordinator' | 'worker';

export interface CoordinatorConfig {
  role: WorkerRole;
  workers: string[];
  scratchpadDir: string;
}

export function getToolsForRole(role: WorkerRole): string[] {
  if (role === 'coordinator') return ['AgentTool', 'TaskStopTool', 'SendMessageTool', 'TodoWriteTool'];
  return ['BashTool', 'FileReadTool', 'FileEditTool', 'GlobTool', 'GrepTool'];
}
