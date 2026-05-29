import React, { useState, useEffect } from 'react';
import { Text, Box } from 'ink';

export enum MimoState {
  IDLE = 'idle',
  THINKING = 'thinking',
  CODING = 'coding',
  SUCCESS = 'success',
  ERROR = 'error',
  READING = 'reading',
}

// Xiaomi Cat sprite — MI logo deconstructed into cat anatomy.
// M = ears (two arches), I = tail (vertical line), super-ellipse = face.
// Each frame is 7 lines tall, ~12 chars wide.

const IDLE_FRAMES = [
  // Frame 0: Rest
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  // Frame 1: Look left
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │ ●     ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ │ ',
    '           ╱  ',
  ],
  // Frame 2: Look right
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ●  │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯   ',
    '   ╲         ',
  ],
  // Frame 3: Blink
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
];

const THINKING_FRAMES = [
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │   ∪    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ ╱ ',
    '          ╱  ',
  ],
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │    ∪   │ ',
    '   ╲      ╱  ',
    '    ╰────╯  ╲',
    '            ╲',
  ],
];

const SUCCESS_FRAMES = [
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◠    ◠ │ ',
    '  │   ╰╯   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
];

const ERROR_FRAMES = [
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ◉    ◉ │ ',
    '  │    ○   │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
];

const CODING_FRAMES = [
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ●    ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │ ●     ● │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯ │ ',
    '           ╱  ',
  ],
];

const READING_FRAMES = [
  [
    '   ╱╲    ╱╲  ',
    '  ╱  ╲──╱  ╲ ',
    '  │  ─    ─ │ ',
    '  │    ω    │ ',
    '   ╲      ╱  ',
    '    ╰────╯│  ',
    '           │  ',
  ],
];

const STATE_FRAMES: Record<MimoState, string[][]> = {
  [MimoState.IDLE]: IDLE_FRAMES,
  [MimoState.THINKING]: THINKING_FRAMES,
  [MimoState.CODING]: CODING_FRAMES,
  [MimoState.SUCCESS]: SUCCESS_FRAMES,
  [MimoState.ERROR]: ERROR_FRAMES,
  [MimoState.READING]: READING_FRAMES,
};

const STATE_TICK_MS: Record<MimoState, number> = {
  [MimoState.IDLE]: 500,
  [MimoState.THINKING]: 400,
  [MimoState.CODING]: 300,
  [MimoState.SUCCESS]: 0, // static
  [MimoState.ERROR]: 0,   // static
  [MimoState.READING]: 0, // static
};

export function MimoAvatar({ state = MimoState.IDLE }: { state?: MimoState }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const tickMs = STATE_TICK_MS[state];
    if (tickMs === 0) {
      setFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setFrame((prev) => (prev + 1) % STATE_FRAMES[state].length);
    }, tickMs);

    return () => clearInterval(interval);
  }, [state]);

  const frames = STATE_FRAMES[state];
  const currentFrame = frames[frame % frames.length];

  return (
    <Box flexDirection="column">
      {currentFrame.map((line, i) => (
        <Text key={i} color="#FF6900">{line}</Text>
      ))}
    </Box>
  );
}

export function MimoWelcomeMessage({ userName }: { userName?: string }) {
  const greeting = userName ? `Hello, ${userName}!` : 'Hello!';
  return (
    <Box flexDirection="column" padding={1}>
      <MimoAvatar state={MimoState.IDLE} />
      <Text color="#FF6900" bold>
        {greeting} I'm MiMo, your coding assistant.
      </Text>
      <Text color="gray">Powered by Xiaomi AI</Text>
    </Box>
  );
}

export function MimoStatusLine({ state }: { state: MimoState }) {
  const statusText: Record<MimoState, string> = {
    [MimoState.IDLE]: 'Ready',
    [MimoState.THINKING]: 'Thinking...',
    [MimoState.CODING]: 'Working...',
    [MimoState.SUCCESS]: 'Done!',
    [MimoState.ERROR]: 'Something went wrong',
    [MimoState.READING]: 'Reading...',
  };
  const color: Record<MimoState, string> = {
    [MimoState.IDLE]: 'gray',
    [MimoState.THINKING]: '#FF6900',
    [MimoState.CODING]: '#FF6900',
    [MimoState.SUCCESS]: 'green',
    [MimoState.ERROR]: 'red',
    [MimoState.READING]: 'blue',
  };
  return <Text color={color[state]}>[{statusText[state]}]</Text>;
}
