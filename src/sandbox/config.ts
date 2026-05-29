export interface SandboxConfig {
  network: { allowedDomains: string[]; blockedDomains: string[] };
  filesystem: { allowedWritePaths: string[]; readOnly: boolean };
  enabled: boolean;
}

export function isDomainAllowed(domain: string, config: SandboxConfig): boolean {
  if (!config.enabled) return true;
  if (config.network.blockedDomains.includes(domain)) return false;
  return config.network.allowedDomains.includes('*') || config.network.allowedDomains.includes(domain);
}

export function isPathWritable(path: string, config: SandboxConfig): boolean {
  if (!config.enabled) return true;
  if (config.filesystem.readOnly) return false;
  return config.filesystem.allowedWritePaths.some(p => path.startsWith(p));
}
