export async function runMcpServer(): Promise<void> {
  process.stdin.setEncoding('utf-8');
  let buffer = '';

  process.stdin.on('data', async (chunk: string) => {
    buffer += chunk;
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const request = JSON.parse(line);
        const response = {
          jsonrpc: '2.0',
          id: request.id,
          result: { tools: [] },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch {
        process.stdout.write(
          JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32700, message: 'Parse error' },
          }) + '\n',
        );
      }
    }
  });
}
