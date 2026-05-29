import { type ChildProcess, spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { EventEmitter } from 'node:events';

/** A JSON-RPC message (request, response, or notification). */
export interface JsonRpcMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: Record<string, unknown>;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

/** Transport abstraction for MCP communication. */
export interface McpTransport {
  /** Send a JSON-RPC message to the server. */
  send(msg: JsonRpcMessage): void;
  /** Register a callback for incoming messages. */
  onMessage(cb: (msg: JsonRpcMessage) => void): void;
  /** Close the transport and clean up resources. */
  close(): Promise<void>;
}

/**
 * Stdio transport that spawns a child process and communicates via
 * newline-delimited JSON on stdin/stdout.
 */
export class StdioTransport implements McpTransport {
  private process: ChildProcess;
  private emitter = new EventEmitter();
  private closed = false;

  constructor(command: string, args: string[] = [], env?: Record<string, string>) {
    this.process = spawn(command, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
    });

    // Read newline-delimited JSON from stdout
    const rl = createInterface({ input: this.process.stdout! });
    rl.on('line', (line: string) => {
      const trimmed = line.trim();
      if (!trimmed) return;
      try {
        const msg = JSON.parse(trimmed) as JsonRpcMessage;
        this.emitter.emit('message', msg);
      } catch {
        // Ignore malformed lines
      }
    });

    rl.on('close', () => {
      this.emitter.emit('close');
    });

    this.process.on('error', (err) => {
      this.emitter.emit('error', err);
    });

    this.process.on('exit', () => {
      this.closed = true;
      this.emitter.emit('close');
    });
  }

  send(msg: JsonRpcMessage): void {
    if (this.closed) {
      throw new Error('Transport is closed');
    }
    const data = JSON.stringify(msg) + '\n';
    this.process.stdin!.write(data);
  }

  onMessage(cb: (msg: JsonRpcMessage) => void): void {
    this.emitter.on('message', cb);
  }

  async close(): Promise<void> {
    if (this.closed) return;
    this.closed = true;
    this.emitter.removeAllListeners();

    // Close stdin to signal the child process
    this.process.stdin!.end();

    // Give the process a moment to exit, then force kill
    await new Promise<void>((resolve) => {
      const timeout = setTimeout(() => {
        this.process.kill('SIGTERM');
        resolve();
      }, 2000);

      this.process.on('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
    });
  }
}
