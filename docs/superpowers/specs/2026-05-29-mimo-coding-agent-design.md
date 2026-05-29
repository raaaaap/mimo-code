# Mimo Coding Agent - Design Specification

## Document Info

| Field | Value |
|-------|-------|
| Project | Mimo Coding Agent CLI |
| Version | v1.0.0 |
| Date | 2026-05-29 |
| Target Model | Mimo Large Language Model |
| Reference Architecture | Claude Code (Anthropic) |
| Approach | Direct Architecture Clone (Approach A) |

---

## 1. Overview

### 1.1 Project Goal

Build a full-featured CLI coding agent for the Mimo large language model, mirroring Claude Code's proven architecture. The agent provides an interactive REPL with rich terminal UI, a comprehensive tool system, multi-model API support, plugin extensibility, and a complete permission/safety system.

### 1.2 Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scope | Full system | Complete Claude Code-level functionality |
| API | Multi-adapter (OpenAI, Anthropic, Mimo) | Flexibility across providers |
| Runtime | Node.js >= 18 | npm distribution compatibility |
| Tool calling | OpenAI function calling format | Mimo native compatibility |
| Terminal UI | Ink (React for CLI) | Rich interactive experience |
| Project structure | Mirror Claude Code source | Proven production architecture |
| Authentication | Multiple methods (env/config/CLI/interactive) | User flexibility |
| MCP | Full support | Extensibility via external tool servers |
| Permission system | Full Claude Code system | Security parity |
| Mimo mascot | Full ASCII art + animations | Brand identity |
| State management | Custom store (like Claude Code) | Zero external dependencies |

### 1.3 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| Language | TypeScript 5.x (strict mode) |
| CLI Framework | Ink (React for CLI) |
| CLI Parsing | Commander.js / yargs |
| Schema Validation | Zod v4 |
| Code Search | ripgrep (GrepTool) |
| Protocols | MCP SDK, LSP |
| Bundler | esbuild + tsup |
| Testing | Vitest + Playwright |
| State | Custom store (useSyncExternalStore) |

---

## 2. Architecture

### 2.1 Layer Diagram

```
+-----------------------------------------------------------------+
|                     Entrypoints                                  |
|  cli.tsx --> fast-path dispatch --> main.tsx --> REPL launch      |
+-----------------------------------------------------------------+
|                     User Interaction                              |
|  +----------+ +-----------+ +------------+ +------------------+  |
|  | REPL     | | Commands  | | Mimo       | | Themes           |  |
|  | Screen   | | Registry  | | Mascot     | | System           |  |
|  +----+-----+ +-----+-----+ +-----+------+ +--------+---------+  |
+-------+-------------+-------------+------------------+-----------+
|                     Core Engine                                    |
|  +--------------+ +--------------+ +----------------------------+ |
|  | QueryEngine  | | Tool System  | | Context Manager            | |
|  | (query loop) | | (orchestrate)| | (window management)        | |
|  +------+-------+ +------+-------+ +----------+----------------+ |
+---------+----------------+--------------------+------------------+
|                     Services                                       |
|  +--------+ +------+ +------+ +------+ +------------------+      |
|  | API    | | MCP  | | LSP  | | Git  | | Permissions      |      |
|  | Client | |      | |      | |      | |                  |      |
|  +--------+ +------+ +------+ +------+ +------------------+      |
+-----------------------------------------------------------------+
|                     Plugin System                                  |
|  Event Bus --> Plugin Loader --> Plugin Registry --> Runtime        |
+-----------------------------------------------------------------+
```

### 2.2 Directory Structure

