import { init } from './init.js';

async function main() {
  if (process.argv.includes('--version')) {
    const { createRequire } = await import('node:module');
    const require = createRequire(import.meta.url);
    const pkg = require('../../package.json');
    console.log(`mimo-code v${pkg.version}`);
    process.exit(0);
  }

  await init();

  const { run } = await import('../main.js');
  await run();
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
