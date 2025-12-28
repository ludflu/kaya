/**
 * Sente/Gote SGF Integration
 * Serialization, deserialization, and tree injection/extraction
 */

import type { GameTreeNode } from '@kaya/gametree';
import type { SGFProperty } from './sgf-utils';
import type { GoBoard, Sign } from '@kaya/goboard';
import { SenteGoteResult, KayaSenteGoteData, KAYA_SENTE_GOTE_PROPERTY } from './sente-gote-types';

/**
 * Property key for sente/gote analysis (re-export for convenience)
 */
export const SENTE_GOTE_PROPERTY = KAYA_SENTE_GOTE_PROPERTY;

/**
 * Serialize sente/gote result to compressed JSON string
 *
 * Compresses the full result into a minimal format for SGF storage
 *
 * @param result - Full sente/gote analysis result
 * @returns JSON string for SGF property
 */
export function serializeSenteGote(result: SenteGoteResult): string {
  const compressed: KayaSenteGoteData = {
    c: result.classification === 'sente' ? 's' : result.classification === 'gote' ? 'g' : 'u',
    d: Math.round(result.winRateDelta * 100) / 100, // 2 decimal places
    f: Math.round(result.confidence * 100) / 100, // 2 decimal places
  };

  // Only include 'l' if response data is available
  if (result.actualResponse && result.actualResponse !== 'PASS') {
    compressed.l = result.responseWasLocal ? 1 : 0;
  }

  return JSON.stringify(compressed);
}

/**
 * Parse compressed JSON string to sente/gote result
 *
 * Decompresses the minimal SGF format back to a partial result object
 *
 * @param json - JSON string from SGF property
 * @returns Partial sente/gote result, or null if parsing fails
 */
export function parseSenteGote(json: string): Partial<SenteGoteResult> | null {
  try {
    const data: KayaSenteGoteData = JSON.parse(json);

    const classification = data.c === 's' ? 'sente' : data.c === 'g' ? 'gote' : 'unclear';

    return {
      classification,
      winRateDelta: data.d,
      confidence: data.f,
      responseWasLocal: data.l === 1,
    };
  } catch (error) {
    console.error('Failed to parse sente/gote data:', error);
    return null;
  }
}

/**
 * Generate cache key for sente/gote analysis
 *
 * Cache key includes board state hash and original move to uniquely
 * identify the position for analysis caching.
 *
 * @param boardAfterMove - Board state after the move
 * @param originalMove - Original move in GTP format
 * @param komi - Komi value
 * @returns Cache key string
 */
export function generateSenteGoteCacheKey(
  boardAfterMove: number[][],
  originalMove: string,
  komi: number
): string {
  // Generate board hash (simple string representation)
  const boardHash = boardAfterMove.map(row => row.join(',')).join('|');

  return `sg:${boardHash}:${originalMove}:${komi}`;
}

/**
 * History item for tracking move sequence
 */
export interface HistoryItem {
  color: Sign;
  x: number;
  y: number;
}

/**
 * Inject sente/gote data into game tree nodes
 *
 * Recursively walks the game tree and adds KS property to nodes
 * that have corresponding entries in the cache.
 *
 * @param node - Game tree node to process
 * @param cache - Cache of sente/gote results
 * @param board - Current board state
 * @param komi - Komi value
 * @param history - Move history for cache key generation
 * @returns New node with KS property injected (immutable)
 */
