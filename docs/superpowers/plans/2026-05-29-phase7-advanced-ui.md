# Phase 7: Advanced UI & Engineering Implementation Plan

**Goal:** Add design system, 20+ commands, output styles, coordinator, voice, bridge, remote sessions, stop hooks

---

## Batch 1: UI & Commands (4 features)

### 1. Design System

```tsx
// src/components/design-system/Button.tsx
import React from 'react';
import { Text, Box } from 'ink';

interface ButtonProps { label: string; onPress?: () => void; variant?: 'primary' | 'secondary' | 'danger'; }
export function Button({ label, variant = 'primary' }: ButtonProps) {
  const color = variant === 'primary' ? '#FF6900' : variant === 'danger' ? 'red' : 'gray';
  return <Box borderStyle="round" borderColor={color} paddingX={1}><Text color={color}>{label}</Text></Box>;
}

// src/components/design-system/Card.tsx
interface CardProps { title?: string; children: React.ReactNode; }
export function Card({ title, children }: CardProps) {
  return <Box flexDirection="column" borderStyle="round" borderColor="gray" paddingX={1}>
    {title && <Text bold>{title}</Text>}
    {children}
  </Box>;
}

// src/components/design-system/Table.tsx
interface TableProps { headers: string[]; rows: string[][]; }
export function Table({ headers, rows }: TableProps) {
  return <Box flexDirection="column">
    <Text bold>{headers.join('  |  ')}</Text>
    <Text>{'─'.repeat(headers.join('  |  ').length)}</Text>
    {rows.map((row, i) => <Text key={i}>{row.join('  |  ')}</Text>)}
  </Box>;
}
```

### 2. More Commands (20+ commands)

Create `src/commands/` files for each:

| Command | File | Description |
|---------|------|-------------|
| `/commit` | `commit.ts` | Git commit with AI-generated message |
| `/diff` | `diff.ts` | Show git diff |
| `/doctor` | `doctor.ts` | System diagnostics |
| `/model` | `model.ts` | Switch model |
| `/theme` | `theme.ts` | Switch theme |
| `/usage` | `usage.ts` | Show token usage |
| `/status` | `status.ts` | Show session status |
| `/permissions` | `permissions.ts` | Show/change permission mode |
| `/plan` | `plan.ts` | Enter plan mode |
| `/export` | `export.ts` | Export conversation |
| `/rename` | `rename.ts` | Rename session |
| `/session` | `session.ts` | Session management |
| `/mcp` | `mcp.ts` | MCP server management |
| `/skills` | `skills.ts` | List available skills |
| `/tasks` | `tasks.ts` | List background tasks |

### 3. Output Style

```ts
// src/outputStyles/styles.ts
export type OutputStyle = 'text' | 'json' | 'markdown';

export function formatOutput(data: unknown, style: OutputStyle): string {
  switch (style) {
    case 'json': return JSON.stringify(data, null, 2);
    case 'markdown': return typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    case 'text': return typeof data === 'string' ? data : String(data);
  }
}
```

### 4. Stop Hooks

```ts
// src/query/stopHooks.ts
import type { HookRegistry } from '../hooks/registry.js';
import type { Message } from '../types/message.js';

export async function executeStopHooks(
  hooks: HookRegistry,
  messages: Message[],
  turnCount: number,
): Promise<void> {
  await hooks.execute('SessionEnd', {
    messageCount: messages.length,
    turnCount,
    lastMessage: messages[messages.length - 1]?.content,
  });
}
```

---

## Batch 2: Remote & Advanced (4 features)

### 5. Coordinator Mode

```ts
// src/coordinator/types.ts
export type WorkerRole = 'coordinator' | 'worker';

export interface CoordinatorConfig {
  role: WorkerRole;
  workers: string[];
  scratchpadDir: string;
}

export function getToolsForRole(role: WorkerRole): string[] {
  if (role === 'coordinator') return ['AgentTool', 'TaskStopTool', 'SendMessageTool', 'TodoWriteTool'];
  return ['BashTool', 'FileReadTool', 'FileEditTool', 'GlobTool', 'GrepTool'];
}
```

### 6. Voice Mode (stub)

```ts
// src/voice/mode.ts
export interface VoiceConfig {
  enabled: boolean;
  sttProvider?: 'whisper' | 'browser';
  ttsProvider?: 'browser' | 'external';
}

export function isVoiceAvailable(): boolean {
  return false; // Stub — requires external STT/TTS
}
```

### 7. Bridge/Remote Control (stub)

```ts
// src/bridge/types.ts
export interface BridgeConfig {
  enabled: boolean;
  port: number;
  authToken?: string;
}

export interface BridgeSession {
  id: string;
  status: 'connected' | 'disconnected';
  createdAt: number;
}
```

### 8. Remote Sessions (stub)

```ts
// src/remote/types.ts
export interface RemoteSessionConfig {
  url: string;
  token: string;
}

export class RemoteSessionManager {
  async connect(_config: RemoteSessionConfig): Promise<void> {}
  async disconnect(): Promise<void> {}
  isConnected(): boolean { return false; }
}
```

---

## Tests

- `tests/unit/design-system/components.test.ts`
- `tests/unit/commands/all-commands.test.ts`
- `tests/unit/outputStyles/format.test.ts`
- `tests/unit/coordinator/types.test.ts`
