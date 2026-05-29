# mimo-code 上下文压缩、Mimo 适配器、小米猫伙伴系统设计文档

**日期:** 2026-05-29
**状态:** Draft
**范围:** 三个功能的统一设计，分三阶段实现

---

## 1. 整体架构

### 1.1 三个功能的定位

| 功能 | 层级 | 依赖 |
|------|------|------|
| 上下文压缩 | 基础设施层 | 无（被其他模块依赖） |
| Mimo 适配器 | 服务层 | 上下文压缩 |
| 小米猫伙伴 | UI 层 | AppState、Settings |

### 1.2 目录结构变更

```
mimo-code/src/
├── services/
│   ├── api/
│   │   ├── adapters/
│   │   │   ├── base.ts          (已有，不变)
│   │   │   ├── openai.ts        (已有，不变)
│   │   │   ├── anthropic.ts     (已有，不变)
│   │   │   └── mimo.ts          ← 新增
│   │   └── client.ts            (修改：注册 MimoAdapter)
│   └── compact/
│       └── contextManager.ts    (重写)
├── buddy/                       ← 新增目录
│   ├── types.ts
│   ├── companion.ts
│   ├── sprites.ts
│   ├── prompt.ts
│   └── CompanionSprite.tsx
├── components/
│   └── Buddy/
│       └── BuddyContainer.tsx   ← 新增
└── ...
```

### 1.3 依赖方向

```
MimoAdapter ──→ ContextManager
Buddy ──→ AppState, Settings
ContextManager ←── QueryEngine (调用压缩)
```

ContextManager 和 Buddy 之间无依赖。

---

## 2. Phase 1: 上下文压缩

### 2.1 Token 计数接口

引入 `TokenCounter` 接口，统一 token 计数逻辑，消除 ContextManager 和 Adapter 之间的重复。

```ts
// services/compact/tokenCounter.ts
export interface TokenCounter {
  countMessages(messages: Message[]): number;
  countText(text: string): number;
}

export class EstimatedTokenCounter implements TokenCounter {
  private charsPerToken: number;

  constructor(charsPerToken: number = 4) {
    this.charsPerToken = charsPerToken;
  }

  countMessages(messages: Message[]): number {
    let total = 0;
    for (const msg of messages) {
      total += this.countMessage(msg);
    }
    return total;
  }

  countMessage(msg: Message): number {
    let total = 0;
    // Handle string content
    if (typeof msg.content === 'string') {
      total += this.countText(msg.content);
    }
    // Handle multi-part content array
    else if (Array.isArray(msg.content)) {
      for (const part of msg.content) {
        if (part.text) total += this.countText(part.text);
        if (part.content) total += this.countText(part.content);
      }
    }
    // Handle tool calls
    if (msg.toolCalls) {
      for (const tc of msg.toolCalls) {
        total += this.countText(tc.function.name);
        total += this.countText(tc.function.arguments);
      }
    }
    // Handle tool results
    if (msg.toolCallId) {
      total += this.countText(msg.toolCallId);
    }
    // Message overhead (role, formatting)
    total += 4;
    return total;
  }

  countText(text: string): number {
    return Math.ceil(text.length / this.charsPerToken);
  }
}
```

### 2.2 ContextManager 重写

