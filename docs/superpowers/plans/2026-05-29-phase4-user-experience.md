# Phase 4: User Experience Implementation Plan

**Goal:** Add keybindings, Vim mode, syntax highlighting, diff rendering, and spinner

---

## Task 1: Keybindings System

**Files:** `src/keybindings/types.ts`, `src/keybindings/parser.ts`, `src/keybindings/defaults.ts`, `tests/unit/keybindings/parser.test.ts`

### Key Types

```ts
// types.ts
export interface Keybinding {
  key: string;        // e.g. 'ctrl+c', 'ctrl+x ctrl+k'
  action: string;     // e.g. 'interrupt', 'exit'
  when?: string;      // condition
  platform?: 'win32' | 'darwin' | 'linux';
}

export interface ParsedKey {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string;
}
```

### Parser

```ts
// parser.ts
export function parseKeyCombo(combo: string): ParsedKey {
  const parts = combo.toLowerCase().split('+');
  const result: ParsedKey = { key: '' };
  for (const part of parts) {
    if (part === 'ctrl') result.ctrl = true;
    else if (part === 'alt') result.alt = true;
    else if (part === 'shift') result.shift = true;
    else if (part === 'meta' || part === 'cmd') result.meta = true;
    else result.key = part;
  }
  return result;
}

export function matchKeybinding(input: string, bindings: Keybinding[]): Keybinding | null {
  // Handle chord sequences (ctrl+x then ctrl+k)
  for (const binding of bindings) {
    if (binding.key === input) return binding;
  }
  return null;
}
```

### Defaults

```ts
// defaults.ts
export const DEFAULT_KEYBINDINGS: Keybinding[] = [
  { key: 'ctrl+c', action: 'interrupt' },
  { key: 'ctrl+d', action: 'exit' },
  { key: 'ctrl+l', action: 'clear' },
  { key: 'ctrl+k', action: 'clear_input' },
  { key: 'ctrl+r', action: 'history_search' },
  { key: 'escape', action: 'cancel' },
];
```

---

## Task 2: Vim Mode

**Files:** `src/vim/types.ts`, `src/vim/state.ts`, `src/vim/motions.ts`, `tests/unit/vim/state.test.ts`

### Core State Machine

```ts
// types.ts
export type VimMode = 'insert' | 'normal';
export type VimSubState = 'idle' | 'operator' | 'count' | 'find';

export interface VimState {
  mode: VimMode;
  subState: VimSubState;
  cursor: number;
  count: string;
  operator: string;
  register: string;
}

// state.ts
export function createVimState(): VimState {
  return { mode: 'insert', subState: 'idle', cursor: 0, count: '', operator: '', register: '"' };
}

export function processVimKey(state: VimState, key: string, line: string): { state: VimState; line: string; action?: string } {
  if (state.mode === 'insert') {
    if (key === 'escape') return { state: { ...state, mode: 'normal', subState: 'idle' }, line };
    return { state, line: line.slice(0, state.cursor) + key + line.slice(state.cursor), action: 'insert' };
  }

  // Normal mode
  switch (key) {
    case 'i': return { state: { ...state, mode: 'insert' }, line };
    case 'a': return { state: { ...state, mode: 'insert', cursor: state.cursor + 1 }, line };
    case 'h': return { state: { ...state, cursor: Math.max(0, state.cursor - 1) }, line };
    case 'l': return { state: { ...state, cursor: Math.min(line.length - 1, state.cursor + 1) }, line };
    case '0': return { state: { ...state, cursor: 0 }, line };
    case '$': return { state: { ...state, cursor: line.length - 1 }, line };
    case 'x': return {
      state: { ...state, cursor: Math.min(state.cursor, line.length - 2) },
      line: line.slice(0, state.cursor) + line.slice(state.cursor + 1),
      action: 'delete',
    };
    default: return { state, line };
  }
}
```

---

## Task 3: Syntax Highlighted Diff

