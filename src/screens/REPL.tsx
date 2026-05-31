import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Box, useApp, useInput } from 'ink';
import { MessageList } from '../components/Messages/MessageList.js';
import { PromptInput } from '../components/PromptInput/PromptInput.js';
import { StatusLine } from '../components/StatusLine/StatusLine.js';
import { useAppState, useAppStateStore } from '../state/AppState.js';
import { selectMessages, selectModel, selectIsProcessing, selectVerbose } from '../state/selectors.js';
import type { Message } from '../types/message.js';
import { APIClient } from '../services/api/client.js';
import { QueryEngine } from '../QueryEngine.js';
import { ContextManager } from '../services/compact/contextManager.js';
import { getSystemContext } from '../context.js';
import { getSystemPrompt } from '../constants/prompts.js';
import { createDefaultRegistry } from '../tools.js';
import type { ToolUseContext } from '../types/tool.js';
import { CommandRegistry } from '../commands.js';
import { helpCommand } from '../commands/help.js';
import { clearCommand, CLEAR_SENTINET } from '../commands/clear.js';
import { compactCommand } from '../commands/compact.js';
import { configCommand } from '../commands/config.js';
import {
  commitCommand, diffCommand, doctorCommand, modelCommand,
  themeCommand, usageCommand, statusCommand, permissionsCommand,
  planCommand, exportCommand, renameCommand, sessionCommand,
  mcpCommand, skillsCommand, tasksCommand,
  contextCommand, statsCommand, effortCommand, filesCommand,
  copyCommand, envCommand, initCommand, keybindingsCommand,
  outputStyleCommand, feedbackCommand, sandboxCommand,
  memoryCommand, reviewCommand, historyCommand, addDirCommand,
  createBuddyCommand, costCommand,
  issueCommand, upgradeCommand,
  vimCommand, loginCommand, logoutCommand, branchCommand, prCommentsCommand,
} from '../commands/index.js';
import { CompanionSprite, type CatState } from '../buddy/CompanionSprite.js';
import { useTheme } from '../utils/useTheme.js';
import { THEME_CHANGE_PREFIX } from '../commands/theme.js';
import { languageCommand, LANGUAGE_CHANGE_PREFIX } from '../commands/language.js';
import { PLAN_MODE_PREFIX } from '../commands/plan.js';
import { t } from '../utils/i18n.js';
import { trackCommandUsage, getTopCommands, getDefaultTopCommands } from '../utils/commandUsage.js';
import { costTracker } from '../commands/cost.js';
import { SessionStore } from '../session/store.js';
import { homedir } from 'node:os';

interface REPLScreenProps {
  apiKey: string;
}

