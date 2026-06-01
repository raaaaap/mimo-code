import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  skill_name: z.string().describe('Name of the skill to invoke'),
  args: z.string().optional().describe('Arguments for the skill'),
});

export const SkillTool = buildTool({
  name: 'SkillTool',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => 'Invoke a skill or slash command programmatically.',
  prompt: () => 'Invoke a skill by name. Use this to call slash commands or skills from code.',
  call: async (args) => {
    return {
      toolUseId: '',
      name: 'SkillTool',
      result: `Skill "${args.skill_name}" invoked. (Skill execution is delegated to the command system)`,
    };
  },
});