```
mimo-code/
+-- bin/mimo.js                      # Executable entry
+-- package.json
+-- tsconfig.json
+-- src/
|   +-- entrypoints/                 # Boot
|   |   +-- cli.tsx                  # Fast-path dispatch (--version, --help, etc.)
|   |   +-- init.ts                  # One-time initialization
|   +-- main.tsx                     # CLI main (Commander.js)
|   +-- replLauncher.tsx             # REPL launcher
|   +-- screens/                     # Full-screen UIs
|   |   +-- REPL.tsx                 # Main REPL screen
|   +-- QueryEngine.ts               # Query engine (conversation lifecycle)
|   +-- query.ts                     # Query loop (core agent loop)
|   +-- Tool.ts                      # Tool type definitions + buildTool()
|   +-- tools.ts                     # Tool registry
|   +-- commands.ts                  # Command registry
|   +-- context.ts                   # Context collection (git status, date, etc.)
|   +-- state/                       # State management
|   |   +-- AppStateStore.ts         # AppState type definition
|   |   +-- AppState.tsx             # React state Provider
|   |   +-- store.ts                 # Custom store implementation
|   |   +-- selectors.ts             # State selectors
|   +-- tools/                       # Tool implementations (one dir per tool)
|   |   +-- BashTool/                # Shell command execution
|   |   +-- FileReadTool/            # File reading
|   |   +-- FileEditTool/            # String-replacement editing
|   |   +-- FileWriteTool/           # File writing
|   |   +-- GrepTool/                # Text search (ripgrep)
|   |   +-- GlobTool/                # File pattern matching
|   |   +-- WebFetchTool/            # Web page fetching
|   |   +-- WebSearchTool/           # Web search
|   |   +-- TodoWriteTool/           # Task list management
|   |   +-- AgentTool/               # Sub-agent spawning
|   |   +-- MCPTool/                 # MCP tool invocation
|   |   +-- NotebookEditTool/        # Jupyter notebook editing
|   |   +-- ...
|   +-- commands/                    # Slash command implementations
|   |   +-- help.ts
|   |   +-- config.ts
|   |   +-- clear.ts
|   |   +-- compact.ts
|   |   +-- ...
|   +-- components/                  # Ink UI components
|   |   +-- Messages/                # Message display
|   |   +-- PromptInput/             # Input box
|   |   +-- PermissionRequest/       # Permission dialog
|   |   +-- Progress/                # Progress indicators
|   |   +-- Diff/                    # Diff view
|   |   +-- Mimo/                    # Mimo mascot components
|   |   +-- ...
|   +-- services/                    # Service layer
|   |   +-- api/                     # API client
|   |   |   +-- adapters/            # Model adapters
|   |   |   |   +-- base.ts
|   |   |   |   +-- openai.ts
|   |   |   |   +-- anthropic.ts
|   |   |   |   +-- mimo.ts
|   |   |   +-- client.ts
|   |   |   +-- streaming.ts
|   |   |   +-- retry.ts
|   |   +-- mcp/                     # MCP service
|   |   +-- permissions/             # Permission service
|   |   +-- tools/                   # Tool execution service
|   |   |   +-- toolExecution.ts
|   |   |   +-- toolOrchestration.ts
|   |   |   +-- StreamingToolExecutor.ts
|   |   +-- compact/                 # Context compression
|   +-- hooks/                       # React Hooks
|   |   +-- useCanUseTool.tsx        # Permission check hook
|   |   +-- ...
|   +-- constants/                   # Constants
|   |   +-- prompts.ts               # System prompt assembly
|   |   +-- systemPromptSections.ts  # Prompt section system
|   +-- utils/                       # Utilities
|   |   +-- settings/                # Settings system
|   |   +-- permissions/             # Permission utilities
|   |   +-- bash/                    # Bash parsing
|   |   +-- ...
|   +-- types/                       # Type definitions
|   +-- plugins/                     # Plugin system
|   +-- keybindings/                 # Keybinding config
|   +-- skills/                      # Skill system
|   +-- buddy/                       # Mimo companion sprite
+-- tests/
|   +-- unit/
|   +-- integration/
|   +-- e2e/
+-- docs/
```

---

## 3. Core Engine

### 3.1 QueryEngine

The QueryEngine manages conversation lifecycle. One instance per conversation.

```typescript
class QueryEngine {
  private mutableMessages: Message[];
  private abortController: AbortController;
  private totalUsage: TokenUsage;
  private readFileState: Map<string, string>;

  // Submit a user message and get an async generator of responses
  async *submitMessage(userMessage: UserMessage): AsyncGenerator<SDKMessage>;

  // Abort the current query
  abort(): void;

  // Get conversation history
  getMessages(): Message[];

  // Get total token usage
  getUsage(): TokenUsage;
}
```

