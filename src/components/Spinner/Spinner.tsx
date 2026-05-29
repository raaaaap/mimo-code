import React, { useEffect, useState } from 'react';
import { Text } from 'ink';

const FRAMES = {
  dots: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
  line: ['-', '\\', '|', '/'],
  arc: ['◜', '◠', '◝', '◞', '◡', '◟'],
};

type SpinnerStyle = keyof typeof FRAMES;

interface Props {
  style?: SpinnerStyle;
  text?: string;
}

export function Spinner({ style = 'dots', text }: Props) {
  const [frame, setFrame] = useState(0);
  const frames = FRAMES[style];

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % frames.length);
    }, 80);
    return () => clearInterval(timer);
  }, [frames.length]);

  return (
    <Text>
      {frames[frame]}{text ? ` ${text}` : ''}
    </Text>
  );
}
