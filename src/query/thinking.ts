export type ThinkingMode = 'off' | 'on' | 'adaptive';

export interface ThinkingConfig {
  mode: ThinkingMode;
  budgetTokens: number;
}

const DEFAULT_THINKING_BUDGET = 10000;
const COMPLEX_TASK_BUDGET = 20000;

/** Keywords that suggest a complex task requiring deeper reasoning. */
const COMPLEXITY_INDICATORS = [
  'implement',
  'design',
  'debug',
  'refactor',
  'architect',
  'optimize',
  'analyze',
  'explain why',
  'trade-off',
  'tradeoff',
  'migration',
  'security',
  'algorithm',
  'concurrent',
  'parallel',
  'distributed',
];

/**
 * Returns true when thinking mode should be enabled for the given prompt.
 *
 * - `off`  -> always false
 * - `on`   -> always true
 * - `adaptive` -> true when the prompt contains complexity indicators
 */
export function shouldEnableThinking(
  prompt: string,
  mode: ThinkingMode,
): boolean {
  if (mode === 'off') return false;
  if (mode === 'on') return true;

  // adaptive
  const lower = prompt.toLowerCase();
  return COMPLEXITY_INDICATORS.some((kw) => lower.includes(kw));
}

/**
 * Returns the token budget to allocate for thinking.
 *
 * Complex prompts get a larger budget; simple prompts get the default.
 */
export function getThinkingBudget(
  prompt: string,
  config: ThinkingConfig,
): number {
  if (config.mode === 'off') return 0;
  if (config.budgetTokens > 0) return config.budgetTokens;

  // Auto-select budget based on prompt complexity.
  const lower = prompt.toLowerCase();
  const isComplex = COMPLEXITY_INDICATORS.some((kw) => lower.includes(kw));
  return isComplex ? COMPLEX_TASK_BUDGET : DEFAULT_THINKING_BUDGET;
}