export function REPLScreen({ apiKey }: REPLScreenProps) {
  const messages = useAppState(selectMessages);
  const model = useAppState(selectModel);
  const isProcessing = useAppState(selectIsProcessing);
  const verbose = useAppState(selectVerbose);
  const store = useAppStateStore();
  const { exit } = useApp();
  const theme = useTheme();
  const [catState, setCatState] = useState<CatState>('idle');
  const [showCommands, setShowCommands] = useState(false);
  const [execStatus, setExecStatus] = useState<'idle' | 'thinking' | 'executing'>('idle');
  const [activeToolName, setActiveToolName] = useState<string>();
  const [topCommands, setTopCommands] = useState<string[]>(getDefaultTopCommands());

  const baseUrl = useAppState((s) => s.baseUrl);
  const debug = useAppState((s) => s.debug);
  const language = useAppState((s) => s.language);

  // Load top commands on mount
  useEffect(() => {
    getTopCommands().then(setTopCommands);
  }, []);

  // Update system prompt when language changes
  useEffect(() => {
    if (engineRef.current && toolRegistryRef.current) {
      const allTools = toolRegistryRef.current.getAll();
      engineRef.current.updateSystemPrompt(getSystemPrompt(allTools, getSystemContext(), undefined, language));
    }
  }, [language]);

  // Track execution state from message history
  // Only update tool name and executing/thinking state — never reset to idle here
  // (idle is only set when isProcessing becomes false in handleSubmit)
  useEffect(() => {
    if (!isProcessing) return;
    if (messages.length === 0) return;

    const lastMsg = messages[messages.length - 1];

    // Tool results = tool finished, now thinking again
    if (lastMsg.role === 'tool') {
      setActiveToolName(undefined);
      setExecStatus('thinking');
      return;
    }

    // Assistant message with tool calls = tools executing
    if (lastMsg.role === 'assistant' && lastMsg.toolCalls && lastMsg.toolCalls.length > 0) {
      setActiveToolName(lastMsg.toolCalls[0].function.name);
      setExecStatus('executing');
      return;
    }

    // Otherwise LLM is thinking
    setExecStatus('thinking');
    setActiveToolName(undefined);
  }, [messages, isProcessing]);

  // Toggle command menu with Tab
  useInput((input, key) => {
    if (key.tab) {
      setShowCommands(prev => !prev);
    }
  });

  const commandRegistry = useRef(new CommandRegistry());
  useEffect(() => {
    const cmds = [
      helpCommand, clearCommand, compactCommand, configCommand,
      commitCommand, diffCommand, doctorCommand, modelCommand,
      themeCommand, usageCommand, statusCommand, permissionsCommand,
      planCommand, exportCommand, renameCommand, sessionCommand,
      mcpCommand, skillsCommand, tasksCommand, languageCommand,
      contextCommand, statsCommand, effortCommand, filesCommand,
      copyCommand, envCommand, initCommand, keybindingsCommand,
      outputStyleCommand, feedbackCommand, sandboxCommand,
      memoryCommand, reviewCommand, historyCommand, addDirCommand,
      issueCommand, upgradeCommand,
      vimCommand, loginCommand, logoutCommand, branchCommand, prCommentsCommand,
      costCommand,
    ];
    // Register buddy command with deps
    const buddyCommand = createBuddyCommand({
      getName: () => '小米猫',
      isMuted: () => false,
      onPet: () => {
        setCatState('success');
        setTimeout(() => setCatState('idle'), 2000);
      },
    });
    for (const cmd of cmds) commandRegistry.current.register(cmd);
    commandRegistry.current.register(buddyCommand);
  }, []);
  const contextManager = useRef(new ContextManager({ maxTokens: 8000 }));
  const engineRef = useRef<QueryEngine | null>(null);
  const toolRegistryRef = useRef<ReturnType<typeof createDefaultRegistry> | null>(null);
  if (!engineRef.current) {
    const client = new APIClient(baseUrl, apiKey);
    const toolRegistry = createDefaultRegistry({
      callModel: (req) => client.streamChat(req),
      getTool: (name: string) => toolRegistry.get(name),
      getToolDefinitions: () => toolRegistry.toToolDefinitions(),
    });
    toolRegistryRef.current = toolRegistry;
    const toolContext: ToolUseContext = {
      options: { model },
      abortController: new AbortController(),
      readFileState: new Map(),
      messages: [],
      toolDecisions: new Map(),
      requestPrompt: async () => '',
      getAppState: () => ({}),
      setAppState: () => {},
    };
    const allTools = toolRegistry.getAll();
    engineRef.current = new QueryEngine({
      callModel: (req) => client.streamChat(req),
      microcompact: (m) => contextManager.current.microcompact(m).messages,
      autocompact: async (m) => (await contextManager.current.autocompact(m)).messages,
      uuid: () => crypto.randomUUID(),
      getTool: (name: string) => toolRegistry.get(name),
      toolContext,
      model,
      systemPrompt: getSystemPrompt(allTools, getSystemContext(), undefined, language),
      tools: toolRegistry.toToolDefinitions(),
    });
  }

  const handleAbort = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.abort();
      store.setState({ isProcessing: false });
      setCatState('idle');
    }
  }, [store]);

  const handleSubmit = useCallback(
    async (input: string) => {
      // Check if input is a slash command
      const parsed = commandRegistry.current.parse(input);
      if (parsed) {
        // Track command usage for personalized TAB menu
        trackCommandUsage(parsed.command.name).then(() => getTopCommands().then(setTopCommands));

        const result = await parsed.command.call(parsed.args, { model, verbose, debug, language });
        if (result === CLEAR_SENTINET) {
          store.setState({ messages: [] });
          return;
        }
        if (result && result.startsWith(THEME_CHANGE_PREFIX)) {
          const themeName = result.slice(THEME_CHANGE_PREFIX.length);
          store.setState({ theme: themeName });
          const confirmMsg: Message = { role: 'assistant', content: `Theme switched to: ${themeName}` };
          store.setState({ messages: [...store.getState().messages, confirmMsg] });
          return;
        }
        if (result && result.startsWith(LANGUAGE_CHANGE_PREFIX)) {
          const lang = result.slice(LANGUAGE_CHANGE_PREFIX.length);
          store.setState({ language: lang as any });
          const confirmMsg: Message = { role: 'assistant', content: `${t(lang as any, 'language_changed')} ${lang}` };
          store.setState({ messages: [...store.getState().messages, confirmMsg] });
          return;
        }
        if (result && result.startsWith(PLAN_MODE_PREFIX)) {
          const task = result.slice(PLAN_MODE_PREFIX.length);
          // Enter plan mode by sending a planning prompt to the LLM
          const planPrompt = language === 'zh-CN' ?
            `请为以下任务制定详细计划（不要执行，只规划）：\n${task}\n\n完成后使用 /plan 退出计划模式。` :
            language === 'ja' ?
            `以下のタスクの詳細な計画を立ててください（実行しない、計画のみ）：\n${task}\n\n完了後に /plan でプランモードを終了してください。` :
            `Create a detailed plan for the following task (do not execute, just plan):\n${task}\n\nUse /plan to exit plan mode when done.`;
          // Process as a regular message
          const engine = engineRef.current!;
          store.setState({ isProcessing: true });
          setCatState('thinking');
          setExecStatus('thinking');
          try {
            for await (const msg of engine.submitMessage(planPrompt)) {
              store.setState({ messages: engine.getMessages(), isProcessing: true });
            }
            store.setState({ messages: engine.getMessages(), isProcessing: false });
            setCatState('success');
            setTimeout(() => setCatState('idle'), 2000);
          } catch (err) {
            store.setState({ messages: engine.getMessages(), isProcessing: false });
            setCatState('error');
          }
          return;
        }
        if (result) {
          const commandMessage: Message = { role: 'assistant', content: result };
          store.setState({ messages: [...store.getState().messages, commandMessage] });
        }
        return;
      }

      const engine = engineRef.current!;
      store.setState({ isProcessing: true });
      setCatState('thinking');
      setExecStatus('thinking');

      try {
        for await (const msg of engine.submitMessage(input)) {
          store.setState({ messages: engine.getMessages(), isProcessing: true });
          if (msg.role === 'assistant' && typeof msg.content === 'string' && !msg.content.startsWith('[')) {
            setCatState('coding');
          }
        }
        // Record cost after API call
        const usage = engine.getUsage();
        if (usage.inputTokens > 0 || usage.outputTokens > 0) {
          costTracker.record(model, usage, usage.inputTokens);
        }

        // Save session to history
        try {
          const sessionStore = new SessionStore(homedir() + '/.mimo');
          const messages = engine.getMessages();
          if (messages.length > 0) {
            await sessionStore.save({
              id: `session-${Date.now()}`,
              messages,
              model,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          }
        } catch {
          // Ignore session save errors
        }

        store.setState({ messages: engine.getMessages(), isProcessing: false });
        setExecStatus('idle');
        setActiveToolName(undefined);
        setCatState('success');
        setTimeout(() => setCatState('idle'), 2000);
      } catch (err) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) {
          if (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')) {
            errorMsg = `无法连接到 API 服务器 (${baseUrl})\n请检查：\n1. Base URL 是否正确\n2. 网络连接是否正常\n3. API 服务是否运行中`;
          } else {
            errorMsg = err.message;
          }
        }
        const errorMessage: Message = {
          role: 'assistant',
          content: `Error: ${errorMsg}`,
        };
        store.setState({
          messages: [...engine.getMessages(), errorMessage],
          isProcessing: false,
        });
        setExecStatus('idle');
        setActiveToolName(undefined);
        setCatState('error');
      }
    },
    [model, store, apiKey, baseUrl, verbose, debug],
  );

  return (
    <Box flexDirection="column" padding={1}>
      {/* Header */}
      <Box marginBottom={1}>
        <Text color={theme.colors.primary} bold>
          [MiMo]
        </Text>
        <Text color={theme.colors.foreground}> MiMo Code v1.0.0</Text>
        <Text color={theme.colors.muted}> [model: {model}]</Text>
      </Box>

      {/* Cat mascot */}
      <Box marginBottom={1}>
        <CompanionSprite state={catState} />
      </Box>

      {/* Messages */}
      <MessageList messages={messages} />

      {/* Execution status — above input so always visible */}
      {isProcessing && (
        <Box flexDirection="column" marginTop={1}>
          <StatusLine status={execStatus} toolName={activeToolName} language={language} />
        </Box>
      )}

      {/* Input area */}
      <Box marginTop={1} borderStyle="round" borderColor={theme.colors.primary} paddingX={1}>
        <PromptInput onSubmit={handleSubmit} isDisabled={isProcessing} onAbort={handleAbort} />
      </Box>

      {/* Command hint / menu */}
      {showCommands ? (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.muted} paddingX={1}>
          <Text bold color={theme.colors.primary}>{t(language, 'commands_title')}</Text>
          {commandRegistry.current.getAll()
            .filter((cmd) => topCommands.includes(cmd.name))
            .sort((a, b) => topCommands.indexOf(a.name) - topCommands.indexOf(b.name))
            .map((cmd) => (
              <Text key={cmd.name}>
                <Text color={theme.colors.primary}>/{cmd.name}</Text>
                {cmd.aliases && cmd.aliases.length > 0 && (
                  <Text color={theme.colors.muted}> ({cmd.aliases.join(', ')})</Text>
                )}
                <Text color={theme.colors.muted}> — {cmd.description}</Text>
              </Text>
            ))}
          <Text color={theme.colors.muted} dimColor>{t(language, 'commands_more')}</Text>
          <Text color={theme.colors.muted} dimColor>{t(language, 'commands_hint')}</Text>
        </Box>
      ) : (
        <Box marginTop={0}>
          <Text color={theme.colors.muted} dimColor>{t(language, 'commands_hint')}</Text>
        </Box>
      )}

      {/* Abort hint */}
      {isProcessing && (
        <Box marginTop={0}>
          <Text color={theme.colors.muted} dimColor>{t(language, 'abort_hint')}</Text>
        </Box>
      )}
    </Box>
  );
}
