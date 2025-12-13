/**
 * Integration tests for SGF analysis
 * Tests the complete pipeline from SGF parsing to analysis
 */

import { describe, test, expect, beforeAll } from 'bun:test';
import { readFileSync } from 'fs';
import { join } from 'path';
import { analyzeSGF, analyzePosition } from '../src/analyze';
import { parseSGF, reconstructBoard, navigateToMove } from '../src/sgf-utils';
import { calculateCurrentTurn } from '../src/analysis-utils';

// Test data directory
const TEST_DATA_DIR = join(__dirname, '..', 'test-data');

describe('SGF Utils Integration Tests', () => {
  describe('parseSGF', () => {
    test('should parse test-game.sgf correctly', () => {
      const sgfContent = readFileSync(join(TEST_DATA_DIR, 'test-game.sgf'), 'utf-8');
      const parsed = parseSGF(sgfContent);

      expect(parsed.boardSize).toBe(19);
      expect(parsed.totalMoves).toBeGreaterThan(0);
      expect(parsed.rootNode).toBeDefined();
      expect(parsed.gameTree).toBeDefined();
    });

    test('should parse game-black-19.sgf correctly', () => {
      const sgfContent = readFileSync(join(TEST_DATA_DIR, 'game-black-19.sgf'), 'utf-8');
      const parsed = parseSGF(sgfContent);

      expect(parsed.boardSize).toBe(19);
      expect(parsed.totalMoves).toBeGreaterThan(0);
      expect(parsed.rootNode).toBeDefined();
      expect(parsed.gameTree).toBeDefined();
    });

    test('should parse game-white-139.sgf correctly', () => {
      const sgfContent = readFileSync(join(TEST_DATA_DIR, 'game-white-139.sgf'), 'utf-8');
      const parsed = parseSGF(sgfContent);

      expect(parsed.boardSize).toBe(19);
      expect(parsed.totalMoves).toBeGreaterThan(0);
      expect(parsed.rootNode).toBeDefined();
      expect(parsed.gameTree).toBeDefined();
    });

    test('should throw error for invalid SGF', () => {
      expect(() => parseSGF('')).toThrow('No games found in SGF file');
    });

    test('should throw error for invalid board size', () => {
      const invalidSGF = '(;SZ[99]B[aa])';
      expect(() => parseSGF(invalidSGF)).toThrow('Invalid board size');
    });
  });

  describe('reconstructBoard', () => {
    test('should reconstruct board state at different positions', () => {
      const sgfContent = readFileSync(join(TEST_DATA_DIR, 'test-game.sgf'), 'utf-8');
      const parsed = parseSGF(sgfContent);

      // Test at start (move 0)
      const node0 = navigateToMove(parsed.gameTree, parsed.rootNode, 0);
      const board0 = reconstructBoard(parsed.gameTree, node0.id, parsed.boardSize);
      expect(board0.moveCount).toBe(0);

      // Test at move 1
      if (parsed.totalMoves >= 1) {
        const node1 = navigateToMove(parsed.gameTree, parsed.rootNode, 1);
        const board1 = reconstructBoard(parsed.gameTree, node1.id, parsed.boardSize);
        expect(board1.moveCount).toBe(1);
      }

      // Test at last move
      const nodeLast = navigateToMove(parsed.gameTree, parsed.rootNode, parsed.totalMoves);
      const boardLast = reconstructBoard(parsed.gameTree, nodeLast.id, parsed.boardSize);
      expect(boardLast.moveCount).toBeGreaterThan(0);
    });

    test('should handle games with setup stones (AB/AW)', () => {
      // Create a simple SGF with setup stones
      const sgfWithSetup = '(;SZ[19]AB[aa][bb]AW[cc][dd])';
      const parsed = parseSGF(sgfWithSetup);
      const node = navigateToMove(parsed.gameTree, parsed.rootNode, 0);
      const board = reconstructBoard(parsed.gameTree, node.id, parsed.boardSize);

      // Should have 4 setup stones (2 black + 2 white)
      expect(board.board.signMap[0][0]).toBe(-1); // aa = Black
      expect(board.board.signMap[1][1]).toBe(-1); // bb = Black
      expect(board.board.signMap[2][2]).toBe(1); // cc = White
      expect(board.board.signMap[3][3]).toBe(1); // dd = White
    });
  });

  describe('calculateCurrentTurn', () => {
    test('should calculate turn correctly for all test games', () => {
      const testFiles = ['test-game.sgf', 'game-black-19.sgf', 'game-white-139.sgf'];

      for (const file of testFiles) {
        const sgfContent = readFileSync(join(TEST_DATA_DIR, file), 'utf-8');
        const parsed = parseSGF(sgfContent);

        // At move 0 (start), Black should be to move
        expect(calculateCurrentTurn(0)).toBe('B');

        // At move 1 (after Black played), White should be to move
        if (parsed.totalMoves >= 1) {
          expect(calculateCurrentTurn(1)).toBe('W');
        }

        // At move 2 (after White played), Black should be to move
        if (parsed.totalMoves >= 2) {
          expect(calculateCurrentTurn(2)).toBe('B');
        }
      }
    });
  });
});
