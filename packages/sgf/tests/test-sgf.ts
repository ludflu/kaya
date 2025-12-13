/**
 * Simple test file for @kaya/sgf
 * Run with: bun run tests/test-sgf.ts
 */

import * as sgf from '../src/index';

console.log('Testing @kaya/sgf implementation\n');

// Test 1: Parse simple SGF
console.log('Test 1: Parsing simple SGF');
const simple = '(;B[aa]SZ[19];W[bb])';
const parsed = sgf.parse(simple);
console.log('✓ Parsed:', JSON.stringify(parsed, null, 2).substring(0, 200), '...\n');

// Test 2: Stringify
console.log('Test 2: Stringifying back to SGF');
const stringified = sgf.stringify(parsed);
console.log('✓ Stringified:', stringified.substring(0, 100), '...\n');

// Test 3: Parse with variations
console.log('Test 3: Parsing with variations');
const variations = '(;B[hh](;W[ii])(;W[hi]C[comment]))';
const parsedVariations = sgf.parse(variations);
console.log('✓ Parsed variations, root has', parsedVariations[0].children.length, 'children\n');

// Test 4: Helper functions
console.log('Test 4: Helper functions');
console.log("✓ parseVertex('dd'):", sgf.parseVertex('dd'));
console.log('✓ stringifyVertex([3, 3]):', sgf.stringifyVertex([3, 3]));
console.log("✓ escapeString('hello]world'):", sgf.escapeString('hello]world'));
console.log("✓ unescapeString('hello\\]world'):", sgf.unescapeString('hello\\]world'));
console.log();

// Test 5: Dates
console.log('Test 5: Date parsing');
const dates = sgf.parseDates('1996-12-27,28,1997-01-03');
console.log('✓ Parsed dates:', dates);
console.log('✓ Stringified back:', sgf.stringifyDates(dates));
console.log();

// Test 6: Roundtrip test
console.log('Test 6: Parse → Stringify → Parse roundtrip');
const original = `(
  ;B[dd]SZ[19]PB[Black]PW[White]
  ;W[dq]
  (;B[pq]C[Variation 1])
  (;B[pd]C[Variation 2])
)`;
const p1 = sgf.parse(original);
const s1 = sgf.stringify(p1);
const p2 = sgf.parse(s1);
const s2 = sgf.stringify(p2);
console.log('✓ First stringify length:', s1.length);
console.log('✓ Second stringify length:', s2.length);
console.log('✓ Outputs match:', s1 === s2);
console.log();

// Test 7: Complex game tree
console.log('Test 7: Complex game with multiple properties');
const complex = '(;GM[1]FF[4]CA[UTF-8]SZ[19];B[pd];W[dp];B[pp];W[dd])';
const parsedComplex = sgf.parse(complex);
console.log('✓ Root node properties:', Object.keys(parsedComplex[0].data));
console.log('✓ Total nodes:', countNodes(parsedComplex[0]));
console.log();

// Test 8: Tokenizer
console.log('Test 8: Tokenizer');
const tokens = sgf.tokenize('(;B[aa];W[bb])');
console.log('✓ Token count:', tokens.length);
console.log('✓ Token types:', tokens.map(t => t.type).join(', '));
console.log();

console.log('All tests completed! ✓');

// Helper function
function countNodes(node: any): number {
  return 1 + node.children.reduce((sum: number, child: any) => sum + countNodes(child), 0);
}
