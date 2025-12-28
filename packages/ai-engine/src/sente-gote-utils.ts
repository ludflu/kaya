/**
 * Sente/Gote Analysis Utilities
 * Distance calculations and coordinate utilities
 */

import { DEFAULT_LOCAL_THRESHOLD } from './sente-gote-types';

export type Vertex = [number, number];

/**
 * Parse a GTP coordinate string into board coordinates
 *
 * GTP format uses letters A-T (excluding I) for columns and numbers 1-19 for rows.
 * Example: "D4" means column D (index 3), row 4 from bottom
 *
 * @param gtpMove - GTP format move string (e.g., "D4", "Q16", "PASS")
 * @param boardSize - Size of the board (typically 9, 13, or 19)
 * @returns Vertex coordinates [x, y] or null for pass/invalid moves
 */
export function parseGTPCoordinate(gtpMove: string, boardSize: number): Vertex | null {
  if (!gtpMove || typeof gtpMove !== 'string') {
    return null;
  }

  const normalized = gtpMove.trim().toUpperCase();

  // Handle pass moves
  if (normalized === 'PASS') {
    return null;
  }

  // GTP uses A-T excluding I (19 letters for 19x19 board)
  const letters = 'ABCDEFGHJKLMNOPQRST';

  if (normalized.length < 2) {
    return null;
  }

  const columnLetter = normalized[0];
  const rowString = normalized.slice(1);

  // Parse column (x coordinate)
  const x = letters.indexOf(columnLetter);
  if (x === -1) {
    return null;
  }

  // Parse row (y coordinate)
  // GTP rows are numbered from bottom (1) to top (boardSize)
  // We need to convert to 0-indexed from top
  const gtpRow = parseInt(rowString, 10);
  if (isNaN(gtpRow) || gtpRow < 1 || gtpRow > boardSize) {
    return null;
  }

  const y = boardSize - gtpRow;

  // Validate coordinates are within board bounds
  if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
    return null;
  }

  return [x, y];
}

/**
 * Convert board coordinates to GTP format
 *
 * @param vertex - Board coordinates [x, y]
 * @param boardSize - Size of the board
 * @returns GTP format string (e.g., "D4") or "PASS" for null/invalid coordinates
 */
export function vertexToGTP(vertex: Vertex | null, boardSize: number): string {
  if (!vertex) {
    return 'PASS';
  }

  const [x, y] = vertex;

  // Validate coordinates
  if (x < 0 || x >= boardSize || y < 0 || y >= boardSize) {
    return 'PASS';
  }

  const letters = 'ABCDEFGHJKLMNOPQRST';
  const column = letters[x];
  const row = boardSize - y;

  return `${column}${row}`;
}

/**
 * Calculate Manhattan distance between two board positions
 *
 * @param move1 - First move in GTP format (e.g., "D4")
 * @param move2 - Second move in GTP format (e.g., "Q16")
 * @param boardSize - Size of the board
 * @returns Manhattan distance in intersections, or null if either move is invalid/pass
 *
 * @example
 * calculateDistance("D4", "E5", 19) // returns 2 (1 right + 1 up)
 * calculateDistance("D4", "D4", 19) // returns 0
 * calculateDistance("PASS", "D4", 19) // returns null
 */
export function calculateDistance(move1: string, move2: string, boardSize: number): number | null {
  const vertex1 = parseGTPCoordinate(move1, boardSize);
  const vertex2 = parseGTPCoordinate(move2, boardSize);

  if (!vertex1 || !vertex2) {
    return null;
  }

  const [x1, y1] = vertex1;
  const [x2, y2] = vertex2;

  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Check if a response move is "local" to the original move
 *
 * A response is considered local if it's within the threshold distance
 * (measured in intersections using Manhattan distance).
 *
 * @param originalMove - Original move in GTP format
 * @param responseMove - Opponent's response in GTP format
 * @param boardSize - Size of the board
 * @param threshold - Distance threshold in intersections (default: 5)
 * @returns True if response is local, false otherwise (or if either move is pass)
 *
 * @example
 * isLocalResponse("D4", "E5", 19, 5) // true (distance 2 <= 5)
 * isLocalResponse("D4", "Q16", 19, 5) // false (distance too large)
 * isLocalResponse("D4", "PASS", 19, 5) // false (pass is never local)
 */
export function isLocalResponse(
  originalMove: string,
  responseMove: string,
  boardSize: number,
  threshold: number = DEFAULT_LOCAL_THRESHOLD
): boolean {
  const distance = calculateDistance(originalMove, responseMove, boardSize);

  if (distance === null) {
    return false; // Pass moves or invalid moves are not local
  }

  return distance <= threshold;
}
