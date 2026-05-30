import React from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../../types/message.js';
import { useTheme } from '../../utils/useTheme.js';

/** Strip tool_call XML blocks from text content */
function stripToolCallXml(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .replace(/<function_calls>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g, '')
    .replace(/<parameter=[^>]*>[\s\S]*?<\/parameter>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse tool call XML blocks from text content */
function parseToolCallXml(text: string): Array<{ name: string; args: string }> {
  const results: Array<{ name: string; args: string }> = [];
  // Match<tool_call> blocks (common format)
  const tcRegex = /<tool_call>\s*<function=(\w+)>([\s\S]*?)<\/function>\s*<\/tool_call>/g;
  let match;
  while ((match = tcRegex.exec(text)) !== null) {
    const name = match[1];
    const argsStr = match[2];
    const paramRegex = /<parameter=([^>]+)>([\s\S]*?)<\/parameter>/g;
    const args: Record<string, string> = {};
    let pm;
    while ((pm = paramRegex.exec(argsStr)) !== null) {
      args[pm[1]] = pm[2].trim();
    }
    results.push({ name, args: JSON.stringify(args) });
  }
  // Also match <tool_call> with JSON inside
  const jsonTcRegex = /<tool_call>\s*(\{[\s\S]*?\})\s*<\/tool_call>/g;
  while ((match = jsonTcRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      results.push({ name: parsed.name ?? parsed.function?.name ?? 'Tool', args: JSON.stringify(parsed.arguments ?? parsed.parameters ?? {}) });
    } catch { /* skip */ }
  }
  return results;
}

/** Extract tool name from a tool result message */
function getToolDisplayName(message: Message): string {
  if (message.name) return message.name;
  // Try to infer from content
  const content = typeof message.content === 'string' ? message.content : '';
  if (message.toolCallId) return 'Tool';
  return 'Tool';
}

function summarizeToolCall(name: string, args: string): string {
  try {
    const parsed = typeof args === 'string' ? JSON.parse(args) : args;
    const cmd = parsed.command ?? parsed.file_path ?? parsed.pattern ?? parsed.query ?? parsed.url;
    if (cmd) return String(cmd).slice(0, 120);
    return JSON.stringify(parsed).slice(0, 80);
  } catch {
    return String(args).slice(0, 80);
  }
}

export function MessageItem({ message }: { message: Message }) {
  const theme = useTheme();

  const roleColors: Record<string, string> = {
    user: theme.colors.accent,
    assistant: theme.colors.success,
    tool: theme.colors.warning,
    system: theme.colors.muted,
  };
  const roleLabels: Record<string, string> = {
    user: 'You',
    assistant: 'Mimo',
    tool: 'Result',
    system: 'System',
  };
  const color = roleColors[message.role] ?? theme.colors.foreground;
  const label = roleLabels[message.role] ?? message.role;

  // Extract text content
  const rawContent =
    typeof message.content === 'string'
      ? message.content
      : message.content.map((p) => p.text ?? '').join('');

  // For tool messages, show a short summary instead of full output
  if (message.role === 'tool') {
    const preview = rawContent.length > 200 ? rawContent.slice(0, 200) + '...' : rawContent;
    return (
      <Box flexDirection="column" marginBottom={0}>
        <Text color={theme.colors.muted} dimColor>
          {'  ↳ '}{preview}
        </Text>
      </Box>
    );
  }

  // For assistant messages, strip tool_call XML from display text
  const displayContent = message.role === 'assistant' ? stripToolCallXml(rawContent) : rawContent;

  // Collect tool calls from both structured toolCalls and parsed XML
  const allToolCalls: Array<{ name: string; args: string }> = [];
  if (message.toolCalls) {
    for (const tc of message.toolCalls) {
      allToolCalls.push({ name: tc.function.name, args: tc.function.arguments });
    }
  }
  // Also parse XML tool calls from text if no structured ones
  if (allToolCalls.length === 0 && message.role === 'assistant') {
    allToolCalls.push(...parseToolCallXml(rawContent));
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={color}>
        [{label}]
      </Text>
      {displayContent && <Text>{displayContent}</Text>}
      {allToolCalls.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {allToolCalls.map((tc, i) => (
            <Text key={i} color={theme.colors.accent}>
              {'  ⚡ '}{tc.name}
              <Text color={theme.colors.muted}> — {summarizeToolCall(tc.name, tc.args)}</Text>
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
