import { describe, it, expect } from 'vitest';
import { isDomainAllowed, isPathWritable, SandboxConfig } from '../../../src/sandbox/config';

const strictConfig: SandboxConfig = {
  enabled: true,
  network: { allowedDomains: ['api.example.com', 'cdn.example.com'], blockedDomains: ['evil.com'] },
  filesystem: { allowedWritePaths: ['/tmp', '/workspace'], readOnly: false },
};

const disabledConfig: SandboxConfig = {
  ...strictConfig,
  enabled: false,
};

const wildcardConfig: SandboxConfig = {
  enabled: true,
  network: { allowedDomains: ['*'], blockedDomains: ['evil.com'] },
  filesystem: { allowedWritePaths: ['/tmp'], readOnly: false },
};

const readOnlyConfig: SandboxConfig = {
  enabled: true,
  network: { allowedDomains: ['*'], blockedDomains: [] },
  filesystem: { allowedWritePaths: [], readOnly: true },
};

describe('isDomainAllowed', () => {
  it('allows listed domains', () => {
    expect(isDomainAllowed('api.example.com', strictConfig)).toBe(true);
  });

  it('blocks unlisted domains', () => {
    expect(isDomainAllowed('unknown.com', strictConfig)).toBe(false);
  });

  it('blocks explicitly blocked domains even with wildcard', () => {
    expect(isDomainAllowed('evil.com', wildcardConfig)).toBe(false);
  });

  it('allows any domain with wildcard', () => {
    expect(isDomainAllowed('anything.com', wildcardConfig)).toBe(true);
  });

  it('allows everything when sandbox disabled', () => {
    expect(isDomainAllowed('evil.com', disabledConfig)).toBe(true);
  });
});

describe('isPathWritable', () => {
  it('allows paths under allowed prefixes', () => {
    expect(isPathWritable('/tmp/file.txt', strictConfig)).toBe(true);
    expect(isPathWritable('/workspace/src/main.ts', strictConfig)).toBe(true);
  });

  it('blocks paths outside allowed prefixes', () => {
    expect(isPathWritable('/etc/passwd', strictConfig)).toBe(false);
  });

  it('blocks all writes when readOnly', () => {
    expect(isPathWritable('/tmp/file.txt', readOnlyConfig)).toBe(false);
  });

  it('allows everything when sandbox disabled', () => {
    expect(isPathWritable('/etc/passwd', disabledConfig)).toBe(true);
  });
});
