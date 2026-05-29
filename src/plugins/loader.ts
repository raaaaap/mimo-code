import { readdir, stat, readFile } from 'node:fs/promises';
import { join } from 'node:path';

/** Valid capability types a plugin can declare. */
export type PluginCapability = 'command' | 'tool' | 'hook' | 'theme';

/** Shape of a parsed plugin manifest. */
export interface PluginManifest {
  name: string;
  version: string;
  description: string;
  main: string;
  capabilities: PluginCapability[];
}

/** A discovered plugin entry with its resolved path and parsed manifest. */
export interface DiscoveredPlugin {
  /** Directory path of the plugin package */
  dir: string;
  /** Parsed manifest.json contents */
  manifest: PluginManifest;
}

/**
 * Scans a directory for mimo-code plugin packages.
 *
 * A valid plugin directory must:
 *  1. Be named `mimo-plugin-*` or match `@mimo-code/plugin-*`
 *  2. Contain a `manifest.json` with required fields
 *
 * Returns an empty array when the directory does not exist or contains
 * no valid plugins.
 */
export async function discoverPlugins(dir: string): Promise<DiscoveredPlugin[]> {
  let entries: string[];
  try {
    const items = await readdir(dir);
    entries = items;
  } catch {
    // Directory doesn't exist or is unreadable
    return [];
  }

  // Resolve candidate plugin directories, including scoped packages
  // e.g. `@mimo-code/plugin-bar` is a nested dir: `@mimo-code/plugin-bar/`
  const pluginDirs: string[] = [];
  for (const name of entries) {
    if (name.startsWith('mimo-plugin-')) {
      pluginDirs.push(join(dir, name));
    } else if (name === '@mimo-code') {
      // Look inside the scope directory for plugin-* subdirectories
      const scopeDir = join(dir, name);
      let scopeEntries: string[];
      try {
        scopeEntries = await readdir(scopeDir);
      } catch {
        continue;
      }
      for (const sub of scopeEntries) {
        if (sub.startsWith('plugin-')) {
          pluginDirs.push(join(scopeDir, sub));
        }
      }
    }
  }

  const discovered: DiscoveredPlugin[] = [];

  for (const fullPath of pluginDirs) {
    // Check that it's actually a directory
    let dirStat;
    try {
      dirStat = await stat(fullPath);
    } catch {
      continue;
    }
    if (!dirStat.isDirectory()) continue;

    // Try to read manifest.json
    const manifestPath = join(fullPath, 'manifest.json');
    let raw: string;
    try {
      raw = await readFile(manifestPath, 'utf-8');
    } catch {
      // No manifest — skip
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Invalid JSON — skip
      continue;
    }

    if (!isValidManifest(parsed)) continue;

    discovered.push({ dir: fullPath, manifest: parsed });
  }

  return discovered;
}

/** Type-guard that validates the parsed JSON has the expected shape. */
function isValidManifest(obj: unknown): obj is PluginManifest {
  if (typeof obj !== 'object' || obj === null) return false;
  const m = obj as Record<string, unknown>;

  if (typeof m.name !== 'string' || m.name.length === 0) return false;
  if (typeof m.version !== 'string' || m.version.length === 0) return false;
  if (typeof m.description !== 'string') return false;
  if (typeof m.main !== 'string' || m.main.length === 0) return false;

  if (!Array.isArray(m.capabilities)) return false;

  const validCaps = new Set(['command', 'tool', 'hook', 'theme']);
  for (const cap of m.capabilities) {
    if (typeof cap !== 'string' || !validCaps.has(cap)) return false;
  }

  return true;
}
