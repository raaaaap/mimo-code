import type { Tool } from '../types/tool.js';
import type { SystemContext } from '../context.js';
import { formatSystemContext } from '../context.js';

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
1. **直接执行**：收到任务后立即开始执行，不要反复创建或更新 todo 列表。只在任务非常复杂（需要 5 个以上步骤）时才使用 TodoWriteTool。
2. **主动执行**：不要只描述你会做什么，要实际去做。用 FileWriteTool 创建文件，用 BashTool 执行命令。
3. **一次性完成**：生成代码时，一次性写入完整内容，不要分多次写入。
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
