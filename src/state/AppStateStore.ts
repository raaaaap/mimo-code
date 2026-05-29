import type { Message, TokenUsage } from '../types/message.js';
import type { SettingsJson } from '../types/config.js';

export interface AppState {
  messages: Message[];
  sessionId: string;
  isProcessing: boolean;
  model: string;
  apiEndpoint: string;
  totalUsage: TokenUsage;
  settings: SettingsJson;
  settingsLoaded: boolean;
  theme: string;
  verbose: boolean;
  debug: boolean;
  permissionMode: string;
  companionReaction?: string;
  companionPetAt?: number;
  buddyEnabled: boolean;
}

export const INITIAL_APP_STATE: AppState = {
  messages: [],
  sessionId: '',
  isProcessing: false,
  model: 'mimo-large',
  apiEndpoint: 'https://api.mimo.ai/v1',
  totalUsage: { inputTokens: 0, outputTokens: 0 },
  settings: {},
  settingsLoaded: false,
  theme: 'mimo-dark',
  verbose: false,
  debug: false,
  permissionMode: 'default',
  buddyEnabled: true,
};
