/**
 * Test Setup File
 *
 * This file runs before all tests to set up the testing environment.
 * It includes mocks for Three.js, Audio APIs, and other browser APIs
 * that aren't available in the test environment.
 */

import { vi } from 'vitest';

// Mock Three.js classes that are commonly used
global.THREE = {
  Vector3: class Vector3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }
    set(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
    copy(v) {
      this.x = v.x;
      this.y = v.y;
      this.z = v.z;
      return this;
    }
    clone() {
      return new Vector3(this.x, this.y, this.z);
    }
    add(v) {
      this.x += v.x;
      this.y += v.y;
      this.z += v.z;
      return this;
    }
    sub(v) {
      this.x -= v.x;
      this.y -= v.y;
      this.z -= v.z;
      return this;
    }
    multiplyScalar(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return this;
    }
    length() {
      return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }
    normalize() {
      const len = this.length();
      if (len > 0) {
        this.multiplyScalar(1 / len);
      }
      return this;
    }
    distanceTo(v) {
      const dx = this.x - v.x;
      const dy = this.y - v.y;
      const dz = this.z - v.z;
      return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
  },
  Color: class Color {
    constructor(r = 1, g = 1, b = 1) {
      this.r = r;
      this.g = g;
      this.b = b;
    }
    setHex(hex) {
      this.r = ((hex >> 16) & 255) / 255;
      this.g = ((hex >> 8) & 255) / 255;
      this.b = (hex & 255) / 255;
      return this;
    }
  },
  MathUtils: {
    degToRad: (degrees) => degrees * (Math.PI / 180),
    radToDeg: (radians) => radians * (180 / Math.PI),
    clamp: (value, min, max) => Math.max(min, Math.min(max, value)),
    lerp: (x, y, t) => x + (y - x) * t
  }
};

// Mock Audio API
global.AudioContext = vi.fn(() => ({
  createGain: vi.fn(() => ({
    gain: { value: 1 },
    connect: vi.fn()
  })),
  createOscillator: vi.fn(() => ({
    frequency: { value: 440 },
    type: 'sine',
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })),
  destination: {}
}));

global.Audio = vi.fn(() => ({
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  volume: 1,
  currentTime: 0,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};
global.localStorage = localStorageMock;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  setTimeout(callback, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// Mock console methods to reduce noise in tests (optional)
// Uncomment if you want to suppress console logs during tests
// global.console = {
//   ...console,
//   log: vi.fn(),
//   error: vi.fn(),
//   warn: vi.fn(),
// };
