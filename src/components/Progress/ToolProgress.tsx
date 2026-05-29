import React from 'react';
import { Text, Box } from 'ink';

interface ToolProgressProps {
  activeTools: Array<{ name: string; status: 'running' | 'done' | 'error' }>;
}

export function ToolProgress({ activeTools }: ToolProgressProps) {
  if (activeTools.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      {activeTools.map((tool, i) => {
        const icon = tool.status === 'running' ? '...' : tool.status === 'done' ? '[OK]' : '[ERR]';
        const color = tool.status === 'running' ? 'yellow' : tool.status === 'done' ? 'green' : 'red';
        return (
          <Box key={i}>
            <Text color={color}>  {icon} {tool.name}</Text>
          </Box>
        );
      })}
    </Box>
  );
}
