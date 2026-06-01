export interface VoiceConfig {
  enabled: boolean;
  language: string;
  pushToTalk: boolean;
  silenceDetection: boolean;
}

export class VoiceMode {
  private config: VoiceConfig = {
    enabled: false,
    language: 'zh-CN',
    pushToTalk: true,
    silenceDetection: true,
  };
  private isRecording = false;

  isAvailable(): boolean {
    // Voice requires native audio capture
    return false;
  }

  getConfig(): VoiceConfig {
    return { ...this.config };
  }

  updateConfig(partial: Partial<VoiceConfig>): void {
    this.config = { ...this.config, ...partial };
  }

  async startRecording(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    this.isRecording = true;
    return true;
  }

  async stopRecording(): Promise<string | null> {
    this.isRecording = false;
    return null;
  }

  isRecordingActive(): boolean {
    return this.isRecording;
  }

  getStatus(): string {
    if (!this.isAvailable()) return 'Voice mode not available';
    if (this.isRecording) return 'Recording...';
    return 'Ready';
  }
}

export const voiceMode = new VoiceMode();