### 3.2 Query Loop

The core agent loop in `query.ts`:

```
while (true) {
  1. Context management
     - microcompact (lightweight, every turn)
     - auto-compact (when approaching token limit)
     - context collapse (drain low-value content)

  2. Build system prompt
     - Static sections (tool descriptions, instructions)
     - Dynamic sections (git status, date, MIMO.md)

  3. Call model via adapter
     - streamChat(request) -> AsyncGenerator<StreamChunk>

  4. Stream response
     - Accumulate text and tool_use blocks
     - Yield AssistantMessage as they complete

  5. Execute tools (if tool_use present)
     - StreamingToolExecutor processes tool calls
     - Concurrent-safe tools run in parallel
     - Non-concurrent tools run serially

  6. Yield tool results

  7. Check stop conditions
     - No more tool_use blocks -> break
     - Stop hooks -> may prevent continuation
     - Error recovery (prompt-too-long, max-output-tokens)

  8. Loop back to step 1
}
```

### 3.3 Query State

```typescript
interface QueryState {
  messages: Message[];
  toolUseContext: ToolUseContext;
  autoCompactTracking: CompactTracking;
  turnCount: number;
  maxOutputTokensRecoveryCount: number;
  hasAttemptedReactiveCompact: boolean;
}
```

### 3.4 Dependency Injection

```typescript
interface QueryDeps {
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  microcompact: (messages: Message[]) => Message[];
  autocompact: (messages: Message[]) => Message[];
  uuid: () => string;
}
```

---

## 4. Tool System

### 4.1 Tool Interface

```typescript
interface Tool<TInput = unknown> {
  name: string;
  aliases?: string[];
  inputSchema: ZodSchema<TInput>;

  // Core methods
  call(args: TInput, context: ToolUseContext): Promise<ToolResult>;
  description(): Promise<string>;
  prompt(): string;

  // Permissions
  checkPermissions(args: TInput, context: ToolUseContext): PermissionResult;
  validateInput?(args: TInput): ValidationResult;

  // Capability flags
  isConcurrencySafe(): boolean;
  isReadOnly(): boolean;
  isDestructive(): boolean;
  interruptBehavior(): 'cancel' | 'block';
  maxResultSizeChars?: number;

  // Rendering
  renderToolUseMessage?(args: TInput): React.ReactNode;
  renderToolResultMessage?(result: ToolResult): React.ReactNode;
  renderToolUseProgressMessage?(args: TInput): React.ReactNode;
}
```

### 4.2 Tool Context

```typescript
interface ToolUseContext {
  options: QueryOptions;
  abortController: AbortController;
  readFileState: Map<string, string>;
  messages: Message[];
  toolDecisions: Map<string, PermissionDecision>;
  requestPrompt: (question: string) => Promise<string>;
  getAppState(): AppState;
  setAppState(state: Partial<AppState>): void;
}
```

### 4.3 Tool Orchestration

```typescript
class ToolOrchestrator {
  // Partition tool calls into batches
  // Consecutive concurrent-safe tools run in parallel (max 10)
  // Non-concurrent tools run serially
  async runTools(toolCalls: ToolCall[], context: ToolUseContext): Promise<ToolResult[]>;
}

class StreamingToolExecutor {
  // Process tools as they stream in
  addToolCall(toolCall: ToolCall): void;
  onResult(callback: (result: ToolResult) => void): void;
  discard(): void;
}
```

### 4.4 Built-in Tools

| Tool | Concurrent | Read-Only | Destructive |
|------|-----------|-----------|-------------|
| BashTool | No | No | Yes |
| FileReadTool | Yes | Yes | No |
| FileEditTool | No | No | No |
| FileWriteTool | No | No | Yes |
| GrepTool | Yes | Yes | No |
| GlobTool | Yes | Yes | No |
| WebFetchTool | Yes | Yes | No |
| WebSearchTool | Yes | Yes | No |
| TodoWriteTool | No | No | No |
| AgentTool | No | Varies | Varies |
| MCPTool | Varies | Varies | Varies |
| NotebookEditTool | No | No | No |

### 4.5 Command System

