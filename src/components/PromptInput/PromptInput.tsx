import React, { useState } from 'react';
import { Text, Box, useInput, useApp } from 'ink';
import { useTheme } from '../../utils/useTheme.js';

interface PromptInputProps {
  onSubmit: (input: string) => void;
  isDisabled?: boolean;
  onAbort?: () => void;
}

export function PromptInput({ onSubmit, isDisabled, onAbort }: PromptInputProps) {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const { exit } = useApp();
  const theme = useTheme();

  useInput((key, keyMeta) => {
    if (isDisabled) {
      if (key === 'escape' || (keyMeta.ctrl && key === 'c')) {
        onAbort?.();
      }
      return;
    }

    if (keyMeta.return) {
      // Shift+Enter inserts a newline instead of submitting
      if (keyMeta.shift) {
        setInput((prev) => prev + '\n');
        return;
      }
      if (input.trim()) {
        setHistory((prev) => [...prev, input.trim()]);
        setHistoryIndex(-1);
        onSubmit(input.trim());
        setInput('');
      }
      return;
    }

    if (keyMeta.ctrl && (key === 'c' || key === 'd')) {
      exit();
      return;
    }

    if (keyMeta.upArrow && history.length > 0) {
      const newIndex =
        historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
      return;
    }

    if (keyMeta.downArrow && historyIndex >= 0) {
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput('');
      } else {
        setHistoryIndex(newIndex);
        setInput(history[newIndex]);
      }
      return;
    }

    if (keyMeta.backspace || keyMeta.delete) {
      setInput((prev) => prev.slice(0, -1));
      return;
    }

    if (key === 'escape') {
      setInput('');
      setHistoryIndex(-1);
      return;
    }

    if (key.length === 1 && !keyMeta.ctrl && !keyMeta.meta) {
      setInput((prev) => prev + key);
    }
  });

  return (
    <Box flexDirection="column">
      <Box>
        <Text color={theme.colors.primary} bold>
          {' > '}
        </Text>
        <Text>{input}</Text>
        {!isDisabled && <Text color={theme.colors.muted}>_</Text>}
      </Box>
      {!isDisabled ? (
        <Text color={theme.colors.muted} dimColor>
          Enter to submit, Shift+Enter for newline
        </Text>
      ) : (
        <Text color={theme.colors.muted} dimColor>
          Press Escape to abort
        </Text>
      )}
    </Box>
  );
}
