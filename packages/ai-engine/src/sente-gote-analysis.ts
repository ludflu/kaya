/**
 * Sente/Gote Analysis
 * Core detection logic using AI win rate evaluation
 */

import type { SignMap } from '@kaya/goboard';
import type { Engine } from './base-engine';
import type { AnalysisResult } from './types';
import {
  SenteGoteResult,
  DEFAULT_LOCAL_THRESHOLD,
  DEFAULT_SENTE_THRESHOLD,
  STRONG_SENTE_THRESHOLD,
} from './sente-gote-types';
import { isLocalResponse, calculateDistance } from './sente-gote-utils';

/**
 * Input for sente/gote analysis of a single move
 */
export interface SenteGoteAnalysisInput {
  /** Board state AFTER the move was played */
  boardAfterMove: SignMap;

  /** Whose turn is it (at the response position) */
  nextToPlay: 'B' | 'W';

  /** Komi value */
  komi: number;

  /** Original move location (GTP format, e.g., "D4") */
  originalMove: string;

  /** Opponent's actual response (if available) */
  actualResponse?: string;

  /** Board size */
  boardSize: number;

  /** Distance threshold for "local" (default: 5) */
  localThreshold?: number;

  /** Win rate delta threshold for sente (default: 0.05 = 5%) */
  senteThreshold?: number;
}

/**
 * Analyze a single move to determine if it's sente or gote
 *
 * Algorithm:
 * 1. Get AI analysis at position after the move
 * 2. Check opponent's actual response (if available)
 * 3. Determine if response was local or tenuki
 * 4. Analyze AI's suggested moves to see if best moves are local
 * 5. Classification logic:
 *    - If opponent responded locally AND AI's best moves are also local → SENTE
 *    - If opponent played tenuki → GOTE
 *    - If no response available, use AI suggestions: local best moves → SENTE
 * 6. Confidence based on:
 *    - Strength of local move suggestions (policy probabilities)
 *    - Consistency between opponent's response and AI suggestions
 *
 * @param engine - AI engine instance (must be initialized)
 * @param input - Analysis input parameters
 * @returns Sente/gote classification result
 */
