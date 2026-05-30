# mimo-code Agent 任务执行修复设计

**日期**: 2026-05-30
**状态**: 已批准
**目标**: 修复 mimo-code 无法完成复杂任务（如"制作展示网页到桌面"）的问题

## 问题描述

用户请求 mimo-code 执行"制作一个展示网页，风格动效参照 iPhone 官网，生成到桌面"时，模型只调用了 TodoWriteTool 创建任务列表，然后就停止了，没有继续执行实际的文件创建任务。

## 根因分析

经过代码审查，发现以下 7 个具体问题：

### 🔴 关键 Bug #1：AgentTool 没有传递 tools 参数
- **文件**: `src/tools/AgentTool/AgentTool.ts:49-59`
- **问题**: 子代理调用 `queryLoop` 时没有传 `tools` 参数，导致子代理完全无法使用任何工具
- **影响**: AgentTool 形同虚设，子代理只能返回纯文本

### 🔴 关键 Bug #2：系统提示词太弱
- **文件**: `src/constants/prompts.ts:27-32`
- **问题**: 系统提示词没有告诉模型如何分解复杂任务、如何持续执行、如何使用工具
- **影响**: 模型以为创建 todo 列表就算完成任务

### 🔴 关键 Bug #3：parseToolCallsFromText 正则太脆弱
- **文件**: `src/query.ts:20`
- **问题**: 贪婪正则 `\{[\s\S]*?\}` 在格式化 JSON 上会匹配失败，只能解析单个工具调用
- **影响**: 模型输出格式化 JSON 或多个调用时丢失

### 🟡 Bug #4：BashTool 在 Windows 上用 `bash -c`
- **文件**: `src/tools/BashTool/BashTool.ts:21`
- **问题**: Windows 用户通常没有 bash，命令直接失败
- **影响**: 所有 shell 命令在 Windows 上无法执行

### 🟡 Bug #5：上下文压缩会破坏工具结果
- **文件**: `src/services/compact/contextManager.ts:61-69`
- **问题**: 超过 2000 字符的 tool output 会被截断，生成的代码可能丢失
- **影响**: 长代码文件被截断后无法使用

### 🟡 Bug #6：maxTokens 默认 4096 太小
- **文件**: `src/query.ts:63`
- **问题**: 生成一个完整的带动效的网页需要大量 token，4096 不够用
- **影响**: 代码生成中途被截断

### 🟡 Bug #7：系统提示词没有中文支持
- **问题**: 模型和用户都是中文环境，但系统提示词全英文
- **影响**: 模型行为不够自然，用户体验差

## 设计方案

### 修复 1：AgentTool 传递 tools 参数

**改动范围**: `src/tools/AgentTool/AgentTool.ts`, `src/tools.ts`, `src/screens/REPL.tsx`

```typescript
// AgentToolDeps 接口新增
export interface AgentToolDeps {
  getTool: (name: string) => Tool | undefined;
  callModel: (request: ModelRequest) => AsyncGenerator<StreamChunk>;
  getToolDefinitions: () => ToolDefinition[];  // 新增
}

// AgentTool call() 中传递 tools
for await (const msg of queryLoop(
  subMessages,
  subDeps,
  { model, maxTokens, temperature, abortSignal },
  args.systemPrompt,
  deps.getToolDefinitions(),  // 新增
))
```

### 修复 2：重写 parseToolCallsFromText

**改动范围**: `src/query.ts`

```typescript
function parseToolCallsFromText(text: string, uuid: () => string): ToolCall[] {
  const results: ToolCall[] = [];
  
  // 用括号平衡算法找到所有 JSON 块
  let depth = 0;
  let start = -1;
  
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '{') {
      if (depth === 0) start = i;
      depth++;
    } else if (text[i] === '}') {
      depth--;
      if (depth === 0 && start !== -1) {
        const jsonStr = text.slice(start, i + 1);
        try {
          const obj = JSON.parse(jsonStr);
          // 检查两种格式
          if (obj.name && obj.arguments) {
            results.push({
              id: uuid(),
              type: 'function',
              function: {
                name: obj.name,
                arguments: typeof obj.arguments === 'string' 
                  ? obj.arguments 
                  : JSON.stringify(obj.arguments)
              }
            });
          } else if (obj.tool && obj.input) {
            results.push({
              id: uuid(),
              type: 'function',
              function: {
                name: obj.tool,
                arguments: typeof obj.input === 'string' 
                  ? obj.input 
                  : JSON.stringify(obj.input)
              }
            });
          }
        } catch { /* 跳过无效 JSON */ }
        start = -1;
      }
    }
  }
  
  return results;
}
```

### 修复 3：BashTool Windows 兼容

**改动范围**: `src/tools/BashTool/BashTool.ts`