```typescript
interface Command {
  name: string;
  aliases?: string[];
  description: string;
  isEnabled: () => boolean;
  isHidden?: boolean;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  call(args: string, context: CommandContext): Promise<string | void>;
  render?(args: string, context: CommandContext): React.ReactNode;
}

class CommandRegistry {
  private commands: Map<string, Command>;
  register(command: Command): void;
  get(name: string): Command | undefined;
  getAll(): Command[];
  parse(input: string): { command: Command; args: string } | null;
}
```

---

## 5. API Communication Layer

### 5.1 Adapter Architecture

```
+---------------------------------------------------------------+
|                    API Client (unified entry)                  |
|  +-----------------------------------------------------------+|
|  |              AdapterRegistry                               ||
|  |  +----------+ +-----------+ +----------------------------+||
|  |  | OpenAI   | | Anthropic | | Mimo                       |||
|  |  | Adapter  | | Adapter   | | Adapter                    |||
|  |  +----+-----+ +-----+-----+ +----------+----------------+||
|  +-------+-------------+-------------------+----------------+||
|                          |                                    ||
|  +-----------------------+----------------------------------+||
|  |           ModelAdapter (unified interface)                 ||
|  |  streamChat(request) -> AsyncGenerator<StreamChunk>        ||
|  |  chat(request) -> Promise<ModelResponse>                   ||
|  |  countTokens(messages) -> number                           ||
|  +-----------------------------------------------------------+||
|                                                                ||
|  +----------+  +----------+  +----------+  +----------------+ ||
|  | Streaming|  |  Retry   |  |  Cache   |  |  Rate          | ||
|  | Handler  |  |  Engine  |  |  (LRU)   |  |  Limiter       | ||
|  +----------+  +----------+  +----------+  +----------------+ ||
+---------------------------------------------------------------+
```

### 5.2 Unified Types

```typescript
interface ModelAdapter {
  name: string;
  streamChat(request: ModelRequest): AsyncGenerator<StreamChunk>;
  chat(request: ModelRequest): Promise<ModelResponse>;
  countTokens(messages: Message[]): number;
  supports(model: string): boolean;
}

interface ModelRequest {
  model: string;
  messages: Message[];
  system?: string;
  tools?: ToolDefinition[];
  toolChoice?: ToolChoice;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  metadata?: Record<string, unknown>;
}

interface StreamChunk {
  type: 'text' | 'tool_use' | 'thinking' | 'error' | 'done';
  content?: string;
  toolCall?: ToolCall;
  usage?: TokenUsage;
  finishReason?: string;
}

interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentPart[];
  toolCalls?: ToolCall[];
  toolCallId?: string;
  name?: string;
}

interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}
```

### 5.3 Adapter Implementations

**OpenAI Adapter** (primary path for Mimo):
- Calls `/v1/chat/completions` endpoint
- Handles SSE streaming
- Native OpenAI function calling format

**Anthropic Adapter** (fallback/compatibility):
- Calls Anthropic Messages API
- Converts `tool_use` to unified format
- Handles Anthropic-specific thinking blocks

**Mimo Adapter** (optimization path):
- Extends OpenAI adapter with Mimo-specific features
- Mimo-specific context window optimizations
- Special token handling
- Falls back to OpenAI adapter if needed

### 5.4 Retry & Fallback

```typescript
interface RetryConfig {
  maxRetries: number;        // default: 3
  baseDelay: number;         // default: 1000ms
  maxDelay: number;          // default: 30000ms
  backoffMultiplier: number; // default: 2
  retryableErrors: string[]; // ['rate_limit', 'server_error', 'timeout']
  jitter: boolean;           // default: true
}

interface FallbackChain {
  primary: string;           // 'mimo-large'
  fallbacks: string[];       // ['mimo-medium', 'gpt-4o']
}
```

---

## 6. Terminal UI

### 6.1 REPL Screen Layout

