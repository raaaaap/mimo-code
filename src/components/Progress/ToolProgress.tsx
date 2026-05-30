import React from 'react';
import { Text, Box } from 'ink';
import { useTheme } from '../../utils/useTheme.js';

interface ToolInfo {
  name: string;
  status: 'running' | 'done' | 'error';
  summary?: string;
  duration?: number;
}

interface ToolProgressProps {
  activeTools: ToolInfo[];
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function ToolProgress({ activeTools }: ToolProgressProps) {
  const theme = useTheme();

  if (activeTools.length === 0) return null;

  return (
    <Box flexDirection="column" marginTop={1}>
      {activeTools.map((tool, i) => {
        const icon = tool.status === 'running' ? '⏳' : tool.status === 'done' ? '✓' : '✗';
        const color = tool.status === 'running' ? theme.colors.primary : tool.status === 'done' ? theme.colors.success : theme.colors.error;
        return (
          <Box key={i}>
            <Text color={color}>
              {'  '}{icon} {tool.name}
              {tool.duration !== undefined && (
                <Text color={theme.colors.muted}> ({formatDuration(tool.duration)})</Text>
              )}
              {tool.summary && (
                <Text color={theme.colors.muted}> — {tool.summary}</Text>
              )}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
}
