#!/usr/bin/env bun

/**
 * Clean build artifacts
 * Cross-platform alternative to: rm -rf dist wasm target
 */

import { rmSync } from 'fs';
import { resolve } from 'path';

const dirs = ['dist', 'wasm', 'target'];

for (const dir of dirs) {
  const path = resolve(dir);
  try {
    rmSync(path, { recursive: true, force: true });
    console.log(`✓ Cleaned ${dir}/`);
  } catch (error) {
    // Directory doesn't exist, that's fine
  }
}

console.log('✨ Clean complete!');
