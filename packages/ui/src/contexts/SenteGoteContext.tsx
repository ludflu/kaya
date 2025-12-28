/**
 * Sente/Gote Analysis Context
 * Manages batch analysis and caching of sente/gote classifications
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
} from 'react';
import type { Engine } from '@kaya/ai-engine';
import {
  SenteGoteResult,
  analyzeMoveForSenteGote,
  type SenteGoteAnalysisInput,
  DEFAULT_LOCAL_THRESHOLD,
  DEFAULT_SENTE_THRESHOLD,
} from '@kaya/ai-engine';
import { useGameTree } from './GameTreeContext';
import { useAIAnalysis } from './AIAnalysisContext';
import { getPathToNode } from '../utils/gameCache';
import { sgfToVertex, vertexToSGF } from '@kaya/sgf';
import { GoBoard, Sign } from '@kaya/goboard';

/**
 * Sente/Gote settings
 */
export interface SenteGoteSettings {
  /** Enable sente/gote analysis */
  enabled: boolean;
  /** Distance threshold for "local" response (intersections) */
  localThreshold: number;
  /** Win rate delta threshold for sente classification */
  senteThreshold: number;
  /** Show in game tree visualization */
  showInTree: boolean;
  /** Show in move comments */
  showInComments: boolean;
  /** Save to SGF file */
  saveToSgf: boolean;
}

/**
 * Default settings
 */
const DEFAULT_SETTINGS: SenteGoteSettings = {
  enabled: true,
  localThreshold: DEFAULT_LOCAL_THRESHOLD,
  senteThreshold: DEFAULT_SENTE_THRESHOLD,
  showInTree: true,
  showInComments: false,
  saveToSgf: true,
};

/**
 * Sente/Gote context value
 */
export interface SenteGoteContextValue {
  /** Cache of sente/gote results */
  senteGoteCache: Map<string, SenteGoteResult>;
  /** Is batch analysis running? */
  isSenteGoteAnalyzing: boolean;
  /** Analysis progress (0-100) */
  senteGoteProgress: number;
  /** Current move being analyzed */
  senteGoteCurrent: number;
  /** Total moves to analyze */
  senteGoteTotal: number;
  /** Estimated time remaining */
  senteGoteETA: string | null;
  /** Analysis error message */
  error: string | null;

  /** Trigger batch analysis for full game */
  analyzeFullGameSenteGote: () => Promise<void>;
  /** Stop ongoing analysis */
  stopSenteGoteAnalysis: () => void;
  /** Clear cache */
  clearSenteGoteCache: () => void;

  /** Settings */
  senteGoteSettings: SenteGoteSettings;
  /** Update settings */
  updateSenteGoteSettings: (settings: Partial<SenteGoteSettings>) => void;

  /** Get result for a specific node */
  getSenteGoteForNode: (nodeId: number | string | null) => SenteGoteResult | null;
}

const SenteGoteContext = createContext<SenteGoteContextValue | undefined>(undefined);

/**
 * Convert SGF coordinate to GTP format
 */
function sgfToGTP(sgfCoord: string, boardSize: number): string {
  if (!sgfCoord || sgfCoord.length !== 2) return 'PASS';
  const vertex = sgfToVertex(sgfCoord);
  if (!vertex) return 'PASS';
  const [x, y] = vertex;
  const letters = 'ABCDEFGHJKLMNOPQRST';
  const column = letters[x];
  const row = boardSize - y;
  return `${column}${row}`;
}

/**
 * Sente/Gote Provider
 */
