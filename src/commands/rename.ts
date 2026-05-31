import type { Command } from '../commands.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

export const renameCommand: Command = {
  name: 'rename',
  description: 'Rename current session',
  arguments: [{ name: 'name', description: 'New session name', required: true }],
  isEnabled: () => true,
  call: async (args, context) => {
    const name = args.trim();
    if (!name) {
      return context.language === 'zh-CN' ? '用法：/rename <名称>' :
             context.language === 'ja' ? '使い方：/rename <名前>' :
             'Usage: /rename <name>';
    }
    try {
      const sessionDir = join(homedir(), '.mimo', 'sessions');
      await mkdir(sessionDir, { recursive: true });
      await writeFile(join(sessionDir, `${name}.json`), JSON.stringify({ name, createdAt: new Date().toISOString() }), 'utf-8');
      return context.language === 'zh-CN' ? `会话已重命名为：${name}` :
             context.language === 'ja' ? `セッション名が変更されました：${name}` :
             `Session renamed to: ${name}`;
    } catch (e: any) {
      return context.language === 'zh-CN' ? `重命名失败：${e.message}` :
             context.language === 'ja' ? `名前変更失敗：${e.message}` :
             `Rename failed: ${e.message}`;
    }
  },
};
