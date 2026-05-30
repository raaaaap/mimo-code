import React from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../../types/message.js';
import { useTheme } from '../../utils/useTheme.js';

function summarizeToolCall(name: string, args: string): string {
  try {
    const parsed = JSON.parse(args);
    switch (name) {
      case 'BashTool':
      case 'PowerShellTool':
        return parsed.command ?? args.slice(0, 80);
      case 'FileReadTool':
        return parsed.file_path ?? args.slice(0, 80);
      case 'FileWriteTool':
        return parsed.file_path ?? args.slice(0, 80);
      case 'FileEditTool':
        return parsed.file_path ?? args.slice(0, 80);
      case 'GlobTool':
        return parsed.pattern ?? args.slice(0, 80);
      case 'GrepTool':
        return parsed.pattern ?? args.slice(0, 80);
      case 'WebFetchTool':
        return parsed.url ?? args.slice(0, 80);
      case 'WebSearchTool':
        return parsed.query ?? args.slice(0, 80);
      default:
        return args.slice(0, 80);
    }
  } catch {
    return args.slice(0, 80);
  }
}

export function MessageItem({ message }: { message: Message }) {
  const theme = useTheme();

  const roleColors: Record<string, string> = {
    user: theme.colors.accent,
    assistant: theme.colors.success,
    tool: theme.colors.muted,
    system: theme.colors.warning,
  };
  const roleLabels: Record<string, string> = {
    user: 'You',
    assistant: 'Mimo',
    tool: 'Tool',
    system: 'System',
  };
  const color = roleColors[message.role] ?? theme.colors.foreground;
  const label = roleLabels[message.role] ?? message.role;
  const content =
    typeof message.content === 'string'
      ? message.content
      : message.content.map((p) => p.text ?? '').join('');

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Text bold color={color}>
        [{label}]
      </Text>
      <Text>{content}</Text>
      {message.toolCalls && message.toolCalls.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          {message.toolCalls.map((tc, i) => (
            <Text key={i} color={theme.colors.muted}>
              {'  → '}{tc.function.name}
              <Text color={theme.colors.foreground}> — {summarizeToolCall(tc.function.name, tc.function.arguments)}</Text>
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
}
