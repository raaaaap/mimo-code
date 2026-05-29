import type { SettingsSource } from '../../types/config.js';

export const SETTING_SOURCES: SettingsSource[] = [
  'policySettings',
  'flagSettings',
  'localSettings',
  'projectSettings',
  'userSettings',
];

export const SETTINGS_FILE_NAMES: Record<SettingsSource, string | null> = {
  policySettings: null,
  flagSettings: null,
  localSettings: '.mimo/settings.local.json',
  projectSettings: '.mimo/settings.json',
  userSettings: '.mimo/settings.json',
};
