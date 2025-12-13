# Performance Guide

## Overview

Kaya is optimized for instant navigation through large game files (300+ moves). This document explains the key optimizations.

## Navigation Performance

Target: <20ms for any navigation action

| Action           | Performance |
| ---------------- | ----------- |
| Click in tree    | <5ms        |
| Arrow keys       | <5ms        |
| Wheel navigation | <5ms        |
| Board clicks     | <20ms       |

## Key Optimizations

### 1. Board Reconstruction Cache

The most critical optimization. Without caching, navigating to move 300 requires replaying all moves from scratch (50-200ms). With caching: <5ms.

```typescript
// packages/ui/src/utils/gameCache.ts
const boardCache = new Map<string, GoBoard>(); // 1000 entries max

// Search backwards for closest cached position
for (let i = sequence.length - 1; i >= 0; i--) {
  const cached = boardCache.get(`${sequence[i].id}-${boardSize}`);
  if (cached) {
    board = cached;
    break;
  }
}

// Cache intermediate positions every 10 moves
if (i % 10 === 0) {
  boardCache.set(key, board);
}
```

### 2. Pattern Matching Disabled During Navigation

`findPatternInMove()` takes 50-100ms per move. Disabled during normal navigation, available for analysis mode.

```typescript
// DON'T call on every navigation
const moveName = findPatternInMove(board, vertex, sign); // 50-100ms!

// DO use cached results when needed
const cached = patternCache.get(cacheKey);
```

### 3. AI Worker Integration

ONNX inference runs in a dedicated Web Worker, keeping the UI responsive at 60fps during analysis.

```typescript
// Heavy inference in worker thread
worker.postMessage({ type: 'analyze', signMap, options });

// Main thread stays responsive
worker.onmessage = e => setResult(e.data);
```

### 4. React Optimizations

**Direct State Updates**: No `startTransition()` which adds 50-100ms delay.

```typescript
// Direct updates for instant UI
setGameTree(newTree);
setCurrentNodeId(newNode.id);
```

**Component Memoization**: Heavy components use `React.memo`:

- `GameBoard`
- `Goban`
- `GameTreeGraph`

### 5. Game Tree Virtualization

For large trees (joseki dictionaries with 60k+ nodes):

- Viewport culling renders only visible nodes
- Smart node selection prioritizes current path and sibling variations
- Web Worker calculates layout off-thread

### 6. Cache Management

```typescript
// Clear caches when loading new game
export function clearAllCaches() {
  boardCache.clear();
  patternCache.clear();
}

// LRU eviction when cache is full
if (cache.size >= MAX_SIZE) {
  const firstKey = cache.keys().next().value;
  cache.delete(firstKey);
}
```

## Troubleshooting

### Slow Navigation

1. Check board cache is working (`boardCache.size` in console)
2. Ensure pattern matching is disabled during navigation
3. Profile with React DevTools

### AI Analysis Freezing UI

1. Verify worker is being used (check Network tab)
2. Check WebGPU/WebGL backend is selected
3. Try WASM backend for stability

### Large Tree Performance

1. Smart node selection should show all variations
2. Layout calculation happens in worker
3. Only visible nodes are rendered

---

**Summary**: Board caching + disabled pattern matching + worker threads = 20-40x faster navigation.
