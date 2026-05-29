import React, { useEffect, useCallback, useRef } from 'react';
import { Box, Text, useStdout, useInput } from 'ink';
import type { Message } from '../../types/message.js';
import { MessageItem } from './MessageItem.js';

interface MessageListProps {
  messages: Message[];
  scrollOffset: number;
  onScrollChange: (offset: number) => void;
  isAtBottom: boolean;
  onSetIsAtBottom: (atBottom: boolean) => void;
}

// Estimate line count for a message (role label + content lines + margin)
function estimateMessageLines(message: Message): number {
  const content =
    typeof message.content === 'string'
      ? message.content
      : message.content.map((p) => p.text ?? '').join('');
  const contentLines = content.split('\n').length;
  const toolCallLines = message.toolCalls && message.toolCalls.length > 0
    ? message.toolCalls.length + 1
    : 0;
  // role label (1) + content lines + tool call lines + margin (1)
  return 1 + contentLines + toolCallLines + 1;
}

export function MessageList({
  messages,
  scrollOffset,
  onScrollChange,
  isAtBottom,
  onSetIsAtBottom,
}: MessageListProps) {
  const { stdout } = useStdout();
  // Reserve space for: header (2) + cat (4) + input area (3) + command hint (1) + padding (2)
  const reservedLines = 12;
  const viewportHeight = Math.max(10, (stdout?.rows ?? 24) - reservedLines);

  // Calculate total lines for all messages
  const totalLines = messages.reduce((sum, msg) => sum + estimateMessageLines(msg), 0);

  // Clamp scroll offset
  const maxOffset = Math.max(0, totalLines - viewportHeight);
  const clampedOffset = Math.min(scrollOffset, maxOffset);

  // Find which messages to render based on scroll offset
  let lineAccum = 0;
  let startIndex = 0;
  for (let i = 0; i < messages.length; i++) {
    if (lineAccum + estimateMessageLines(messages[i]) > clampedOffset) {
      startIndex = i;
      break;
    }
    lineAccum += estimateMessageLines(messages[i]);
    if (i === messages.length - 1) {
      startIndex = i;
    }
  }

  // Slice messages to fit viewport
  const visibleMessages: Message[] = [];
  let usedLines = 0;
  for (let i = startIndex; i < messages.length; i++) {
    const msgLines = estimateMessageLines(messages[i]);
    if (usedLines + msgLines > viewportHeight && visibleMessages.length > 0) break;
    visibleMessages.push(messages[i]);
    usedLines += msgLines;
  }

  const canScrollUp = clampedOffset > 0;
  const canScrollDown = clampedOffset < maxOffset;

  return (
    <Box flexDirection="column">
      {/* Scroll up indicator */}
      {canScrollUp && (
        <Box>
          <Text color="gray" dimColor>
            ↑ 更多消息... (Page Up / 滚轮上滚)
          </Text>
        </Box>
      )}

      {/* Visible messages */}
      {visibleMessages.map((msg, i) => (
        <MessageItem key={startIndex + i} message={msg} />
      ))}

      {/* Scroll down indicator */}
      {canScrollDown && (
        <Box>
          <Text color="gray" dimColor>
            ↓ 更多消息... (Page Down / 滚轮下滚)
          </Text>
        </Box>
      )}
    </Box>
  );
}
