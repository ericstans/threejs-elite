# Testing Guide

## Overview

This project uses [Vitest](https://vitest.dev/) for unit testing. Vitest is a fast, modern testing framework that integrates seamlessly with Vite.

## Running Tests

### Basic Commands

```bash
# Run all tests once
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with UI (opens a browser interface)
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

### Integration with Agent Workflow

Tests are automatically run as part of the pre-PR checks:

```bash
npm run agent:checks
```

This command runs linting, type checking, tests, and build verification.

## Test Structure

### Test Files

Test files are located next to the files they test and use the `.test.js` extension:

```
src/
  util/
    seedUtils.js
    seedUtils.test.js      ← Test file
  data/
    constants.js
    constants.test.js      ← Test file
  systems/
    CargoSystem.js
    CargoSystem.test.js    ← Test file
```

### Test Setup

The testing environment is configured in:

- `vite.config.js` - Test runner configuration
- `src/__tests__/setup.js` - Global setup and mocks
- `src/__tests__/testUtils.js` - Helper utilities for tests

## Writing Tests

### Basic Test Structure

```javascript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule.js';

describe('myModule', () => {
  describe('myFunction', () => {
    it('should do something', () => {
      const result = myFunction('input');
      expect(result).toBe('expected');
    });

    it('should handle edge cases', () => {
      expect(myFunction(null)).toBe(null);
    });
  });
});
```

### Using Mocks

Vitest provides powerful mocking capabilities:

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyClass } from '../MyClass.js';

describe('MyClass', () => {
  let instance;
  let mockDependency;

  beforeEach(() => {
    // Create mock
    mockDependency = {
      method: vi.fn(() => 'mocked result')
    };

    // Create instance with mock
    instance = new MyClass(mockDependency);
  });

  it('should call dependency method', () => {
    instance.doSomething();
    expect(mockDependency.method).toHaveBeenCalled();
  });
});
```

### Testing Three.js Code

Three.js classes are mocked in `src/__tests__/setup.js`. Basic Vector3 and Color implementations are available:

```javascript
import { describe, it, expect } from 'vitest';

describe('position calculations', () => {
  it('should calculate distance', () => {
    const pos1 = new THREE.Vector3(0, 0, 0);
    const pos2 = new THREE.Vector3(3, 4, 0);
    
    const distance = pos1.distanceTo(pos2);
    expect(distance).toBe(5);
  });
});
```

### Using Test Utilities

Helper functions are available in `src/__tests__/testUtils.js`:

```javascript
import { createMockGameState, createMockSpaceship } from './__tests__/testUtils.js';

describe('game logic', () => {
  it('should work with mock game state', () => {
    const gameState = createMockGameState();
    expect(gameState.credits).toBe(1000);
  });
});
```

## Test Coverage

### Running Coverage

```bash
npm run test:coverage
```

This generates:
- Console summary
- HTML report in `coverage/` directory
- JSON data in `coverage/coverage-final.json`

### Coverage Goals

- **Utilities**: Aim for 90%+ coverage
- **Data modules**: Aim for 80%+ coverage
- **System modules**: Aim for 70%+ coverage
- **UI components**: Focus on critical logic

### Excluded from Coverage

The following are excluded from coverage reports:
- `node_modules/`
- Test files (`**/*.test.js`)
- Type definitions (`**/*.d.ts`)
- Config files (`**/*.config.*`)
- Build output (`dist/`)
- Scripts (`scripts/`)

## Best Practices

### 1. Test One Thing at a Time

```javascript
// ✅ Good - tests one specific behavior
it('should return null for invalid input', () => {
  expect(parse(null)).toBe(null);
});

// ❌ Bad - tests multiple things
it('should work correctly', () => {
  expect(parse(null)).toBe(null);
  expect(parse('test')).toBe('test');
  expect(parse(123)).toBe('123');
});
```

### 2. Use Descriptive Test Names

```javascript
// ✅ Good - clear what is being tested
it('should throw error when price is negative', () => {
  // ...
});

// ❌ Bad - vague
it('should work', () => {
  // ...
});
```

### 3. Arrange, Act, Assert

```javascript
it('should calculate total price', () => {
  // Arrange - set up test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 }
  ];
  
  // Act - perform the action
  const total = calculateTotal(items);
  
  // Assert - verify the result
  expect(total).toBe(35);
});
```

### 4. Clean Up After Tests

```javascript
import { beforeEach, afterEach } from 'vitest';

describe('MyClass', () => {
  let instance;

  beforeEach(() => {
    instance = new MyClass();
  });

  afterEach(() => {
    instance.cleanup();
  });

  // Tests...
});
```

### 5. Don't Test Implementation Details

```javascript
// ✅ Good - tests behavior
it('should add item to cart', () => {
  cart.addItem('apple');
  expect(cart.getItemCount()).toBe(1);
});

// ❌ Bad - tests internal structure
it('should add item to internal array', () => {
  cart.addItem('apple');
  expect(cart._items.length).toBe(1);
});
```

## Common Patterns

### Testing Async Code

```javascript
it('should load data asynchronously', async () => {
  const data = await loadData();
  expect(data).toBeDefined();
});
```

### Testing Error Cases

```javascript
it('should throw error for invalid input', () => {
  expect(() => {
    processData(null);
  }).toThrow('Invalid input');
});
```

### Parameterized Tests

```javascript
import { it, expect } from 'vitest';

const testCases = [
  { input: 1, expected: 2 },
  { input: 2, expected: 4 },
  { input: 3, expected: 6 }
];

testCases.forEach(({ input, expected }) => {
  it(`should double ${input} to get ${expected}`, () => {
    expect(double(input)).toBe(expected);
  });
});
```

## Troubleshooting

### Tests Are Slow

- Use `npm run test:watch` during development
- Mock expensive operations (network, file I/O)
- Consider splitting large test files

### Mocks Not Working

- Ensure mocks are set up in `beforeEach()`
- Check that `vi.fn()` is imported from vitest
- Reset mocks between tests with `vi.clearAllMocks()`

### Import Errors

- Make sure file extensions are included (.js)
- Check that imports match actual exports
- Verify paths are correct (relative to test file)

### Three.js Errors

- Check that `src/__tests__/setup.js` is being loaded
- Add missing Three.js mock implementations as needed
- Consider creating factory functions for complex objects

## Next Steps

### Expand Test Coverage

Priority areas for additional tests:

1. **TargetingSystem** - Target selection and tracking logic
2. **NavigationSystem** - Sector navigation and pathfinding
3. **DockingManager** - Docking clearance and state management
4. **CombatSystem** - Damage calculation and combat logic
5. **GameStateManager** - Save/load and state transitions

### Integration Tests

Consider adding integration tests that test multiple systems working together:

```javascript
describe('resource collection integration', () => {
  it('should collect resource and update cargo', () => {
    // Test CargoSystem + TargetingSystem interaction
  });
});
```

### Performance Tests

For critical paths, add performance benchmarks:

```javascript
import { bench } from 'vitest';

bench('pathfinding algorithm', () => {
  findPath(start, end);
});
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Three.js Testing Examples](https://github.com/mrdoob/three.js/tree/dev/test)

## Contributing

When adding new features:

1. Write tests alongside your code
2. Aim for good coverage of critical logic
3. Run `npm test` before committing
4. Update this guide if you discover new patterns

Remember: **Good tests make refactoring safer and development faster!** 🚀
