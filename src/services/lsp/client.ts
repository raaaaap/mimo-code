export interface LspLocation {
  file: string;
  line: number;
  column: number;
}

export interface LspDiagnostic {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export class LspClient {
  async findDefinition(
    _file: string,
    _line: number,
    _column: number,
  ): Promise<LspLocation | null> {
    return null;
  }

  async getDiagnostics(_file: string): Promise<LspDiagnostic[]> {
    return [];
  }

  async format(_file: string): Promise<string | null> {
    return null;
  }
}
