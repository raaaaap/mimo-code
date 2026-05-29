export interface RemoteSessionConfig {
  url: string;
  token: string;
}

export class RemoteSessionManager {
  async connect(_config: RemoteSessionConfig): Promise<void> {}
  async disconnect(): Promise<void> {}
  isConnected(): boolean { return false; }
}
