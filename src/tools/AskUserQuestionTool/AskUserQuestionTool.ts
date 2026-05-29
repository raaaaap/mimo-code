import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.object({
  question: z.string().min(1).describe('Question to ask the user'),
  options: z.array(z.string()).optional().describe('Multiple choice options (omit for open question)'),
  multiSelect: z.boolean().optional().default(false).describe('Allow selecting multiple options'),
  defaultAnswer: z.string().optional().describe('Default answer if user does not respond'),
});

export const AskUserQuestionTool = () => buildTool({
  name: 'AskUserQuestionTool',
  aliases: ['ask'],
  inputSchema,
  isReadOnly: () => true,
  description: async () => 'Ask the user a clarifying question.',
  prompt: () => 'Ask the user a question. Supports multiple choice and open-ended questions.',
  call: async (args, context) => {
    try {
      let promptText = `\n${args.question}\n`;

      if (args.options && args.options.length > 0) {
        args.options.forEach((opt, i) => {
          promptText += `  ${i + 1}. ${opt}\n`;
        });
        if (args.multiSelect) {
          promptText += '  (Select multiple, comma-separated numbers, or type custom answer)\n';
        } else {
          promptText += '  (Enter number or type custom answer)\n';
        }
      } else {
        promptText += '  (Type your answer)\n';
      }

      if (args.defaultAnswer) {
        promptText += `  Default: ${args.defaultAnswer}\n`;
      }

      const answer = await context.requestPrompt(promptText);

      if (!answer && args.defaultAnswer) {
        return { toolUseId: '', name: 'AskUserQuestionTool', result: args.defaultAnswer };
      }

      if (!answer) {
        return { toolUseId: '', name: 'AskUserQuestionTool', result: '(no answer provided)' };
      }

      // If options provided, try to parse as selection
      if (args.options && args.options.length > 0) {
        const numbers = answer.split(',').map(s => parseInt(s.trim()) - 1).filter(n => !isNaN(n));
        if (numbers.length > 0) {
          const selected = numbers.map(n => args.options![n]).filter(Boolean);
          if (selected.length > 0) {
            return { toolUseId: '', name: 'AskUserQuestionTool', result: selected.join(', ') };
          }
        }
      }

      return { toolUseId: '', name: 'AskUserQuestionTool', result: answer };
    } catch (error) {
      return { toolUseId: '', name: 'AskUserQuestionTool', result: '', error: error instanceof Error ? error.message : String(error), isError: true };
    }
  },
});
