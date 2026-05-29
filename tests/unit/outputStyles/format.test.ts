import { describe, it, expect } from 'vitest';
import { formatOutput } from '../../../src/outputStyles/styles.js';
import type { OutputStyle } from '../../../src/outputStyles/styles.js';

describe('formatOutput', () => {
  describe('text style', () => {
    it('returns string data as-is', () => {
      expect(formatOutput('hello', 'text')).toBe('hello');
    });

    it('converts non-string data to string', () => {
      expect(formatOutput(42, 'text')).toBe('42');
    });

    it('converts objects using String()', () => {
      expect(formatOutput({ a: 1 }, 'text')).toBe('[object Object]');
    });

    it('handles arrays', () => {
      expect(formatOutput([1, 2, 3], 'text')).toBe('1,2,3');
    });

    it('handles null and undefined', () => {
      expect(formatOutput(null, 'text')).toBe('null');
      expect(formatOutput(undefined, 'text')).toBe('undefined');
    });
  });

  describe('json style', () => {
    it('returns JSON string for objects', () => {
      const result = formatOutput({ a: 1, b: 2 }, 'json');
      expect(result).toBe(JSON.stringify({ a: 1, b: 2 }, null, 2));
    });

    it('returns quoted JSON string for string data', () => {
      expect(formatOutput('hello', 'json')).toBe('"hello"');
    });

    it('handles arrays', () => {
      const result = formatOutput([1, 2, 3], 'json');
      expect(result).toBe('[\n  1,\n  2,\n  3\n]');
    });

    it('handles nested objects', () => {
      const input = { nested: { deep: true } };
      const result = formatOutput(input, 'json');
      expect(JSON.parse(result)).toEqual(input);
    });

    it('handles null', () => {
      expect(formatOutput(null, 'json')).toBe('null');
    });
  });

  describe('markdown style', () => {
    it('returns string data as-is', () => {
      expect(formatOutput('hello', 'markdown')).toBe('hello');
    });

    it('returns JSON for non-string data', () => {
      const result = formatOutput({ key: 'value' }, 'markdown');
      expect(result).toBe(JSON.stringify({ key: 'value' }, null, 2));
    });

    it('returns JSON array string for arrays', () => {
      const result = formatOutput([1, 2], 'markdown');
      expect(result).toBe('[\n  1,\n  2\n]');
    });

    it('handles numbers', () => {
      expect(formatOutput(42, 'markdown')).toBe('42');
    });
  });

  describe('style type coverage', () => {
    const styles: OutputStyle[] = ['text', 'json', 'markdown'];

    it.each(styles)('handles %s style without throwing', (style) => {
      expect(() => formatOutput('test', style)).not.toThrow();
      expect(() => formatOutput({ a: 1 }, style)).not.toThrow();
      expect(() => formatOutput(null, style)).not.toThrow();
    });
  });
});
