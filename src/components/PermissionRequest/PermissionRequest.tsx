import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';

interface PermissionRequestProps {
  toolName: string;
  args: string;
  onAllow: () => void;
  onDeny: () => void;
}

export function PermissionRequest({ toolName, args, onAllow, onDeny }: PermissionRequestProps) {
  const [choice, setChoice] = useState<'allow' | 'deny' | null>(null);

  useInput((key) => {
    if (choice) return;
    if (key === 'y' || key === 'Y') {
      setChoice('allow');
      onAllow();
    } else if (key === 'n' || key === 'N') {
      setChoice('deny');
      onDeny();
    }
  });

  if (choice === 'allow') return <Text color="green">[Allowed] {toolName}</Text>;
  if (choice === 'deny') return <Text color="red">[Denied] {toolName}</Text>;

  const truncatedArgs = args.length > 100 ? args.slice(0, 100) + '...' : args;

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
      <Text color="yellow" bold>Permission required</Text>
      <Text>Tool: <Text color="cyan">{toolName}</Text></Text>
      <Text>Args: <Text color="gray">{truncatedArgs}</Text></Text>
      <Box marginTop={1}>
        <Text color="green">[Y]</Text>
        <Text> Allow  </Text>
        <Text color="red">[N]</Text>
        <Text> Deny</Text>
      </Box>
    </Box>
  );
}
