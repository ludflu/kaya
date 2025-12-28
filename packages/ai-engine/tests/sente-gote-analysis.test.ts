import { describe, test, expect, mock } from 'bun:test';
import { analyzeMoveForSenteGote } from '../src/sente-gote-analysis';
import type { Engine } from '../src/base-engine';
import type { AnalysisResult, MoveSuggestion } from '../src/types';

// Create a mock engine that returns controlled analysis results
function createMockEngine(mockResult: AnalysisResult): Engine {
  return {
    analyze: mock(() => Promise.resolve(mockResult)),
    analyzeBatch: mock(() => Promise.resolve([mockResult])),
    dispose: mock(() => Promise.resolve()),
    getCapabilities: mock(() => ({
      name: 'MockEngine',
      version: '1.0',
      supportedBoardSizes: [19],
      supportsParallel: true,
      providesPV: false,
      providesWinRate: true,
      providesScoreLead: true,
    })),
    getRuntimeInfo: mock(() => ({
      backend: 'mock',
      inputDataType: 'float32',
      didFallback: false,
    })),
  } as unknown as Engine;
}

describe('analyzeMoveForSenteGote', () => {
  test('classifies as sente when AI suggests local response and opponent responds locally', async () => {
    // AI analysis shows local moves have high probability
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'D5', probability: 0.4 }, // Local move (distance 1 from D4)
        { move: 'E5', probability: 0.3 }, // Local move (distance 2 from D4)
        { move: 'Q16', probability: 0.1 }, // Tenuki
      ],
      winRate: 0.6,
      scoreLead: 5.0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]], // Simplified board
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'D5', // Opponent responded locally
      boardSize: 19,
      localThreshold: 5,
      senteThreshold: 0.05,
    });

    expect(result.classification).toBe('sente');
    expect(result.responseWasLocal).toBe(true);
    expect(result.actualResponse).toBe('D5');
  });

  test('classifies as gote when AI suggests tenuki', async () => {
    // AI analysis shows best move is elsewhere
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'Q16', probability: 0.5 }, // Tenuki
        { move: 'D5', probability: 0.1 }, // Local move has low probability
      ],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'Q16', // Opponent played tenuki
      boardSize: 19,
    });

    expect(result.classification).toBe('gote');
    expect(result.responseWasLocal).toBe(false);
  });

  test('classifies as gote when opponent plays tenuki and AI agrees', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'Q16', probability: 0.6 },
        { move: 'D5', probability: 0.2 },
      ],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'Q16',
      boardSize: 19,
    });

    expect(result.classification).toBe('gote');
    expect(result.confidence).toBeGreaterThan(0.5);
  });

  test('classifies as unclear when opponent responds locally but AI suggests tenuki', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'Q16', probability: 0.6 }, // AI suggests tenuki
        { move: 'D5', probability: 0.2 }, // Local has low probability
      ],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'D5', // But opponent responded locally anyway
      boardSize: 19,
    });

    expect(result.classification).toBe('unclear');
    expect(result.responseWasLocal).toBe(true);
  });

  test('pass moves are always classified as gote', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [{ move: 'D4', probability: 0.5 }],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'PASS',
      actualResponse: 'D4',
      boardSize: 19,
    });

    expect(result.classification).toBe('gote');
    expect(result.confidence).toBe(1.0);
    expect(result.reason).toContain('Pass move');
  });

  test('handles no response (end of game)', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [{ move: 'D5', probability: 0.7 }],
      winRate: 0.6,
      scoreLead: 5.0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      // No actualResponse - end of game
      boardSize: 19,
    });

    expect(result.classification).toBe('sente'); // AI suggests local, so classify as sente
    expect(result.responseWasLocal).toBe(false);
    expect(result.actualResponse).toBeUndefined();
  });

  test('confidence is higher when AI strongly agrees', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'D5', probability: 0.8 }, // Very strong local suggestion
      ],
      winRate: 0.7,
      scoreLead: 10.0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'D5',
      boardSize: 19,
    });

    expect(result.classification).toBe('sente');
    expect(result.confidence).toBeGreaterThan(0.8);
  });

  test('uses custom thresholds', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [
        { move: 'G7', probability: 0.5 }, // 6 intersections away from D4 (3 right + 3 up)
      ],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    // With threshold 10, G7 (distance 6) should be local
    const result1 = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'G7',
      boardSize: 19,
      localThreshold: 10, // Large threshold
    });

    expect(result1.responseWasLocal).toBe(true);

    // With threshold 5, G7 (distance 6) should not be local
    const result2 = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'G7',
      boardSize: 19,
      localThreshold: 5, // Default threshold
    });

    expect(result2.responseWasLocal).toBe(false);
  });

  test('calculates response distance correctly', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [{ move: 'D5', probability: 0.5 }],
      winRate: 0.5,
      scoreLead: 0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'F6', // Distance = |5-3| + |6-4| = 2 + 2 = 4
      boardSize: 19,
    });

    expect(result.responseDistance).toBe(4);
  });

  test('includes reason in result', async () => {
    const mockAnalysis: AnalysisResult = {
      moveSuggestions: [{ move: 'D5', probability: 0.7 }],
      winRate: 0.6,
      scoreLead: 5.0,
      currentTurn: 'W',
    };

    const engine = createMockEngine(mockAnalysis);

    const result = await analyzeMoveForSenteGote(engine, {
      boardAfterMove: [[0]],
      nextToPlay: 'W',
      komi: 7.5,
      originalMove: 'D4',
      actualResponse: 'D5',
      boardSize: 19,
    });

    expect(result.reason).toBeDefined();
    expect(result.reason.length).toBeGreaterThan(0);
  });
});
