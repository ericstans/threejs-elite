import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TargetingSystem } from './TargetingSystem.js';
import * as THREE from 'three';

describe('TargetingSystem', () => {
  let targetingSystem;
  let mockCamera;
  let mockUI;
  let mockSoundManager;
  let mockSpaceship;
  let mockAsteroids;
  let mockNPCShips;
  let mockPlanets;
  let mockStations;
  let mockResources;

  beforeEach(() => {
    // Mock camera
    mockCamera = new THREE.PerspectiveCamera();
    mockCamera.position.set(0, 0, 0);

    // Mock UI
    mockUI = {
      updateTargetInfo: vi.fn(),
      clearTargetInfo: vi.fn(),
      updateNavTargetInfo: vi.fn(),
      clearNavTargetInfo: vi.fn()
    };

    // Mock sound manager
    mockSoundManager = {
      playTargetSelectedSound: vi.fn()
    };

    // Mock spaceship
    mockSpaceship = {
      getPosition: vi.fn(() => new THREE.Vector3(0, 0, 0)),
      getRotation: vi.fn(() => new THREE.Euler(0, 0, 0)),
      flags: {
        isDocked: false,
        isDocking: false,
        landingVectorLocked: false
      }
    };

    // Mock arrays
    mockAsteroids = [];
    mockNPCShips = [];
    mockPlanets = [];
    mockStations = [];
    mockResources = [];

    // Create targeting system
    targetingSystem = new TargetingSystem({
      camera: mockCamera,
      ui: mockUI,
      soundManager: mockSoundManager,
      getSpaceship: () => mockSpaceship,
      getAsteroids: () => mockAsteroids,
      getNPCShips: () => mockNPCShips,
      getPlanets: () => mockPlanets,
      getStations: () => mockStations,
      getResources: () => mockResources
    });
  });

  describe('initialization', () => {
    it('should initialize with null current target', () => {
      expect(targetingSystem.currentTarget).toBeNull();
    });

    it('should initialize with null current nav target', () => {
      expect(targetingSystem.currentNavTarget).toBeNull();
    });

    it('should initialize with empty combat target cycle', () => {
      expect(targetingSystem.combatTargetCycle).toEqual([]);
      expect(targetingSystem.combatCycleIndex).toBe(-1);
    });

    it('should initialize with empty nav target cycle', () => {
      expect(targetingSystem.navTargetCycle).toEqual([]);
      expect(targetingSystem.navCycleIndex).toBe(-1);
    });

    it('should store all dependencies', () => {
      expect(targetingSystem.camera).toBe(mockCamera);
      expect(targetingSystem.ui).toBe(mockUI);
      expect(targetingSystem.soundManager).toBe(mockSoundManager);
    });

    it('should have default cycle timeout', () => {
      expect(targetingSystem.cycleTimeout).toBe(3000);
    });
  });

  describe('combat targeting', () => {
    let mockAsteroid;

    beforeEach(() => {
      mockAsteroid = {
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-1',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
      mockAsteroids.push(mockAsteroid);
    });

    it('should target nearest combat target to crosshair', () => {
      targetingSystem.targetNearestCombat();
      
      expect(targetingSystem.currentTarget).toBe(mockAsteroid);
      expect(mockAsteroid.setTargeted).toHaveBeenCalledWith(true);
      expect(mockSoundManager.playTargetSelectedSound).toHaveBeenCalled();
    });

    it('should clear previous target before selecting new one', () => {
      const mockAsteroid2 = {
        getPosition: vi.fn(() => new THREE.Vector3(1, 0, -10)), // Off to the side
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-2',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };

      targetingSystem.targetNearestCombat();
      expect(targetingSystem.currentTarget).toBeDefined();

      mockAsteroids.push(mockAsteroid2);
      targetingSystem.targetNearestCombat();

      expect(mockAsteroid.setTargeted).toHaveBeenCalledWith(false);
      // mockAsteroid (0,0,-10) is still closer to crosshair than mockAsteroid2 (1,0,-10)
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-1');
    });

    it('should not target when no spaceship', () => {
      targetingSystem.getSpaceship = () => null;
      targetingSystem.targetNearestCombat();
      
      expect(targetingSystem.currentTarget).toBeNull();
    });

    it('should skip dead asteroids', () => {
      mockAsteroid.isAlive.mockReturnValue(false);
      targetingSystem.targetNearestCombat();
      
      expect(targetingSystem.currentTarget).toBeNull();
    });

    it('should include resources in combat targeting', () => {
      const mockResource = {
        getPosition: vi.fn(() => new THREE.Vector3(0.1, 0.1, -10)), // Slightly off center
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'resource-1',
        getMass: () => 1,
        getHealth: () => 1,
        getMaxHealth: () => 1,
        isCommable: () => false
      };
      mockResources.push(mockResource);

      targetingSystem.targetNearestCombat();

      // mockAsteroid (0,0,-10) is closer to crosshair than resource (0.1,0.1,-10)
      expect(targetingSystem.currentTarget).toBeDefined();
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-1');
    });
  });

  describe('nav targeting', () => {
    let mockPlanet;

    beforeEach(() => {
      mockPlanet = {
        getPosition: vi.fn(() => new THREE.Vector3(5, 0, -10)), // To the right and in front
        setNavTargeted: vi.fn(),
        getId: () => 'planet-1',
        getName: () => 'Test Planet',
        getMass: () => 10000,
        isCommable: () => true,
        getType: () => 'planet',
        radius: 5
      };
      mockPlanets.push(mockPlanet);
    });

    it('should target nearest nav target to crosshair', () => {
      targetingSystem.targetNearestNav();
      
      expect(targetingSystem.currentNavTarget).toBeDefined();
      expect(targetingSystem.currentNavTarget.getId()).toBe('planet-1');
      expect(mockPlanet.setNavTargeted).toHaveBeenCalledWith(true);
      expect(mockSoundManager.playTargetSelectedSound).toHaveBeenCalled();
    });

    it('should target stations as nav targets', () => {
      const mockStation = {
        getPosition: vi.fn(() => new THREE.Vector3(2, 0, -10)), // Closer to center than planet
        setNavTargeted: vi.fn(),
        getId: () => 'station-1',
        getName: () => 'Test Station',
        getMass: () => 5000,
        isCommable: () => true,
        getType: () => 'station',
        size: 10
      };
      mockStations.push(mockStation);

      targetingSystem.targetNearestNav();

      // Station is closer to crosshair (x=2 vs x=5)
      expect(targetingSystem.currentNavTarget).toBeDefined();
      expect(targetingSystem.currentNavTarget.getId()).toBe('station-1');
    });

    it('should not target when no spaceship', () => {
      targetingSystem.getSpaceship = () => null;
      targetingSystem.targetNearestNav();
      
      expect(targetingSystem.currentNavTarget).toBeNull();
    });

    it('should block targeting when docked', () => {
      mockSpaceship.flags.isDocked = true;
      targetingSystem.targetNearestNav();
      
      expect(targetingSystem.currentNavTarget).toBeNull();
    });

    it('should block targeting when docking', () => {
      mockSpaceship.flags.isDocking = true;
      targetingSystem.targetNearestNav();
      
      expect(targetingSystem.currentNavTarget).toBeNull();
    });

    it('should block targeting when landing vector locked', () => {
      mockSpaceship.flags.landingVectorLocked = true;
      targetingSystem.targetNearestNav();
      
      expect(targetingSystem.currentNavTarget).toBeNull();
    });

    it('should allow targeting when blockIfDockingFlags is false', () => {
      mockSpaceship.flags.isDocked = true;
      targetingSystem.targetNearestNav({ blockIfDockingFlags: false });
      
      expect(targetingSystem.currentNavTarget).toBeDefined();
      expect(targetingSystem.currentNavTarget.getId()).toBe('planet-1');
    });
  });

  describe('target info updates', () => {
    let mockAsteroid;

    beforeEach(() => {
      mockAsteroid = {
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-1',
        getMass: () => 100,
        getHealth: () => 2,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
    });

    it('should update target info when target exists', () => {
      targetingSystem.currentTarget = mockAsteroid;
      targetingSystem.updateTargetInfo();
      
      expect(mockUI.updateTargetInfo).toHaveBeenCalled();
      const callArgs = mockUI.updateTargetInfo.mock.calls[0][0];
      expect(callArgs.id).toBe('asteroid-1');
      expect(callArgs.mass).toBe(100);
      expect(callArgs.health).toBe(2);
      expect(callArgs.maxHealth).toBe(3);
    });

    it('should calculate distance to target', () => {
      targetingSystem.currentTarget = mockAsteroid;
      targetingSystem.updateTargetInfo();
      
      const callArgs = mockUI.updateTargetInfo.mock.calls[0][0];
      expect(callArgs.distance).toBeCloseTo(10, 1);
    });

    it('should clear target info when target is dead', () => {
      mockAsteroid.isAlive.mockReturnValue(false);
      targetingSystem.currentTarget = mockAsteroid;
      
      targetingSystem.updateTargetInfo();
      
      expect(mockUI.clearTargetInfo).toHaveBeenCalled();
      expect(targetingSystem.currentTarget).toBeNull();
    });

    it('should clear target info when no target', () => {
      targetingSystem.currentTarget = null;
      targetingSystem.updateTargetInfo();
      
      expect(mockUI.clearTargetInfo).toHaveBeenCalled();
    });
  });

  describe('nav target info updates', () => {
    let mockPlanet;

    beforeEach(() => {
      mockPlanet = {
        getPosition: vi.fn(() => new THREE.Vector3(100, 0, 0)),
        setNavTargeted: vi.fn(),
        getId: () => 'planet-1',
        getName: () => 'Test Planet',
        getMass: () => 10000,
        isCommable: () => true,
        getType: () => 'planet',
        radius: 5,
        getServices: null
      };
      mockSpaceship.flags.isDocked = false;
    });

    it('should update nav target info', () => {
      targetingSystem.currentNavTarget = mockPlanet;
      targetingSystem.updateNavTargetInfo();
      
      expect(mockUI.updateNavTargetInfo).toHaveBeenCalled();
      const callArgs = mockUI.updateNavTargetInfo.mock.calls[0][0];
      expect(callArgs.id).toBe('planet-1');
      expect(callArgs.name).toBe('Test Planet');
      expect(callArgs.mass).toBe(10000);
    });

    it('should calculate surface distance for planets', () => {
      targetingSystem.currentNavTarget = mockPlanet;
      targetingSystem.updateNavTargetInfo();
      
      const callArgs = mockUI.updateNavTargetInfo.mock.calls[0][0];
      // Distance should be 100 - 5 (radius) = 95
      expect(callArgs.distance).toBe(95);
    });

    it('should calculate surface distance for stations', () => {
      const mockStation = {
        getPosition: vi.fn(() => new THREE.Vector3(100, 0, 0)),
        setNavTargeted: vi.fn(),
        getId: () => 'station-1',
        getName: () => 'Test Station',
        getMass: () => 5000,
        isCommable: () => true,
        getType: () => 'station',
        size: 10,
        getServices: null
      };
      
      targetingSystem.currentNavTarget = mockStation;
      targetingSystem.updateNavTargetInfo();
      
      const callArgs = mockUI.updateNavTargetInfo.mock.calls[0][0];
      // Distance should be 100 - 10 (size) = 90
      expect(callArgs.distance).toBe(90);
    });

    it('should detect when docked with nav target planet', () => {
      mockSpaceship.flags.isDocked = true;
      mockSpaceship.flags.dockContext = 'planet';
      mockSpaceship.flags.docketPlanetId = 'planet-1';
      
      targetingSystem.currentNavTarget = mockPlanet;
      targetingSystem.updateNavTargetInfo();
      
      const callArgs = mockUI.updateNavTargetInfo.mock.calls[0][0];
      expect(callArgs.isDockedWithTarget).toBe(true);
    });

    it('should detect when docked with nav target station', () => {
      const mockStation = {
        getPosition: vi.fn(() => new THREE.Vector3(100, 0, 0)),
        setNavTargeted: vi.fn(),
        getId: () => 'station-1',
        getName: () => 'Test Station',
        getMass: () => 5000,
        isCommable: () => true,
        getType: () => 'station',
        size: 10,
        getServices: null
      };
      
      mockSpaceship.flags.isDocked = true;
      mockSpaceship.flags.dockContext = 'station';
      mockSpaceship.flags.dockedStationId = 'station-1';
      
      targetingSystem.currentNavTarget = mockStation;
      targetingSystem.updateNavTargetInfo();
      
      const callArgs = mockUI.updateNavTargetInfo.mock.calls[0][0];
      expect(callArgs.isDockedWithTarget).toBe(true);
    });

    it('should clear nav target info when no target', () => {
      targetingSystem.currentNavTarget = null;
      targetingSystem.updateNavTargetInfo();
      
      expect(mockUI.clearNavTargetInfo).toHaveBeenCalled();
    });
  });

  describe('combat target cycling', () => {
    let asteroid1, asteroid2, asteroid3;

    beforeEach(() => {
      asteroid1 = {
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-1',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
      asteroid2 = {
        getPosition: vi.fn(() => new THREE.Vector3(3, 0, -10)), // Far to the right
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-2',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
      asteroid3 = {
        getPosition: vi.fn(() => new THREE.Vector3(1, 0, -10)), // Slightly to the right
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-3',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
      mockAsteroids.push(asteroid1, asteroid2, asteroid3);
    });

    it('should build combat target cycle sorted by distance', () => {
      targetingSystem.buildCombatTargetCycle();
      
      expect(targetingSystem.combatTargetCycle.length).toBe(3);
      // Closest to crosshair should be first (asteroid1 at x=0)
      expect(targetingSystem.combatTargetCycle[0].getId()).toBe('asteroid-1');
    });

    it('should cycle through targets', () => {
      targetingSystem.cycleCombatTarget();
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-1');
      
      targetingSystem.cycleCombatTarget();
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-3');
      
      targetingSystem.cycleCombatTarget();
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-2');
    });

    it('should wrap around to first target', () => {
      targetingSystem.cycleCombatTarget();
      targetingSystem.cycleCombatTarget();
      targetingSystem.cycleCombatTarget();
      // Cycled through all 3
      
      targetingSystem.cycleCombatTarget();
      // Should wrap to first
      expect(targetingSystem.currentTarget.getId()).toBe('asteroid-1');
    });

    it('should clear previous target when cycling', () => {
      targetingSystem.cycleCombatTarget();
      const firstTarget = targetingSystem.currentTarget;
      
      targetingSystem.cycleCombatTarget();
      
      expect(firstTarget.setTargeted).toHaveBeenCalledWith(false);
    });

    it('should reset cycle after timeout', () => {
      targetingSystem.cycleCombatTarget();
      expect(targetingSystem.combatCycleIndex).toBe(0);
      
      // Simulate timeout
      targetingSystem.lastTargetTime = Date.now() - 4000;
      targetingSystem.cycleCombatTarget();
      
      // Should rebuild and start from beginning
      expect(targetingSystem.combatCycleIndex).toBe(0);
    });

    it('should play sound when cycling', () => {
      targetingSystem.cycleCombatTarget();
      expect(mockSoundManager.playTargetSelectedSound).toHaveBeenCalled();
    });
  });

  describe('nav target cycling', () => {
    let planet1, planet2, station1;

    beforeEach(() => {
      planet1 = {
        getPosition: vi.fn(() => new THREE.Vector3(3, 0, -10)), // To the right
        setNavTargeted: vi.fn(),
        getId: () => 'planet-1',
        getName: () => 'Planet 1',
        getMass: () => 10000,
        isCommable: () => true,
        getType: () => 'planet',
        radius: 5
      };
      planet2 = {
        getPosition: vi.fn(() => new THREE.Vector3(5, 0, -10)), // Farther right
        setNavTargeted: vi.fn(),
        getId: () => 'planet-2',
        getName: () => 'Planet 2',
        getMass: () => 10000,
        isCommable: () => true,
        getType: () => 'planet',
        radius: 5
      };
      station1 = {
        getPosition: vi.fn(() => new THREE.Vector3(1, 0, -10)), // Closest to center
        setNavTargeted: vi.fn(),
        getId: () => 'station-1',
        getName: () => 'Station 1',
        getMass: () => 5000,
        isCommable: () => true,
        getType: () => 'station',
        size: 10
      };
      mockPlanets.push(planet1, planet2);
      mockStations.push(station1);
    });

    it('should build nav target cycle sorted by distance', () => {
      targetingSystem.buildNavTargetCycle();
      
      expect(targetingSystem.navTargetCycle.length).toBe(3);
      // Station is closest (x=1)
      expect(targetingSystem.navTargetCycle[0].getId()).toBe('station-1');
    });

    it('should cycle through nav targets', () => {
      targetingSystem.cycleNavTarget();
      expect(targetingSystem.currentNavTarget.getId()).toBe('station-1');
      
      targetingSystem.cycleNavTarget();
      expect(targetingSystem.currentNavTarget.getId()).toBe('planet-1');
    });

    it('should wrap around nav targets', () => {
      for (let i = 0; i < 4; i++) {
        targetingSystem.cycleNavTarget();
      }
      // Should wrap back to first
      expect(targetingSystem.currentNavTarget.getId()).toBe('station-1');
    });
  });

  describe('homing state computation', () => {
    let mockAsteroid;

    beforeEach(() => {
      mockAsteroid = {
        getPosition: vi.fn(() => new THREE.Vector3(0, 0, -10)),
        isAlive: vi.fn(() => true),
        setTargeted: vi.fn(),
        getId: () => 'asteroid-1',
        getMass: () => 100,
        getHealth: () => 3,
        getMaxHealth: () => 3,
        isCommable: () => false
      };
    });

    it('should return false when no target', () => {
      targetingSystem.currentTarget = null;
      expect(targetingSystem.computeHomingState()).toBe(false);
    });

    it('should return false when target is dead', () => {
      mockAsteroid.isAlive.mockReturnValue(false);
      targetingSystem.currentTarget = mockAsteroid;
      expect(targetingSystem.computeHomingState()).toBe(false);
    });

    it('should return true when target is in cone and range', () => {
      targetingSystem.currentTarget = mockAsteroid;
      const homingState = targetingSystem.computeHomingState();
      // Should be true since asteroid is directly ahead at z=-10
      expect(homingState).toBe(true);
    });

    it('should return false when target is out of range', () => {
      mockAsteroid.getPosition.mockReturnValue(new THREE.Vector3(0, 0, -10000));
      targetingSystem.currentTarget = mockAsteroid;
      expect(targetingSystem.computeHomingState()).toBe(false);
    });
  });

  describe('lead target calculation', () => {
    it('should return null when no target', () => {
      targetingSystem.currentTarget = null;
      expect(targetingSystem.calculateLeadTarget()).toBeNull();
    });

    it('should return current position for stationary target', () => {
      const mockAsteroid = {
        getPosition: vi.fn(() => new THREE.Vector3(10, 0, 0)),
        isAlive: vi.fn(() => true),
        velocity: new THREE.Vector3(0, 0, 0)
      };
      targetingSystem.currentTarget = mockAsteroid;
      
      const lead = targetingSystem.calculateLeadTarget();
      expect(lead.x).toBeCloseTo(10, 1);
      expect(lead.y).toBeCloseTo(0, 1);
      expect(lead.z).toBeCloseTo(0, 1);
    });

    it('should calculate lead position for moving target', () => {
      const mockTarget = {
        getPosition: vi.fn(() => new THREE.Vector3(10, 0, 0)),
        isAlive: vi.fn(() => true),
        velocity: new THREE.Vector3(5, 0, 0) // Moving in +X
      };
      targetingSystem.currentTarget = mockTarget;
      
      const lead = targetingSystem.calculateLeadTarget();
      // Lead position should be ahead of current position
      expect(lead.x).toBeGreaterThan(10);
    });

    it('should return valid Vector3 for lead calculation', () => {
      const mockTarget = {
        getPosition: vi.fn(() => new THREE.Vector3(10, 5, -3)),
        isAlive: vi.fn(() => true),
        velocity: new THREE.Vector3(2, 1, -1)
      };
      targetingSystem.currentTarget = mockTarget;
      
      const lead = targetingSystem.calculateLeadTarget();
      expect(lead).toBeInstanceOf(THREE.Vector3);
      expect(isNaN(lead.x)).toBe(false);
      expect(isNaN(lead.y)).toBe(false);
      expect(isNaN(lead.z)).toBe(false);
    });

    it('should use getVelocity method if velocity property not available', () => {
      const mockTarget = {
        getPosition: vi.fn(() => new THREE.Vector3(10, 0, 0)),
        isAlive: vi.fn(() => true),
        getVelocity: () => new THREE.Vector3(5, 0, 0)
      };
      targetingSystem.currentTarget = mockTarget;
      
      const lead = targetingSystem.calculateLeadTarget();
      expect(lead.x).toBeGreaterThan(10);
    });
  });

  describe('convenience getters', () => {
    it('should get current combat target', () => {
      const mockTarget = { id: 'test' };
      targetingSystem.currentTarget = mockTarget;
      expect(targetingSystem.getCurrentCombatTarget()).toBe(mockTarget);
    });

    it('should get current nav target', () => {
      const mockTarget = { id: 'test-nav' };
      targetingSystem.currentNavTarget = mockTarget;
      expect(targetingSystem.getCurrentNavTarget()).toBe(mockTarget);
    });
  });

  describe('NPC ship targeting', () => {
    it('should target loaded NPC ships', () => {
      const mockNPC = {
        loaded: true,
        isAlive: vi.fn(() => true),
        mesh: {
          traverse: vi.fn((callback) => {
            const mockMesh = {
              isMesh: true,
              getWorldPosition: vi.fn((target) => {
                target.set(0, 0, -10);
                return target;
              })
            };
            callback(mockMesh);
          }),
          userData: {}
        },
        getName: () => 'Test NPC',
        getMass: () => 1000,
        getHealth: () => 100,
        getMaxHealth: () => 100,
        isCommable: () => true,
        velocity: new THREE.Vector3(0, 0, 0)
      };
      mockNPCShips.push(mockNPC);

      targetingSystem.targetNearestCombat();
      
      expect(targetingSystem.currentTarget).toBeDefined();
      expect(targetingSystem.currentTarget.getId()).toBe('npcship-0');
    });

    it('should skip unloaded NPCs', () => {
      const mockNPC = {
        loaded: false,
        isAlive: vi.fn(() => true),
        mesh: {}
      };
      mockNPCShips.push(mockNPC);

      targetingSystem.targetNearestCombat();
      
      expect(targetingSystem.currentTarget).toBeNull();
    });
  });
});
