import { describe, it, expect } from 'vitest';
import { createFastCommand } from '../../../src/commands/fast.js';

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const FAST_MODEL = 'claude-haiku-4-20250514';

function setup(initialModel = DEFAULT_MODEL) {
  let model = initialModel;
  const cmd = createFastCommand(
    () => model,
    (m: string) => { model = m; },
    DEFAULT_MODEL,
    FAST_MODEL,
  );
  return {
    cmd,
    getModel: () => model,
  };
}

describe('createFastCommand', () => {
  it('returns a command named "fast"', () => {
    const { cmd } = setup();
    expect(cmd.name).toBe('fast');
  });

  it('has the speed alias', () => {
    const { cmd } = setup();
    expect(cmd.aliases).toContain('speed');
  });

  it('is always enabled', () => {
    const { cmd } = setup();
    expect(cmd.isEnabled()).toBe(true);
  });

  it('switches to fast model when currently on default', async () => {
    const { cmd, getModel } = setup();
    const result = await cmd.call('', { model: DEFAULT_MODEL, verbose: false, debug: false, language: 'en' as const });
    expect(getModel()).toBe(FAST_MODEL);
    expect(result).toContain(FAST_MODEL);
  });

  it('switches back to default model when currently on fast', async () => {
    const { cmd, getModel } = setup(FAST_MODEL);
    const result = await cmd.call('', { model: FAST_MODEL, verbose: false, debug: false, language: 'en' as const });
    expect(getModel()).toBe(DEFAULT_MODEL);
    expect(result).toContain(DEFAULT_MODEL);
  });

  it('toggles back and forth correctly', async () => {
    const { cmd, getModel } = setup();

    await cmd.call('', { model: DEFAULT_MODEL, verbose: false, debug: false, language: 'en' as const });
    expect(getModel()).toBe(FAST_MODEL);

    await cmd.call('', { model: FAST_MODEL, verbose: false, debug: false, language: 'en' as const });
    expect(getModel()).toBe(DEFAULT_MODEL);

    await cmd.call('', { model: DEFAULT_MODEL, verbose: false, debug: false, language: 'en' as const });
    expect(getModel()).toBe(FAST_MODEL);
  });
});
