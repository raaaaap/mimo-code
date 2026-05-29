import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Text, Box, useApp, useInput, useStdout } from 'ink';
import { MessageList } from '../components/Messages/MessageList.js';
import { PromptInput } from '../components/PromptInput/PromptInput.js';
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
  const { stdout } = useStdout();
  const [catState, setCatState] = useState<CatState>('idle');
  const [showCommands, setShowCommands] = useState(false);

  // Scroll state
  const [scrollOffset, setScrollOffset] = useState(0);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const prevMessageCountRef = useRef(0);

  const apiEndpoint = useAppState((s) => s.apiEndpoint);
  const debug = useAppState((s) => s.debug);

  // Enable mouse tracking for scroll wheel support
  useEffect(() => {
    if (stdout) {
      // Enable mouse tracking (SGR mode for better compatibility)
      stdout.write('\x1b[?1006h'); // Enable SGR extended mouse mode
      stdout.write('\x1b[?1003h'); // Enable all mouse events
    }
    return () => {
      if (stdout) {
        stdout.write('\x1b[?1003l'); // Disable all mouse events
        stdout.write('\x1b[?1006l'); // Disable SGR extended mouse mode
      }
    };
  }, [stdout]);

  // Auto-scroll to bottom when new messages arrive (if was at bottom)
  useEffect(() => {
    const currentCount = messages.length;
    if (currentCount > prevMessageCountRef.current && isAtBottom) {
      setScrollOffset(0);
    }
    prevMessageCountRef.current = currentCount;
  }, [messages.length, isAtBottom]);

  // Toggle command menu with Tab
  useInput((input, key) => {
    if (key.tab) {
      setShowCommands(prev => !prev);
      return;
    }

    // Keyboard scrolling
    if (key.pageUp) {
      setScrollOffset(prev => prev + 20);
      setIsAtBottom(false);
      return;
    }
    if (key.pageDown) {
      setScrollOffset(prev => {
        const next = Math.max(0, prev - 20);
        if (next === 0) setIsAtBottom(true);
        return next;
      });
      return;
    }
    if (key.ctrl && input === 'home') {
      // Scroll to top (max offset)
      setScrollOffset(99999);
      setIsAtBottom(false);
      return;
    }
    if (key.ctrl && input === 'end') {
      // Scroll to bottom
      setScrollOffset(0);
      setIsAtBottom(true);
      return;
    }

    // Mouse wheel detection via escape sequences
    // Ink passes mouse events as raw input strings
    if (typeof input === 'string') {
      // SGR mouse event: ESC [ < Cb ; Cx ; Cy M/m
      const sgrMatch = input.match(/\x1b\[<(\d+);(\d+);(\d+)([Mm])/);
      if (sgrMatch) {
        const cb = parseInt(sgrMatch[1], 10);
        // cb & 64 === 64 means scroll wheel
        if ((cb & 64) === 64) {
          if ((cb & 1) === 0) {
            // Scroll up (wheel up)
            setScrollOffset(prev => prev + 5);
            setIsAtBottom(false);
          } else {
            // Scroll down (wheel down)
            setScrollOffset(prev => {
              const next = Math.max(0, prev - 5);
              if (next === 0) setIsAtBottom(true);
              return next;
            });
          }
          return;
        }
      }

      // X10 mouse event format: ESC [ M Cb Cx Cy
      const x10Match = input.match(/\x1b\[M(.)(.)(.)/);
      if (x10Match) {
        const cb = x10Match[1].charCodeAt(0) - 32;
        if ((cb & 64) === 64) {
          if ((cb & 1) === 0) {
            setScrollOffset(prev => prev + 5);
            setIsAtBottom(false);
          } else {
            setScrollOffset(prev => {
              const next = Math.max(0, prev - 5);
              if (next === 0) setIsAtBottom(true);
              return next;
            });
          }
          return;
        }
      }
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
    engineRef.current = new QueryEngine({
      callModel: (req) => client.streamChat(req),
      microcompact: (m) => contextManager.current.microcompact(m).messages,
      autocompact: async (m) => (await contextManager.current.autocompact(m)).messages,
      uuid: () => crypto.randomUUID(),
      getTool: (name: string) => toolRegistry.current.get(name),
      toolContext,
      model,
      systemPrompt: getSystemPrompt([], getSystemContext()),
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
        if (result) {
          const commandMessage: Message = { role: 'assistant', content: result };
          store.setState({ messages: [...store.getState().messages, commandMessage] });
        }
        return;
      }

      const engine = engineRef.current!;
      store.setState({ isProcessing: true });
      setCatState('thinking');

      // Auto-scroll to bottom on new submission
      setScrollOffset(0);
      setIsAtBottom(true);

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
      {/* Xiaomi-inspired header */}
      <Box marginBottom={1}>
        <Text color="#FF6900" bold>
          [MiMo]
        </Text>
        <Text color="white"> MiMo Code v1.0.0</Text>
        <Text color="gray"> [model: {model}]</Text>
      </Box>

      {/* Xiaomi Cat mascot */}
      <Box marginBottom={1}>
        <CompanionSprite state={catState} />
      </Box>

      {/* Messages with scrolling */}
      <MessageList
        messages={messages}
        scrollOffset={scrollOffset}
        onScrollChange={setScrollOffset}
        isAtBottom={isAtBottom}
        onSetIsAtBottom={setIsAtBottom}
      />

      {/* Input area */}
      <Box marginTop={1} borderStyle="round" borderColor="#FF6900" paddingX={1}>
        <PromptInput onSubmit={handleSubmit} isDisabled={isProcessing} onAbort={handleAbort} />
      </Box>

      {/* Command hint / menu */}
      {showCommands ? (
        <Box flexDirection="column" marginTop={1} borderStyle="round" borderColor="gray" paddingX={1}>
          <Text bold color="#FF6900">Available Commands:</Text>
          {commandRegistry.current.getAll().map((cmd) => (
            <Text key={cmd.name}>
              <Text color="#FF6900">/{cmd.name}</Text>
              {cmd.aliases && cmd.aliases.length > 0 && (
                <Text color="gray"> ({cmd.aliases.join(', ')})</Text>
              )}
              <Text color="gray"> — {cmd.description}</Text>
            </Text>
          ))}
          <Text color="gray" dimColor>Press Tab to close</Text>
        </Box>
      ) : (
        <Box marginTop={0}>
          <Text color="gray" dimColor>Press Tab to see all commands</Text>
        </Box>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <Box marginTop={1}>
          <Text color="#FF6900">Processing... </Text>
          <Text color="gray" dimColor>(Press Escape to abort)</Text>
        </Box>
      )}
    </Box>
  );
}
