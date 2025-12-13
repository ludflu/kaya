#!/usr/bin/env bun

/**
 * Setup script for @kaya/deadstones
 * Cross-platform setup using bun
 */

import { $ } from 'bun';

console.log('🎋 Setting up @kaya/deadstones...\n');

// Install wasm-pack globally via bun
console.log('📦 Installing wasm-pack...');
try {
  await $`bun install -g wasm-pack`;
  console.log('✓ wasm-pack installed\n');
} catch (error) {
  console.error('✗ Failed to install wasm-pack');
  process.exit(1);
}

// Add wasm32 target (requires Rust)
console.log('📦 Adding wasm32 target...');
try {
  await $`rustup target add wasm32-unknown-unknown`;
  console.log('✓ wasm32 target added\n');
} catch (error) {
  console.warn('⚠️  Rust not installed. Install from https://rustup.rs\n');
}

console.log('✨ Setup complete!\n');
console.log('Next steps:');
console.log('  1. Run "bun run build:wasm" to build WASM (requires Rust)');
console.log('  2. Run "bun run build:ts" to build TypeScript');
console.log('  3. Run "bun run example" to test with mock WASM\n');
