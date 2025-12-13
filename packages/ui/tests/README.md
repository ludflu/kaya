# UI Package Tests

## OGS Loader Test

Test the OGS (Online-Go.com) URL detection functionality.

### Running the Test

```bash
cd packages/ui
bun tests/ogsLoader.test.ts
```

### What It Tests

1. **URL Detection** - Validates OGS URL parsing for various formats
2. **Non-OGS URLs** - Ensures non-OGS URLs are rejected
3. **Game ID Extraction** - Verifies correct extraction of game IDs

**Note**: This test does NOT make network calls. It only tests URL parsing logic.

### Expected Output

```
🧪 Testing OGS Loader...

Test 1: URL Detection
  ✅ https://online-go.com/game/81344851
    → isOGSUrl: true, gameId: 81344851
  ...

Results: 7 passed, 0 failed

✅ All tests passed!
```

### Manual Testing in Application

To test the full workflow including download:

1. **Copy an OGS URL**: `https://online-go.com/game/81155989`
2. **Start the app**: `bun run dev:web` or `bun run tauri:dev`
3. **Paste** (Ctrl+V / Cmd+V) - handled by Header keyboard shortcut
4. **Verify** the game loads correctly from OGS

### Test Cases

#### Valid OGS URLs

- ✅ `https://online-go.com/game/81344851`
- ✅ `https://online-go.com/game/81344851/something`
- ✅ `http://online-go.com/game/81344851`

#### Invalid Inputs

- ❌ `https://example.com/game/123` (not OGS domain)
- ❌ `invalid url` (not a URL)
- ❌ `(;FF[4]GM[1]SZ[19])` (SGF content, not URL)

### Integration

The OGS loader is integrated in:

- **Header.tsx** - Ctrl+V / Cmd+V keyboard shortcut
- **GameTreeContext.tsx** - `loadSGFAsync()` automatically detects and downloads OGS URLs