```
+--------------------------------------------------------------+
|  <MimoHeader>                                                 |
|  [Mimo] Mimo Agent v1.0.0                      [model: mimo]  |
+--------------------------------------------------------------+
|  <MessageList>                                                |
|  +-----------------------------------------------------------+
|  | [user] Help me optimize this function                      |
|  |                                                            |
|  | [mimo] [avatar] Let me take a look...                      |
|  | [tool] FileReadTool -> src/utils.ts (2.3KB)                |
|  | [mimo] Found several optimization points:                  |
|  |        1. Use Map instead of linear search...              |
|  | [tool] FileEditTool -> src/utils.ts [OK]                   |
|  | [mimo] [avatar] Done! ~40% performance improvement         |
|  +-----------------------------------------------------------+
+--------------------------------------------------------------+
|  <ToolProgress>                                               |
|  +-- FileReadTool  [################] 100%                    |
|  +-- FileEditTool  [########--------]  60%                    |
+--------------------------------------------------------------+
|  <PromptInput>                                                |
|  > _                                                          |
+--------------------------------------------------------------+
```

### 6.2 Core Ink Components

```typescript
function REPLScreen(): React.ReactNode;
function MessageList({ messages: Message[] }): React.ReactNode;
function MessageItem({ message: Message }): React.ReactNode;
function PromptInput({ onSubmit, onInterrupt }): React.ReactNode;
function ToolProgress({ activeTools: ToolCall[] }): React.ReactNode;
function PermissionRequest({ toolCall, onAllow, onDeny }): React.ReactNode;
function MimoHeader({ model: string, version: string }): React.ReactNode;
```

### 6.3 Mimo Mascot

```typescript
enum MimoState {
  IDLE = 'idle',           // [idle face]
  THINKING = 'thinking',   // [thinking animation]
  CODING = 'coding',       // [coding animation]
  SUCCESS = 'success',     // [happy face]
  ERROR = 'error',         // [confused face]
  READING = 'reading',     // [reading face]
}

const MIMO_ASCII: Record<MimoState, string> = {
  idle: `
    +-----------+
   /  O   O   \\
  |    +---+    |
  |   |     |   |
   \\    +---+    /
    +----+----+
         |
       /   \\`,
  thinking: `
    +-----------+
   /  .   .   \\   ?
  |    +---+    |
  |   | ### |   |
   \\    +---+    /
    +----+----+`,
  coding: `
    +-----------+
   /  O   O   \\   >>>
  |    +---+    |
  |   |===|===| |
   \\    +---+    /
    +----+----+`,
  success: `
    +-----------+
   /  O   O   \\   !!
  |    +---+    |
  |   |     |   |
   \\    +---+    /
    +----+----+`,
  error: `
    +-----------+
   /  O _ O   \\   ???
  |    +---+    |
  |   |     |   |
   \\    +---+    /
    +----+----+`,
  reading: `
    +-----------+
   /  O   o   \\
  |    +---+    |
  |   | ___ |   |
   \\    +---+    /
    +----+----+`,
};

class MimoAnimator {
  setState(state: MimoState): void;
  getCurrentFrame(): string;
  startAnimation(): void;
  stopAnimation(): void;
}
```

### 6.4 Theme System

```typescript
interface Theme {
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
    code: {
      keyword: string;
      string: string;
      comment: string;
      number: string;
      function: string;
    };
  };
  mimo: {
    primaryColor: string;
    animationSpeed: number;
  };
}

const THEMES: Record<string, Theme> = {
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
      code: { keyword: '#c678dd', string: '#98c379', comment: '#5c6370', number: '#d19a66', function: '#61afef' },
    },
    mimo: { primaryColor: '#4a9eff', animationSpeed: 150 },
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
      code: { keyword: '#8b5cf6', string: '#16a34a', comment: '#9ca3af', number: '#ea580c', function: '#2563eb' },
    },
    mimo: { primaryColor: '#2563eb', animationSpeed: 150 },
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
      code: { keyword: '#00ff00', string: '#00cc00', comment: '#006600', number: '#00ff00', function: '#00ff00' },
    },
    mimo: { primaryColor: '#00ff00', animationSpeed: 100 },
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
      code: { keyword: '#ff7b72', string: '#a5d6ff', comment: '#8b949e', number: '#79c0ff', function: '#d2a8ff' },
    },
    mimo: { primaryColor: '#58a6ff', animationSpeed: 120 },
  },
};
```

### 6.5 Keybindings

