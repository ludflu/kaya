import { describe, test, expect } from 'bun:test';
import {
  serializeSenteGote,
  parseSenteGote,
  generateSenteGoteCacheKey,
  SENTE_GOTE_PROPERTY,
} from '../src/sente-gote-sgf';
import type { SenteGoteResult } from '../src/sente-gote-types';

describe('SENTE_GOTE_PROPERTY', () => {
  test('uses KS as property key', () => {
    expect(SENTE_GOTE_PROPERTY).toBe('KS');
  });
});

describe('serializeSenteGote', () => {
  test('serializes sente result correctly', () => {
    const result: SenteGoteResult = {
      classification: 'sente',
      confidence: 0.85,
      baselineWinRate: 0.6,
      tenukiWinRate: 0.52,
      winRateDelta: 0.08,
      responseWasLocal: true,
      actualResponse: 'D5',
      responseDistance: 2,
      reason: 'AI suggests local response',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.c).toBe('s'); // sente
    expect(parsed.d).toBe(0.08); // delta rounded to 2 decimals
    expect(parsed.f).toBe(0.85); // confidence rounded to 2 decimals
    expect(parsed.l).toBe(1); // local response
  });

  test('serializes gote result correctly', () => {
    const result: SenteGoteResult = {
      classification: 'gote',
      confidence: 0.7,
      baselineWinRate: 0.5,
      tenukiWinRate: 0.5,
      winRateDelta: 0,
      responseWasLocal: false,
      actualResponse: 'Q16',
      responseDistance: 15,
      reason: 'Opponent played tenuki',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.c).toBe('g'); // gote
    expect(parsed.d).toBe(0);
    expect(parsed.f).toBe(0.7);
    expect(parsed.l).toBe(0); // not local
  });

  test('serializes unclear result correctly', () => {
    const result: SenteGoteResult = {
      classification: 'unclear',
      confidence: 0.5,
      baselineWinRate: 0.55,
      tenukiWinRate: 0.53,
      winRateDelta: 0.02,
      responseWasLocal: true,
      actualResponse: 'E5',
      responseDistance: 3,
      reason: 'Mixed signals',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.c).toBe('u'); // unclear
  });

  test('handles no response (PASS) correctly', () => {
    const result: SenteGoteResult = {
      classification: 'gote',
      confidence: 0.6,
      baselineWinRate: 0.5,
      tenukiWinRate: 0.5,
      winRateDelta: 0,
      responseWasLocal: false,
      reason: 'No response',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.l).toBeUndefined(); // l property not included when no response
  });

  test('rounds delta to 2 decimal places', () => {
    const result: SenteGoteResult = {
      classification: 'sente',
      confidence: 0.85,
      baselineWinRate: 0.6,
      tenukiWinRate: 0.523456,
      winRateDelta: 0.076544, // Should round to 0.08
      responseWasLocal: true,
      reason: 'Test',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.d).toBe(0.08);
  });

  test('rounds confidence to 2 decimal places', () => {
    const result: SenteGoteResult = {
      classification: 'sente',
      confidence: 0.856789, // Should round to 0.86
      baselineWinRate: 0.6,
      tenukiWinRate: 0.52,
      winRateDelta: 0.08,
      responseWasLocal: true,
      reason: 'Test',
    };

    const serialized = serializeSenteGote(result);
    const parsed = JSON.parse(serialized);

    expect(parsed.f).toBe(0.86);
  });
});

