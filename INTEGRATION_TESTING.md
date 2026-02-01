# Integration Testing Guide

## Overview

Integration tests verify that multiple systems work together correctly. This project now includes comprehensive integration test templates covering the key system interactions.

## What Integration Tests Should Cover

Based on your game's architecture, focus on these critical interactions:

### 1. **Game Flow & State Management**
- Pause/Resume coordination with audio systems
- Global flag management across systems
- Job availability and progression
- **File:** [src/__tests__/integration.game-flow.test.js](src/__tests__/integration.game-flow.test.js)

### 2. **Combat System**
- Target selection and UI updates
- Navigation target independence from combat target
- Crosshair display synchronization
- **File:** [src/__tests__/integration.combat.test.js](src/__tests__/integration.combat.test.js)

### 3. **Cargo & Economy**
- Cargo collection and inventory management
- Currency tracking and cargo sales
- Magnetic field collection parameters
- UI synchronization with cargo changes
- **File:** [src/__tests__/integration.cargo.test.js](src/__tests__/integration.cargo.test.js)

### 4. **Sector Management**
- Sector state persistence across transitions
- Entity tracking in different sectors
- Procedural generation state preservation
- **File:** [src/__tests__/integration.sectors.test.js](src/__tests__/integration.sectors.test.js)

### 5. **Conversations & Game State**
- Conversation flow and flag processing
- Docking state changes
- Job offers and acceptance
- Game pause during conversations
- **File:** [src/__tests__/integration.conversations.test.js](src/__tests__/integration.conversations.test.js)

## Running Tests

```bash
# Run all tests
npm test

# Run specific integration test file
npm test -- src/__tests__/integration.game-flow.test.js

# Run with coverage
npm test:coverage

# Watch mode (re-runs on changes)
npm run test:watch

# UI mode (browser interface)
npm run test:ui
```

## Creating New Integration Tests

### Step 1: Create Test File
Follow the naming pattern: `integration.{feature}.test.js`

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SystemA } from '../systems/SystemA.js';
import { SystemB } from '../systems/SystemB.js';

describe('Integration: Feature Name', () => {
  let systemA;
  let systemB;
  let mockDependency;

  beforeEach(() => {
    // Setup mocks and instances
    mockDependency = { method: vi.fn() };
    systemA = new SystemA();
    systemB = new SystemB(systemA);
  });

  describe('Feature interaction', () => {
    it('should coordinate between systems', () => {
      // Test the interaction
    });
  });
});
```

### Step 2: Key Testing Patterns

**Testing System Coordination:**
```javascript
it('should coordinate state changes', () => {
  // Trigger action in system A
  systemA.doSomething();
  
  // Verify system B responds correctly
  expect(systemB.state).toEqual(expectedState);
  expect(mockDependency.method).toHaveBeenCalled();
});
```

**Testing State Propagation:**
```javascript
it('should propagate state across systems', () => {
  systemA.setState('value1');
  const result = systemB.getState();
  expect(result).toBe('value1');
});
```

**Testing Error Handling:**
```javascript
it('should handle missing dependencies gracefully', () => {
  systemA.dependency = null;
  expect(() => systemA.doSomething()).not.toThrow();
});
```

## Mock Patterns Used in This Project

### Three.js Objects
```javascript
const mockCamera = new THREE.PerspectiveCamera();
// Camera is already mocked in src/__tests__/setup.js
```

### Audio Managers
```javascript
const mockMusicManager = {
  pauseTrack: vi.fn(),
  resumeTrack: vi.fn(),
  fadeIn: vi.fn()
};
```

### Game Engine
```javascript
const mockGameEngine = {
  scene: { add: vi.fn(), remove: vi.fn() },
  addEntity: vi.fn(),
  removeEntity: vi.fn()
};
```

### UI Components
```javascript
const mockUI = {
  updateTargetInfo: vi.fn(),
  clearTargetInfo: vi.fn(),
  blinkCrosshairRed: vi.fn()
};
```

## Current Integration Tests

| Test File | Coverage | Status |
|-----------|----------|--------|
| [integration.game-flow.test.js](src/__tests__/integration.game-flow.test.js) | GameStateManager + Audio | ✅ Passing |
| [integration.combat.test.js](src/__tests__/integration.combat.test.js) | TargetingSystem + UI | ⚠️ Needs THREE.js mock fixes |
| [integration.cargo.test.js](src/__tests__/integration.cargo.test.js) | CargoSystem + GameEngine | ⚠️ Needs mock improvements |
| [integration.sectors.test.js](src/__tests__/integration.sectors.test.js) | SectorManager + serialization | ⚠️ Needs sectorStates initialization |
| [integration.conversations.test.js](src/__tests__/integration.conversations.test.js) | ConversationSystem + GameState | ⚠️ Needs processFlags implementation |

## Common Issues & Solutions

### Issue: THREE.js objects not instantiated
**Solution:** Three.js objects are mocked in `src/__tests__/setup.js`. Check that Vector3, PerspectiveCamera, etc. are available in global THREE.

### Issue: Undefined system properties
**Solution:** Ensure the system initializes properties. Use `sectorManager.sectorStates = {}` in test setup if needed.

### Issue: Mock not tracking calls
**Solution:** Use `vi.fn()` for all methods you want to track. Example:
```javascript
const mock = { method: vi.fn(() => 'value') };
```

### Issue: Mock return values don't chain
**Solution:** Return objects that support method chaining:
```javascript
const mock = {
  method: vi.fn(() => ({ chained: vi.fn(() => 'result') }))
};
```

## Best Practices

1. **Test one interaction per `it` block** - Keep tests focused and readable
2. **Use descriptive names** - `should coordinate pause across GameStateManager and AudioManagers`
3. **Setup in beforeEach** - Ensures clean state for each test
4. **Verify both directions** - If system A affects B, verify B's state changed
5. **Test edge cases** - What happens when dependencies are null or missing?
6. **Group related tests** - Use nested `describe` blocks

## Integration Testing Tips

- Focus on **boundaries between systems** not internal logic
- Test **state persistence** across transitions
- Verify **event/callback chains** work correctly
- Test **error handling** when systems interact
- Check **ordering constraints** (does A need to initialize before B?)

## Next Steps

1. Fix failing integration tests by:
   - Ensuring proper mock initialization
   - Verifying system APIs match test expectations
   - Adding missing mock methods

2. Add integration tests for:
   - **Navigation System** - How TargetingSystem, NavigationSystem, and GameEngine interact
   - **Docking Flow** - DockingManager ↔ ConversationSystem ↔ GameStateManager
   - **NPC Combat** - CombatSystem ↔ TargetingSystem ↔ NPC Ship behavior
   - **Audio Playback** - AudioManager ↔ GameStateManager ↔ Controls

3. Use CI/CD pipeline to run integration tests on commits:
   ```bash
   npm run agent:checks  # Runs linting, types, tests, and build
   ```