```ts
// services/compact/contextManager.ts
export interface CompressionResult {
  messages: Message[];
  compressed: boolean;
  removedCount: number;
  strategy: string;
}

export interface ContextManagerConfig {
  maxTokens: number;
  compactThreshold: number;    // 0.0-1.0, 触发 autocompact 的阈值
  maxToolOutputLength: number; // microcompact 截断长度
  preserveRecent: number;      // reactive compress 保留最近 N 条
  summarize: (text: string) => Promise<string>;  // LLM 摘要回调
}

const DEFAULT_CONFIG: ContextManagerConfig = {
  maxTokens: 8000,
  compactThreshold: 0.8,
  maxToolOutputLength: 2000,
  preserveRecent: 5,
  summarize: async (text) => `[Summary of ${text.length} chars]`,
};

export class ContextManager {
  private config: ContextManagerConfig;
  private tokenCounter: TokenCounter;

  constructor(config: Partial<ContextManagerConfig> = {}, tokenCounter?: TokenCounter) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.tokenCounter = tokenCounter ?? new EstimatedTokenCounter();
  }

  countTokens(messages: Message[]): number {
    return this.tokenCounter.countMessages(messages);
  }

  updateMaxTokens(maxTokens: number): void {
    this.config.maxTokens = maxTokens;
  }

  setSummarize(summarize: (text: string) => Promise<string>): void {
    this.config.summarize = summarize;
  }

  get maxTokens(): number { return this.config.maxTokens; }

  // --- Strategy 1: Microcompact ---
  microcompact(messages: Message[]): CompressionResult {
    let changed = false;
    const result = messages.map(msg => {
      // Truncate long tool outputs
      if (msg.role === 'tool' && typeof msg.content === 'string') {
        if (msg.content.length > this.config.maxToolOutputLength) {
          changed = true;
          const half = this.config.maxToolOutputLength / 2;
          return {
            ...msg,
            content: msg.content.slice(0, half) + '\n\n[...truncated...]\n\n' + msg.content.slice(-half),
          };
        }
      }
      // Remove empty/meaningless messages
      if (typeof msg.content === 'string' && msg.content.trim().length === 0 && !msg.toolCalls) {
        changed = true;
        return null;
      }
      return msg;
    }).filter(Boolean) as Message[];

    return {
      messages: result,
      compressed: changed,
      removedCount: messages.length - result.length,
      strategy: 'microcompact',
    };
  }

  // --- Strategy 2: Autocompact ---
  async autocompact(messages: Message[]): Promise<CompressionResult> {
    const tokens = this.tokenCounter.countMessages(messages);
    if (tokens <= this.config.maxTokens * this.config.compactThreshold) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    // Find messages to compress (earliest half of non-system messages)
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');
    const compressCount = Math.floor(nonSystem.length / 2);

    if (compressCount < 3) {
      return { messages, compressed: false, removedCount: 0, strategy: 'autocompact' };
    }

    const toCompress = nonSystem.slice(0, compressCount);
    const toKeep = nonSystem.slice(compressCount);

    // Generate summary
    const conversationText = toCompress
      .map(m => `[${m.role}]: ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
      .join('\n');

    const summary = await this.config.summarize(conversationText);

    const summaryMessage: Message = {
      role: 'system',
      content: `[Context compressed — ${compressCount} messages summarized]\n\n${summary}`,
    };

    const result = [...systemMessages, summaryMessage, ...toKeep];

    return {
      messages: result,
      compressed: true,
      removedCount: compressCount,
      strategy: 'autocompact',
    };
  }

  // --- Strategy 3: Context Collapse ---
  collapseToolSequences(messages: Message[]): CompressionResult {
    const result: Message[] = [];
    let toolSequence: Message[] = [];
    let collapsed = 0;

    for (const msg of messages) {
      if (msg.role === 'tool' || (msg.role === 'assistant' && msg.toolCalls)) {
        toolSequence.push(msg);
      } else {
        if (toolSequence.length >= 4) {
          // Collapse the sequence
          const toolNames = toolSequence
            .filter(m => m.toolCalls)
            .flatMap(m => m.toolCalls!.map(tc => tc.function.name));
          const uniqueTools = [...new Set(toolNames)];
          result.push({
            role: 'system',
            content: `[Executed ${toolSequence.length} tool calls: ${uniqueTools.join(', ')}]`,
          });
          collapsed += toolSequence.length - 1;
        } else {
          result.push(...toolSequence);
        }
        toolSequence = [];
        result.push(msg);
      }
    }
    // Handle trailing tool sequence
    if (toolSequence.length >= 4) {
      const toolNames = toolSequence
        .filter(m => m.toolCalls)
        .flatMap(m => m.toolCalls!.map(tc => tc.function.name));
      const uniqueTools = [...new Set(toolNames)];
      result.push({
        role: 'system',
        content: `[Executed ${toolSequence.length} tool calls: ${uniqueTools.join(', ')}]`,
      });
      collapsed += toolSequence.length - 1;
    } else {
      result.push(...toolSequence);
    }

    return {
      messages: result,
      compressed: collapsed > 0,
      removedCount: collapsed,
      strategy: 'context_collapse',
    };
  }

  // --- Strategy 4: Reactive Compress ---
  reactiveCompress(messages: Message[]): CompressionResult {
    const systemMessages = messages.filter(m => m.role === 'system');
    const nonSystem = messages.filter(m => m.role !== 'system');

    if (nonSystem.length <= this.config.preserveRecent) {
      return { messages, compressed: false, removedCount: 0, strategy: 'reactive' };
    }

    const recent = nonSystem.slice(-this.config.preserveRecent);
    const removed = nonSystem.length - this.config.preserveRecent;

    const result: Message[] = [
      ...systemMessages,
      {
        role: 'system',
        content: `[Context compressed: ${removed} earlier messages removed due to length limits]`,
      },
      ...recent,
    ];

    return {
      messages: result,
      compressed: true,
      removedCount: removed,
      strategy: 'reactive',
    };
  }

  // --- Pipeline: apply all strategies ---
  async compress(messages: Message[]): Promise<Message[]> {
    // Step 1: Microcompact (always)
    let result = this.microcompact(messages);

    // Step 2: Autocompact (if over threshold)
    const autocompactResult = await this.autocompact(result.messages);
    if (autocompactResult.compressed) {
      result = autocompactResult;
    }

    // Step 3: Context collapse (if still over)
    const tokens = this.tokenCounter.countMessages(result.messages);
    if (tokens > this.config.maxTokens) {
      const collapseResult = this.collapseToolSequences(result.messages);
      if (collapseResult.compressed) {
        result = collapseResult;
      }
    }

    return result.messages;
  }
}
```

### 2.3 与 QueryEngine 的集成

在 `QueryEngine.ts` 的消息发送前调用压缩：

```ts
// QueryEngine.ts 修改
async *query(messages: Message[], system: string): AsyncGenerator<StreamChunk> {
  // 压缩消息
  const compressed = await this.contextManager.compress(messages);
  // 发送压缩后的消息
  yield* this.apiClient.streamChat({
    model: this.model,
    messages: compressed,
    system,
    // ...
  });
}
```

### 2.4 配置项

在 `SettingsJson` 中新增：

```ts
interface ContextConfig {
  maxTokens?: number;           // 默认 8000
  compactThreshold?: number;    // 默认 0.8
  maxToolOutputLength?: number; // 默认 2000
  autoCompact?: boolean;        // 默认 true
}
```

---

## 3. Phase 2: Mimo 原生适配器

### 3.1 适配器类

`MimoAdapter` 继承 `OpenAIAdapter`，复用 OpenAI 协议的请求/响应处理，针对 Mimo 做优化。

```ts
// services/api/adapters/mimo.ts
import { OpenAIAdapter } from './openai.js';
import type { ModelRequest, StreamChunk } from '../../../types/api.js';
import type { Message } from '../../../types/message.js';
import { ContextManager } from '../../compact/contextManager.js';

