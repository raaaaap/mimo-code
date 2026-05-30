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
} from '../commands/index.js';
import { CompanionSprite, type CatState } from '../buddy/CompanionSprite.js';
import { useTheme } from '../utils/useTheme.js';
import { THEME_CHANGE_PREFIX } from '../commands/theme.js';

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

  const apiEndpoint = useAppState((s) => s.apiEndpoint);
  const debug = useAppState((s) => s.debug);

  // Track execution state from message history
  useEffect(() => {
    if (!isProcessing || messages.length === 0) {
      setExecStatus('idle');
      setActiveToolName(undefined);
      return;
    }

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
      mcpCommand, skillsCommand, tasksCommand,
    ];
    for (const cmd of cmds) commandRegistry.current.register(cmd);
  }, []);
  const toolRegistry = useRef(createDefaultRegistry());
  const contextManager = useRef(new ContextManager({ maxTokens: 8000 }));
  const engineRef = useRef<QueryEngine | null>(null);
  if (!engineRef.current) {
    const client = new APIClient(apiEndpoint, apiKey);
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
    const allTools = toolRegistry.current.getAll();
    engineRef.current = new QueryEngine({
      callModel: (req) => client.streamChat(req),
      microcompact: (m) => contextManager.current.microcompact(m).messages,
      autocompact: async (m) => (await contextManager.current.autocompact(m)).messages,
      uuid: () => crypto.randomUUID(),
      getTool: (name: string) => toolRegistry.current.get(name),
      toolContext,
      model,
      systemPrompt: getSystemPrompt(allTools, getSystemContext()),
      tools: toolRegistry.current.toToolDefinitions(),
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
        const result = await parsed.command.call(parsed.args, { model, verbose, debug });
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
        store.setState({ messages: engine.getMessages(), isProcessing: false });
        setCatState('success');
        setTimeout(() => setCatState('idle'), 2000);
      } catch (err) {
        let errorMsg = 'Unknown error';
        if (err instanceof Error) {
          if (err.message.includes('fetch failed') || err.message.includes('ECONNREFUSED')) {
            errorMsg = `无法连接到 API 服务器 (${apiEndpoint})\n请检查：\n1. API 端点是否正确\n2. 网络连接是否正常\n3. API 服务是否运行中`;
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
        setCatState('error');
      }
    },
    [model, store, apiKey, apiEndpoint, verbose, debug],
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

      {/* Input area */}
      <Box marginTop={1} borderStyle="round" borderColor={theme.colors.primary} paddingX={1}>
        <PromptInput onSubmit={handleSubmit} isDisabled={isProcessing} onAbort={handleAbort} />
      </Box>

      {/* Command hint / menu */}
      {showCommands ? (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor={theme.colors.muted} paddingX={1}>
          <Text bold color={theme.colors.primary}>Available Commands:</Text>
          {commandRegistry.current.getAll().map((cmd) => (
            <Text key={cmd.name}>
              <Text color={theme.colors.primary}>/{cmd.name}</Text>
              {cmd.aliases && cmd.aliases.length > 0 && (
                <Text color={theme.colors.muted}> ({cmd.aliases.join(', ')})</Text>
              )}
              <Text color={theme.colors.muted}> — {cmd.description}</Text>
            </Text>
          ))}
          <Text color={theme.colors.muted} dimColor>Press Tab to close</Text>
        </Box>
      ) : (
        <Box marginTop={0}>
          <Text color={theme.colors.muted} dimColor>Press Tab to see all commands</Text>
        </Box>
      )}

      {/* Execution status */}
      {isProcessing && (
        <Box flexDirection="column" marginTop={1}>
          <StatusLine status={execStatus} toolName={activeToolName} />
          <Box marginTop={0}>
            <Text color={theme.colors.muted} dimColor>Press Escape to abort</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}