export async function analyzeMoveForSenteGote(
  engine: Engine,
  input: SenteGoteAnalysisInput
): Promise<SenteGoteResult> {
  const {
    boardAfterMove,
    nextToPlay,
    komi,
    originalMove,
    actualResponse,
    boardSize,
    localThreshold = DEFAULT_LOCAL_THRESHOLD,
    senteThreshold = DEFAULT_SENTE_THRESHOLD,
  } = input;

  // 1. Get AI analysis at position after the move
  const analysis = await engine.analyze(boardAfterMove, { maxMoves: 10 });

  const baselineWinRate = analysis.winRate;

  // 2. Check if opponent's actual response was local (if available)
  let responseWasLocal = false;
  let responseDistance: number | undefined;

  if (actualResponse && actualResponse !== 'PASS') {
    responseWasLocal = isLocalResponse(originalMove, actualResponse, boardSize, localThreshold);
    const dist = calculateDistance(originalMove, actualResponse, boardSize);
    if (dist !== null) {
      responseDistance = dist;
    }
  }

  // 3. Analyze AI's suggested moves to see how many are local
  const localSuggestions = analysis.moveSuggestions.filter(suggestion => {
    if (suggestion.move === 'PASS') return false;
    return isLocalResponse(originalMove, suggestion.move, boardSize, localThreshold);
  });

  const totalLocalProbability = localSuggestions.reduce((sum, s) => sum + s.probability, 0);

  const bestMove = analysis.moveSuggestions[0];
  const bestMoveIsLocal =
    bestMove && bestMove.move !== 'PASS'
      ? isLocalResponse(originalMove, bestMove.move, boardSize, localThreshold)
      : false;

  // 4. Determine classification
  let classification: 'sente' | 'gote' | 'unclear';
  let confidence: number;
  let reason: string;
  let tenukiWinRate = baselineWinRate; // Default: same as baseline
  let winRateDelta = 0;

  // Special case: Pass move is always gote
  if (originalMove === 'PASS') {
    return {
      classification: 'gote',
      confidence: 1.0,
      baselineWinRate,
      tenukiWinRate: baselineWinRate,
      winRateDelta: 0,
      responseWasLocal: false,
      actualResponse,
      responseDistance,
      reason: 'Pass move is always gote',
    };
  }

  // Case 1: No response available - use AI suggestions only
  if (!actualResponse || actualResponse === 'PASS') {
    // If AI's best move is local, classify as sente
    if (bestMoveIsLocal) {
      confidence = Math.min(totalLocalProbability * 1.5, 1.0);
      // Estimate win rate impact based on local move strength
      winRateDelta = totalLocalProbability * 0.15; // Rough estimate
      tenukiWinRate = baselineWinRate - winRateDelta * (nextToPlay === 'B' ? 1 : -1);

      if (totalLocalProbability > 0.7) {
        classification = 'sente';
        reason = `AI strongly suggests local response (${(totalLocalProbability * 100).toFixed(1)}% probability)`;
      } else if (totalLocalProbability > 0.4) {
        classification = 'sente';
        reason = `AI suggests local response (${(totalLocalProbability * 100).toFixed(1)}% probability)`;
      } else {
        classification = 'unclear';
        reason = `AI weakly suggests local response (${(totalLocalProbability * 100).toFixed(1)}% probability)`;
      }
    } else {
      classification = 'gote';
      confidence = Math.min((1 - totalLocalProbability) * 1.2, 1.0);
      reason = `AI suggests playing elsewhere (best move: ${bestMove?.move || 'unknown'})`;
    }

    return {
      classification,
      confidence,
      baselineWinRate,
      tenukiWinRate,
      winRateDelta,
      responseWasLocal: false,
      actualResponse,
      responseDistance,
      reason,
    };
  }

  // Case 2: Opponent responded locally
  if (responseWasLocal) {
    // Check if AI also thinks local response is best
    if (bestMoveIsLocal) {
      // Strong sente: both opponent and AI agree on local response
      confidence = Math.min(totalLocalProbability * 1.3, 1.0);
      winRateDelta = totalLocalProbability * 0.15;
      tenukiWinRate = baselineWinRate - winRateDelta * (nextToPlay === 'B' ? 1 : -1);

      if (totalLocalProbability > 0.7) {
        classification = 'sente';
        reason = `Opponent responded locally (${responseDistance} intersections), AI agrees (${(totalLocalProbability * 100).toFixed(1)}% local probability)`;
      } else {
        classification = 'sente';
        reason = `Opponent responded locally (${responseDistance} intersections), AI partially agrees (${(totalLocalProbability * 100).toFixed(1)}% local probability)`;
      }
    } else {
      // Opponent responded locally but AI suggests tenuki
      // Could be gote, but opponent chose to respond anyway
      classification = 'unclear';
      confidence = 0.5;
      reason = `Opponent responded locally (${responseDistance} intersections), but AI suggests tenuki (best: ${bestMove?.move})`;
    }

    return {
      classification,
      confidence,
      baselineWinRate,
      tenukiWinRate,
      winRateDelta,
      responseWasLocal: true,
      actualResponse,
      responseDistance,
      reason,
    };
  }

  // Case 3: Opponent played tenuki (elsewhere)
  // This suggests the move was gote
  if (bestMoveIsLocal) {
    // AI thinks local response is best, but opponent played elsewhere
    // This could indicate opponent made a mistake OR the move is gote
    confidence = 0.6;
    classification = 'unclear';
    reason = `Opponent played tenuki, but AI suggests local response (${(totalLocalProbability * 100).toFixed(1)}% local probability)`;
  } else {
    // Both AI and opponent agree: tenuki is fine
    classification = 'gote';
    confidence = Math.min((1 - totalLocalProbability) * 1.3, 1.0);
    reason = `Opponent played tenuki, AI agrees (best move: ${bestMove?.move})`;
  }

  return {
    classification,
    confidence,
    baselineWinRate,
    tenukiWinRate,
    winRateDelta,
    responseWasLocal: false,
    actualResponse,
    responseDistance,
    reason,
  };
}

/**
 * Batch analyze multiple moves for sente/gote classification
 *
 * This function analyzes multiple positions efficiently by batching
 * the AI analysis requests.
 *
 * @param engine - AI engine instance
 * @param inputs - Array of analysis inputs
 * @returns Array of sente/gote results (same order as inputs)
 */
export async function analyzeBatchForSenteGote(
  engine: Engine,
  inputs: SenteGoteAnalysisInput[]
): Promise<SenteGoteResult[]> {
  // For now, analyze sequentially
  // TODO: Implement true batch analysis if engine supports it
  const results: SenteGoteResult[] = [];

  for (const input of inputs) {
    const result = await analyzeMoveForSenteGote(engine, input);
    results.push(result);
  }

  return results;
}
