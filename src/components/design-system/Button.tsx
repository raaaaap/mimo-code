import React from 'react';
import { Text, Box } from 'ink';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
}

export function Button({ label, variant = 'primary' }: ButtonProps) {
  const color = variant === 'primary' ? '#FF6900' : variant === 'danger' ? 'red' : 'gray';
  return (
    <Box borderStyle="round" borderColor={color} paddingX={1}>
      <Text color={color}>{label}</Text>
    </Box>
  );
}
