import { describe, test, expect } from 'bun:test';
import {
  parseGTPCoordinate,
  vertexToGTP,
  calculateDistance,
  isLocalResponse,
} from '../src/sente-gote-utils';

describe('parseGTPCoordinate', () => {
  test('parses valid GTP coordinates correctly', () => {
    expect(parseGTPCoordinate('A1', 19)).toEqual([0, 18]);
    expect(parseGTPCoordinate('D4', 19)).toEqual([3, 15]);
    expect(parseGTPCoordinate('Q16', 19)).toEqual([15, 3]);
    expect(parseGTPCoordinate('T19', 19)).toEqual([18, 0]);
  });

  test('handles PASS move', () => {
    expect(parseGTPCoordinate('PASS', 19)).toBeNull();
    expect(parseGTPCoordinate('pass', 19)).toBeNull();
  });

  test('handles invalid coordinates', () => {
    expect(parseGTPCoordinate('', 19)).toBeNull();
    expect(parseGTPCoordinate('A', 19)).toBeNull();
    expect(parseGTPCoordinate('ZZ', 19)).toBeNull();
    expect(parseGTPCoordinate('A0', 19)).toBeNull();
    expect(parseGTPCoordinate('A20', 19)).toBeNull();
  });

  test('works with different board sizes', () => {
    expect(parseGTPCoordinate('A1', 9)).toEqual([0, 8]);
    expect(parseGTPCoordinate('J9', 9)).toEqual([8, 0]);
    expect(parseGTPCoordinate('A1', 13)).toEqual([0, 12]);
    expect(parseGTPCoordinate('N13', 13)).toEqual([12, 0]);
  });

  test('excludes letter I', () => {
    // In GTP, 'I' is skipped, so 'J' is the 9th column (index 8)
    expect(parseGTPCoordinate('J1', 19)).toEqual([8, 18]);
  });
});

describe('vertexToGTP', () => {
  test('converts vertices to GTP format correctly', () => {
    expect(vertexToGTP([0, 18], 19)).toBe('A1');
    expect(vertexToGTP([3, 15], 19)).toBe('D4');
    expect(vertexToGTP([15, 3], 19)).toBe('Q16');
    expect(vertexToGTP([18, 0], 19)).toBe('T19');
  });

  test('handles null vertex as PASS', () => {
    expect(vertexToGTP(null, 19)).toBe('PASS');
  });

  test('handles invalid coordinates as PASS', () => {
    expect(vertexToGTP([-1, 0], 19)).toBe('PASS');
    expect(vertexToGTP([0, -1], 19)).toBe('PASS');
    expect(vertexToGTP([19, 0], 19)).toBe('PASS');
    expect(vertexToGTP([0, 19], 19)).toBe('PASS');
  });

  test('works with different board sizes', () => {
    expect(vertexToGTP([0, 8], 9)).toBe('A1');
    expect(vertexToGTP([8, 0], 9)).toBe('J9');
    expect(vertexToGTP([0, 12], 13)).toBe('A1');
    expect(vertexToGTP([12, 0], 13)).toBe('N13');
  });

  test('round-trip conversion preserves coordinates', () => {
    const testCoords = ['A1', 'D4', 'Q16', 'T19', 'K10'];
    for (const coord of testCoords) {
      const vertex = parseGTPCoordinate(coord, 19);
      if (vertex) {
        expect(vertexToGTP(vertex, 19)).toBe(coord);
      }
    }
  });
});

describe('calculateDistance', () => {
  test('calculates Manhattan distance correctly', () => {
    // Same position
    expect(calculateDistance('D4', 'D4', 19)).toBe(0);

    // Horizontal distance
    expect(calculateDistance('D4', 'E4', 19)).toBe(1);
    expect(calculateDistance('D4', 'G4', 19)).toBe(3);

    // Vertical distance
    expect(calculateDistance('D4', 'D5', 19)).toBe(1);
    expect(calculateDistance('D4', 'D7', 19)).toBe(3);

    // Diagonal distance (Manhattan = x + y)
    expect(calculateDistance('D4', 'E5', 19)).toBe(2); // 1 right + 1 up
    expect(calculateDistance('D4', 'G7', 19)).toBe(6); // 3 right + 3 up
  });

  test('handles PASS moves', () => {
    expect(calculateDistance('PASS', 'D4', 19)).toBeNull();
    expect(calculateDistance('D4', 'PASS', 19)).toBeNull();
    expect(calculateDistance('PASS', 'PASS', 19)).toBeNull();
  });

  test('handles invalid coordinates', () => {
    expect(calculateDistance('ZZ', 'D4', 19)).toBeNull();
    expect(calculateDistance('D4', 'ZZ', 19)).toBeNull();
  });

  test('distance is symmetric', () => {
    expect(calculateDistance('D4', 'Q16', 19)).toBe(calculateDistance('Q16', 'D4', 19));
    expect(calculateDistance('A1', 'T19', 19)).toBe(calculateDistance('T19', 'A1', 19));
  });

  test('corner to corner distance', () => {
    // A1 (0,18) to T19 (18,0) = 18 + 18 = 36
    expect(calculateDistance('A1', 'T19', 19)).toBe(36);
  });
});

describe('isLocalResponse', () => {
  test('identifies local responses within threshold', () => {
    // Default threshold is 5
    expect(isLocalResponse('D4', 'D4', 19)).toBe(true); // Same position (0)
    expect(isLocalResponse('D4', 'E5', 19)).toBe(true); // Distance 2
    expect(isLocalResponse('D4', 'G7', 19)).toBe(false); // Distance 6 > 5
  });

  test('uses custom threshold', () => {
    expect(isLocalResponse('D4', 'G7', 19, 6)).toBe(true); // Distance 6 = threshold
    expect(isLocalResponse('D4', 'G7', 19, 7)).toBe(true); // Distance 6 < threshold
    expect(isLocalResponse('D4', 'G7', 19, 5)).toBe(false); // Distance 6 > threshold
  });

  test('PASS moves are never local', () => {
    expect(isLocalResponse('D4', 'PASS', 19)).toBe(false);
    expect(isLocalResponse('PASS', 'D4', 19)).toBe(false);
    expect(isLocalResponse('PASS', 'PASS', 19)).toBe(false);
  });

  test('invalid coordinates are not local', () => {
    expect(isLocalResponse('ZZ', 'D4', 19)).toBe(false);
    expect(isLocalResponse('D4', 'ZZ', 19)).toBe(false);
  });

  test('typical joseki responses are local', () => {
    // 3-3 invasion response scenarios
    expect(isLocalResponse('C3', 'D3', 19, 5)).toBe(true);
    expect(isLocalResponse('C3', 'C4', 19, 5)).toBe(true);
    expect(isLocalResponse('C3', 'D4', 19, 5)).toBe(true);
  });

  test('tenuki (playing elsewhere) is not local', () => {
    // Corner to opposite corner
    expect(isLocalResponse('C3', 'Q16', 19, 5)).toBe(false);
    // Bottom to top
    expect(isLocalResponse('D4', 'D16', 19, 5)).toBe(false);
  });
});
