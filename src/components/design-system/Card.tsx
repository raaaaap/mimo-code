import React from 'react';
import { Text, Box } from 'ink';

interface CardProps {
  title?: string;
  children: React.ReactNode;
}

export function Card({ title, children }: CardProps) {
  return (
    <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
      {title && <Text bold>{title}</Text>}
      {children}
    </Box>
  );
}