```typescript
const KEYBINDINGS = {
  'ctrl+c': 'cancel',
  'ctrl+d': 'exit',
  'ctrl+l': 'clear',
  'ctrl+k': 'clear_input',
  'ctrl+n': 'new_session',
  'ctrl+r': 'history_search',
  'tab': 'autocomplete',
  'esc': 'clear_suggestions',
  'up': 'history_prev',
  'down': 'history_next',
};
```

---

## 7. Permission System

### 7.1 Permission Check Flow

```
Tool call request
  |
  v
1. Tool self-check: checkPermissions()
  |  (e.g., BashTool command security analysis)
  v
2. General permission rule matching
  |  (allow/deny/ask rules from settings)
  v
3. Permission mode check
  |  (bypass -> allow all, plan -> deny writes)
  v
4. PreToolUse Hook
  |  (user-configured pre-hooks)
  v
5. Auto-mode classifier (optional)
  |  (LLM evaluates tool call safety)
  v
6. User confirmation (if needed)
  |
  v
Allow / Deny / Downgrade
```

### 7.2 Permission Modes

```typescript
type PermissionMode =
  | 'default'            // Dangerous ops need confirmation
  | 'acceptEdits'        // File edits auto-allowed
  | 'bypassPermissions'  // All allowed (dangerous)
  | 'plan'               // Read-only allowed
  | 'auto';              // LLM classifier decides
```

### 7.3 Permission Rules

```typescript
interface PermissionRule {
  source: 'userSettings' | 'projectSettings' | 'localSettings' | 'policySettings';
  tool: string;           // Tool name or '*'
  pattern?: string;       // Match pattern (e.g., bash command pattern)
  action: 'allow' | 'deny' | 'ask';
  reason?: string;
}
```

### 7.4 Bash Security Analysis

Full replication of Claude Code's 300KB+ security layer:

```typescript
class BashSecurityAnalyzer {
  analyze(command: string): SecurityAnalysis;
  isReadOnly(command: string): boolean;
  validatePaths(command: string, allowedPaths: string[]): PathValidation;
  validateSed(command: string): SedValidation;
}

interface SecurityAnalysis {
  safe: boolean;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
  suggestions: string[];
}
```

### 7.5 Auto-mode Classifier

```typescript
class YoloClassifier {
  fastClassify(toolCall: ToolCall): ClassificationResult;
  async thinkingClassify(toolCall: ToolCall): Promise<ClassificationResult>;
}

interface ClassificationResult {
  decision: 'allow' | 'deny' | 'ask';
  confidence: number;
  reason: string;
}
```

### 7.6 Context Management

```typescript
class ContextManager {
  private tokenBudget: TokenBudget;
  autoCompress(messages: Message[]): Message[];
  microcompact(messages: Message[]): Message[];
  contextCollapse(messages: Message[]): Message[];
  reactiveCompress(messages: Message[]): Message[];
}

enum CompressionStrategy {
  TRUNCATE_OLDEST,
  SUMMARIZE,
  SELECTIVE,
  LAYERED,
}
```

---

## 8. Plugin System

### 8.1 Plugin Interface

```typescript
interface Plugin {
  name: string;
  version: string;
  description: string;
  author?: string;
  onLoad: (context: PluginContext) => Promise<void>;
  onUnload: () => Promise<void>;
  capabilities: PluginCapability[];
  subscriptions?: EventSubscription[];
  commands?: CommandDefinition[];
  tools?: ToolDefinition[];
}

interface PluginContext {
  api: {
    model: ModelClient;
    files: FileSystem;
    config: ConfigManager;
    logger: Logger;
  };
  events: EventEmitter;
  registerCommand(cmd: Command): void;
  registerTool(tool: Tool): void;
}

enum PluginCapability {
  COMMAND = 'command',
  TOOL = 'tool',
  HOOK = 'hook',
  THEME = 'theme',
  PROVIDER = 'provider',
}
```

### 8.2 Event System

```typescript
enum PluginEvent {
  BEFORE_INPUT = 'before_input',
  AFTER_INPUT = 'after_input',
  BEFORE_REQUEST = 'before_request',
  AFTER_RESPONSE = 'after_response',
  BEFORE_TOOL_EXECUTE = 'before_tool_execute',
  AFTER_TOOL_EXECUTE = 'after_tool_execute',
  BEFORE_FILE_READ = 'before_file_read',
  AFTER_FILE_WRITE = 'after_file_write',
  SESSION_START = 'session_start',
  SESSION_END = 'session_end',
}
```

