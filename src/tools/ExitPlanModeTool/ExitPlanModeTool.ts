import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({
  plan: z.string().describe('完整的计划文本'),
});

export const ExitPlanModeTool = buildTool({
  name: 'ExitPlanMode',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => false,
  description: async () => '退出计划模式，提交计划供用户审批。',
  prompt: () => '退出计划模式并提交计划。计划应包含具体的实施步骤。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    if (!state.planMode) {
      return { toolUseId: '', name: 'ExitPlanMode', result: '当前不在计划模式中。' };
    }
    context.setAppState({
      planMode: false,
      permissionMode: state.prePlanMode || 'default',
    } as any);
    return {
      toolUseId: '', name: 'ExitPlanMode',
      result: `计划已提交：\n\n${args.plan}\n\n用户已确认，现在开始执行计划。`,
    };
  },
});
