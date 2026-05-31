import { z } from 'zod';
import { buildTool } from '../../types/tool.js';

const inputSchema = z.strictObject({});

export const EnterPlanModeTool = buildTool({
  name: 'EnterPlanMode',
  inputSchema,
  isConcurrencySafe: () => false,
  isReadOnly: () => true,
  description: async () => '进入计划模式。在此模式下只能读取文件和搜索，不能写入或执行命令。',
  prompt: () => '进入计划模式，用于在执行前规划方案。只能读取和搜索，不能修改文件。',
  call: async (args, context) => {
    const state = context.getAppState() as any;
    if (state.planMode) {
      return { toolUseId: '', name: 'EnterPlanMode', result: '已经在计划模式中。' };
    }
    context.setAppState({
      planMode: true,
      prePlanMode: state.permissionMode || 'default',
      permissionMode: 'plan',
    } as any);
    return {
      toolUseId: '', name: 'EnterPlanMode',
      result: '已进入计划模式。你现在只能读取文件和搜索代码。请分析代码库，设计方案，然后使用 ExitPlanMode 退出。',
    };
  },
});
