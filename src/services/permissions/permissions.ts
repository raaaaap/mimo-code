export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan' | 'auto';

export interface PermissionRule {
  tool: string;
  action: 'allow' | 'deny' | 'ask';
  pattern?: string;
  reason?: string;
}

export interface PermissionConfig {
  mode: PermissionMode;
  rules?: PermissionRule[];
}

export class PermissionChecker {
  private config: PermissionConfig;

  constructor(config: PermissionConfig) {
    this.config = config;
  }

  canUseTool(toolName: string, args: unknown): boolean | 'ask' {
    if (this.config.mode === 'bypassPermissions') return true;
    if (this.config.mode === 'plan') {
      const readOnlyTools = ['FileReadTool', 'GlobTool', 'GrepTool', 'WebFetchTool'];
      return readOnlyTools.includes(toolName);
    }
    const rules = this.config.rules ?? [];
    for (const rule of rules) {
      if (rule.tool === toolName || rule.tool === '*') {
        if (rule.action === 'allow') return true;
        if (rule.action === 'deny') return false;
      }
    }
    if (this.config.mode === 'acceptEdits') {
      const editTools = ['FileReadTool', 'FileWriteTool', 'FileEditTool', 'GlobTool', 'GrepTool'];
      if (editTools.includes(toolName)) return true;
    }
    return 'ask';
  }

  getMode(): PermissionMode { return this.config.mode; }
  setMode(mode: PermissionMode): void { this.config.mode = mode; }
}
