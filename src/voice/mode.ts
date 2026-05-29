export interface VoiceConfig {
  enabled: boolean;
  sttProvider?: 'whisper' | 'browser';
  ttsProvider?: 'browser' | 'external';
}

export function isVoiceAvailable(): boolean {
  return false;
}
