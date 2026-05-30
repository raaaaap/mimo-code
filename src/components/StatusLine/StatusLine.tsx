import React, { useState, useEffect, useRef } from 'react';
import { Text, Box } from 'ink';
import { useTheme } from '../../utils/useTheme.js';

interface StatusLineProps {
  status: 'idle' | 'thinking' | 'executing';
  toolName?: string;
  toolSummary?: string;
}

function useTimer(isRunning: boolean): number {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      startRef.current = Date.now();
      setElapsed(0);
      const interval = setInterval(() => {
        setElapsed(Date.now() - startRef.current);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setElapsed(0);
      return undefined;
    }
  }, [isRunning]);

  return elapsed;
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StatusLine({ status, toolName, toolSummary }: StatusLineProps) {
  const theme = useTheme();
  const elapsed = useTimer(status !== 'idle');

  if (status === 'idle') return null;

  return (
    <Box marginTop={1} flexDirection="column">
      {status === 'thinking' && (
        <Text color={theme.colors.primary}>
          💭 思考中... <Text color={theme.colors.muted}>{formatTime(elapsed)}</Text>
        </Text>
      )}
      {status === 'executing' && (
        <Box flexDirection="column">
          <Text color={theme.colors.accent}>
            ⚡ 执行中: <Text color={theme.colors.muted}>{formatTime(elapsed)}</Text>
          </Text>
          {toolName && (
            <Text color={theme.colors.foreground}>
              {'  '}{toolName}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
}
