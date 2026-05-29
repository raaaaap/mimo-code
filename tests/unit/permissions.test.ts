import { describe, it, expect } from 'vitest';
import { PermissionChecker } from '../../src/services/permissions/permissions.js';

describe('PermissionChecker', () => {
  it('should allow in bypass mode', () => {
    const checker = new PermissionChecker({ mode: 'bypassPermissions' });
    expect(checker.canUseTool('BashTool', { command: 'rm -rf /' })).toBe(true);
  });
  it('should deny writes in plan mode', () => {
    const checker = new PermissionChecker({ mode: 'plan' });
    expect(checker.canUseTool('FileWriteTool', {})).toBe(false);
    expect(checker.canUseTool('FileReadTool', {})).toBe(true);
  });
  it('should allow based on rules', () => {
    const checker = new PermissionChecker({ mode: 'default', rules: [{ tool: 'BashTool', action: 'allow' }] });
    expect(checker.canUseTool('BashTool', {})).toBe(true);
  });
  it('should ask for unknown tools in default mode', () => {
    const checker = new PermissionChecker({ mode: 'default' });
    expect(checker.canUseTool('UnknownTool', {})).toBe('ask');
  });
});
