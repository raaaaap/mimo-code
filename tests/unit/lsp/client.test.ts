import { describe, it, expect } from 'vitest';
import {
  LspClient,
  type LspLocation,
  type LspDiagnostic,
} from '../../../src/services/lsp/client.js';

describe('LspClient', () => {
  let client: LspClient;

  beforeEach(() => {
    client = new LspClient();
  });

  describe('findDefinition', () => {
    it('should return null (stub)', async () => {
      const result = await client.findDefinition('src/main.ts', 10, 5);
      expect(result).toBeNull();
    });

    it('should accept file, line, and column parameters', async () => {
      // Verify the signature accepts the right types
      const result: LspLocation | null = await client.findDefinition(
        'src/index.ts',
        1,
        0,
      );
      expect(result).toBeNull();
    });
  });

  describe('getDiagnostics', () => {
    it('should return empty array (stub)', async () => {
      const result = await client.getDiagnostics('src/main.ts');
      expect(result).toEqual([]);
    });

    it('should return LspDiagnostic[] type', async () => {
      const result: LspDiagnostic[] = await client.getDiagnostics('any.ts');
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('format', () => {
    it('should return null (stub)', async () => {
      const result = await client.format('src/main.ts');
      expect(result).toBeNull();
    });
  });
});
