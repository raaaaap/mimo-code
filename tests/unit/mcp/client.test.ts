import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MCPClient, type MCPServerConfig } from '../../../src/services/mcp/client.js';
import type { McpTransport, JsonRpcMessage } from '../../../src/services/mcp/transport.js';

// ── Mock Transport ───────────────────────────────────────────────────────

type MessageHandler = (msg: JsonRpcMessage) => void;

/**
 * A mock transport that captures outgoing messages and lets tests
 * simulate incoming responses.
 */
class MockTransport implements McpTransport {
  public sent: JsonRpcMessage[] = [];
  private handler: MessageHandler | null = null;
  public closed = false;

  send(msg: JsonRpcMessage): void {
    if (this.closed) throw new Error('Transport is closed');
    this.sent.push(msg);
  }

  onMessage(cb: MessageHandler): void {
    this.handler = cb;
  }

  async close(): Promise<void> {
    this.closed = true;
  }

  /** Simulate the server sending a response for the most recent request. */
  respond(result: unknown): void {
    const last = this.sent.at(-1);
    if (!last || last.id === undefined) {
      throw new Error('No pending request to respond to');
    }
    this.handler?.({ jsonrpc: '2.0', id: last.id, result });
  }

  /** Simulate the server sending an error for the most recent request. */
  respondError(code: number, message: string): void {
    const last = this.sent.at(-1);
    if (!last || last.id === undefined) {
      throw new Error('No pending request to respond to');
    }
    this.handler?.({
      jsonrpc: '2.0',
      id: last.id,
      error: { code, message },
    });
  }

  /** Simulate a response by matching on method name. */
  respondTo(method: string, result: unknown): void {
    const msg = this.sent.find((m) => m.method === method && m.id !== undefined);
    if (!msg) throw new Error(`No request found for method: ${method}`);
    this.handler?.({ jsonrpc: '2.0', id: msg.id!, result });
  }
}

// ── Helper to auto-respond to initialize ─────────────────────────────────

async function createConnectedClient(
  transport: MockTransport,
): Promise<MCPClient> {
  const config: MCPServerConfig = {
    name: 'test-server',
    transport: 'stdio',
    command: 'echo', // won't actually be used
  };
  const client = new MCPClient(config);

  // Auto-respond to initialize and notifications/initialized
  const originalSend = transport.send.bind(transport);
  transport.send = (msg: JsonRpcMessage) => {
    originalSend(msg);
    // Auto-respond to initialize request
    if (msg.method === 'initialize' && msg.id !== undefined) {
      setTimeout(() => {
        transport.respondTo('initialize', {
          protocolVersion: '2024-11-05',
          capabilities: { tools: {}, resources: {} },
          serverInfo: { name: 'test', version: '0.1.0' },
        });
      }, 0);
    }
    // notifications/initialized has no id, so nothing to respond to
  };

  await client.connect(transport);
  return client;
}

// ── Tests ────────────────────────────────────────────────────────────────

