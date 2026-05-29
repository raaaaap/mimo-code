# Mimo Coding Agent - Phase 5: Polish Implementation Plan

**Goal:** Add theme system, enhance Mimo mascot animations, add slash commands, and improve testing.

**Prerequisites:** Phase 4 complete (permissions, plugins, MCP, Anthropic adapter)

---

### Task 1: Theme System

**Files:**
- Create: `mimo-code/src/utils/themes.ts`
- Test: `mimo-code/tests/unit/themes.test.ts`

- [ ] **Step 1: Implement**

```typescript
// src/utils/themes.ts
export interface Theme {
  name: string;
  type: 'dark' | 'light';
  colors: {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
  };
}

export const THEMES: Record<string, Theme> = {
  'mimo-dark': {
    name: 'mimo-dark',
    type: 'dark',
    colors: {
      background: '#1a1b2e',
      foreground: '#e0e0e0',
      primary: '#4a9eff',
      secondary: '#7c3aed',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    },
  },
  'mimo-light': {
    name: 'mimo-light',
    type: 'light',
    colors: {
      background: '#ffffff',
      foreground: '#1f2937',
      primary: '#2563eb',
      secondary: '#7c3aed',
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
    },
  },
  'matrix': {
    name: 'matrix',
    type: 'dark',
    colors: {
      background: '#000000',
      foreground: '#00ff00',
      primary: '#00ff00',
      secondary: '#00cc00',
      success: '#00ff00',
      warning: '#ffff00',
      error: '#ff0000',
    },
  },
  'ocean': {
    name: 'ocean',
    type: 'dark',
    colors: {
      background: '#0a1628',
      foreground: '#c9d1d9',
      primary: '#58a6ff',
      secondary: '#bc8cff',
      success: '#3fb950',
      warning: '#d29922',
      error: '#f85149',
    },
  },
};

export function getTheme(name: string): Theme {
  return THEMES[name] ?? THEMES['mimo-dark'];
}
```

- [ ] **Step 2: Commit**

---

### Task 2: Slash Commands (help, clear, compact, config)

**Files:**
- Create: `mimo-code/src/commands/help.ts`
- Create: `mimo-code/src/commands/clear.ts`
- Create: `mimo-code/src/commands/compact.ts`
- Create: `mimo-code/src/commands/config.ts`

- [ ] **Step 1: Implement help command**

```typescript
// src/commands/help.ts
import type { Command } from '../commands.js';

export const helpCommand: Command = {
  name: 'help',
  aliases: ['h', '?'],
  description: 'Show available commands',
  isEnabled: () => true,
  call: async (_args, _context) => {
    return [
      'Available commands:',
      '  /help     - Show this help',
      '  /clear    - Clear screen',
      '  /compact  - Compact conversation history',
      '  /config   - Show current configuration',
      '  /model    - Switch model',
      '  /exit     - Exit the agent',
      '',
      'Keyboard shortcuts:',
      '  Ctrl+C    - Cancel current operation',
      '  Ctrl+D    - Exit',
      '  Ctrl+L    - Clear screen',
      '  Up/Down   - Navigate history',
      '  Tab       - Autocomplete',
      '  Escape    - Clear input',
    ].join('\n');
  },
};
```

- [ ] **Step 2: Implement clear command**

```typescript
// src/commands/clear.ts
import type { Command } from '../commands.js';

export const clearCommand: Command = {
  name: 'clear',
  aliases: ['cls'],
  description: 'Clear the screen',
  isEnabled: () => true,
  call: async () => {
    process.stdout.write('\x1B[2J\x1B[0f');
    return undefined;
  },
};
```

- [ ] **Step 3: Implement compact command**

```typescript
// src/commands/compact.ts
import type { Command } from '../commands.js';

export const compactCommand: Command = {
  name: 'compact',
  description: 'Compact conversation history',
  isEnabled: () => true,
  call: async () => {
    return 'Conversation compacted. (Context management not yet fully implemented)';
  },
};
```

- [ ] **Step 4: Implement config command**

```typescript
// src/commands/config.ts
import type { Command } from '../commands.js';

export const configCommand: Command = {
  name: 'config',
  description: 'Show current configuration',
  isEnabled: () => true,
  call: async (_args, context) => {
    return [
      'Current configuration:',
      `  Model: ${context.model}`,
      `  Verbose: ${context.verbose}`,
      `  Debug: ${context.debug}`,
    ].join('\n');
  },
};
```

- [ ] **Step 5: Register commands in main.tsx**

- [ ] **Step 6: Commit**

---

### Task 3: Enhanced Mimo Mascot

**Files:**
- Modify: `mimo-code/src/components/Mimo/MimoAvatar.tsx`

- [ ] **Step 1: Add animation frames**

Add blinking animation to the idle state and a working animation to the coding state.

- [ ] **Step 2: Commit**

---

### Task 4: Improved Prompt Input

**Files:**
- Modify: `mimo-code/src/components/PromptInput/PromptInput.tsx`

- [ ] **Step 1: Add multiline input support**

Add Shift+Enter for newline, Enter for submit.

- [ ] **Step 2: Commit**

---

### Task 5: Comprehensive Tests

- [ ] **Step 1: Add integration test for full agent flow**

Test the complete flow: user input → query engine → tool execution → response.

- [ ] **Step 2: Run all tests, fix any issues**

- [ ] **Step 3: Commit**

---

### Task 6: Final Verification

- [ ] **Step 1: Run all tests**
- [ ] **Step 2: Run type check**
- [ ] **Step 3: Commit any fixes**
