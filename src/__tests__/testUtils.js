/**
 * Test Utilities
 *
 * Helper functions and factories for creating test objects
 */

/**
 * Create a mock game state for testing
 */
export function createMockGameState() {
  return {
    currentSector: 'test-sector',
    playerShip: createMockSpaceship(),
    credits: 1000,
    cargo: [],
    maxCargo: 50,
    fuel: 100,
    maxFuel: 100,
    health: 100,
    maxHealth: 100,
    gameTime: 0
  };
}

/**
 * Create a mock spaceship for testing
 */
export function createMockSpaceship() {
  return {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    velocity: { x: 0, y: 0, z: 0 },
    health: 100,
    maxHealth: 100,
    fuel: 100,
    maxFuel: 100,
    cargo: [],
    maxCargo: 50,
    credits: 1000
  };
}

/**
 * Create a mock target for testing
 */
export function createMockTarget(type = 'asteroid', position = { x: 10, y: 0, z: 10 }) {
  return {
    type,
    position,
    health: 100,
    maxHealth: 100,
    isTargetable: true,
    name: `Test ${type}`
  };
}

/**
 * Create a mock commodity for testing
 */
export function createMockCommodity(id = 'test-item', basePrice = 100) {
  return {
    id,
    name: 'Test Item',
    basePrice,
    description: 'A test item',
    volume: 1
  };
}

/**
 * Wait for a condition to be true (useful for async tests)
 */
export async function waitFor(condition, timeout = 1000) {
  const startTime = Date.now();
  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

/**
 * Create a mock event
 */
export function createMockEvent(type, properties = {}) {
  return {
    type,
    preventDefault: () => {},
    stopPropagation: () => {},
    ...properties
  };
}
