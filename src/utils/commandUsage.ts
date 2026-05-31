import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';

const USAGE_PATH = join(homedir(), '.mimo', 'command-usage.json');
const DEFAULT_TOP_COMMANDS = ['help', 'clear', 'compact', 'model', 'theme', 'language', 'config', 'permissions', 'plan', 'status', 'usage', 'memory'];

interface UsageData {
  [command: string]: number;
}

let cachedUsage: UsageData | null = null;

async function loadUsage(): Promise<UsageData> {
  if (cachedUsage) return cachedUsage;
  try {
    const content = await readFile(USAGE_PATH, 'utf-8');
    cachedUsage = JSON.parse(content);
    return cachedUsage!;
  } catch {
    cachedUsage = {};
    return cachedUsage;
  }
}

async function saveUsage(data: UsageData): Promise<void> {
  await mkdir(join(homedir(), '.mimo'), { recursive: true });
  await writeFile(USAGE_PATH, JSON.stringify(data, null, 2), 'utf-8');
  cachedUsage = data;
}

export async function trackCommandUsage(commandName: string): Promise<void> {
  const data = await loadUsage();
  data[commandName] = (data[commandName] || 0) + 1;
  await saveUsage(data);
}

export async function getTopCommands(count: number = 12): Promise<string[]> {
  const data = await loadUsage();
  const entries = Object.entries(data);

  if (entries.length === 0) {
    return DEFAULT_TOP_COMMANDS;
  }

  // Sort by usage count descending
  entries.sort((a, b) => b[1] - a[1]);

  // Return top N command names
  return entries.slice(0, count).map(([name]) => name);
}

export function getDefaultTopCommands(): string[] {
  return DEFAULT_TOP_COMMANDS;
}
