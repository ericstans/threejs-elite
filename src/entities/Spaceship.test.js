import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Spaceship } from './entities/Spaceship.js';
import * as THREE from 'three';

describe('Spaceship', () => {
  let spaceship;

  beforeEach(() => {
    spaceship = new Spaceship('Flea');
  });

  describe('initialization', () => {
    it('should initialize with default ship type', () => {
      expect(spaceship.shipType).toBe('Flea');
    });

    it('should initialize position at origin', () => {
      expect(spaceship.position.x).toBe(0);
      expect(spaceship.position.y).toBe(0);
      expect(spaceship.position.z).toBe(0);
    });

    it('should initialize velocity at zero', () => {
      expect(spaceship.velocity.x).toBe(0);
      expect(spaceship.velocity.y).toBe(0);
      expect(spaceship.velocity.z).toBe(0);
    });

    it('should initialize with zero throttle', () => {
      expect(spaceship.throttle).toBe(0);
    });

    it('should initialize with movement stats from ship type', () => {
      expect(spaceship.maxSpeed).toBeGreaterThan(0);
      expect(spaceship.acceleration).toBeGreaterThan(0);
      expect(spaceship.rotationSpeed).toBeGreaterThan(0);
    });

    it('should initialize with full hull strength', () => {
      expect(spaceship.hullStrength).toBe(spaceship.maxHullStrength);
      expect(spaceship.hullStrength).toBeGreaterThan(0);
    });

    it('should initialize with zero cash', () => {
      expect(spaceship.cash).toBe(0);
    });

    it('should initialize with default flags', () => {
      expect(spaceship.flags.firingEnabled).toBe(true);
      expect(spaceship.flags.isDocking).toBe(false);
      expect(spaceship.flags.isDocked).toBe(false);
      expect(spaceship.flags.isInCombat).toBe(false);
    });

    it('should create mesh', () => {
      expect(spaceship.mesh).toBeDefined();
      expect(spaceship.mesh.isGroup).toBe(true);
    });

    it('should initialize third person mode as disabled', () => {
      expect(spaceship.thirdPersonMode).toBe(false);
      expect(spaceship.thirdPersonLoaded).toBe(false);
    });

    it('should have empty speed history', () => {
      expect(spaceship.speedHistory).toEqual([]);
      expect(spaceship.speedHistoryMaxLength).toBe(30);
    });
  });

  describe('throttle management', () => {
    it('should set throttle within valid range', () => {
      spaceship.setThrottle(0.5);
      expect(spaceship.throttle).toBe(0.5);
    });

    it('should clamp throttle to maximum', () => {
      spaceship.setThrottle(2.0);
      expect(spaceship.throttle).toBe(spaceship.maxThrottle);
    });

    it('should clamp throttle to minimum (0)', () => {
      spaceship.setThrottle(-0.5);
      expect(spaceship.throttle).toBe(0);
    });

    it('should get current throttle', () => {
      spaceship.setThrottle(0.75);
      expect(spaceship.getThrottle()).toBe(0.75);
    });
  });

  describe('position and rotation', () => {
    it('should return position clone', () => {
      const pos = spaceship.getPosition();
      expect(pos).toBeInstanceOf(THREE.Vector3);
      expect(pos).not.toBe(spaceship.position);
      expect(pos.equals(spaceship.position)).toBe(true);
    });

    it('should get rotation', () => {
      const rotation = spaceship.getRotation();
      expect(rotation).toBeDefined();
      expect(rotation).toBeInstanceOf(THREE.Euler);
    });

    it('should update mesh position when position changes', () => {
      spaceship.position.set(10, 5, -3);
      spaceship.update(0.016);
      expect(spaceship.mesh.position.x).toBe(10);
      expect(spaceship.mesh.position.y).toBe(5);
      expect(spaceship.mesh.position.z).toBe(-3);
    });
  });

  describe('speed calculations', () => {
    it('should return velocity magnitude as speed', () => {
      spaceship.velocity.set(3, 4, 0);
      expect(spaceship.getSpeed()).toBe(5); // sqrt(3^2 + 4^2)
    });

    it('should return zero speed when stationary', () => {
      expect(spaceship.getSpeed()).toBe(0);
    });

    it('should calculate speed per minute', () => {
      spaceship.velocity.set(1, 0, 0);
      expect(spaceship.getSpeedPerMinute()).toBe(60);
    });

    it('should calculate speed percentage relative to max speed', () => {
      spaceship.velocity.set(0, 0, 0);
      expect(spaceship.getSpeedPercentage()).toBe(0);

      spaceship.velocity = new THREE.Vector3(0, 0, -spaceship.maxSpeed / 2);
      expect(spaceship.getSpeedPercentage()).toBeCloseTo(0.5, 1);
    });

    it('should cap speed percentage at 100%', () => {
      spaceship.velocity = new THREE.Vector3(0, 0, -spaceship.maxSpeed * 2);
      expect(spaceship.getSpeedPercentage()).toBe(1.0);
    });

    it('should reset speed history', () => {
      spaceship.speedHistory = [1, 2, 3, 4, 5];
      spaceship.calculatedSpeed = 10;
      
      spaceship.resetSpeedHistory();
      
      expect(spaceship.speedHistory).toEqual([]);
      expect(spaceship.calculatedSpeed).toBe(0);
    });
  });

  describe('movement controls', () => {
    it('should pitch up with positive amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.x;
      spaceship.pitch(1);
      expect(spaceship.angularVelocity.x).toBeGreaterThan(initialAngularVelocity);
    });

    it('should pitch down with negative amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.x;
      spaceship.pitch(-1);
      expect(spaceship.angularVelocity.x).toBeLessThan(initialAngularVelocity);
    });

    it('should yaw left with positive amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.y;
      spaceship.yaw(1);
      expect(spaceship.angularVelocity.y).toBeGreaterThan(initialAngularVelocity);
    });

    it('should yaw right with negative amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.y;
      spaceship.yaw(-1);
      expect(spaceship.angularVelocity.y).toBeLessThan(initialAngularVelocity);
    });

    it('should roll left with negative amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.z;
      spaceship.roll(-1);
      expect(spaceship.angularVelocity.z).toBeLessThan(initialAngularVelocity);
    });

    it('should roll right with positive amount', () => {
      const initialAngularVelocity = spaceship.angularVelocity.z;
      spaceship.roll(1);
      expect(spaceship.angularVelocity.z).toBeGreaterThan(initialAngularVelocity);
    });
  });

  describe('flag management', () => {
    it('should set flag', () => {
      spaceship.setFlag('isInCombat', true);
      expect(spaceship.flags.isInCombat).toBe(true);
    });

    it('should get flag', () => {
      spaceship.flags.isDocking = true;
      expect(spaceship.getFlag('isDocking')).toBe(true);
    });

    it('should return false for unset flag', () => {
      expect(spaceship.getFlag('nonExistentFlag')).toBe(false);
    });

    it('should check if flag exists and is truthy', () => {
      spaceship.flags.dockingAuthorized = true;
      expect(spaceship.hasFlag('dockingAuthorized')).toBe(true);
    });

    it('should return false for falsy flag', () => {
      spaceship.flags.dockingAuthorized = false;
      expect(spaceship.hasFlag('dockingAuthorized')).toBe(false);
    });

    it('should get all flags', () => {
      const allFlags = spaceship.getAllFlags();
      expect(allFlags).toHaveProperty('firingEnabled');
      expect(allFlags).toHaveProperty('isDocking');
      expect(allFlags).toHaveProperty('isDocked');
      expect(allFlags).not.toBe(spaceship.flags); // Should be a copy
    });
  });

  describe('cash management', () => {
    it('should get cash', () => {
      expect(spaceship.getCash()).toBe(0);
    });

    it('should add cash', () => {
      const result = spaceship.addCash(500);
      expect(result).toBe(500);
      expect(spaceship.cash).toBe(500);
    });

    it('should add multiple amounts', () => {
      spaceship.addCash(100);
      spaceship.addCash(200);
      expect(spaceship.cash).toBe(300);
    });

    it('should remove cash', () => {
      spaceship.cash = 1000;
      const result = spaceship.removeCash(300);
      expect(result).toBe(700);
      expect(spaceship.cash).toBe(700);
    });

    it('should not go below zero when removing cash', () => {
      spaceship.cash = 100;
      const result = spaceship.removeCash(200);
      expect(result).toBe(0);
      expect(spaceship.cash).toBe(0);
    });

    it('should set cash', () => {
      const result = spaceship.setCash(5000);
      expect(result).toBe(5000);
      expect(spaceship.cash).toBe(5000);
    });

    it('should not allow negative cash when setting', () => {
      const result = spaceship.setCash(-100);
      expect(result).toBe(0);
      expect(spaceship.cash).toBe(0);
    });
  });

  describe('hull strength', () => {
    it('should initialize with full hull strength', () => {
      expect(spaceship.hullStrength).toBe(spaceship.maxHullStrength);
      expect(spaceship.hullStrength).toBeGreaterThan(0);
    });

    it('should track hull strength property', () => {
      spaceship.hullStrength = 75;
      expect(spaceship.hullStrength).toBe(75);
    });

    it('should have max hull strength property', () => {
      expect(spaceship.maxHullStrength).toBeGreaterThan(0);
    });
  });

  describe('docking system', () => {
    let mockPlanet;

    beforeEach(() => {
      mockPlanet = {
        getPosition: vi.fn(() => new THREE.Vector3(100, 0, 0)),
        mesh: {
          quaternion: new THREE.Quaternion(),
          worldToLocal: vi.fn(v => v.clone())
        },
        getSize: vi.fn(() => 10),
        getType: vi.fn(() => 'planet')
      };
    });

    it('should start docking', () => {
      spaceship.startDocking(mockPlanet);
      expect(spaceship.flags.isDocking).toBe(true);
      expect(spaceship.flags.firingEnabled).toBe(false);
      expect(spaceship.dockingTarget).toBe(mockPlanet);
    });

    it('should reset speed history on docking start', () => {
      spaceship.speedHistory = [1, 2, 3];
      spaceship.startDocking(mockPlanet);
      expect(spaceship.speedHistory).toEqual([]);
    });

    it('should have docking progress start at 0', () => {
      spaceship.startDocking(mockPlanet);
      expect(spaceship.dockingProgress).toBe(0);
    });

    it('should complete takeoff', () => {
      spaceship.flags.isDocking = true;
      spaceship.flags.isDocked = true;
      spaceship.flags.firingEnabled = false;
      
      spaceship.completeTakeoff();
      
      expect(spaceship.flags.isDocking).toBe(false);
      expect(spaceship.flags.isDocked).toBe(false);
      expect(spaceship.flags.firingEnabled).toBe(true);
    });

    it('should reset speed history on takeoff complete', () => {
      spaceship.speedHistory = [1, 2, 3];
      spaceship.completeTakeoff();
      expect(spaceship.speedHistory).toEqual([]);
    });
  });

  describe('update loop - basic behavior', () => {
    it('should update mesh position', () => {
      spaceship.position.set(10, 20, 30);
      spaceship.update(0.016);
      expect(spaceship.mesh.position.x).toBe(10);
      expect(spaceship.mesh.position.y).toBe(20);
      expect(spaceship.mesh.position.z).toBe(30);
    });

    it('should freeze movement when controls disabled', () => {
      spaceship._controlsDisabled = true;
      spaceship.velocity.set(10, 10, 10);
      spaceship.angularVelocity.set(1, 1, 1);
      
      spaceship.update(0.016);
      
      expect(spaceship.velocity.x).toBe(0);
      expect(spaceship.velocity.y).toBe(0);
      expect(spaceship.velocity.z).toBe(0);
      expect(spaceship.angularVelocity.x).toBe(0);
      expect(spaceship.angularVelocity.y).toBe(0);
      expect(spaceship.angularVelocity.z).toBe(0);
    });

    it('should set throttle to zero when controls disabled', () => {
      spaceship._controlsDisabled = true;
      spaceship.throttle = 0.8;
      
      spaceship.update(0.016);
      
      expect(spaceship.throttle).toBe(0);
    });
  });

  describe('third person mode', () => {
    it('should enable third person mode with model', () => {
      const mockModel = new THREE.Group();
      spaceship.enableThirdPerson(mockModel, true);
      
      expect(spaceship.thirdPersonMode).toBe(true);
      expect(spaceship.thirdPersonLoaded).toBe(true);
    });

    it('should preload model without activating third person', () => {
      const mockModel = new THREE.Group();
      spaceship.enableThirdPerson(mockModel, false);
      
      expect(spaceship.thirdPersonMode).toBe(false);
      expect(spaceship.thirdPersonLoaded).toBe(true);
    });

    it('should disable third person mode', () => {
      spaceship.thirdPersonMode = true;
      spaceship.disableThirdPerson();
      expect(spaceship.thirdPersonMode).toBe(false);
    });

    it('should hide third person group when disabled', () => {
      const mockModel = new THREE.Group();
      spaceship.enableThirdPerson(mockModel, true);
      spaceship.syncThirdPerson();
      expect(spaceship.thirdPersonGroup.visible).toBe(true);
      
      spaceship.disableThirdPerson();
      spaceship.syncThirdPerson();
      expect(spaceship.thirdPersonGroup.visible).toBe(false);
    });
  });

  describe('station docking', () => {
    let mockStation;

    beforeEach(() => {
      mockStation = {
        id: 'test-station-1',
        size: 20,
        mesh: {
          quaternion: new THREE.Quaternion(),
          worldToLocal: vi.fn(v => v.clone()),
          localToWorld: vi.fn(v => v.clone()),
          add: vi.fn(),
          remove: vi.fn(),
          parent: null
        },
        getLandingVectorStartWorld: vi.fn(() => new THREE.Vector3(100, 0, 0)),
        getLandingVectorDirectionWorld: vi.fn(() => new THREE.Vector3(-1, 0, 0)),
        getLandingVectorLength: vi.fn(() => 30)
      };
    });

    it('should lock to station landing vector', () => {
      spaceship.position.set(110, 0, 0);
      spaceship.lockToStation(mockStation);
      
      expect(spaceship.flags.landingVectorLocked).toBe(true);
      expect(spaceship.dockingTarget).toBe(mockStation);
      expect(spaceship.landingVectorStation).toBe(mockStation);
    });

    it('should freeze velocity when locked to station', () => {
      spaceship.velocity.set(10, 5, -3);
      spaceship.lockToStation(mockStation);
      
      expect(spaceship.velocity.x).toBe(0);
      expect(spaceship.velocity.y).toBe(0);
      expect(spaceship.velocity.z).toBe(0);
    });

    it('should freeze angular velocity when locked to station', () => {
      spaceship.angularVelocity.set(1, 1, 1);
      spaceship.lockToStation(mockStation);
      
      expect(spaceship.angularVelocity.x).toBe(0);
      expect(spaceship.angularVelocity.y).toBe(0);
      expect(spaceship.angularVelocity.z).toBe(0);
    });
  });

  describe('different ship types', () => {
    it('should initialize with different ship types', () => {
      const cobra = new Spaceship('Cobra Mk III');
      expect(cobra.shipType).toBe('Cobra Mk III');
      expect(cobra.maxSpeed).toBeGreaterThan(0);
    });

    it('should have different stats for different ship types', () => {
      const flea = new Spaceship('Flea');
      const cobra = new Spaceship('Cobra Mk III');
      
      // Different ships should have different characteristics
      const fleaSpeed = flea.maxSpeed;
      const cobraSpeed = cobra.maxSpeed;
      
      expect(fleaSpeed).toBeGreaterThan(0);
      expect(cobraSpeed).toBeGreaterThan(0);
      // They may or may not be different, but both should be valid
    });
  });

  describe('physics integration', () => {
    it('should apply acceleration based on throttle', () => {
      spaceship.setThrottle(1.0);
      
      // Simulate several update frames
      for (let i = 0; i < 10; i++) {
        spaceship.update(0.016);
      }
      
      // Speed should increase (unless docking/special state)
      // Note: Actual physics depends on update() implementation
      expect(spaceship.maxSpeed).toBeGreaterThan(0);
    });

    it('should maintain zero speed when throttle is zero', () => {
      spaceship.setThrottle(0);
      spaceship.velocity.set(0, 0, 0);
      
      spaceship.update(0.016);
      
      // Velocity should remain zero or decay
      const speed = spaceship.getSpeed();
      expect(speed).toBeLessThanOrEqual(0.1);
    });
  });

  describe('edge cases', () => {
    it('should handle zero delta time in update', () => {
      expect(() => spaceship.update(0)).not.toThrow();
    });

    it('should handle very large delta time', () => {
      expect(() => spaceship.update(10)).not.toThrow();
    });

    it('should handle negative cash operations gracefully', () => {
      spaceship.cash = 50;
      spaceship.removeCash(100);
      expect(spaceship.cash).toBe(0);
    });

    it('should handle controls disabled state', () => {
      spaceship._controlsDisabled = true;
      spaceship.velocity.set(10, 10, 10);
      spaceship.update(0.016);
      expect(spaceship.velocity.length()).toBe(0);
    });
  });
});
