import { describe, it, expect } from 'vitest';
import { AskUserQuestionTool } from '../../../src/tools/AskUserQuestionTool/AskUserQuestionTool.js';

describe('AskUserQuestionTool', () => {
  it('has correct name', () => {
    const tool = AskUserQuestionTool();
    expect(tool.name).toBe('AskUserQuestionTool');
  });

  it('validates input with question', () => {
    const tool = AskUserQuestionTool();
    const result = tool.inputSchema.safeParse({
      question: 'Which framework?',
      options: ['React', 'Vue', 'Angular'],
    });
    expect(result.success).toBe(true);
  });

  it('validates input with open question', () => {
    const tool = AskUserQuestionTool();
    const result = tool.inputSchema.safeParse({
      question: 'What is your API key?',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty question', () => {
    const tool = AskUserQuestionTool();
    const result = tool.inputSchema.safeParse({ question: '' });
    expect(result.success).toBe(false);
  });

  it('is read-only', () => {
    const tool = AskUserQuestionTool();
    expect(tool.isReadOnly()).toBe(true);
  });

  it('is not destructive', () => {
    const tool = AskUserQuestionTool();
    expect(tool.isDestructive()).toBe(false);
  });

  it('has aliases', () => {
    const tool = AskUserQuestionTool();
    expect(tool.aliases).toContain('ask');
  });

  it('uses defaultAnswer when user provides no input', async () => {
    const tool = AskUserQuestionTool();
    const context = {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const result = await tool.call(
      { question: 'Pick one', defaultAnswer: 'Option A' },
      context as any,
    );
    expect(result.result).toBe('Option A');
    expect(result.isError).toBeUndefined();
  });

  it('returns user answer as-is when no options provided', async () => {
    const tool = AskUserQuestionTool();
    const context = {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => 'my custom answer',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const result = await tool.call(
      { question: 'What is your name?' },
      context as any,
    );
    expect(result.result).toBe('my custom answer');
  });

  it('resolves numeric selection to option text', async () => {
    const tool = AskUserQuestionTool();
    const context = {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '2',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const result = await tool.call(
      { question: 'Pick a framework', options: ['React', 'Vue', 'Angular'] },
      context as any,
    );
    expect(result.result).toBe('Vue');
  });

  it('resolves multi-select comma-separated numbers', async () => {
    const tool = AskUserQuestionTool();
    const context = {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '1,3',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const result = await tool.call(
      { question: 'Pick languages', options: ['TypeScript', 'Python', 'Rust'], multiSelect: true },
      context as any,
    );
    expect(result.result).toBe('TypeScript, Rust');
  });

  it('returns "(no answer provided)" when no answer and no default', async () => {
    const tool = AskUserQuestionTool();
    const context = {
      options: { model: 'test' },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const result = await tool.call(
      { question: 'Any preference?' },
      context as any,
    );
    expect(result.result).toBe('(no answer provided)');
  });
});
