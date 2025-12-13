#!/usr/bin/env bun
/**
 * Set exact version across all packages and Tauri files
 * Usage: bun run set-version <version>
 * Example: bun run set-version 0.1.3
 */

import { readFile, writeFile } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readdir } from 'fs/promises';
import { join } from 'path';

const execAsync = promisify(exec);

async function updateJsonVersion(filePath: string, version: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const json = JSON.parse(content);
  json.version = version;
  await writeFile(filePath, JSON.stringify(json, null, 2) + '\n');
  console.log(`✅ Updated ${filePath} to ${version}`);
}

async function updateTomlVersion(filePath: string, version: string): Promise<void> {
  const content = await readFile(filePath, 'utf-8');
  const updated = content.replace(/^version = ".*"/m, `version = "${version}"`);
  await writeFile(filePath, updated);
  console.log(`✅ Updated ${filePath} to ${version}`);
}

async function main() {
  const version = process.argv[2];

  if (!version) {
    console.error('❌ Error: Version argument is required');
    console.error('Usage: bun run set-version <version>');
    console.error('Example: bun run set-version 0.1.3');
    process.exit(1);
  }

  // Validate version format (SemVer compatible)
  // Allows: 0.1.3, 0.1.3-dev, 0.1.3-alpha.1, etc.
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+)?$/.test(version)) {
    console.error('❌ Error: Invalid version format');
    console.error('Version must be in format: major.minor.patch[-prerelease][+build]');
    console.error('Examples: 0.1.3, 0.1.3-dev, 1.0.0-alpha.1');
    process.exit(1);
  }

  console.log(`🚀 Setting version to ${version}...\n`);

  try {
    // 1. Update root package.json
    console.log('📦 Updating root package.json...');
    await updateJsonVersion('package.json', version);

    // 2. Update all workspace package.json files
    console.log('\n📦 Updating workspace packages...');
    const packagesDir = await readdir('packages');
    const packageJsonFiles: string[] = [];
    for (const pkg of packagesDir) {
      const pkgPath = join('packages', pkg, 'package.json');
      try {
        await readFile(pkgPath);
        packageJsonFiles.push(pkgPath);
        await updateJsonVersion(pkgPath, version);
      } catch {
        // Skip if package.json doesn't exist
      }
    }

    // 3. Update app package.json files
    console.log('\n📱 Updating apps...');
    const appsDir = await readdir('apps');
    const appPackageJsonFiles: string[] = [];
    for (const app of appsDir) {
      const appPath = join('apps', app, 'package.json');
      try {
        await readFile(appPath);
        appPackageJsonFiles.push(appPath);
        await updateJsonVersion(appPath, version);
      } catch {
        // Skip if package.json doesn't exist
      }
    }

    // 4. Update Cargo.toml
    console.log('\n🦀 Updating Rust/Tauri files...');
    await updateTomlVersion('apps/desktop/src-tauri/Cargo.toml', version);

    // 5. Update tauri.conf.json
    await updateJsonVersion('apps/desktop/src-tauri/tauri.conf.json', version);

    // 6. Update version.json if it exists
    try {
      await updateJsonVersion('version.json', version);
    } catch (error) {
      // version.json might not exist, that's okay
    }

    // 7. Format all modified files
    console.log('\n💅 Formatting all files...');
    await execAsync('bun run format');

    console.log('\n✨ Version update complete!');
    console.log(`\n📋 Summary:`);
    console.log(`   - All packages set to: v${version}`);
    console.log(`   - Cargo.toml and tauri.conf.json updated`);
    console.log(`\n🎯 Files updated:`);
    console.log(`   - Root package.json`);
    console.log(`   - ${packageJsonFiles.length} workspace packages`);
    console.log(`   - ${appPackageJsonFiles.length} apps`);
    console.log(`   - Cargo.toml`);
    console.log(`   - tauri.conf.json`);
  } catch (error) {
    console.error('\n❌ Error during version update:', error);
    process.exit(1);
  }
}

main();
