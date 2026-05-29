export interface CLIOptions {
  model: string;
  apiKey?: string;
  apiEndpoint?: string;
  mode: 'interactive' | 'single' | 'pipe';
  verbose: boolean;
  debug: boolean;
  output: 'text' | 'json' | 'markdown';
  noColor: boolean;
  theme: string;
  maxTokens: number;
  temperature: number;
  permissionMode: string;
}

export interface ContextConfig {
  maxTokens?: number;
  compactThreshold?: number;
  maxToolOutputLength?: number;
  autoCompact?: boolean;
}

export interface MimoConfig {
  model?: string;
  contextWindow?: number;
  maxOutput?: number;
}

export interface BuddyConfig {
  enabled?: boolean;
  muted?: boolean;
  name?: string;
}

export interface SettingsJson {
  model?: string;
  apiKey?: string;
  apiEndpoint?: string;
  theme?: string;
  maxTokens?: number;
  temperature?: number;
  permissionMode?: string;
  allowedTools?: string[];
  deniedTools?: string[];
  hooks?: {
    preToolUse?: Record<string, string>;
    postToolUse?: Record<string, string>;
  };
  mcpServers?: Record<string, {
    transport: 'stdio' | 'sse' | 'http';
    command?: string;
    args?: string[];
    url?: string;
    env?: Record<string, string>;
  }>;
  context?: ContextConfig;
  mimo?: MimoConfig;
  buddy?: BuddyConfig;
}

export type SettingsSource = 'userSettings' | 'projectSettings' | 'localSettings' | 'flagSettings' | 'policySettings';
