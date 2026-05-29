import React from 'react';
import { Box, Text } from 'ink';
import { parseDiff } from '../../native-ts/color-diff/index.js';

interface StructuredDiffProps {
  diff: string;
}

const colorMap: Record<string, string> = {
  add: 'green',
  remove: 'red',
  header: 'cyan',
  context: 'white',
};

const prefixMap: Record<string, string> = {
  add: '+',
  remove: '-',
  header: '',
  context: ' ',
};

export function StructuredDiff({ diff }: StructuredDiffProps) {
  const lines = parseDiff(diff);

  return (
    <Box flexDirection="column">
      {lines.map((line, i) => {
        const color = colorMap[line.type] ?? 'white';
        const prefix = prefixMap[line.type] ?? ' ';

        return (
          <Text key={i} color={color}>
            {prefix}
            {line.content}
          </Text>
        );
      })}
    </Box>
  );
}