### 8.3 MCP Support

```typescript
class MCPClient {
  async connect(config: MCPServerConfig): Promise<void>;
  async listTools(): Promise<MCPToolDefinition[]>;
  async callTool(name: string, args: Record<string, unknown>): Promise<MCPToolResult>;
  async listResources(): Promise<MCPResource[]>;
  async readResource(uri: string): Promise<MCPResourceContent>;
  async disconnect(): Promise<void>;
}

interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

class MCPToolRegistry {
  registerMCPTools(client: MCPClient): void;
  resolveConflicts(): void;  // Built-in tools win on conflict
}
```

### 8.4 Plugin SDK

```typescript
// @mimo-code/plugin-sdk exports
export {
  Plugin, PluginContext, PluginCapability, PluginEvent,
  createPlugin, defineCommand, defineTool, subscribeEvent,
  PluginLogger, PluginConfig, PluginManifest,
};
```

---

## 9. Settings & Configuration

### 9.1 Settings Sources (Priority Order)

1. `policySettings` - Organizational policy (highest priority)
2. `flagSettings` - CLI flags
3. `localSettings` - `.mimo/settings.local.json`
4. `projectSettings` - `.mimo/settings.json`
5. `userSettings` - `~/.mimo/settings.json` (lowest priority)

### 9.2 Authentication

Multiple authentication methods:

- Environment variable: `MIMO_API_KEY`
- Config file: `~/.mimo/settings.json`
- CLI argument: `--api-key`
- Interactive login flow (for OAuth-capable providers)

---

## 10. Testing Strategy

### 10.1 Test Types

| Type | Framework | Coverage Target |
|------|-----------|----------------|
| Unit | Vitest | >80% lines, functions |
| Integration | Vitest | Module interactions |
| E2E | Playwright | Full CLI flows |
| Performance | Custom | Startup <2s, response <300ms |

### 10.2 Key Test Areas

- Query loop (mock API, verify tool execution flow)
- Tool system (each tool's call, permissions, edge cases)
- Permission system (rule matching, mode behavior)
- API adapters (streaming, retry, fallback)
- REPL (rendering, input handling, keybindings)
- Plugin system (lifecycle, events, registration)
- MCP (connect, discover, invoke)

---

## 11. Development Phases

### Phase 1: Foundation (1-2 weeks)
- Project scaffolding (package.json, tsconfig, build)
- CLI entry point with Commander.js
- Basic REPL with Ink
- API client with OpenAI adapter
- Settings system

### Phase 2: Core Engine (2-3 weeks)
- QueryEngine and query loop
- Tool interface and buildTool()
- Tool orchestration and streaming execution
- Command registry
- Context management

### Phase 3: Essential Tools (2-3 weeks)
- BashTool with security analysis
- FileReadTool, FileEditTool, FileWriteTool
- GrepTool (ripgrep), GlobTool
- WebFetchTool, WebSearchTool
- TodoWriteTool

### Phase 4: Advanced Features (2-3 weeks)
- Permission system (full implementation)
- Auto-mode classifier
- MCP support
- Plugin system
- Additional adapters (Anthropic, Mimo-native)

### Phase 5: Polish (2 weeks)
- Mimo mascot and animations
- Theme system
- Skill system
- Comprehensive testing
- Performance optimization

### Phase 6: Release (1 week)
- Documentation
- npm packaging
- Examples and tutorials

---

## 12. Appendix

### 12.1 Glossary

| Term | Definition |
|------|-----------|
| REPL | Read-Eval-Print Loop |
| MCP | Model Context Protocol |
| LSP | Language Server Protocol |
| SSE | Server-Sent Events |
| Ink | React for CLI |

### 12.2 Reference

- Claude Code source: `src/` directory in this repository
- MIMO_CODING_AGENT_REQUIREMENTS.md: Detailed requirements document
- Ink: https://github.com/vadimdemedes/ink
- MCP SDK: https://github.com/modelcontextprotocol/sdk
