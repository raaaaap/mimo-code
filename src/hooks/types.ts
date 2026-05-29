/** Events that can trigger hooks */
export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Compact'
  | 'PermissionRequest';

/** Context passed to hook execution */
export interface HookContext {
  /** Name of the tool being used (for PreToolUse/PostToolUse) */
  toolName?: string;
  /** Input arguments for the tool */
  toolInput?: Record<string, unknown>;
  /** Tool execution result (for PostToolUse) */
  toolResult?: unknown;
  /** Session ID */
  sessionId?: string;
  /** Working directory */
  cwd?: string;
  /** Permission being requested (for PermissionRequest) */
  permission?: string;
  /** Additional arbitrary context */
  [key: string]: unknown;
}

/** Result of a hook execution */
export interface HookResult {
  /** Whether the hook succeeded */
  success: boolean;
  /** Output from the hook command */
  output?: string;
  /** Error message if the hook failed */
  error?: string;
}

/** A registered hook */
export interface Hook {
  /** Unique identifier for this hook */
  id: string;
  /** The event that triggers this hook */
  event: HookEvent;
  /** Hook type */
  type: 'command' | 'agent';
  /** Shell command to execute (required for command type) */
  command?: string;
  /** Conditional expression — hook runs only if this evaluates truthy */
  if?: string;
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Whether to run the hook asynchronously (fire-and-forget) */
  async?: boolean;
}
