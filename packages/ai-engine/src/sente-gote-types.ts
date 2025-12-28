/**
 * Sente/Gote Analysis Types
 */

/**
 * Sente/Gote classification result for a move
 */
export interface SenteGoteResult {
  /** Classification: 'sente', 'gote', or 'unclear' */
  classification: 'sente' | 'gote' | 'unclear';

  /** Confidence score (0.0 to 1.0) */
  confidence: number;

  /** Win rate at position after the move */
  baselineWinRate: number;

  /** Win rate if opponent plays tenuki (elsewhere) */
  tenukiWinRate: number;

  /** Win rate difference (baseline - tenuki) */
  winRateDelta: number;

  /** Whether opponent actually responded locally */
  responseWasLocal: boolean;

  /** Opponent's actual response location (GTP format, e.g., "Q16") */
  actualResponse?: string;

  /** Distance from original move to response (intersections) */
  responseDistance?: number;

  /** Reason for classification */
  reason: string;
}

/**
 * Compressed sente/gote data for SGF storage (minimal format)
 */
export interface KayaSenteGoteData {
  /** Classification: 's' (sente), 'g' (gote), 'u' (unclear) */
  c: 's' | 'g' | 'u';

  /** Win rate delta (rounded to 2 decimals) */
  d: number;

  /** Confidence (0-1, rounded to 2 decimals) */
  f: number;

  /** Was response local? (1 = yes, 0 = no, undefined = no response) */
  l?: 0 | 1;
}

/**
 * Property key for Kaya Sente/Gote analysis
 */
export const KAYA_SENTE_GOTE_PROPERTY = 'KS';

/**
 * Default distance threshold for "local" response (intersections)
 */
export const DEFAULT_LOCAL_THRESHOLD = 5;

/**
 * Default win rate delta threshold for sente classification
 * (0.05 = 5% win rate loss)
 */
export const DEFAULT_SENTE_THRESHOLD = 0.05;

/**
 * Strong sente threshold (10% win rate loss)
 */
export const STRONG_SENTE_THRESHOLD = 0.1;
