export interface SecurityAnalysis {
  safe: boolean;
  risk: 'low' | 'medium' | 'high' | 'critical';
  reasons: string[];
}

const DANGEROUS_PATTERNS = [
  { pattern: /\brm\s+-rf?\b/, risk: 'critical' as const, reason: 'Recursive delete' },
  { pattern: /\bmkfs\b/, risk: 'critical' as const, reason: 'Format filesystem' },
  { pattern: /\bdd\b.*of=\/dev/, risk: 'critical' as const, reason: 'Write to device' },
  { pattern: /\bchmod\s+777\b/, risk: 'high' as const, reason: 'World-writable permissions' },
  { pattern: /\bsudo\b/, risk: 'high' as const, reason: 'Elevated privileges' },
  { pattern: /\bcurl\b.*\|\s*bash/, risk: 'high' as const, reason: 'Pipe to shell' },
  { pattern: /\bwget\b.*\|\s*bash/, risk: 'high' as const, reason: 'Pipe to shell' },
  { pattern: /\bkill\b/, risk: 'medium' as const, reason: 'Process termination' },
];

const READONLY_PATTERNS = [
  /^\s*echo\b/, /^\s*cat\b/, /^\s*ls\b/, /^\s*pwd\b/, /^\s*which\b/,
  /^\s*grep\b/, /^\s*find\b/, /^\s*wc\b/, /^\s*head\b/, /^\s*tail\b/,
  /^\s*git\s+(status|log|diff|show|branch)\b/,
];

export function analyzeCommand(command: string): SecurityAnalysis {
  const reasons: string[] = [];
  let maxRisk: SecurityAnalysis['risk'] = 'low';
  const riskOrder = { low: 0, medium: 1, high: 2, critical: 3 };

  for (const { pattern, risk, reason } of DANGEROUS_PATTERNS) {
    if (pattern.test(command)) {
      reasons.push(reason);
      if (riskOrder[risk] > riskOrder[maxRisk]) maxRisk = risk;
    }
  }

  const isReadOnly = READONLY_PATTERNS.some(p => p.test(command));
  if (isReadOnly && reasons.length === 0) return { safe: true, risk: 'low', reasons: ['Read-only command'] };

  return { safe: maxRisk === 'low' || maxRisk === 'medium', risk: maxRisk, reasons };
}