interface MimoModelConfig {
  contextWindow: number;
  maxOutput: number;
}

const MIMO_MODELS: Record<string, MimoModelConfig> = {
  'mimo-large':  { contextWindow: 128000, maxOutput: 8192 },
  'mimo-medium': { contextWindow: 32000,  maxOutput: 4096 },
  'mimo-small':  { contextWindow: 8000,   maxOutput: 2048 },
};

export class MimoAdapter extends OpenAIAdapter {
  readonly name = 'mimo';
  private contextManager: ContextManager;

  constructor(endpoint: string, apiKey: string) {
    super(endpoint, apiKey);
    this.contextManager = new ContextManager();
  }

  supports(model: string): boolean {
    return model.startsWith('mimo-');
  }

  getContextWindow(model: string): number {
    return MIMO_MODELS[model]?.contextWindow ?? 128000;
  }

  countTokens(messages: Message[]): number {
    return this.contextManager.countTokens(messages);
  }

  async *streamChat(request: ModelRequest): AsyncGenerator<StreamChunk> {
    // 按模型更新上下文窗口
    const contextWindow = this.getContextWindow(request.model);
    this.contextManager.updateMaxTokens(contextWindow);

    // 注入摘要回调（仅首次或模型变化时）
    this.contextManager.setSummarize(async (text) => {
      const response = await this.chat({
        model: request.model,
        messages: [{ role: 'user', content: text }],
        system: '请将以下对话压缩为简要摘要，保留关键信息、文件路径和决策结论。输出不超过 200 字。',
        maxTokens: 300,
      });
      return response.content;
    });

    const compressed = await this.contextManager.compress(request.messages);

    // 调用父类（OpenAI）的 streamChat
    yield* super.streamChat({
      ...request,
      messages: compressed,
    });
  }
}
```

### 3.2 APIClient 注册

```ts
// services/api/client.ts 修改
import { MimoAdapter } from './adapters/mimo.js';

