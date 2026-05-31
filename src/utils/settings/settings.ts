import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { SettingsJson, CLIOptions } from '../../types/config.js';

const USER_SETTINGS_PATH = join(homedir(), '.mimo', 'settings.json');

async function readJsonFile(path: string): Promise<SettingsJson | null> {
  try {
    await access(path);
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content) as SettingsJson;
  } catch {
    return null;
  }
}

export async function loadSettings(
  projectRoot: string,
  cliOptions: Partial<CLIOptions>,
): Promise<SettingsJson> {
  const userSettings = await readJsonFile(USER_SETTINGS_PATH) ?? {};
  const projectSettings = await readJsonFile(join(projectRoot, '.mimo', 'settings.json')) ?? {};
  const localSettings = await readJsonFile(join(projectRoot, '.mimo', 'settings.local.json')) ?? {};

  const flagSettings: SettingsJson = {};
  if (cliOptions.model) flagSettings.model = cliOptions.model;
  if (cliOptions.apiKey) flagSettings.apiKey = cliOptions.apiKey;
  if (cliOptions.baseUrl) flagSettings.baseUrl = cliOptions.baseUrl;
  if (cliOptions.theme) flagSettings.theme = cliOptions.theme;
  if (cliOptions.maxTokens) flagSettings.maxTokens = cliOptions.maxTokens;
  if (cliOptions.temperature) flagSettings.temperature = cliOptions.temperature;
  if (cliOptions.permissionMode) flagSettings.permissionMode = cliOptions.permissionMode;

  return {
    ...userSettings,
    ...projectSettings,
    ...localSettings,
    ...flagSettings,
  };
}

export function resolveApiKey(settings: SettingsJson): string | undefined {
  return settings.apiKey ?? process.env.MIMO_API_KEY ?? process.env.OPENAI_API_KEY;
}

export function resolveBaseUrl(settings: SettingsJson): string {
  return settings.baseUrl
    ?? (settings as any).apiEndpoint  // backward compatibility
    ?? process.env.MIMO_BASE_URL
    ?? process.env.OPENAI_API_BASE
    ?? 'https://api.xiaomimimo.com/v1';
}
