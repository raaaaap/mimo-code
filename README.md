# Mimo Coding Agent

A CLI coding agent powered by the Mimo large language model, built with TypeScript and Ink (React for CLI).

## Features

- Interactive REPL with rich terminal UI
- Mimo ASCII mascot with animations
- 8 built-in tools: Bash, FileRead, FileEdit, FileWrite, Grep, Glob, WebFetch, TodoWrite
- Multi-model API support (OpenAI, Anthropic, Mimo)
- SSE streaming responses
- Permission system with multiple modes
- Plugin system with event bus
- MCP (Model Context Protocol) support
- Theme system (4 built-in themes)
- Slash commands (/help, /clear, /compact, /config)

## Quick Start

### Prerequisites

- Node.js >= 18
- npm or yarn

### Install

```bash
# From the repo root:
cd mimo-code/mimo-code
npm install
```

### Configure

Set your API key:

```bash
export MIMO_API_KEY=your-api-key-here
```

Or create `~/.mimo/settings.json`:

```json
{
  "model": "mimo-large",
  "apiKey": "your-api-key-here",
  "apiEndpoint": "https://api.mimo.ai/v1"
}
```

### Run

```bash
# Development mode
npm run dev

# Or build and run
npm run build
node dist/entrypoints/cli.js
```

### CLI Options

```
mimo [options] [prompt]

Options:
  -m, --model <model>          Model to use (default: "mimo-large")
  -k, --api-key <key>          API key
  --api-endpoint <url>         API endpoint URL
  --mode <mode>                Mode: interactive, single, pipe (default: "interactive")
  -v, --verbose                Verbose output
  --debug                      Debug mode
  -o, --output <format>        Output format: text, json, markdown
  --no-color                   Disable colors
  --theme <theme>              UI theme: mimo-dark, mimo-light, matrix, ocean
  --max-tokens <n>             Max tokens (default: 4096)
  --temperature <n>            Temperature (default: 0.7)
  --permission-mode <mode>     Permission mode: default, acceptEdits, bypassPermissions, plan, auto
  -h, --help                   Display help
  -V, --version                Display version
```

### Slash Commands

| Command | Description |
|---------|-------------|
| /help | Show available commands |
| /clear | Clear the screen |
| /compact | Compact conversation history |
| /config | Show current configuration |

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Enter | Submit input |
| Shift+Enter | New line |
| Ctrl+C | Cancel / Exit |
| Ctrl+D | Exit |
| Up/Down | Navigate history |
| Escape | Clear input |

## Architecture

```
src/
├── types/           # Core type definitions
├── state/           # State management (custom store)
├── services/
│   ├── api/         # API client + adapters (OpenAI, Anthropic, Mimo)
│   ├── tools/       # Tool execution engine
│   ├── permissions/ # Permission system
│   └── mcp/         # MCP client
├── tools/           # 8 built-in tools
├── plugins/         # Plugin system (EventBus + PluginManager)
├── commands/        # Slash commands
├── components/      # Ink UI components
├── utils/           # Utilities (settings, themes, bash security)
├── QueryEngine.ts   # Conversation lifecycle
├── query.ts         # Core agent loop
└── screens/         # REPL screen
```

## Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

## Plugin Development

```typescript
import type { Plugin } from './src/plugins/manager.js';

const myPlugin: Plugin = {
  name: 'my-plugin',
  version: '1.0.0',
  description: 'My custom plugin',
  capabilities: ['command', 'tool'],
  onLoad: async (context) => {
    context.events.on('before_request', (data) => {
      console.log('Request about to be sent:', data);
    });
  },
  onUnload: async () => {
    console.log('Plugin unloaded');
  },
};
```

## License

MIT
