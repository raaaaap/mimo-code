export type SettingsSource = 'user' | 'project' | 'local' | 'managed' | 'flag';

export interface SettingsLayer {
  source: SettingsSource;
  settings: Record<string, unknown>;
}

export function mergeSettings(layers: SettingsLayer[]): Record<string, unknown> {
  const priority: SettingsSource[] = ['flag', 'managed', 'local', 'project', 'user'];
  const result: Record<string, unknown> = {};
  for (const source of priority) {
    const layer = layers.find(l => l.source === source);
    if (layer) Object.assign(result, layer.settings);
  }
  return result;
}
