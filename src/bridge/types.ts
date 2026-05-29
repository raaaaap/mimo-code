export interface BridgeConfig {
  enabled: boolean;
  port: number;
  authToken?: string;
}

export interface BridgeSession {
  id: string;
  status: 'connected' | 'disconnected';
  createdAt: number;
}
