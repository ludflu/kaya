import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Resolve coi-serviceworker path (handles monorepo hoisting)
const coiServiceWorkerPath = path.dirname(require.resolve('coi-serviceworker/package.json'));

export default defineConfig({
  plugins: [pluginReact()],
  source: {
    entry: {
      index: './src/main.tsx',
    },
    define: {
      'import.meta.env.VITE_ASSET_PREFIX': JSON.stringify('/'),
    },
  },
  html: {
    template: './index.html',
  },
  output: {
    copy: [
      {
        from: '../../version.json',
        to: '.',
      },
      {
        from: path.join(coiServiceWorkerPath, 'coi-serviceworker.js'),
        to: '.',
      },
      {
        from: 'public/vendor',
        to: 'vendor',
      },
      {
        from: 'public/wasm',
        to: 'wasm',
      },
      {
        from: 'public/assets',
        to: 'assets',
      },
    ],
    distPath: {
      root: 'dist',
    },
    sourceMap: {
      js: process.env.TAURI_DEBUG ? 'source-map' : false,
    },
    target: 'web',
  },
  server: {
    port: 1420,
    strictPort: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  tools: {
    rspack: {
      resolve: {
        // Force single instance of React to prevent "Invalid hook call" errors
        alias: {
          react: require.resolve('react'),
          'react-dom': require.resolve('react-dom'),
          'react/jsx-runtime': require.resolve('react/jsx-runtime'),
          'react/jsx-dev-runtime': require.resolve('react/jsx-dev-runtime'),
          // Dagre dependencies - ensure graphlib is resolved properly
          '@dagrejs/dagre': require.resolve('@dagrejs/dagre'),
          '@dagrejs/graphlib': require.resolve('@dagrejs/graphlib'),
        },
      },
      optimization: {
        minimize: !process.env.TAURI_DEBUG,
        providedExports: true,
        usedExports: true,
      },
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
});
