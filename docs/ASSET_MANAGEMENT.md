# Asset Management Guide

## Overview

Kaya uses a strict asset management strategy to ensure compatibility across all platforms (Windows, macOS, Linux) and build environments (CI/CD).

## Core Principle: No Symlinks

**❌ NEVER use symlinks** for assets.
Symlinks cause issues on:

- Windows file systems
- GitHub Actions artifacts
- Some build tools

**✅ ALWAYS copy assets** to their destination.

## The `copy-assets` Script

We use a custom TypeScript script (`scripts/copy-assets.ts`) to handle asset distribution. This script is cross-platform and replaces shell-based copying.

### Usage

```bash
bun run copy-assets
```

This runs automatically during:

- `bun run dev`
- `bun run build`
- `bun run build:web`
- `bun run build:desktop`

### What it Copies

1. **Sounds** (`public/sounds/*.mp3`) ->
   - `public/assets/`
   - `apps/web/public/assets/`
   - `apps/desktop/public/assets/`

2. **AI Models** (`packages/ai-engine/models/*`) ->
   - `apps/web/public/models/`
   - `apps/desktop/public/models/`

3. **Web Assets** (`public/manifest.json`, icons) ->
   - `apps/web/public/`

## Adding New Assets

1. Place the original asset in the root `public/` folder (or appropriate package folder).
2. Update `scripts/copy-assets.ts` to include the new file/folder in the copy logic.
3. Run `bun run copy-assets` to verify.

## Troubleshooting

**"File not found" errors in production**:

- Check if the file is included in `scripts/copy-assets.ts`.
- Verify that `bun run copy-assets` was run before the build.
- Check the build output for "✅ Assets copied".
