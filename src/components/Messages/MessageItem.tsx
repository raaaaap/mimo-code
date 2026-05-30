import React from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../../types/message.js';
import { useTheme } from '../../utils/useTheme.js';

/** Strip tool call blocks (XML and JSON) from text content */
function stripToolCallXml(text: string): string {
  return text
    .replace(/<tool_call>[\s\S]*?<\/tool_call>/g, '')
    .replace(/\{"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:\s*\{[\s\S]*?\}\s*\}/g, '')
    .replace(/\{"tool"\s*:\s*"[^"]+"\s*,\s*"input"\s*:\s*\{[\s\S]*?\}\s*\}/g, '')
    .replace(/<function_calls>[\s\S]*?<\/antml:invoke>[\s\S]*?<\/antml:function_calls>/g, '')
    .replace(/<parameter=[^>]*>[\s\S]*?<\/parameter>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Parse tool call names from text content (XML and JSON formats) */
function parseToolCallNames(text: string): string[] {
  const names: string[] = [];
  // XML format
  const xmlRegex = /<tool_call>\s*<function=(\w+)>/g;
  let match;
  while ((match = xmlRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  // JSON format with "name" key
  const jsonRegex = /\{"name"\s*:\s*"([^"]+)"\s*,\s*"arguments"\s*:/g;
  while ((match = jsonRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  // JSON format with "tool" key
  const altRegex = /\{"tool"\s*:\s*"([^"]+)"\s*,\s*"input"\s*:/g;
  while ((match = altRegex.exec(text)) !== null) {
    names.push(match[1]);
  }
  return names;
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

  // Hide tool result messages entirely
  if (message.role === 'tool') {
    return null;
  }

  // For assistant messages, strip tool call blocks from display text
  const displayContent = message.role === 'assistant' ? stripToolCallXml(rawContent) : rawContent;

  // Collect tool names from both structured toolCalls and parsed text
  const toolNames: string[] = [];
  if (message.toolCalls) {
    for (const tc of message.toolCalls) {
      toolNames.push(tc.function.name);
    }
  }
  // Also parse tool calls from text if no structured ones
  if (toolNames.length === 0 && message.role === 'assistant') {
    toolNames.push(...parseToolCallNames(rawContent));
  }

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={color}>
        [{label}]
      </Text>
      {displayContent && <Text>{displayContent}</Text>}
      {toolNames.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {toolNames.map((name, i) => (
            <Text key={i} color={theme.colors.accent}>
              {'  '}{name}
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