constructor(endpoint: string, apiKey: string) {
  this.defaultAdapter = new OpenAIAdapter(endpoint, apiKey);
  this.adapters.push(new MimoAdapter(endpoint, apiKey));  // 优先匹配
  this.adapters.push(this.defaultAdapter);
}
```

### 3.3 模型配置

在 `SettingsJson` 中新增：

```ts
interface MimoConfig {
  model?: string;           // 默认 'mimo-large'
  contextWindow?: number;   // 覆盖默认值
  maxOutput?: number;       // 覆盖默认值
}
```

---

## 4. Phase 3: 小米猫伙伴系统

### 4.1 移植文件清单

| 源文件 | 目标文件 | 修改内容 |
|--------|---------|---------|
| `src/buddy/types.ts` | `mimo-code/src/buddy/types.ts` | 无修改，直接移植 |
| `src/buddy/companion.ts` | `mimo-code/src/buddy/companion.ts` | 替换 `getGlobalConfig()` 为 `loadSettings()` |
| `src/buddy/sprites.ts` | `mimo-code/src/buddy/sprites.ts` | 无修改，直接移植 |
| `src/buddy/prompt.ts` | `mimo-code/src/buddy/prompt.ts` | 移除 `feature('BUDDY')` 守卫，改用 settings 检查 |
| `src/buddy/CompanionSprite.tsx` | `mimo-code/src/buddy/CompanionSprite.tsx` | 移除 React Compiler 输出，改用手写 memo；移除全屏模式 |
| — | `mimo-code/src/components/Buddy/BuddyContainer.tsx` | 新增：连接 AppState 和 CompanionSprite |

### 4.2 依赖适配

| 源依赖 | mimo-code 替代方案 |
|--------|-------------------|
| `getGlobalConfig()` | `loadSettings()` from `src/utils/settings/` |
| `feature('BUDDY')` | `settings.buddy?.enabled ?? false` |
| `useAppState` / `useSetAppState` | 已有 `useAppState` from `src/state/AppState.tsx` |
| `useNotifications` | 简化为首次启动 console.log |
| `useTerminalSize` | 使用 Ink 的 `useStdout().columns` |
| `stringWidth` | 使用 `string-width` npm 包 |
| `Box`, `Text` | 直接使用 Ink |
| `isFullscreenActive` | 移除（mimo-code 无全屏模式） |
| `figures` | 使用 `figures` npm 包 |
| `getRainbowColor` | 简化为固定颜色或移除 |
| React Compiler runtime | 移除 `_c()` 调用，改用 `useMemo` / `useCallback` |

### 4.3 AppState 扩展

在 `AppState` 中新增：

```ts
interface AppState {
  // ... 已有字段
  companionReaction?: string;   // 伙伴当前反应文本
  companionPetAt?: number;      // 上次 pet 时间戳
  buddyEnabled: boolean;        // 是否启用伙伴
}
```

### 4.4 Settings 扩展

在 `SettingsJson` 中新增：

```ts
interface BuddyConfig {
  enabled?: boolean;    // 默认 true
  muted?: boolean;      // 默认 false
  name?: string;        // 自定义名字
}
```

### 4.5 Slash 命令

新增 `/buddy` 命令：

| 子命令 | 功能 |
|--------|------|
| `/buddy pet` | 撸猫，触发 Happy 动画 + 爱心 |
| `/buddy mute` | 隐藏伙伴 |
| `/buddy unmute` | 显示伙伴 |
| `/buddy name <name>` | 修改伙伴名字 |

### 4.6 交互行为

| 事件 | 动画帧 | 触发条件 |
|------|--------|---------|
| 启动 | Frame 0 (Rest) | REPL 启动 |
| AI 思考 | Frame 6 (Thinking) | `isProcessing = true` |
| 工具完成 | Frame 5 (Surprised) | 工具执行返回 |
| 撸猫 | Frame 4 (Happy) | `/buddy pet` |
| 空闲 | Frame 7 (Sleepy) | 5 分钟无操作 |
| 闪烁 | Frame 3 (Blink) | 随机（10% 概率） |
| 左看/右看 | Frame 1/2 | 随机（5% 概率） |

### 4.7 窄终端适配

终端宽度 < 100 字符时，折叠为单行 `(●ω●)` + 名字，不显示完整 7 行精灵。

---

## 5. 测试策略

### 5.1 上下文压缩测试

- `tests/services/compact/contextManager.test.ts`
  - TokenCounter 各种内容类型的计数
  - microcompact 截断长输出、移除空消息
  - autocompact 超阈值时调用 summarize
  - collapseToolSequences 折叠长工具序列
  - reactiveCompress 保留最近 N 条
  - compress 完整 pipeline

### 5.2 Mimo 适配器测试

- `tests/services/api/adapters/mimo.test.ts`
  - supports() 匹配 mimo-* 模型
  - getContextWindow() 返回正确值
  - streamChat 自动压缩集成
  - 继承 OpenAI 的请求构建逻辑

### 5.3 小米猫测试

- `tests/buddy/companion.test.ts` — getCompanion 从 settings 读取
- `tests/buddy/sprites.test.ts` — renderSprite 返回正确帧
- `tests/buddy/prompt.test.ts` — companionIntroText 生成正确文本

---

## 6. 实现阶段

| 阶段 | 内容 | 依赖 |
|------|------|------|
| Phase 1 | 上下文压缩：TokenCounter、ContextManager 四种策略、QueryEngine 集成 | 无 |
| Phase 2 | Mimo 适配器：MimoAdapter、APIClient 注册、自动压缩集成 | Phase 1 |
| Phase 3 | 小米猫：移植 6 文件、AppState 扩展、Slash 命令 | 无（可与 Phase 1 并行） |

---

## 7. 配置项汇总

```json
{
  "context": {
    "maxTokens": 8000,
    "compactThreshold": 0.8,
    "maxToolOutputLength": 2000,
    "autoCompact": true
  },
  "mimo": {
    "model": "mimo-large",
    "contextWindow": 128000,
    "maxOutput": 8192
  },
  "buddy": {
    "enabled": true,
    "muted": false,
    "name": "小米猫"
  }
}
```
