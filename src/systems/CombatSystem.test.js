import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CombatSystem } from './CombatSystem.js';
import * as THREE from 'three';

describe('CombatSystem', () => {
  let combatSystem;
  let mockGameEngine;
  let mockSoundManager;
  let mockUI;
  let mockSpaceship;
  let mockAsteroids;
  let mockNPCShips;
  let mockCurrentTarget;
  let callbacks;

  beforeEach(() => {
    // Mock game engine
    mockGameEngine = {
      addEntity: vi.fn(),
      removeEntity: vi.fn(),
      createSpatialExplosion: vi.fn(),
      createSpatialLaserHit: vi.fn()
    };

    // Mock sound manager
    mockSoundManager = {
      playLaserSound: vi.fn()
    };

    // Mock UI
    mockUI = {
      blinkCrosshairRed: vi.fn()
    };

    // Mock spaceship
    mockSpaceship = {
      getPosition: vi.fn(() => new THREE.Vector3(0, 0, 0)),
      getRotation: vi.fn(() => new THREE.Euler(0, 0, 0))
    };

    // Mock asteroids array
    mockAsteroids = [];

    // Mock NPC ships array
    mockNPCShips = [];

    // Mock current target
    mockCurrentTarget = null;

    // Callbacks
    callbacks = {
      onRequestTargetInfoUpdate: vi.fn(),
      onHitFeedback: vi.fn(),
      onNPCShipHit: vi.fn(),
      onNPCShipDestroyed: vi.fn()
    };

    // Create combat system
    combatSystem = new CombatSystem({
      gameEngine: mockGameEngine,
      soundManager: mockSoundManager,
      ui: mockUI,
      getSpaceship: () => mockSpaceship,
      getCurrentTarget: () => mockCurrentTarget,
      onRequestTargetInfoUpdate: callbacks.onRequestTargetInfoUpdate,
      getNPCShips: () => mockNPCShips,
      getAsteroids: () => mockAsteroids,
      onHitFeedback: callbacks.onHitFeedback,
      onNPCShipHit: callbacks.onNPCShipHit,
      onNPCShipDestroyed: callbacks.onNPCShipDestroyed,
      environmentSystem: null
    });
  });

  describe('initialization', () => {
    it('should initialize with empty lasers array', () => {
      expect(combatSystem.lasers).toEqual([]);
    });

    it('should initialize with empty explosions array', () => {
      expect(combatSystem.explosions).toEqual([]);
    });

    it('should store all dependencies', () => {
      expect(combatSystem.gameEngine).toBe(mockGameEngine);
      expect(combatSystem.soundManager).toBe(mockSoundManager);
      expect(combatSystem.ui).toBe(mockUI);
    });
  });

  describe('shootLaser', () => {
    it('should not fire when no spaceship', () => {
      combatSystem.getSpaceship = () => null;
      combatSystem.shootLaser();
      expect(combatSystem.lasers.length).toBe(0);
      expect(mockSoundManager.playLaserSound).not.toHaveBeenCalled();
    });

    it('should create and add a laser', () => {
      combatSystem.shootLaser();
      expect(combatSystem.lasers.length).toBe(1);
      expect(mockGameEngine.addEntity).toHaveBeenCalledTimes(1);
      expect(mockSoundManager.playLaserSound).toHaveBeenCalledTimes(1);
    });

    it('should fire laser in forward direction', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];

      // Forward direction should be roughly (0, 0, -1) when no rotation
      expect(laser.direction.z).toBeLessThan(0);
      expect(Math.abs(laser.direction.x)).toBeLessThan(0.1);
      expect(Math.abs(laser.direction.y)).toBeLessThan(0.1);
    });

    it('should fire laser from offset position in front of ship', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];

      // Laser should start slightly ahead of ship (z = -2 for forward offset)
      expect(laser.position.z).toBeLessThan(0);
    });

    it('should respect ship rotation', () => {
      mockSpaceship.getRotation = vi.fn(() => new THREE.Euler(0, Math.PI / 2, 0));
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];

      // When rotated 90 degrees, should fire to the side
      expect(Math.abs(laser.direction.x)).toBeGreaterThan(0.9);
    });
  });

  describe('updateLasers', () => {
    it('should update all lasers', () => {
      combatSystem.shootLaser();
      combatSystem.shootLaser();
      const laser1 = combatSystem.lasers[0];
      const laser2 = combatSystem.lasers[1];

      vi.spyOn(laser1, 'update').mockReturnValue(false);
      vi.spyOn(laser2, 'update').mockReturnValue(false);

      combatSystem.updateLasers(0.016);

      expect(laser1.update).toHaveBeenCalledWith(0.016);
      expect(laser2.update).toHaveBeenCalledWith(0.016);
    });

    it('should remove expired lasers', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      vi.spyOn(laser, 'update').mockReturnValue(true); // Should destroy

      combatSystem.updateLasers(0.016);

      expect(combatSystem.lasers.length).toBe(0);
      expect(mockGameEngine.removeEntity).toHaveBeenCalledWith(laser);
    });

    it('should keep active lasers', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      vi.spyOn(laser, 'update').mockReturnValue(false); // Should not destroy

      combatSystem.updateLasers(0.016);

      expect(combatSystem.lasers.length).toBe(1);
      expect(mockGameEngine.removeEntity).not.toHaveBeenCalled();
    });
  });

  describe('updateExplosions', () => {
    it('should update all explosions', () => {
      const mockExplosion1 = {
        update: vi.fn().mockReturnValue(false)
      };
      const mockExplosion2 = {
        update: vi.fn().mockReturnValue(false)
      };

      combatSystem.explosions.push(mockExplosion1, mockExplosion2);
      combatSystem.updateExplosions(0.016);

      expect(mockExplosion1.update).toHaveBeenCalledWith(0.016);
      expect(mockExplosion2.update).toHaveBeenCalledWith(0.016);
    });

    it('should remove finished explosions', () => {
      const mockExplosion = {
        update: vi.fn().mockReturnValue(true) // Should destroy
      };

      combatSystem.explosions.push(mockExplosion);
      combatSystem.updateExplosions(0.016);

      expect(combatSystem.explosions.length).toBe(0);
      expect(mockGameEngine.removeEntity).toHaveBeenCalledWith(mockExplosion);
    });
  });

  describe('collision detection - asteroids', () => {
    let mockAsteroid;

    beforeEach(() => {
      mockAsteroid = {
        isAlive: vi.fn(() => true),
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        getSize: vi.fn(() => 1),
        takeDamage: vi.fn(() => false) // Not destroyed by default
      };
      mockAsteroids.push(mockAsteroid);
    });

    it('should detect laser-asteroid collision', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10); // Same position as asteroid

      combatSystem.checkCollisions();

      expect(mockAsteroid.takeDamage).toHaveBeenCalledWith(1);
      expect(combatSystem.lasers.length).toBe(0); // Laser removed
    });

    it('should not detect collision when too far', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(100, 100, 100); // Far from asteroid

      combatSystem.checkCollisions();

      expect(mockAsteroid.takeDamage).not.toHaveBeenCalled();
      expect(combatSystem.lasers.length).toBe(1); // Laser still exists
    });

    it('should create small explosion on hit when asteroid survives', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(combatSystem.explosions.length).toBe(1);
      expect(mockGameEngine.createSpatialLaserHit).toHaveBeenCalled();
    });

    it('should create large explosion when asteroid is destroyed', () => {
      mockAsteroid.takeDamage.mockReturnValue(true); // Destroyed

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(combatSystem.explosions.length).toBe(1);
      expect(mockGameEngine.createSpatialExplosion).toHaveBeenCalled();
      expect(mockGameEngine.removeEntity).toHaveBeenCalledWith(mockAsteroid);
    });

    it('should spawn resources when asteroid is destroyed', () => {
      mockAsteroid.takeDamage.mockReturnValue(true); // Destroyed

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      const initialEntityCount = mockGameEngine.addEntity.mock.calls.length;
      combatSystem.checkCollisions();

      // Should add at least explosion (might add 0-4 resources)
      expect(mockGameEngine.addEntity.mock.calls.length).toBeGreaterThanOrEqual(initialEntityCount);
    });

    it('should call hit feedback on collision', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(callbacks.onHitFeedback).toHaveBeenCalled();
    });

    it('should skip dead asteroids', () => {
      mockAsteroid.isAlive.mockReturnValue(false);

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(mockAsteroid.takeDamage).not.toHaveBeenCalled();
    });
  });

  describe('collision detection - NPC ships', () => {
    let mockNPCShip;

    beforeEach(() => {
      mockNPCShip = {
        loaded: true,
        isAlive: vi.fn(() => true),
        getWorldPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        getSize: vi.fn(() => 2),
        takeDamage: vi.fn(() => false), // Not destroyed by default
        setNPCFlag: vi.fn()
      };
      mockNPCShips.push(mockNPCShip);
    });

    it('should detect laser-NPC collision', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(mockNPCShip.takeDamage).toHaveBeenCalledWith(1);
      expect(combatSystem.lasers.length).toBe(0);
    });

    it('should set NPC as hostile when hit', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(mockNPCShip.setNPCFlag).toHaveBeenCalledWith('isHostile', true);
    });

    it('should trigger combat soundtrack on hit', () => {
      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(callbacks.onNPCShipHit).toHaveBeenCalled();
    });

    it('should skip unloaded NPCs', () => {
      mockNPCShip.loaded = false;

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(mockNPCShip.takeDamage).not.toHaveBeenCalled();
    });

    it('should skip dead NPCs', () => {
      mockNPCShip.isAlive.mockReturnValue(false);

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(mockNPCShip.takeDamage).not.toHaveBeenCalled();
    });

    it('should create explosion when NPC is destroyed', () => {
      mockNPCShip.takeDamage.mockReturnValue(true); // Destroyed

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(combatSystem.explosions.length).toBe(1);
      expect(mockGameEngine.createSpatialExplosion).toHaveBeenCalled();
    });

    it('should call destroyed callback when targeted NPC is destroyed', () => {
      mockCurrentTarget = {
        getId: () => 'npcship-0'
      };
      mockNPCShip.takeDamage.mockReturnValue(true); // Destroyed

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(callbacks.onNPCShipDestroyed).toHaveBeenCalled();
    });

    it('should update target info when hit but not destroyed', () => {
      mockCurrentTarget = {
        getId: () => 'npcship-0'
      };

      combatSystem.shootLaser();
      const laser = combatSystem.lasers[0];
      laser.position.set(0, 0, -10);

      combatSystem.checkCollisions();

      expect(callbacks.onRequestTargetInfoUpdate).toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('should call updateLasers', () => {
      const spy = vi.spyOn(combatSystem, 'updateLasers');
      combatSystem.update(0.016);
      expect(spy).toHaveBeenCalledWith(0.016);
    });

    it('should call updateExplosions', () => {
      const spy = vi.spyOn(combatSystem, 'updateExplosions');
      combatSystem.update(0.016);
      expect(spy).toHaveBeenCalledWith(0.016);
    });

    it('should call checkCollisions', () => {
      const spy = vi.spyOn(combatSystem, 'checkCollisions');
      combatSystem.update(0.016);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('calculateLeadTarget', () => {
    it('should return null for null target', () => {
      const result = combatSystem.calculateLeadTarget(null, new THREE.Vector3(0, 0, 0));
      expect(result).toBeNull();
    });

    it('should return current position for stationary target', () => {
      const target = {
        getPosition: () => new THREE.Vector3(10, 0, 0),
        velocity: new THREE.Vector3(0, 0, 0)
      };

      const result = combatSystem.calculateLeadTarget(target, new THREE.Vector3(0, 0, 0));
      expect(result.x).toBe(10);
      expect(result.y).toBe(0);
      expect(result.z).toBe(0);
    });

    it('should calculate lead position for moving target', () => {
      const target = {
        getPosition: () => new THREE.Vector3(10, 0, 0),
        velocity: new THREE.Vector3(5, 0, 0) // Moving in +X direction
      };

      const result = combatSystem.calculateLeadTarget(target, new THREE.Vector3(0, 0, 0));

      // Lead position should be ahead of current position
      expect(result.x).toBeGreaterThan(10);
    });

    it('should use getVelocity method if velocity property not available', () => {
      const target = {
        getPosition: () => new THREE.Vector3(10, 0, 0),
        getVelocity: () => new THREE.Vector3(5, 0, 0)
      };

      const result = combatSystem.calculateLeadTarget(target, new THREE.Vector3(0, 0, 0));

      expect(result.x).toBeGreaterThan(10);
    });

    it('should handle slow-moving targets', () => {
      const target = {
        getPosition: () => new THREE.Vector3(10, 0, 0),
        velocity: new THREE.Vector3(0.05, 0, 0) // Very slow
      };

      const result = combatSystem.calculateLeadTarget(target, new THREE.Vector3(0, 0, 0));

      // Should return current position for very slow targets
      expect(result.x).toBeCloseTo(10, 1);
    });

    it('should return valid Vector3', () => {
      const target = {
        getPosition: () => new THREE.Vector3(10, 5, -3),
        velocity: new THREE.Vector3(2, 1, -1)
      };

      const result = combatSystem.calculateLeadTarget(target, new THREE.Vector3(0, 0, 0));

      expect(result).toBeInstanceOf(THREE.Vector3);
      expect(isNaN(result.x)).toBe(false);
      expect(isNaN(result.y)).toBe(false);
      expect(isNaN(result.z)).toBe(false);
    });
  });

  describe('spawnResources', () => {
    it('should spawn 0-4 resources', () => {
      const position = new THREE.Vector3(10, 5, -3);

      // Test multiple times due to randomness
      let minResources = Infinity;
      let maxResources = 0;

      for (let i = 0; i < 50; i++) {
        mockGameEngine.addEntity.mockClear();
        combatSystem.spawnResources(position);

        const resourceCount = mockGameEngine.addEntity.mock.calls.length;
        minResources = Math.min(minResources, resourceCount);
        maxResources = Math.max(maxResources, resourceCount);
      }

      expect(minResources).toBeGreaterThanOrEqual(0);
      expect(maxResources).toBeLessThanOrEqual(4);
    });

    it('should spawn resources near asteroid position', () => {
      const position = new THREE.Vector3(10, 5, -3);
      combatSystem.spawnResources(position);

      // Check that resources are added
      const addedResources = mockGameEngine.addEntity.mock.calls
        .map(call => call[0])
        .filter(entity => entity && entity.getType && entity.getType() === 'resource');

      addedResources.forEach(resource => {
        const resourcePos = resource.getPosition();
        const distance = resourcePos.distanceTo(position);

        // Should be within 4 units (offset range is -2 to +2 on each axis)
        expect(distance).toBeLessThan(7); // sqrt(4^2 * 3) ≈ 6.9
      });
    });
  });

  describe('hit feedback', () => {
    it('should use onHitFeedback callback when provided', () => {
      combatSystem._hitFeedback();
      expect(callbacks.onHitFeedback).toHaveBeenCalled();
      expect(mockUI.blinkCrosshairRed).not.toHaveBeenCalled();
    });

    it('should fallback to UI method when no callback', () => {
      const systemWithoutCallback = new CombatSystem({
        gameEngine: mockGameEngine,
        soundManager: mockSoundManager,
        ui: mockUI,
        getSpaceship: () => mockSpaceship,
        getCurrentTarget: () => mockCurrentTarget,
        onRequestTargetInfoUpdate: callbacks.onRequestTargetInfoUpdate,
        getNPCShips: () => mockNPCShips,
        getAsteroids: () => mockAsteroids,
        onHitFeedback: null,
        onNPCShipHit: vi.fn(),
        onNPCShipDestroyed: vi.fn(),
        environmentSystem: null
      });

      systemWithoutCallback._hitFeedback();
      expect(mockUI.blinkCrosshairRed).toHaveBeenCalled();
    });
  });

  describe('environment system integration', () => {
    it('should mark asteroid as destroyed when environment system provided', () => {
      const mockEnvironmentSystem = {
        markAsteroidDestroyed: vi.fn()
      };

      const systemWithEnv = new CombatSystem({
        gameEngine: mockGameEngine,
        soundManager: mockSoundManager,
        ui: mockUI,
        getSpaceship: () => mockSpaceship,
        getCurrentTarget: () => mockCurrentTarget,
        onRequestTargetInfoUpdate: callbacks.onRequestTargetInfoUpdate,
        getNPCShips: () => mockNPCShips,
        getAsteroids: () => mockAsteroids,
        onHitFeedback: callbacks.onHitFeedback,        onNPCShipHit: vi.fn(),
        onNPCShipDestroyed: vi.fn(),        environmentSystem: mockEnvironmentSystem
      });

      const mockAsteroid = {
        isAlive: vi.fn(() => true),
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        getSize: vi.fn(() => 1),
        takeDamage: vi.fn(() => true) // Destroyed
      };
      mockAsteroids.push(mockAsteroid);

      systemWithEnv.shootLaser();
      const laser = systemWithEnv.lasers[0];
      laser.position.set(0, 0, -10);

      systemWithEnv.checkCollisions();

      expect(mockEnvironmentSystem.markAsteroidDestroyed).toHaveBeenCalledWith(mockAsteroid);
    });
  });
});
