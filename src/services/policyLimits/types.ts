export interface PolicyLimits {
  maxTokensPerTurn?: number;
  maxTurns?: number;
  allowedTools?: string[];
  deniedTools?: string[];
  allowedModels?: string[];
}

export function checkToolAllowed(toolName: string, policy: PolicyLimits): boolean {
  if (policy.deniedTools?.includes(toolName)) return false;
  if (policy.allowedTools) return policy.allowedTools.includes(toolName);
  return true;
}

export function checkModelAllowed(model: string, policy: PolicyLimits): boolean {
  if (policy.allowedModels) return policy.allowedModels.includes(model);
  return true;
}