**Files:** `src/native-ts/color-diff/index.ts`, `tests/unit/color-diff/renderer.test.ts`

```ts
// index.ts
import chalk from 'chalk';

export interface DiffLine {
  type: 'add' | 'remove' | 'context' | 'header';
  content: string;
  oldLine?: number;
  newLine?: number;
}

export function parseDiff(diffText: string): DiffLine[] {
  const lines = diffText.split('\n');
  const result: DiffLine[] = [];

  for (const line of lines) {
    if (line.startsWith('@@')) {
      result.push({ type: 'header', content: line });
    } else if (line.startsWith('+')) {
      result.push({ type: 'add', content: line.slice(1) });
    } else if (line.startsWith('-')) {
      result.push({ type: 'remove', content: line.slice(1) });
    } else {
      result.push({ type: 'context', content: line.startsWith(' ') ? line.slice(1) : line });
    }
  }

  return result;
}

export function renderDiffLine(line: DiffLine): string {
  switch (line.type) {
    case 'add': return chalk.green(`+ ${line.content}`);
    case 'remove': return chalk.red(`- ${line.content}`);
    case 'header': return chalk.cyan(line.content);
    case 'context': return `  ${line.content}`;
  }
}

export function renderDiff(diffText: string): string {
  return parseDiff(diffText).map(renderDiffLine).join('\n');
}
```

---

## Task 4: StructuredDiff Component

**Files:** `src/components/StructuredDiff/StructuredDiff.tsx`

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import { parseDiff, type DiffLine } from '../../native-ts/color-diff/index.js';

interface Props {
  diff: string;
  maxLines?: number;
}

export function StructuredDiff({ diff, maxLines }: Props) {
  const lines = parseDiff(diff);
  const displayed = maxLines ? lines.slice(0, maxLines) : lines;

  return (
    <Box flexDirection="column">
      {displayed.map((line, i) => (
        <Text key={i} color={line.type === 'add' ? 'green' : line.type === 'remove' ? 'red' : line.type === 'header' ? 'cyan' : undefined}>
          {line.type === 'add' ? '+ ' : line.type === 'remove' ? '- ' : '  '}{line.content}
        </Text>
      ))}
    </Box>
  );
}
```

---

## Task 5: HighlightedCode Component

**Files:** `src/components/HighlightedCode/HighlightedCode.tsx`

```tsx
import React from 'react';
import { Text } from 'ink';
import chalk from 'chalk';

interface Props {
  code: string;
  language?: string;
}

const KEYWORDS: Record<string, string[]> = {
  typescript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'class', 'import', 'export', 'from', 'interface', 'type', 'async', 'await', 'new', 'this'],
  python: ['def', 'class', 'import', 'from', 'return', 'if', 'else', 'for', 'while', 'with', 'as', 'try', 'except', 'finally', 'lambda', 'yield'],
};

function highlightLine(line: string, language?: string): string {
  const keywords = KEYWORDS[language ?? ''] ?? [];

  // Comments
  if (line.trimStart().startsWith('//') || line.trimStart().startsWith('#')) {
    return chalk.gray(line);
  }

  // Strings
  let result = line.replace(/(["'`])((?:(?!\1)[\s\S])*?)\1/g, chalk.yellow('$1$2$1'));

  // Keywords
  for (const kw of keywords) {
    result = result.replace(new RegExp(`\\b${kw}\\b`, 'g'), chalk.blue(kw));
  }

  // Numbers
  result = result.replace(/\b(\d+)\b/g, chalk.cyan('$1'));

  return result;
}

export function HighlightedCode({ code, language }: Props) {
  const lines = code.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Text key={i}>{highlightLine(line, language)}</Text>
      ))}
    </>
  );
}
```

---

## Task 6: Spinner Component

**Files:** `src/components/Spinner/Spinner.tsx`, `tests/unit/spinner/spinner.test.ts`

```tsx
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
```

---

## Task 7: Final Integration

- Run full test suite
- Commit all Phase 4 changes
