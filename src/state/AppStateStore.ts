import type { Message, TokenUsage } from '../types/message.js';
import type { SettingsJson } from '../types/config.js';
import type { Language } from '../utils/i18n.js';

export interface AppState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  baseUrl: string;
  totalUsage: TokenUsage;
  settings: SettingsJson;
  settingsLoaded: boolean;
  theme: string;
  language: Language;
  verbose: boolean;
  debug: boolean;
  permissionMode: string;
  companionReaction?: string;
  companionPetAt?: number;
  buddyEnabled: boolean;
  planMode: boolean;
  prePlanMode?: string;
  tasks: Record<string, any>;
}

export const INITIAL_APP_STATE: AppState = {
  messages: [],
  sessionId: '',
  isProcessing: false,
  model: 'mimo-v2.5',
  baseUrl: 'https://api.xiaomimimo.com/v1',
  totalUsage: { inputTokens: 0, outputTokens: 0 },
  settings: {},
  settingsLoaded: false,
  theme: 'mimo-dark',
  language: 'zh-CN',
  verbose: false,
  debug: false,
  permissionMode: 'default',
  buddyEnabled: true,
  planMode: false,
  tasks: {},
};