export function SenteGoteProvider({ children }: { children: React.ReactNode }) {
  const { gameTree, currentNodeId, gameInfo } = useGameTree();
  const { aiEngine } = useAIAnalysis();

  // Cache
  const senteGoteCacheRef = useRef<Map<string, SenteGoteResult>>(new Map());
  const [senteGoteCache, setSenteGoteCache] = useState<Map<string, SenteGoteResult>>(new Map());

  // Analysis state
  const [isSenteGoteAnalyzing, setIsSenteGoteAnalyzing] = useState(false);
  const [senteGoteProgress, setSenteGoteProgress] = useState(0);
  const [senteGoteCurrent, setSenteGoteCurrent] = useState(0);
  const [senteGoteTotal, setSenteGoteTotal] = useState(0);
  const [senteGoteETA, setSenteGoteETA] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Settings
  const [senteGoteSettings, setSenteGoteSettings] = useState<SenteGoteSettings>(DEFAULT_SETTINGS);

  // Stop flag
  const stopAnalysisRef = useRef(false);

  /**
   * Update settings
   */
  const updateSenteGoteSettings = useCallback((updates: Partial<SenteGoteSettings>) => {
    setSenteGoteSettings(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Clear cache
   */
  const clearSenteGoteCache = useCallback(() => {
    senteGoteCacheRef.current.clear();
    setSenteGoteCache(new Map());
  }, []);

  /**
   * Get result for a specific node
   */
  const getSenteGoteForNode = useCallback(
    (nodeId: number | string | null): SenteGoteResult | null => {
      if (!gameTree || nodeId === null || nodeId === undefined) return null;

      // Get path to node and reconstruct board
      const sequence = getPathToNode(gameTree, nodeId);
      if (sequence.length === 0) return null;

      const currentNode = sequence[sequence.length - 1];
      const moveCoord = currentNode.data.B?.[0] || currentNode.data.W?.[0];
      if (!moveCoord) return null;

      // Generate cache key
      const boardSize = gameInfo?.boardSize ?? 19;
      const komi = gameInfo?.komi ?? 7.5;

      // Reconstruct board after the move
      let board = GoBoard.fromDimensions(boardSize);
      for (const node of sequence) {
        const coord = node.data.B?.[0] || node.data.W?.[0];
        if (coord) {
          const vertex = sgfToVertex(coord);
          const color: Sign = node.data.B ? 1 : -1;
          if (vertex) {
            try {
              board = board.makeMove(color, vertex);
            } catch {
              // Invalid move
            }
          }
        }
      }

      const originalMove = sgfToGTP(moveCoord, boardSize);
      const boardHash = board.signMap.map((row: Sign[]) => row.join(',')).join('|');
      const cacheKey = `sg:${boardHash}:${originalMove}:${komi}`;

      return senteGoteCacheRef.current.get(cacheKey) || null;
    },
    [gameTree, gameInfo, senteGoteCacheRef]
  );

  /**
   * Batch analyze full game
   */
  const analyzeFullGameSenteGote = useCallback(async () => {
    if (!gameTree || currentNodeId === null || currentNodeId === undefined) {
      setError('No game tree available');
      return;
    }

    if (!aiEngine) {
      setError('AI engine not available. Please enable AI analysis first.');
      return;
    }

    setError(null);
    setIsSenteGoteAnalyzing(true);
    setSenteGoteProgress(0);
    setSenteGoteETA(null);
    stopAnalysisRef.current = false;

    try {
      // Get full sequence of nodes
      const historyNodes = getPathToNode(gameTree, currentNodeId);
      const futureNodes = Array.from(gameTree.listNodesVertically(currentNodeId, 1)).slice(1);
      const fullSequence = [...historyNodes, ...futureNodes];

      setSenteGoteTotal(fullSequence.length);

      const boardSize = gameInfo?.boardSize ?? 19;
      const komi = gameInfo?.komi ?? 7.5;

      // Build list of positions to analyze
      const positionsToAnalyze: Array<{
        index: number;
        input: SenteGoteAnalysisInput;
        cacheKey: string;
      }> = [];

      let board = GoBoard.fromDimensions(boardSize);

      for (let i = 0; i < fullSequence.length; i++) {
        const node = fullSequence[i];
        const moveCoord = node.data.B?.[0] || node.data.W?.[0];

        if (!moveCoord) continue; // Skip nodes without moves

        const color: Sign = node.data.B ? 1 : -1;
        const vertex = sgfToVertex(moveCoord);
        if (!vertex) continue;

        // Apply move to board
        let boardAfterMove: GoBoard;
        try {
          boardAfterMove = board.makeMove(color, vertex);
        } catch {
          // Invalid move, skip
          continue;
        }

        const originalMove = sgfToGTP(moveCoord, boardSize);

        // Check if next node exists (opponent's response)
        const nextNode = fullSequence[i + 1];
        const actualResponse = nextNode
          ? sgfToGTP(nextNode.data.B?.[0] || nextNode.data.W?.[0] || '', boardSize)
          : undefined;

        // Determine next to play
        const nextToPlay = color === 1 ? 'W' : 'B';

        // Generate cache key
        const boardHash = boardAfterMove.signMap.map((row: Sign[]) => row.join(',')).join('|');
        const cacheKey = `sg:${boardHash}:${originalMove}:${komi}`;

        // Skip if already cached
        if (senteGoteCacheRef.current.has(cacheKey)) {
          continue;
        }

        const input: SenteGoteAnalysisInput = {
          boardAfterMove: boardAfterMove.signMap,
          nextToPlay: nextToPlay as 'B' | 'W',
          komi,
          originalMove,
          actualResponse,
          boardSize,
          localThreshold: senteGoteSettings.localThreshold,
          senteThreshold: senteGoteSettings.senteThreshold,
        };

        positionsToAnalyze.push({ index: i, input, cacheKey });

        // Update board for next iteration
        board = boardAfterMove;
      }

      const cachedCount = fullSequence.length - positionsToAnalyze.length;

      if (positionsToAnalyze.length === 0) {
        setError(`All positions already analyzed (${cachedCount} cached)`);
        setTimeout(() => setError(null), 3000);
        return;
      }

      console.log(
        `[SenteGote] Analyzing ${positionsToAnalyze.length} positions (${cachedCount} cached)`
      );

      let processedCount = cachedCount;
      setSenteGoteProgress(Math.round((processedCount / fullSequence.length) * 100));
      setSenteGoteCurrent(processedCount);

      let totalTime = 0;
      let totalPositions = 0;

      // Analyze sequentially (could be optimized with batching if engine supports it)
      for (let i = 0; i < positionsToAnalyze.length; i++) {
        if (stopAnalysisRef.current) {
          console.log('[SenteGote] Analysis stopped by user');
          break;
        }

        const { input, cacheKey, index } = positionsToAnalyze[i];

        try {
          const startTime = performance.now();
          const result = await analyzeMoveForSenteGote(aiEngine, input);
          const elapsed = performance.now() - startTime;

          totalTime += elapsed;
          totalPositions++;

          // Cache result
          senteGoteCacheRef.current.set(cacheKey, result);

          // Update progress
          processedCount++;
          setSenteGoteProgress(Math.round((processedCount / fullSequence.length) * 100));
          setSenteGoteCurrent(processedCount);

          // Calculate ETA
          const posPerSec = (totalPositions / totalTime) * 1000;
          const remainingPositions = positionsToAnalyze.length - (i + 1);
          if (remainingPositions > 0) {
            const etaSeconds = remainingPositions / posPerSec;
            const etaStr =
              etaSeconds < 60
                ? `${Math.round(etaSeconds)}s`
                : `${Math.floor(etaSeconds / 60)}m ${Math.round(etaSeconds % 60)}s`;
            setSenteGoteETA(etaStr);
          } else {
            setSenteGoteETA(null);
          }

          // Log progress every 10 moves
          if ((i + 1) % 10 === 0 || i === positionsToAnalyze.length - 1) {
            console.log(`[SenteGote] Progress: ${i + 1}/${positionsToAnalyze.length}`, {
              move: index,
              classification: result.classification,
              confidence: result.confidence.toFixed(2),
              reason: result.reason,
            });
          }
        } catch (err) {
          console.error(`[SenteGote] Failed to analyze position ${index}:`, err);
          // Continue with next position
        }
      }

      // Update state with new cache
      setSenteGoteCache(new Map(senteGoteCacheRef.current));

      console.log(
        `[SenteGote] Analysis complete. ${senteGoteCacheRef.current.size} positions in cache`
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(`Analysis failed: ${message}`);
      console.error('[SenteGote] Analysis failed:', err);
    } finally {
      setIsSenteGoteAnalyzing(false);
      stopAnalysisRef.current = false;
      setSenteGoteETA(null);
    }
  }, [gameTree, currentNodeId, gameInfo, aiEngine, senteGoteSettings]);

  /**
   * Stop analysis
   */
  const stopSenteGoteAnalysis = useCallback(() => {
    stopAnalysisRef.current = true;
  }, []);

  const value: SenteGoteContextValue = {
    senteGoteCache,
    isSenteGoteAnalyzing,
    senteGoteProgress,
    senteGoteCurrent,
    senteGoteTotal,
    senteGoteETA,
    error,
    analyzeFullGameSenteGote,
    stopSenteGoteAnalysis,
    clearSenteGoteCache,
    senteGoteSettings,
    updateSenteGoteSettings,
    getSenteGoteForNode,
  };

  return <SenteGoteContext.Provider value={value}>{children}</SenteGoteContext.Provider>;
}

/**
 * Hook to access sente/gote context
 */
export function useSenteGote(): SenteGoteContextValue {
  const context = useContext(SenteGoteContext);
  if (!context) {
    throw new Error('useSenteGote must be used within SenteGoteProvider');
  }
  return context;
}
