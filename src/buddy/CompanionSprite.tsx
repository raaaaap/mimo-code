import React, { useEffect, useState } from 'react';
import { Box, Text } from 'ink';
import { renderSprite, renderFace } from './sprites.js';
import { useTheme } from '../utils/useTheme.js';

export type CatState = 'idle' | 'thinking' | 'coding' | 'success' | 'error';

const STATE_FRAMES: Record<CatState, number> = {
  idle: 0,     // Rest
  thinking: 6, // Thinking
  coding: 5,   // Surprised
  success: 4,  // Happy
  error: 3,    // Blink
};

const MIN_COLS_FOR_FULL_SPRITE = 60;

interface CompanionSpriteProps {
  state: CatState;
  columns?: number;
}

export function CompanionSprite({ state, columns }: CompanionSpriteProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setTick(t => t + 1), 500);
    return () => clearInterval(timer);
  }, []);

  const cols = columns ?? process.stdout.columns ?? 80;
  const theme = useTheme();
  const color = theme.colors.primary;

  // Narrow terminal: one-line face
  if (cols < MIN_COLS_FOR_FULL_SPRITE) {
    return (
      <Box paddingX={1}>
        <Text bold color={color}>{renderFace()}</Text>
      </Box>
    );
  }

  // Full sprite
  const baseFrame = STATE_FRAMES[state];
  // Idle: cycle through rest frames. Active: show state frame with occasional blink
  let frame: number;
  if (state === 'idle') {
    const idleCycle = [0, 0, 0, 0, 1, 0, 0, 0, 3, 0, 0, 2, 0, 0, 0];
    frame = idleCycle[tick % idleCycle.length]!;
  } else {
    // Active state: show state frame, blink every ~8 ticks
    frame = tick % 8 === 7 ? 3 : baseFrame;
  }

  const body = renderSprite(frame);

  return (
    <Box paddingX={1} flexDirection="column" alignItems="center">
      {body.map((line, i) => (
        <Text key={i} color={color}>{line}</Text>
      ))}
    </Box>
  );
}
