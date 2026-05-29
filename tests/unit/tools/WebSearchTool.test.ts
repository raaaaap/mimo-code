import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebSearchTool } from '../../../src/tools/WebSearchTool/WebSearchTool.js';
import type { ToolUseContext } from '../../../src/types/tool.js';

function makeCtx(): ToolUseContext {
  return {
    options: { model: 'test' },
    abortController: new AbortController(),
    readFileState: new Map(),
    messages: [],
    toolDecisions: new Map(),
    requestPrompt: async () => '',
    getAppState: () => ({}),
    setAppState: () => {},
  };
}

const MOCK_HTML = `
<html><body>
<div class="results--main">
<div class="result results_links results_links_deep web-result">
  <a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage1&amp;rut=abc">Example Page One</a>
  <a class="result__snippet">This is the first example search result snippet text.</a>
</div>
<div class="result results_links results_links_deep web-result">
  <a class="result__a" href="https://duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpage2&amp;rut=def">Example Page Two</a>
  <a class="result__snippet">This is the second example search result snippet text.</a>
</div>
<div class="result results_links results_links_deep web-result">
  <a class="result__a" href="https://example.com/page3">Example Page Three</a>
  <a class="result__snippet">This is the third example search result snippet text.</a>
</div>
</div>
</body></html>
`;

describe('WebSearchTool', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('should return parsed search results', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(MOCK_HTML, { status: 200 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test query' }, makeCtx());

    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Example Page One');
    expect(result.result).toContain('https://example.com/page1');
    expect(result.result).toContain('first example search result snippet');
    expect(result.result).toContain('Example Page Two');
    expect(result.result).toContain('3 of 5 requested');
  });

  it('should respect maxResults parameter', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(MOCK_HTML, { status: 200 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test', maxResults: 1 }, makeCtx());

    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('Example Page One');
    expect(result.result).not.toContain('Example Page Two');
    expect(result.result).toContain('1 of 1 requested');
  });

  it('should decode DuckDuckGo redirect URLs', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(MOCK_HTML, { status: 200 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test' }, makeCtx());

    // Should contain the decoded URL, not the redirect
    expect(result.result).toContain('https://example.com/page1');
    expect(result.result).not.toContain('uddg=');
  });

  it('should handle non-redirect URLs', async () => {
    fetchSpy.mockResolvedValueOnce(new Response(MOCK_HTML, { status: 200 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test', maxResults: 3 }, makeCtx());

    expect(result.result).toContain('https://example.com/page3');
  });

  it('should return "no results" message for empty results', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('<html><body>no results</body></html>', { status: 200 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'nonsense12345' }, makeCtx());

    expect(result.isError).toBeFalsy();
    expect(result.result).toContain('No results found');
  });

  it('should error on empty query', async () => {
    const tool = WebSearchTool();
    const result = await tool.call({ query: '   ' }, makeCtx());

    expect(result.isError).toBe(true);
    expect(result.error).toContain('empty');
  });

  it('should error on HTTP failure', async () => {
    fetchSpy.mockResolvedValueOnce(new Response('', { status: 503 }));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test' }, makeCtx());

    expect(result.isError).toBe(true);
    expect(result.error).toContain('503');
  });

  it('should error on network failure', async () => {
    fetchSpy.mockRejectedValueOnce(new Error('Network timeout'));

    const tool = WebSearchTool();
    const result = await tool.call({ query: 'test' }, makeCtx());

    expect(result.isError).toBe(true);
    expect(result.error).toContain('Network timeout');
  });

  it('should be read-only and concurrency-safe', () => {
    const tool = WebSearchTool();
    expect(tool.isReadOnly()).toBe(true);
    expect(tool.isConcurrencySafe()).toBe(true);
    expect(tool.isDestructive()).toBe(false);
  });

  it('should have correct name and aliases', () => {
    const tool = WebSearchTool();
    expect(tool.name).toBe('WebSearchTool');
    expect(tool.aliases).toContain('web_search');
    expect(tool.aliases).toContain('search');
  });
});
