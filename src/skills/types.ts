/**
 * A Skill is a reusable prompt template that can be invoked by name.
 */
export interface Skill {
  /** Primary name used to invoke the skill (e.g. "remember") */
  name: string;
  /** Human-readable description of what the skill does */
  description: string;
  /** Alternative names that also trigger this skill */
  aliases?: string[];
  /** Tools this skill is allowed to use (if unset, all tools are allowed) */
  allowedTools?: string[];
  /** Returns the prompt text to send to the model for the given args */
  getPromptForCommand(args: string): string;
}
