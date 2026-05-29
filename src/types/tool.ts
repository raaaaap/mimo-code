import type { z } from 'zod';
import type { Message } from './message.js';

export interface ToolResult {
  toolUseId: string;
  name: string;
  result: string;
  error?: string;
  isError?: boolean;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface QueryOptions {
  model: string;
  apiKey?: string;
  apiEndpoint?: string;
  maxTokens?: number;
  temperature?: number;
  verbose?: boolean;
  debug?: boolean;
  permissionMode?: string;
}

export interface ToolUseContext {
  options: QueryOptions;
  abortController: AbortController;
  readFileState: Map<string, string>;
  messages: Message[];
  toolDecisions: Map<string, unknown>;
  requestPrompt: (question: string) => Promise<string>;
  getAppState: () => Record<string, unknown>;
  setAppState: (state: Partial<Record<string, unknown>>) => void;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface Tool<TInput = unknown> {
  name: string;
  aliases?: string[];
  inputSchema: z.ZodSchema<TInput>;
  call(args: TInput, context: ToolUseContext): Promise<ToolResult>;
  description(): Promise<string>;
  prompt(): string;
  checkPermissions(args: TInput, context: ToolUseContext): PermissionResult;
  validateInput?(args: TInput): ValidationResult;
  isConcurrencySafe(): boolean;
  isReadOnly(): boolean;
  isDestructive(): boolean;
  interruptBehavior(): 'cancel' | 'block';
  maxResultSizeChars?: number;
}

export interface ToolPartial<TInput = unknown> {
  name: string;
  aliases?: string[];
  inputSchema: z.ZodSchema<TInput>;
  call(args: TInput, context: ToolUseContext): Promise<ToolResult>;
  description?: () => Promise<string>;
  prompt?: () => string;
  checkPermissions?: (args: TInput, context: ToolUseContext) => PermissionResult;
  validateInput?: (args: TInput) => ValidationResult;
  isConcurrencySafe?: () => boolean;
  isReadOnly?: () => boolean;
  isDestructive?: () => boolean;
  interruptBehavior?: () => 'cancel' | 'block';
}

export function buildTool<T>(partial: ToolPartial<T>): Tool<T> {
  return {
    name: partial.name,
    aliases: partial.aliases,
    inputSchema: partial.inputSchema,
    call: partial.call,
    description: partial.description ?? (async () => partial.name),
    prompt: partial.prompt ?? (() => ''),
    checkPermissions: partial.checkPermissions ?? (() => ({ allowed: true })),
    validateInput: partial.validateInput,
    isConcurrencySafe: partial.isConcurrencySafe ?? (() => false),
    isReadOnly: partial.isReadOnly ?? (() => false),
    isDestructive: partial.isDestructive ?? (() => false),
    interruptBehavior: partial.interruptBehavior ?? (() => 'cancel'),
  };
}
