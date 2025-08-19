import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['core/index.ts'],
  format: ['cjs', 'esm'],
  outDir: 'dist',
  target: 'es2020',
  splitting: false,
  sourcemap: false,
  clean: false,
  treeshake: true,
  dts: options.dts
    ? {
        resolve: false, // don't inline external type deps (prevents OOM)
        entry: {
          index: 'core/index.ts',
        },
      }
    : false,
  external: [
    '@langchain/core',
    '@langchain/google-genai',
    '@langchain/langgraph',
    '@langchain/openai',
    '@modelcontextprotocol/sdk',
    'zod',
    'node-html-markdown',
  ],
}));
