import type { Message, ToolCall, TokenUsage } from './message.js';
import type { ToolDefinition } from './tool.js';

export interface ModelRequest {
  model: string;
  messages: Message[];
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: 'auto' | 'none' | 'required' | { type: 'function'; function: { name: string } };
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  abortSignal?: AbortSignal;
  metadata?: Record<string, unknown>;
}

export interface StreamChunk {
  type: 'text' | 'tool_use' | 'thinking' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  usage?: TokenUsage;
  finishReason?: string;
}

export interface ModelResponse {
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
  finishReason?: string;
}

export interface ModelAdapter {
  name: string;
  streamChat(request: ModelRequest): AsyncGenerator<StreamChunk>;
  chat(request: ModelRequest): Promise<ModelResponse>;
  countTokens(messages: Message[]): number;
  supports(model: string): boolean;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  jitter: boolean;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['rate_limit', 'server_error', 'timeout', '429', '500', '502', '503'],
  jitter: true,
};