```typescript
call: async (args) => {
  return new Promise((resolve) => {
    const isWindows = process.platform === 'win32';
    const shell = isWindows ? 'powershell.exe' : 'bash';
    const shellArgs = isWindows ? ['-Command', args.command] : ['-c', args.command];
    
    const proc = spawn(shell, shellArgs, { 
      cwd: process.cwd(), 
      env: process.env, 
      stdio: ['pipe', 'pipe', 'pipe'] 
    });
    // ... 其余逻辑不变
  });
}
```

### 修复 4：maxTokens 动态调整

**改动范围**: `src/query.ts`, `src/screens/REPL.tsx`

```typescript
// 在 queryLoop 中，如果没有指定 maxTokens，使用模型的默认值
const request: ModelRequest = {
  // ...
  maxTokens: options.maxTokens ?? 8192,  // 从 4096 提高到 8192
  // ...
};
```

### 修复 5：上下文压缩保护

**改动范围**: `src/services/compact/contextManager.ts`

```typescript
microcompact(messages: Message[]): CompressionResult {
  // ...
  if (msg.role === 'tool' && typeof msg.content === 'string') {
    // 只截断超过 5000 字符的输出（从 2000 提高）
    if (msg.content.length > 5000) {
      // 保留前 2500 和后 2500 字符
      const half = 2500;
      result.push({
        ...msg,
        content: msg.content.slice(0, half) + '\n\n[...truncated...]\n\n' + msg.content.slice(-half),
      });
      continue;
    }
  }
  // ...
}
```

### 修复 6：系统提示词重设计

**改动范围**: `src/constants/prompts.ts`

```typescript
export function getSystemPrompt(
  tools: Tool[],
  context: SystemContext,
  mimoMd?: string,
): string {
  const sections: string[] = [];

  sections.push(`## 身份
你是 Mimo，一个运行在用户终端中的 AI 编程助手。你可以编写代码、执行命令、搜索文件、管理任务。`);

  if (tools.length > 0) {
    sections.push(`## 可用工具`);
    for (const tool of tools) {
      sections.push(`### ${tool.name}\n${tool.prompt()}`);
    }
  }

  sections.push(`## 系统上下文\n${formatSystemContext(context)}`);

  if (mimoMd) {
    sections.push(`## 项目配置\n${mimoMd}`);
  }

  sections.push(`## 核心工作原则
1. **任务分解**：收到复杂任务时，先用 TodoWriteTool 创建任务列表，然后逐步执行每个任务。
2. **主动执行**：不要只描述你会做什么，要实际去做。用 FileWriteTool 创建文件，用 BashTool 执行命令。
3. **持续工作**：创建 todo 后不要停下来，立即开始执行第一个任务。直到所有任务完成才停止。
4. **代码完整性**：生成的代码必须是完整可运行的，不要省略任何部分。
5. **路径处理**：
   - Windows 桌面路径：C:\\Users\\{username}\\Desktop\\
   - 使用绝对路径确保文件写入正确位置
6. **网页开发**：
   - 生成单文件 HTML（包含 CSS 和 JS）
   - 使用现代 CSS 动画和过渡效果
   - 确保响应式设计

## 工具使用指南
- FileWriteTool：创建新文件，自动创建父目录
- FileEditTool：修改已有文件的特定内容
- BashTool：执行 shell 命令（Windows 上自动使用 PowerShell）
- WebSearchTool：搜索参考资料
- TodoWriteTool：跟踪任务进度，每完成一个任务就更新状态

## 语言
使用中文与用户交流。代码注释也用中文。`);

  return sections.join('\n\n');
}
```

## 实施顺序

1. **AgentTool 修复** — 基础设施，其他功能依赖它
2. **parseToolCallsFromText 重写** — 确保工具调用能被正确解析
3. **BashTool Windows 兼容** — 平台兼容性
4. **maxTokens 调整** — 确保足够 token 生成完整代码
5. **上下文压缩保护** — 防止代码被截断
6. **系统提示词重设计** — 最后做，因为需要前面的修复配合

## 测试策略

- 为每个修复编写单元测试
- 端到端测试：用 mimo-code 执行"创建一个带动效的网页到桌面"任务
- 验证文件是否正确创建、内容是否完整、路径是否正确

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 系统提示词改动导致模型行为不可预测 | 中 | 逐步测试，保留旧提示词作为回退 |
| Windows PowerShell 命令兼容性 | 低 | 测试常用命令，提供 bash 回退选项 |
| maxTokens 提高导致 API 成本增加 | 低 | 用户可通过配置覆盖默认值 |

## 成功标准

- [ ] 用户请求"制作展示网页到桌面"时，mimo-code 能自动创建完整 HTML 文件
- [ ] 文件路径正确（Windows 桌面）
- [ ] 代码完整可运行
- [ ] 子代理能正常使用工具
- [ ] 在 Windows 和 Linux/macOS 上都能正常工作
