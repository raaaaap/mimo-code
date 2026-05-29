import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  query: z.string().describe('The search query to look up on the web'),
  maxResults: z.number().int().min(1).max(20).optional().default(5)
    .describe('Maximum number of results to return (1-20, default 5)'),
});

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function parseSearchResults(html: string): SearchResult[] {
  const results: SearchResult[] = [];

  // DuckDuckGo HTML results use class="result__a" for links
  // and class="result__snippet" for snippets
  // Split by result blocks
  const resultBlocks = html.split(/class="result\s/);

  for (let i = 1; i < resultBlocks.length; i++) {
    const block = resultBlocks[i];

    // Extract title and URL from result__a link
    const titleMatch = block.match(/class="result__a"[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/s);
    if (!titleMatch) continue;

    const rawUrl = titleMatch[1];
    const title = titleMatch[2].replace(/<[^>]+>/g, '').trim();

    // Extract snippet
    const snippetMatch = block.match(/class="result__snippet"[^>]*>(.*?)<\/(?:a|span|td|div)/s);
    const snippet = snippetMatch
      ? snippetMatch[1].replace(/<[^>]+>/g, '').trim()
      : '';

    // Decode DuckDuckGo redirect URLs to get the actual URL
    let url = rawUrl;
    try {
      const u = new URL(rawUrl, 'https://duckduckgo.com');
      const ddg = u.searchParams.get('uddg');
      if (ddg) url = decodeURIComponent(ddg);
    } catch {
      // Keep rawUrl if parsing fails
    }

    if (title && url) {
      results.push({ title, url, snippet });
    }
  }

  return results;
}

export const WebSearchTool = () => buildTool({
  name: 'WebSearchTool',
  aliases: ['web_search', 'search'],
  inputSchema,
  isReadOnly: () => true,
  isConcurrencySafe: () => true,
  description: async () => 'Search the web using DuckDuckGo and return a list of results with titles, URLs, and snippets.',
  prompt: () => 'Search the web for a query using DuckDuckGo and return matching results.',
  call: async (args) => {
    const { query, maxResults: maxResultsRaw } = args;
    const maxResults = maxResultsRaw ?? 5;

    if (!query.trim()) {
      return {
        toolUseId: '',
        name: 'WebSearchTool',
        result: '',
        error: 'Query must not be empty',
        isError: true,
      };
    }

    try {
      const params = new URLSearchParams({ q: query, kl: 'us-en' });
      const url = `https://html.duckduckgo.com/html/?${params.toString()}`;

      const response = await fetch(url, {
        signal: AbortSignal.timeout(15000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
      });

      if (!response.ok) {
        return {
          toolUseId: '',
          name: 'WebSearchTool',
          result: '',
          error: `DuckDuckGo returned HTTP ${response.status}`,
          isError: true,
        };
      }

      const html = await response.text();
      const results = parseSearchResults(html).slice(0, maxResults);

      if (results.length === 0) {
        return {
          toolUseId: '',
          name: 'WebSearchTool',
          result: `No results found for: "${query}"`,
        };
      }

      const formatted = results
        .map((r, i) => `${i + 1}. **${r.title}**\n   URL: ${r.url}\n   ${r.snippet}`)
        .join('\n\n');

      return {
        toolUseId: '',
        name: 'WebSearchTool',
        result: `Search results for "${query}" (${results.length} of ${maxResults} requested):\n\n${formatted}`,
      };
    } catch (error) {
      return {
        toolUseId: '',
        name: 'WebSearchTool',
        result: '',
        error: error instanceof Error ? error.message : String(error),
        isError: true,
      };
    }
  },
});
