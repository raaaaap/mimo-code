export interface PromptSuggestion {
  text: string;
  category: 'code' | 'file' | 'git' | 'general';
  confidence: number;
}

const SUGGESTIONS: Record<string, PromptSuggestion[]> = {
  'code': [
    { text: 'Explain this code', category: 'code', confidence: 0.9 },
    { text: 'Find bugs in this code', category: 'code', confidence: 0.85 },
    { text: 'Refactor this function', category: 'code', confidence: 0.8 },
    { text: 'Add error handling', category: 'code', confidence: 0.75 },
    { text: 'Write tests for this', category: 'code', confidence: 0.7 },
  ],
  'file': [
    { text: 'Read this file', category: 'file', confidence: 0.9 },
    { text: 'Create a new file', category: 'file', confidence: 0.85 },
    { text: 'Edit this file', category: 'file', confidence: 0.8 },
    { text: 'Find files matching pattern', category: 'file', confidence: 0.75 },
  ],
  'git': [
    { text: 'Show git diff', category: 'git', confidence: 0.9 },
    { text: 'Commit these changes', category: 'git', confidence: 0.85 },
    { text: 'Create a new branch', category: 'git', confidence: 0.8 },
    { text: 'Review recent changes', category: 'git', confidence: 0.75 },
  ],
  'general': [
    { text: 'Help me with this task', category: 'general', confidence: 0.9 },
    { text: 'Explain how this works', category: 'general', confidence: 0.85 },
    { text: 'What are the best practices', category: 'general', confidence: 0.8 },
  ],
};

export function getSuggestions(context: string): PromptSuggestion[] {
  const lower = context.toLowerCase();
  if (lower.includes('code') || lower.includes('function') || lower.includes('class')) {
    return SUGGESTIONS['code'];
  }
  if (lower.includes('file') || lower.includes('read') || lower.includes('write')) {
    return SUGGESTIONS['file'];
  }
  if (lower.includes('git') || lower.includes('commit') || lower.includes('branch')) {
    return SUGGESTIONS['git'];
  }
  return SUGGESTIONS['general'];
}

export function getRandomSuggestion(): PromptSuggestion {
  const all = Object.values(SUGGESTIONS).flat();
  return all[Math.floor(Math.random() * all.length)];
}
