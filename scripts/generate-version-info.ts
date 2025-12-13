#!/usr/bin/env bun

/**
 * Generate version information file for Kaya
 * Includes: version, git commit hash, build date
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const rootDir = join(import.meta.dir, '..');

interface VersionInfo {
  version: string;
  gitHash: string;
  buildDate: string;
}

interface PackageJson {
  version: string;
  [key: string]: unknown;
}

try {
  // Read version from package.json
  const packageJson: PackageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
  const version = packageJson.version;

  // Get git commit hash (short)
  let gitHash = 'dev';
  try {
    gitHash = execSync('git rev-parse --short HEAD', {
      cwd: rootDir,
      encoding: 'utf-8',
    }).trim();
  } catch (error) {
    console.warn('⚠️  Could not get git hash, using "dev"');
  }

  // Get build date
  const buildDate = new Date().toISOString();

  // Generate version info
  const versionInfo: VersionInfo = {
    version,
    gitHash,
    buildDate,
  };

  // Write to file
  const outputPath = join(rootDir, 'version.json');
  writeFileSync(outputPath, JSON.stringify(versionInfo, null, 2));

  console.log('✅ Version info generated:');
  console.log(`   Version: ${version}`);
  console.log(`   Git Hash: ${gitHash}`);
  console.log(`   Build Date: ${buildDate}`);
} catch (error) {
  console.error('❌ Error generating version info:', error);
  process.exit(1);
}
