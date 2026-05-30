import { Command } from 'commander';
import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';
import { writeFile, mkdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { homedir } from 'node:os';
import type { CLIOptions, SettingsJson } from './types/config.js';
import { loadSettings, resolveApiKey, resolveEndpoint } from './utils/settings/settings.js';

const SETTINGS_PATH = join(homedir(), '.mimo', 'settings.json');

async function ask(question: string): Promise<string> {
  const rl = createInterface({ input: stdin, output: stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function settingsExist(): Promise<boolean> {
  try {
    await access(SETTINGS_PATH);
    return true;
  } catch {
    return false;
  }
}

async function interactiveSetup(): Promise<SettingsJson> {
  console.log('\n=== MiMo Code 首次配置 ===\n');

  const apiKey = await ask('请输入 API Key: ');
  if (!apiKey) {
    console.error('API Key 不能为空');
    process.exit(1);
  }

  const endpoint = await ask('请输入 API Base URL (默认: https://api.mimo.ai/v1): ') || 'https://api.mimo.ai/v1';
  const model = await ask('请输入模型名称 (默认: mimo-v2.5): ') || 'mimo-v2.5';

  const settings: SettingsJson = { apiKey, apiEndpoint: endpoint, model };

  // Save to ~/.mimo/settings.json
  await mkdir(join(homedir(), '.mimo'), { recursive: true });
  await writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf-8');

  console.log(`\n配置已保存到 ${SETTINGS_PATH}`);
  console.log(`  API Key: ****${apiKey.slice(-4)}`);
  console.log(`  Endpoint: ${endpoint}`);
  console.log(`  Model: ${model}\n`);

  return settings;
}

export async function run(): Promise<void> {
  const program = new Command();

  program
    .name('mimo')
    .description('MiMo Code - CLI coding assistant powered by MiMo LLM')
    .version('1.0.0')
    .argument('[prompt]', 'Initial prompt (non-interactive mode)')
    .option('-m, --model <model>', 'Model to use')
    .option('-k, --api-key <key>', 'API key')
    .option('--api-endpoint <url>', 'API endpoint URL')
    .option('--setup', 'Run interactive setup')
    .option('--mode <mode>', 'Mode: interactive, single, pipe', 'interactive')
    .option('-v, --verbose', 'Verbose output', false)
    .option('--debug', 'Debug mode', false)
    .option('-o, --output <format>', 'Output format: text, json, markdown', 'text')
    .option('--no-color', 'Disable colors')
    .option('--theme <theme>', 'UI theme', 'mimo-dark')
    .option('--max-tokens <n>', 'Max tokens', parseInt, 4096)
    .option('--temperature <n>', 'Temperature', parseFloat, 0.7)
    .option('--permission-mode <mode>', 'Permission mode', 'default')
    .action(async (prompt: string | undefined, options: Partial<CLIOptions> & { setup?: boolean }) => {
      // --setup: force interactive setup
      if (options.setup) {
        await interactiveSetup();
      }

      // Check if settings exist, if not run setup
      if (!(await settingsExist()) && !options.apiKey && !process.env.MIMO_API_KEY) {
        console.log('未找到配置，开始首次设置...\n');
        await interactiveSetup();
      }

      // Load settings first to get defaults
      const projectRoot = process.cwd();
      const settings = await loadSettings(projectRoot, options);

      const cliOptions: CLIOptions = {
        model: options.model ?? settings.model ?? 'mimo-v2.5',
        apiKey: options.apiKey,
        apiEndpoint: options.apiEndpoint,
        mode: (options.mode as CLIOptions['mode']) ?? 'interactive',
        verbose: options.verbose ?? false,
        debug: options.debug ?? false,
        output: (options.output as CLIOptions['output']) ?? 'text',
        noColor: options.noColor ?? false,
        theme: options.theme ?? 'mimo-dark',
        maxTokens: options.maxTokens ?? 4096,
        temperature: options.temperature ?? 0.7,
        permissionMode: options.permissionMode ?? 'default',
      };

      const apiKey = resolveApiKey(settings);
      const endpoint = resolveEndpoint(settings);

      if (!apiKey) {
        console.error('Error: No API key found. Run "mimo --setup" to configure.');
        process.exit(1);
      }

      if (cliOptions.mode === 'interactive' && !prompt) {
        const { launchREPL } = await import('./replLauncher.js');
        await launchREPL({ ...cliOptions, apiKey, apiEndpoint: endpoint, settings });
      } else if (prompt || cliOptions.mode === 'single') {
        const { runSingleMode } = await import('./modes/single.js');
        const { APIClient } = await import('./services/api/client.js');
        const client = new APIClient(endpoint, apiKey);
        const exitCode = await runSingleMode({
          prompt: prompt ?? '',
          model: cliOptions.model,
          maxTokens: cliOptions.maxTokens,
          temperature: cliOptions.temperature,
          callModel: (req) => client.streamChat(req),
          print: (text) => process.stdout.write(text),
        });
        process.exit(exitCode);
      } else if (cliOptions.mode === 'pipe') {
        const { runPipeMode } = await import('./modes/pipe.js');
        const { APIClient } = await import('./services/api/client.js');
        const client = new APIClient(endpoint, apiKey);
        const exitCode = await runPipeMode({
          model: cliOptions.model,
          maxTokens: cliOptions.maxTokens,
          temperature: cliOptions.temperature,
          callModel: (req) => client.streamChat(req),
          print: (text) => process.stdout.write(text),
        });
        process.exit(exitCode);
      }
    });

  await program.parseAsync();
}
