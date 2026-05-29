import React from 'react';
import { Text, Box } from 'ink';
import type { Message } from '../../types/message.js';

export function MessageItem({ message }: { message: Message }) {
  const roleColors: Record<string, string> = {
    user: 'blue',
    assistant: 'green',
    tool: 'gray',
    system: 'yellow',
  };
  const roleLabels: Record<string, string> = {
    user: 'You',
    assistant: 'Mimo',
    tool: 'Tool',
    system: 'System',
  };
  const color = roleColors[message.role] ?? 'white';
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
        <Box marginTop={1}>
          <Text color="gray">
            {message.toolCalls
              .map(
                (tc) =>
                  `  -> ${tc.function.name}(${tc.function.arguments.slice(0, 80)}${tc.function.arguments.length > 80 ? '...' : ''})`,
              )
              .join('\n')}
          </Text>
        </Box>
      )}
    </Box>
  );
}
