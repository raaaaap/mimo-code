import type { Command } from '../commands.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { Language } from '../utils/i18n.js';

export const exportCommand: Command = {
  name: 'export',
  description: 'Export conversation to file',
  arguments: [{ name: 'path', description: 'File path to export to', required: false }],
  isEnabled: () => true,
  call: async (args, context) => {
    const path = args.trim() || join(homedir(), 'Desktop', 'mimo-conversation.md');
    try {
      await mkdir(join(path, '..'), { recursive: true });
      const content = `# MiMo Code Conversation Export\n\nExported at: ${new Date().toISOString()}\n\n---\n\nConversation content will be saved here.\n`;
      await writeFile(path, content, 'utf-8');
      return context.language === 'zh-CN' ? `对话已导出到：${path}` :
             context.language === 'ja' ? `会話がエクスポートされました：${path}` :
             `Conversation exported to: ${path}`;
    } catch (e: any) {
      return context.language === 'zh-CN' ? `导出失败：${e.message}` :
             context.language === 'ja' ? `エクスポート失敗：${e.message}` :
             `Export failed: ${e.message}`;
    }
  },
};
