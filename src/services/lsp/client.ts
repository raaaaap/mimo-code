export interface LSPDiagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'hint';
}

export class LSPClient {
  private diagnostics: LSPDiagnostic[] = [];

  async connect(serverPath: string): Promise<boolean> {
    // Stub - would connect to language server
    return false;
  }

  async getDiagnostics(file: string): Promise<LSPDiagnostic[]> {
    return this.diagnostics.filter(d => d.file === file);
  }

  async getDefinition(file: string, line: number, column: number): Promise<string | null> {
    return null;
  }

  async getReferences(file: string, line: number, column: number): Promise<string[]> {
    return [];
  }

  async format(file: string): Promise<string | null> {
    return null;
  }

  isConnected(): boolean {
    return false;
  }

  disconnect(): void {
    this.diagnostics = [];
  }
}

export const lspClient = new LSPClient();