export function injectSenteGoteToTree(
  node: GameTreeNode<SGFProperty>,
  cache: Map<string, SenteGoteResult>,
  board: GoBoard,
  komi: number,
  history: HistoryItem[] = []
): GameTreeNode<SGFProperty> {
  // Extract move from current node
  const moveCoord = node.data.B?.[0] || node.data.W?.[0];
  let newBoard = board;
  let newHistory = [...history];
  let originalMove: string | undefined;

  // Apply move to board if present
  if (moveCoord) {
    const color: Sign = node.data.B ? 1 : -1;

    // Parse SGF coordinate to vertex
    const sgfToVertex = (sgf: string): [number, number] | null => {
      if (!sgf || sgf.length !== 2) return null;
      const x = sgf.charCodeAt(0) - 97;
      const y = sgf.charCodeAt(1) - 97;
      return [x, y];
    };

    const vertex = sgfToVertex(moveCoord);

    if (vertex) {
      const [x, y] = vertex;

      // Convert to GTP format for cache key
      const vertexToGTP = (v: [number, number], size: number): string => {
        const letters = 'ABCDEFGHJKLMNOPQRST';
        const column = letters[v[0]];
        const row = size - v[1];
        return `${column}${row}`;
      };

      originalMove = vertexToGTP(vertex, board.width);

      // Update board
      try {
        newBoard = board.makeMove(color, vertex);
        newHistory.push({ color, x, y });
      } catch {
        // Invalid move, skip
      }
    }
  }

  // Generate cache key and check for sente/gote data
  let newData = node.data;

  if (originalMove) {
    const cacheKey = generateSenteGoteCacheKey(newBoard.signMap, originalMove, komi);
    const result = cache.get(cacheKey);

    if (result) {
      // Inject KS property
      const serialized = serializeSenteGote(result);
      newData = {
        ...node.data,
        [SENTE_GOTE_PROPERTY]: [serialized],
      };
    }
  }

  // Recursively process children
  const newChildren = node.children.map(child =>
    injectSenteGoteToTree(child, cache, newBoard, komi, newHistory)
  );

  return {
    ...node,
    data: newData,
    children: newChildren,
  };
}

/**
 * Extract sente/gote data from game tree and populate cache
 *
 * Recursively walks the game tree and extracts KS properties into
 * the cache for faster lookups.
 *
 * @param node - Game tree node to process
 * @param cache - Cache to populate with results
 * @param board - Current board state
 * @param komi - Komi value
 * @param history - Move history for cache key generation
 * @returns Count of extracted positions
 */
export function extractSenteGoteFromTree(
  node: GameTreeNode<SGFProperty>,
  cache: Map<string, Partial<SenteGoteResult>>,
  board: GoBoard,
  komi: number,
  history: HistoryItem[] = []
): number {
  let extractedCount = 0;

  // Extract move from current node
  const moveCoord = node.data.B?.[0] || node.data.W?.[0];
  let newBoard = board;
  let newHistory = [...history];
  let originalMove: string | undefined;

  // Apply move to board if present
  if (moveCoord) {
    const color: Sign = node.data.B ? 1 : -1;

    // Parse SGF coordinate to vertex
    const sgfToVertex = (sgf: string): [number, number] | null => {
      if (!sgf || sgf.length !== 2) return null;
      const x = sgf.charCodeAt(0) - 97;
      const y = sgf.charCodeAt(1) - 97;
      return [x, y];
    };

    const vertex = sgfToVertex(moveCoord);

    if (vertex) {
      const [x, y] = vertex;

      // Convert to GTP format for cache key
      const vertexToGTP = (v: [number, number], size: number): string => {
        const letters = 'ABCDEFGHJKLMNOPQRST';
        const column = letters[v[0]];
        const row = size - v[1];
        return `${column}${row}`;
      };

      originalMove = vertexToGTP(vertex, board.width);

      // Update board
      try {
        newBoard = board.makeMove(color, vertex);
        newHistory.push({ color, x, y });
      } catch {
        // Invalid move, skip
      }
    }
  }

  // Extract KS property if present
  if (originalMove && node.data[SENTE_GOTE_PROPERTY]?.[0]) {
    const serialized = node.data[SENTE_GOTE_PROPERTY][0];
    const result = parseSenteGote(serialized);

    if (result) {
      const cacheKey = generateSenteGoteCacheKey(newBoard.signMap, originalMove, komi);
      cache.set(cacheKey, result);
      extractedCount++;
    }
  }

  // Recursively process children
  for (const child of node.children) {
    extractedCount += extractSenteGoteFromTree(child, cache, newBoard, komi, newHistory);
  }

  return extractedCount;
}
