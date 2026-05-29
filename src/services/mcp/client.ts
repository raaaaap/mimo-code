import type { McpTransport, JsonRpcMessage } from './transport.js';
import { StdioTransport } from './transport.js';

/** Configuration for connecting to an MCP server. */
export interface MCPServerConfig {
  name: string;
  transport: 'stdio' | 'sse' | 'http';
  command?: string;
  args?: string[];
  url?: string;
  env?: Record<string, string>;
}

/** Definition of a tool exposed by an MCP server. */
export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

/** Result of calling a tool. */
export interface MCPToolResult {
  content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  isError?: boolean;
}

/** An MCP resource. */
export interface MCPResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

/** Contents of a read resource. */
export interface MCPResourceContent {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

/**
 * Full MCP client implementing the JSON-RPC 2.0 protocol.
 *
 * Supports `initialize`, `listTools`, `callTool`, `listResources`, and
 * `readResource`.  Any transport implementing `McpTransport` can be used;
 * for convenience, `MCPServerConfig` with `transport: 'stdio'` will
 * auto-create a `StdioTransport`.
 */
export class MCPClient {
  private config: MCPServerConfig;
  private transport: McpTransport | null = null;
  private connected = false;
  private nextId = 1;
  private pending = new Map<number | string, PendingRequest>();
  private serverCapabilities: Record<string, unknown> = {};

  /** Timeout for individual RPC calls (ms). */
  private static readonly REQUEST_TIMEOUT = 30_000;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────

  /**
   * Connect to the MCP server and run the initialize handshake.
   * @param transport Optional externally-managed transport (useful for testing).
   */
  async connect(transport?: McpTransport): Promise<void> {
    if (this.connected) return;

    if (transport) {
      this.transport = transport;
    } else if (this.config.transport === 'stdio') {
      if (!this.config.command) {
        throw new Error('stdio transport requires a command');
      }
      this.transport = new StdioTransport(
        this.config.command,
        this.config.args ?? [],
        this.config.env,
      );
    } else {
      throw new Error(`Unsupported transport: ${this.config.transport}`);
    }

    this.transport.onMessage((msg) => this.handleMessage(msg));

    // Run the MCP initialize handshake
    const result = (await this.request('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'mimo-code', version: '1.0.0' },
    })) as { capabilities?: Record<string, unknown> } | undefined;

    this.serverCapabilities = result?.capabilities ?? {};

    // Notify the server that we're initialized
    this.notify('notifications/initialized', {});

    this.connected = true;
  }

  /** Gracefully shut down the connection. */
  async disconnect(): Promise<void> {
    if (!this.connected) return;
    this.connected = false;

    // Best-effort shutdown notification — don't block on it.
    try {
      this.notify('shutdown', {});
    } catch {
      // Transport may already be gone.
    }

    // Reject any lingering requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error('Client disconnected'));
      this.pending.delete(id);
    }

    await this.transport?.close();
    this.transport = null;
  }

  /** Whether the client is currently connected. */
  isConnected(): boolean {
    return this.connected;
  }

  /** The capabilities reported by the server during initialize. */
  getCapabilities(): Record<string, unknown> {
    return { ...this.serverCapabilities };
  }

  // ── MCP Methods ────────────────────────────────────────────────────────

  /** List all tools provided by the server. */
  async listTools(): Promise<MCPToolDefinition[]> {
    this.assertConnected();
    const result = (await this.request('tools/list', {})) as {
      tools?: MCPToolDefinition[];
    };
    return result?.tools ?? [];
  }

  /** Invoke a tool by name with the given arguments. */
  async callTool(
    name: string,
    args: Record<string, unknown> = {},
  ): Promise<MCPToolResult> {
    this.assertConnected();
    return (await this.request('tools/call', {
      name,
      arguments: args,
    })) as MCPToolResult;
  }

  /** List all resources provided by the server. */
  async listResources(): Promise<MCPResource[]> {
    this.assertConnected();
    const result = (await this.request('resources/list', {})) as {
      resources?: MCPResource[];
    };
    return result?.resources ?? [];
  }

  /** Read the contents of a resource by URI. */
  async readResource(uri: string): Promise<MCPResourceContent[]> {
    this.assertConnected();
    const result = (await this.request('resources/read', { uri })) as {
      contents?: MCPResourceContent[];
    };
    return result?.contents ?? [];
  }

  // ── JSON-RPC internals ─────────────────────────────────────────────────

  /**
   * Send a JSON-RPC request and wait for its response.
   * Rejects on error responses or timeout.
   */
  private request(method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`Request timed out: ${method}`));
      }, MCPClient.REQUEST_TIMEOUT);

      this.pending.set(id, { resolve, reject, timer });

      const msg: JsonRpcMessage = {
        jsonrpc: '2.0',
        id,
        method,
        params,
      };

      try {
        this.transport!.send(msg);
      } catch (err) {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(err);
      }
    });
  }

  /** Send a JSON-RPC notification (no response expected). */
  private notify(method: string, params: Record<string, unknown>): void {
    const msg: JsonRpcMessage = {
      jsonrpc: '2.0',
      method,
      params,
    };
    this.transport!.send(msg);
  }

  /** Route an incoming message to the right pending request or ignore. */
  private handleMessage(msg: JsonRpcMessage): void {
    // Only handle responses (messages with an id and either result or error)
    if (msg.id === undefined) return;

    const pending = this.pending.get(msg.id);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pending.delete(msg.id);

    if (msg.error) {
      pending.reject(new Error(msg.error.message));
    } else {
      pending.resolve(msg.result);
    }
  }

  private assertConnected(): void {
    if (!this.connected) {
      throw new Error('Not connected');
    }
  }
}
