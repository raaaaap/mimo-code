import type { Command } from '../commands.js';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const SETTINGS_PATH = join(homedir(), '.mimo', 'settings.json');

async function loadSettingsFile(): Promise<Record<string, unknown>> {
  try {
    const content = await readFile(SETTINGS_PATH, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveSettingsFile(settings: Record<string, unknown>): Promise<void> {
  await mkdir(join(homedir(), '.mimo'), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');
}

export const configCommand: Command = {
  name: 'config',
  aliases: ['cfg'],
  description: 'Show or set configuration (config set <key> <value>)',
  isEnabled: () => true,
  call: async (args) => {
    const parts = args.trim().split(/\s+/);

    // No args: show current config
    if (!args.trim()) {
      const settings = await loadSettingsFile();
      return [
        'Current configuration (~/.mimo/settings.json):',
        `  apiKey: ${settings.apiKey ? '****' + String(settings.apiKey).slice(-4) : '(not set)'}`,
        `  apiEndpoint: ${settings.apiEndpoint ?? '(not set)'}`,
        `  model: ${settings.model ?? '(not set)'}`,
        `  theme: ${settings.theme ?? 'mimo-dark'}`,
        '',
        'Environment variables:',
        `  MIMO_API_KEY: ${process.env.MIMO_API_KEY ? '****' + process.env.MIMO_API_KEY.slice(-4) : '(not set)'}`,
        `  MIMO_API_ENDPOINT: ${process.env.MIMO_API_ENDPOINT ?? '(not set)'}`,
        '',
        'Usage:',
        '  config set apiKey <key>',
        '  config set apiEndpoint <url>',
        '  config set model <model>',
      ].join('\n');
    }

    // config set <key> <value>
    if (parts[0] === 'set') {
      const key = parts[1];
      const value = parts.slice(2).join(' ');

      if (!key || !value) {
        return 'Usage: config set <key> <value>\nKeys: apiKey, apiEndpoint, model';
      }

      const allowedKeys = ['apiKey', 'apiEndpoint', 'model', 'theme', 'temperature', 'maxTokens'];
      if (!allowedKeys.includes(key)) {
        return `Unknown key: ${key}\nAllowed keys: ${allowedKeys.join(', ')}`;
      }

      const settings = await loadSettingsFile();
      settings[key] = value;
      await saveSettingsFile(settings);

      const displayValue = key === 'apiKey' ? '****' + value.slice(-4) : value;
      return `Set ${key} = ${displayValue}\nSaved to ~/.mimo/settings.json`;
    }

    // config get <key>
    if (parts[0] === 'get') {
      const key = parts[1];
      if (!key) return 'Usage: config get <key>';
      const settings = await loadSettingsFile();
      const value = settings[key];
      if (value === undefined) return `${key} is not set`;
      if (key === 'apiKey') return `${key} = ****${String(value).slice(-4)}`;
      return `${key} = ${value}`;
    }

    return 'Usage: config [set <key> <value> | get <key>]';
  },
};
