import { describe, it, expect } from 'vitest';
import {
  LSPClient,
  type LSPDiagnostic,
} from '../../../src/services/lsp/client.js';

describe('LSPClient', () => {
  let client: LSPClient;

  beforeEach(() => {
    client = new LSPClient();
  });

  describe('getDefinition', () => {
    it('should return null (stub)', async () => {
      const result = await client.getDefinition('src/main.ts', 10, 5);
      expect(result).toBeNull();
    });

    it('should accept file, line, and column parameters', async () => {
      // Verify the signature accepts the right types
      const result: string | null = await client.getDefinition(
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

    it('should return LSPDiagnostic[] type', async () => {
      const result: LSPDiagnostic[] = await client.getDiagnostics('any.ts');
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
