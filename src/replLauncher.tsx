import React from 'react';
import { render } from 'ink';
import type { CLIOptions, SettingsJson } from './types/config.js';
import { AppStateProvider } from './state/AppState.js';
import { REPLScreen } from './screens/REPL.js';

interface REPLLaunchOptions extends CLIOptions {
  apiKey: string;
  apiEndpoint: string;
  settings: SettingsJson;
}

export async function launchREPL(options: REPLLaunchOptions): Promise<void> {
  // Enter alternate screen buffer to prevent rendering artifacts from scrollback
  process.stdout.write('\x1B[?1049h\x1B[H');

  try {
    const { waitUntilExit } = render(
      <AppStateProvider
        initialState={{
          model: options.model,
          apiEndpoint: options.apiEndpoint,
          theme: options.theme,
          verbose: options.verbose,
          debug: options.debug,
          permissionMode: options.permissionMode,
          settings: options.settings,
          settingsLoaded: true,
        }}
      >
        <REPLScreen apiKey={options.apiKey} />
      </AppStateProvider>,
    );

    await waitUntilExit();
  } finally {
    // Leave alternate screen buffer, restoring original terminal content
    process.stdout.write('\x1B[?1049l');
  }
}
