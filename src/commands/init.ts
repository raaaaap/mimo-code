import type { Command } from '../commands.js';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize project configuration',
  isEnabled: () => true,
  call: async (args, context) => {
    const configPath = join(process.cwd(), '.mimo', 'settings.json');
    try {
      await access(configPath);
      return context.language === 'zh-CN' ? `配置文件已存在：${configPath}` :
             context.language === 'ja' ? `設定ファイルは既に存在します：${configPath}` :
             `Config file already exists: ${configPath}`;
    } catch {
      // File doesn't exist, create it
    }
    try {
      await mkdir(join(process.cwd(), '.mimo'), { recursive: true });
      const config = {
        model: 'mimo-v2.5',
        baseUrl: 'https://api.xiaomimimo.com/v1',
      };
      await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
      return context.language === 'zh-CN' ? `配置文件已创建：${configPath}` :
             context.language === 'ja' ? `設定ファイルが作成されました：${configPath}` :
             `Config file created: ${configPath}`;
    } catch (e: any) {
      return context.language === 'zh-CN' ? `创建失败：${e.message}` :
             context.language === 'ja' ? `作成失敗：${e.message}` :
             `Creation failed: ${e.message}`;
    }
  },
};
