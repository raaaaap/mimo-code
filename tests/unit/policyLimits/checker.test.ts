import { describe, it, expect } from 'vitest';
import { checkToolAllowed, checkModelAllowed, PolicyLimits } from '../../../src/services/policyLimits/types';

describe('checkToolAllowed', () => {
  it('allows any tool when no restrictions', () => {
    const policy: PolicyLimits = {};
    expect(checkToolAllowed('Read', policy)).toBe(true);
  });

  it('allows tools in allowedTools list', () => {
    const policy: PolicyLimits = { allowedTools: ['Read', 'Write'] };
    expect(checkToolAllowed('Read', policy)).toBe(true);
  });

  it('blocks tools not in allowedTools list', () => {
    const policy: PolicyLimits = { allowedTools: ['Read', 'Write'] };
    expect(checkToolAllowed('Bash', policy)).toBe(false);
  });

  it('blocks tools in deniedTools list', () => {
    const policy: PolicyLimits = { deniedTools: ['Bash'] };
    expect(checkToolAllowed('Bash', policy)).toBe(false);
  });

  it('deniedTools takes precedence over allowedTools', () => {
    const policy: PolicyLimits = { allowedTools: ['Read', 'Bash'], deniedTools: ['Bash'] };
    expect(checkToolAllowed('Bash', policy)).toBe(false);
    expect(checkToolAllowed('Read', policy)).toBe(true);
  });
});

describe('checkModelAllowed', () => {
  it('allows any model when no restrictions', () => {
    const policy: PolicyLimits = {};
    expect(checkModelAllowed('gpt-4', policy)).toBe(true);
  });

  it('allows models in allowedModels list', () => {
    const policy: PolicyLimits = { allowedModels: ['gpt-4', 'claude-3'] };
    expect(checkModelAllowed('gpt-4', policy)).toBe(true);
  });

  it('blocks models not in allowedModels list', () => {
    const policy: PolicyLimits = { allowedModels: ['gpt-4'] };
    expect(checkModelAllowed('gpt-3.5', policy)).toBe(false);
  });
});
