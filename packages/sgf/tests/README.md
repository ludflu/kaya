# Tests for @kaya/sgf

This directory contains test files for the SGF parser/stringifier.

## Running Tests

```bash
# Run the main test suite
bun run tests/test-sgf.ts

# Or from the package root
cd packages/sgf
bun run tests/test-sgf.ts
```

## Test Files

- **`test-sgf.ts`** - Main test suite covering:
  - Basic parsing and stringifying
  - Variations and game trees
  - Helper functions (vertex, dates, escaping)
  - Roundtrip integrity
  - Complex game structures
  - Tokenizer

## Adding New Tests

When adding new test cases:

1. Add them to `test-sgf.ts` or create a new test file
2. Follow the existing pattern with console output
3. Use descriptive test names
4. Verify all tests pass before committing

## Future Improvements

- [ ] Migrate to a proper test framework (e.g., Bun's built-in test runner)
- [ ] Add assertion library for better error messages
- [ ] Add test coverage reporting
- [ ] Add SGF fixture files for integration tests
