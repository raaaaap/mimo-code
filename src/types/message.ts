export interface ContentPart {
  type: 'text' | 'image' | 'tool_use' | 'tool_result';
  text?: string;
  source?: { type: 'base64'; media_type: string; data: string };
  tool_use?: { id: string; name: string; input: Record<string, unknown> };
  tool_result?: { tool_use_id: string; content: string };
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  cacheCreationTokens?: number;
}

export interface UserMessage {
  type: 'user';
  content: string;
  attachments?: unknown[];
}

export interface AssistantMessage {
  type: 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  usage?: TokenUsage;
}
