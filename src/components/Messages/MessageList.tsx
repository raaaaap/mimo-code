import React from 'react';
import { Box } from 'ink';
import type { Message } from '../../types/message.js';
import { MessageItem } from './MessageItem.js';

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <Box flexDirection="column">
      {messages.map((msg, i) => (
        <MessageItem key={i} message={msg} />
      ))}
    </Box>
  );
}
