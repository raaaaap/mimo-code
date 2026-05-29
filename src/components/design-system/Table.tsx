import React from 'react';
import { Text, Box } from 'ink';

interface TableProps {
  headers: string[];
  rows: string[][];
}

export function Table({ headers, rows }: TableProps) {
  const headerLine = headers.join('  |  ');
  const separator = '─'.repeat(headerLine.length);
  return (
    <Box flexDirection="column">
      <Text bold>{headerLine}</Text>
      <Text>{separator}</Text>
      {rows.map((row, i) => (
        <Text key={i}>{row.join('  |  ')}</Text>
      ))}
    </Box>
  );
}
