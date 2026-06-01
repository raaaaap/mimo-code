import { z } from 'zod';
import { buildTool } from '../../types/tool.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SETTINGS_PATH = join(homedir(), '.mimo', 'settings.json');

const inputSchema = z.object({
  action: z.enum(['get', 'set', 'list']).describe('Action to perform'),
  key: z.string().optional().describe('Setting key'),
  value: z.string().optional().describe('Setting value (for set action)'),
});

async function loadSettings(): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSettings(settings: Record<string, unknown>): Promise<void> {
  await mkdir(join(homedir(), '.mimo'), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export const ConfigTool = buildTool({
  name: 'ConfigTool',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Read or modify configuration settings programmatically.',
  prompt: () => 'Get, set, or list configuration settings. Keys: model, apiKey, baseUrl, theme, maxTokens, temperature.',
  call: async (args) => {
    try {
      const settings = await loadSettings();

      if (args.action === 'list') {
        const safeSettings = { ...settings };
        if (safeSettings.apiKey) safeSettings.apiKey = '****' + String(safeSettings.apiKey).slice(-4);
        return { toolUseId: '', name: 'ConfigTool', result: JSON.stringify(safeSettings, null, 2) };
      }

      if (args.action === 'get') {
        if (!args.key) return { toolUseId: '', name: 'ConfigTool', result: '', error: 'Key required for get action', isError: true };
        const value = settings[args.key];
        if (value === undefined) return { toolUseId: '', name: 'ConfigTool', result: `${args.key} is not set` };
        const display = args.key === 'apiKey' ? '****' + String(value).slice(-4) : value;
        return { toolUseId: '', name: 'ConfigTool', result: `${args.key} = ${display}` };
      }

      if (args.action === 'set') {
        if (!args.key || !args.value) return { toolUseId: '', name: 'ConfigTool', result: '', error: 'Key and value required for set action', isError: true };
        settings[args.key] = args.value;
        await saveSettings(settings);
        return { toolUseId: '', name: 'ConfigTool', result: `Set ${args.key} = ${args.value}` };
      }

      return { toolUseId: '', name: 'ConfigTool', result: '', error: 'Invalid action', isError: true };
    } catch (error) {
      return { toolUseId: '', name: 'ConfigTool', result: '', error: String(error), isError: true };
    }
  },
});
