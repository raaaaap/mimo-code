import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { 'entrypoints/cli': 'src/entrypoints/cli.tsx' },
  format: ['esm'],
  target: 'node18',
  outDir: 'dist',
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  external: ['ink', 'react'],
});