describe('MCPClient', () => {
  let transport: MockTransport;
  let client: MCPClient;

  beforeEach(async () => {
    transport = new MockTransport();
    client = await createConnectedClient(transport);
  });

  // ── Connection lifecycle ─────────────────────────────────────────────

  describe('connect / disconnect', () => {
    it('should be connected after connect()', () => {
      expect(client.isConnected()).toBe(true);
    });

    it('should send initialize request with correct params', () => {
      const initMsg = transport.sent.find((m) => m.method === 'initialize');
      expect(initMsg).toBeDefined();
      expect(initMsg!.params).toMatchObject({
        protocolVersion: '2024-11-05',
        clientInfo: { name: 'mimo-code', version: '1.0.0' },
      });
    });

    it('should send notifications/initialized after initialize', () => {
      const notif = transport.sent.find(
        (m) => m.method === 'notifications/initialized',
      );
      expect(notif).toBeDefined();
      // Notifications should not have an id
      expect(notif!.id).toBeUndefined();
    });

    it('should be disconnected after disconnect()', async () => {
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('should be safe to call disconnect() twice', async () => {
      await client.disconnect();
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('should report server capabilities after connect', () => {
      const caps = client.getCapabilities();
      expect(caps).toHaveProperty('tools');
      expect(caps).toHaveProperty('resources');
    });

    it('should throw when connect is called with unsupported transport', async () => {
      const config: MCPServerConfig = {
        name: 'bad',
        transport: 'http',
        url: 'http://localhost',
      };
      const badClient = new MCPClient(config);
      await expect(badClient.connect()).rejects.toThrow('Unsupported transport');
    });

    it('should throw when stdio config has no command', async () => {
      const config: MCPServerConfig = {
        name: 'bad',
        transport: 'stdio',
      };
      const badClient = new MCPClient(config);
      await expect(badClient.connect()).rejects.toThrow('requires a command');
    });
  });

  // ── listTools ────────────────────────────────────────────────────────

  describe('listTools', () => {
    it('should return tools from the server', async () => {
      const toolsPromise = client.listTools();

      // Respond to the tools/list request
      transport.respond({
        tools: [
          {
            name: 'read_file',
            description: 'Read a file',
            inputSchema: { type: 'object', properties: { path: { type: 'string' } } },
          },
          {
            name: 'write_file',
            description: 'Write a file',
            inputSchema: {
              type: 'object',
              properties: { path: { type: 'string' }, content: { type: 'string' } },
            },
          },
        ],
      });

      const tools = await toolsPromise;
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('read_file');
      expect(tools[1].name).toBe('write_file');
    });

    it('should return empty array when server returns no tools', async () => {
      const toolsPromise = client.listTools();
      transport.respond({});
      const tools = await toolsPromise;
      expect(tools).toEqual([]);
    });
  });

  // ── callTool ─────────────────────────────────────────────────────────

  describe('callTool', () => {
    it('should call a tool and return its result', async () => {
      const resultPromise = client.callTool('read_file', { path: '/tmp/test.txt' });

      const lastReq = transport.sent.at(-1);
      expect(lastReq!.method).toBe('tools/call');
      expect(lastReq!.params).toEqual({
        name: 'read_file',
        arguments: { path: '/tmp/test.txt' },
      });

      transport.respond({
        content: [{ type: 'text', text: 'file contents' }],
      });

      const result = await resultPromise;
      expect(result.content[0].text).toBe('file contents');
    });

    it('should call a tool with empty args when none provided', async () => {
      const resultPromise = client.callTool('list_files');

      const lastReq = transport.sent.at(-1);
      expect(lastReq!.params).toEqual({
        name: 'list_files',
        arguments: {},
      });

      transport.respond({ content: [] });
      const result = await resultPromise;
      expect(result.content).toEqual([]);
    });

    it('should propagate server errors', async () => {
      const resultPromise = client.callTool('broken_tool', {});
      transport.respondError(-32000, 'Tool execution failed');
      await expect(resultPromise).rejects.toThrow('Tool execution failed');
    });
  });

  // ── listResources ────────────────────────────────────────────────────

  describe('listResources', () => {
    it('should return resources from the server', async () => {
      const resPromise = client.listResources();

      transport.respond({
        resources: [
          { uri: 'file:///tmp/a.txt', name: 'a.txt', mimeType: 'text/plain' },
          { uri: 'file:///tmp/b.txt', name: 'b.txt', description: 'File B' },
        ],
      });

      const resources = await resPromise;
      expect(resources).toHaveLength(2);
      expect(resources[0].uri).toBe('file:///tmp/a.txt');
      expect(resources[1].description).toBe('File B');
    });

    it('should return empty array when server returns no resources', async () => {
      const resPromise = client.listResources();
      transport.respond({});
      const resources = await resPromise;
      expect(resources).toEqual([]);
    });
  });

  // ── readResource ─────────────────────────────────────────────────────

  describe('readResource', () => {
    it('should read a resource and return its contents', async () => {
      const readPromise = client.readResource('file:///tmp/a.txt');

      const lastReq = transport.sent.at(-1);
      expect(lastReq!.method).toBe('resources/read');
      expect(lastReq!.params).toEqual({ uri: 'file:///tmp/a.txt' });

      transport.respond({
        contents: [
          { uri: 'file:///tmp/a.txt', mimeType: 'text/plain', text: 'hello' },
        ],
      });

      const contents = await readPromise;
      expect(contents).toHaveLength(1);
      expect(contents[0].text).toBe('hello');
    });
  });

  // ── Error handling ───────────────────────────────────────────────────

  describe('error handling', () => {
    it('should throw "Not connected" when calling methods before connect', async () => {
      const config: MCPServerConfig = { name: 'x', transport: 'stdio', command: 'echo' };
      const fresh = new MCPClient(config);
      await expect(fresh.listTools()).rejects.toThrow('Not connected');
      await expect(fresh.callTool('t', {})).rejects.toThrow('Not connected');
      await expect(fresh.listResources()).rejects.toThrow('Not connected');
      await expect(fresh.readResource('u')).rejects.toThrow('Not connected');
    });

    it('should reject pending requests on disconnect', async () => {
      // Start a request that won't be responded to
      const promise = client.listTools();
      await client.disconnect();
      await expect(promise).rejects.toThrow('Client disconnected');
    });
  });
});
