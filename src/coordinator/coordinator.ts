export type CoordinatorMode = 'single' | 'coordinator' | 'worker';

export interface CoordinatorConfig {
  mode: CoordinatorMode;
  maxWorkers: number;
  scratchpad: Map<string, string>;
}

export class Coordinator {
  private config: CoordinatorConfig;

  constructor(config: Partial<CoordinatorConfig> = {}) {
    this.config = {
      mode: config.mode ?? 'single',
      maxWorkers: config.maxWorkers ?? 4,
      scratchpad: config.scratchpad ?? new Map(),
    };
  }

  getMode(): CoordinatorMode {
    return this.config.mode;
  }

  setMode(mode: CoordinatorMode): void {
    this.config.mode = mode;
  }

  isCoordinator(): boolean {
    return this.config.mode === 'coordinator';
  }

  isWorker(): boolean {
    return this.config.mode === 'worker';
  }

  getScratchpad(key: string): string | undefined {
    return this.config.scratchpad.get(key);
  }

  setScratchpad(key: string, value: string): void {
    this.config.scratchpad.set(key, value);
  }

  getWorkerTools(): string[] {
    // Workers get a subset of tools
    return ['FileReadTool', 'FileWriteTool', 'FileEditTool', 'GlobTool', 'GrepTool', 'BashTool'];
  }

  getCoordinatorTools(): string[] {
    // Coordinators get orchestration tools
    return ['AgentTool', 'SendMessageTool', 'TaskCreateTool', 'TaskGetTool', 'TaskUpdateTool', 'TaskListTool', 'TodoWriteTool'];
  }
}

export const coordinator = new Coordinator();