describe('parseSenteGote', () => {
  test('parses sente data correctly', () => {
    const json = JSON.stringify({
      c: 's',
      d: 0.08,
      f: 0.85,
      l: 1,
    });

    const result = parseSenteGote(json);

    expect(result).toBeDefined();
    expect(result?.classification).toBe('sente');
    expect(result?.winRateDelta).toBe(0.08);
    expect(result?.confidence).toBe(0.85);
    expect(result?.responseWasLocal).toBe(true);
  });

  test('parses gote data correctly', () => {
    const json = JSON.stringify({
      c: 'g',
      d: 0,
      f: 0.7,
      l: 0,
    });

    const result = parseSenteGote(json);

    expect(result).toBeDefined();
    expect(result?.classification).toBe('gote');
    expect(result?.winRateDelta).toBe(0);
    expect(result?.confidence).toBe(0.7);
    expect(result?.responseWasLocal).toBe(false);
  });

  test('parses unclear data correctly', () => {
    const json = JSON.stringify({
      c: 'u',
      d: 0.02,
      f: 0.5,
      l: 1,
    });

    const result = parseSenteGote(json);

    expect(result).toBeDefined();
    expect(result?.classification).toBe('unclear');
  });

  test('handles missing l property', () => {
    const json = JSON.stringify({
      c: 'g',
      d: 0,
      f: 0.6,
    });

    const result = parseSenteGote(json);

    expect(result).toBeDefined();
    expect(result?.responseWasLocal).toBe(false);
  });

  test('handles invalid JSON', () => {
    const result = parseSenteGote('invalid json');
    expect(result).toBeNull();
  });

  test('handles empty string', () => {
    const result = parseSenteGote('');
    expect(result).toBeNull();
  });

  test('round-trip serialization preserves data', () => {
    const original: SenteGoteResult = {
      classification: 'sente',
      confidence: 0.85,
      baselineWinRate: 0.6,
      tenukiWinRate: 0.52,
      winRateDelta: 0.08,
      responseWasLocal: true,
      actualResponse: 'D5',
      responseDistance: 2,
      reason: 'AI suggests local response',
    };

    const serialized = serializeSenteGote(original);
    const parsed = parseSenteGote(serialized);

    expect(parsed).toBeDefined();
    expect(parsed?.classification).toBe(original.classification);
    expect(parsed?.confidence).toBe(original.confidence);
    expect(parsed?.winRateDelta).toBe(original.winRateDelta);
    expect(parsed?.responseWasLocal).toBe(original.responseWasLocal);
  });
});

describe('generateSenteGoteCacheKey', () => {
  test('generates consistent cache keys', () => {
    const board = [
      [0, 0, 1],
      [0, -1, 0],
      [0, 0, 0],
    ];

    const key1 = generateSenteGoteCacheKey(board, 'D4', 7.5);
    const key2 = generateSenteGoteCacheKey(board, 'D4', 7.5);

    expect(key1).toBe(key2);
  });

  test('different boards generate different keys', () => {
    const board1 = [
      [0, 0, 1],
      [0, -1, 0],
      [0, 0, 0],
    ];

    const board2 = [
      [0, 0, 1],
      [0, 0, 0],
      [0, 0, 0],
    ];

    const key1 = generateSenteGoteCacheKey(board1, 'D4', 7.5);
    const key2 = generateSenteGoteCacheKey(board2, 'D4', 7.5);

    expect(key1).not.toBe(key2);
  });

  test('different moves generate different keys', () => {
    const board = [
      [0, 0, 1],
      [0, -1, 0],
      [0, 0, 0],
    ];

    const key1 = generateSenteGoteCacheKey(board, 'D4', 7.5);
    const key2 = generateSenteGoteCacheKey(board, 'D5', 7.5);

    expect(key1).not.toBe(key2);
  });

  test('different komi values generate different keys', () => {
    const board = [
      [0, 0, 1],
      [0, -1, 0],
      [0, 0, 0],
    ];

    const key1 = generateSenteGoteCacheKey(board, 'D4', 7.5);
    const key2 = generateSenteGoteCacheKey(board, 'D4', 6.5);

    expect(key1).not.toBe(key2);
  });

  test('cache key includes sg prefix', () => {
    const board = [[0, 0, 0]];
    const key = generateSenteGoteCacheKey(board, 'A1', 7.5);

    expect(key.startsWith('sg:')).toBe(true);
  });
});
