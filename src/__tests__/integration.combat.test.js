import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TargetingSystem } from '../systems/TargetingSystem.js';
import * as THREE from 'three';

describe('Integration: Combat System', () => {
  let mockCamera;
  let mockUI;
  let mockSoundManager;
  let targetingSystem;

  beforeEach(() => {
    mockCamera = new THREE.PerspectiveCamera();

    mockUI = {
      updateTargetInfo: vi.fn(),
      clearTargetInfo: vi.fn(),
      blinkCrosshairRed: vi.fn()
    };

    mockSoundManager = {
      playLaserSound: vi.fn(),
      playExplosionSound: vi.fn(),
      onCombatStart: vi.fn()
    };

    targetingSystem = new TargetingSystem({
      camera: mockCamera,
      ui: mockUI,
      soundManager: mockSoundManager,
      getSpaceship: () => ({ getPosition: () => new THREE.Vector3(0, 0, 0) }),
      getAsteroids: () => [],
      getNPCShips: () => [],
      getPlanets: () => [],
      getStations: () => [],
      getResources: () => []
    });
  });

  describe('Target selection and crosshair display', () => {
    it('should update UI when target is selected', () => {
      const mockTarget = {
        getId: () => 'npc1',
        getName: () => 'Test NPC',
        getPosition: () => new THREE.Vector3(100, 0, 0)
      };

      targetingSystem.setCurrentCombatTarget(mockTarget);

      expect(targetingSystem.getCurrentCombatTarget()).toBe(mockTarget);
      expect(mockUI.updateTargetInfo).toHaveBeenCalled();
    });

    it('should clear target info when target is cleared', () => {
      targetingSystem.clearCurrentCombatTarget();

      expect(targetingSystem.getCurrentCombatTarget()).toBe(null);
      expect(mockUI.clearTargetInfo).toHaveBeenCalled();
    });

    it('should handle switching targets', () => {
      const target1 = {
        getId: () => 'npc1',
        getName: () => 'Target 1',
        getPosition: () => new THREE.Vector3(100, 0, 0)
      };

      const target2 = {
        getId: () => 'npc2',
        getName: () => 'Target 2',
        getPosition: () => new THREE.Vector3(200, 0, 0)
      };

      targetingSystem.setCurrentCombatTarget(target1);
      expect(mockUI.updateTargetInfo).toHaveBeenCalledTimes(1);

      targetingSystem.setCurrentCombatTarget(target2);
      expect(mockUI.updateTargetInfo).toHaveBeenCalledTimes(2);
      expect(targetingSystem.getCurrentCombatTarget()).toBe(target2);
    });
  });

  describe('Navigation target and waypoint display', () => {
    it('should set and display navigation targets', () => {
      const navTarget = {
        getId: () => 'planet1',
        getName: () => 'Aridus Prime',
        getPosition: () => new THREE.Vector3(500, 0, 0)
      };

      targetingSystem.setCurrentNavTarget(navTarget);

      expect(targetingSystem.getCurrentNavTarget()).toBe(navTarget);
      expect(mockUI.updateTargetInfo).toHaveBeenCalled();
    });

    it('should allow independent nav target and combat target', () => {
      const combatTarget = {
        getId: () => 'npc1',
        getName: () => 'Enemy Ship',
        getPosition: () => new THREE.Vector3(100, 0, 0)
      };

      const navTarget = {
        getId: () => 'planet1',
        getName: () => 'Destination',
        getPosition: () => new THREE.Vector3(500, 0, 0)
      };

      targetingSystem.setCurrentCombatTarget(combatTarget);
      targetingSystem.setCurrentNavTarget(navTarget);

      expect(targetingSystem.getCurrentCombatTarget()).toBe(combatTarget);
      expect(targetingSystem.getCurrentNavTarget()).toBe(navTarget);
    });
  });

  describe('Combat feedback', () => {
    it('should trigger visual feedback on hit', () => {
      const target = {
        getId: () => 'npc1',
        getName: () => 'Test NPC',
        getPosition: () => new THREE.Vector3(100, 0, 0)
      };

      targetingSystem.setCurrentCombatTarget(target);

      // Simulate hit feedback
      targetingSystem.onHitFeedback?.();

      expect(mockUI.blinkCrosshairRed).toHaveBeenCalled();
    });
  });
});
