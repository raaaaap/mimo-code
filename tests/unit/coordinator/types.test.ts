import { describe, it, expect } from 'vitest';
import { getToolsForRole } from '../../../src/coordinator/types.js';
import type { WorkerRole, CoordinatorConfig } from '../../../src/coordinator/types.js';

describe('getToolsForRole', () => {
  describe('coordinator role', () => {
    it('returns coordination tools', () => {
      const tools = getToolsForRole('coordinator');
      expect(tools).toEqual(['AgentTool', 'TaskStopTool', 'SendMessageTool', 'TodoWriteTool']);
    });

    it('includes AgentTool', () => {
      expect(getToolsForRole('coordinator')).toContain('AgentTool');
    });

    it('does not include file tools', () => {
      const tools = getToolsForRole('coordinator');
      expect(tools).not.toContain('BashTool');
      expect(tools).not.toContain('FileReadTool');
    });
  });

  describe('worker role', () => {
    it('returns file and execution tools', () => {
      const tools = getToolsForRole('worker');
      expect(tools).toEqual(['BashTool', 'FileReadTool', 'FileEditTool', 'GlobTool', 'GrepTool']);
    });

    it('includes BashTool', () => {
      expect(getToolsForRole('worker')).toContain('BashTool');
    });

    it('does not include coordination tools', () => {
      const tools = getToolsForRole('worker');
      expect(tools).not.toContain('AgentTool');
      expect(tools).not.toContain('SendMessageTool');
    });
  });

  describe('role type safety', () => {
    it('accepts coordinator role', () => {
      const role: WorkerRole = 'coordinator';
      expect(getToolsForRole(role)).toBeDefined();
    });

    it('accepts worker role', () => {
      const role: WorkerRole = 'worker';
      expect(getToolsForRole(role)).toBeDefined();
    });
  });
});

describe('CoordinatorConfig', () => {
  it('can be constructed with valid shape', () => {
    const config: CoordinatorConfig = {
      role: 'coordinator',
      workers: ['worker-1', 'worker-2'],
      scratchpadDir: '/tmp/scratch',
    };
    expect(config.role).toBe('coordinator');
    expect(config.workers).toHaveLength(2);
    expect(config.scratchpadDir).toBe('/tmp/scratch');
  });
});
