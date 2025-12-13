/**
 * OGS Loader Test
 *
 * Unit tests for OGS URL detection (no network calls)
 */

import { extractOGSGameId, isOGSUrl } from '../src/services/ogsLoader';

function runTests() {
  console.log('🧪 Testing OGS Loader...\n');

  // Test 1: URL Detection
  console.log('Test 1: URL Detection');
  const testUrls = [
    'https://online-go.com/game/81344851',
    'https://online-go.com/game/81344851/something',
    'http://online-go.com/game/81344851',
    'https://online-go.com/game/12345',
    'invalid url',
    '(;FF[4]GM[1]SZ[19])',
    'https://example.com/game/123',
  ];

  let passed = 0;
  let failed = 0;

  testUrls.forEach(url => {
    const isOGS = isOGSUrl(url);
    const gameId = extractOGSGameId(url);
    const shouldBeOGS = url.includes('online-go.com/game/');
    const testPassed = isOGS === shouldBeOGS;

    if (testPassed) {
      console.log(`  ✅ ${url}`);
      console.log(`     → isOGSUrl: ${isOGS}, gameId: ${gameId}`);
      passed++;
    } else {
      console.log(`  ❌ ${url}`);
      console.log(`     → Expected: ${shouldBeOGS}, Got: ${isOGS}`);
      failed++;
    }
  });

  console.log('');
  console.log(`Results: ${passed} passed, ${failed} failed`);

  if (failed === 0) {
    console.log('\n✅ All tests passed!');
  } else {
    console.log('\n❌ Some tests failed!');
    process.exit(1);
  }
}

// Run tests
runTests();
