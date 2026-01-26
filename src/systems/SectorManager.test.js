import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SectorManager } from './SectorManager.js';

describe('SectorManager', () => {
  let sectorManager;
  let mockGameEngine;
  let mockCreateByType;

  beforeEach(() => {
    mockGameEngine = {
      scene: {
        add: vi.fn(),
        remove: vi.fn()
      },
      addEntity: vi.fn(),
      removeEntity: vi.fn()
    };

    mockCreateByType = vi.fn();

    sectorManager = new SectorManager({
      gameEngine: mockGameEngine,
      createByType: mockCreateByType
    });
  });

  describe('initialization', () => {
    it('should initialize with null current sector', () => {
      expect(sectorManager.currentSectorId).toBeNull();
    });

    it('should initialize with empty sectors map', () => {
      expect(sectorManager.sectors.size).toBe(0);
    });

    it('should store game engine reference', () => {
      expect(sectorManager.gameEngine).toBe(mockGameEngine);
    });

    it('should store createByType function', () => {
      expect(sectorManager.createByType).toBe(mockCreateByType);
    });

    it('should provide getGameEngine accessor', () => {
      expect(sectorManager.getGameEngine()).toBe(mockGameEngine);
    });

    it('should create serializer registry', () => {
      expect(sectorManager.registry).toBeDefined();
    });
  });

  describe('sector creation and retrieval', () => {
    it('should create sector on first access', () => {
      const sector = sectorManager._ensureSector('sector-1');
      
      expect(sector).toBeDefined();
      expect(sector.id).toBe('sector-1');
      expect(sector.dynamic).toEqual({ entities: [] });
      expect(sector.asteroidField).toBeNull();
    });

    it('should return existing sector on subsequent access', () => {
      const sector1 = sectorManager._ensureSector('sector-1');
      sector1.customData = 'test';
      
      const sector2 = sectorManager._ensureSector('sector-1');
      
      expect(sector2.customData).toBe('test');
      expect(sector2).toBe(sector1);
    });

    it('should track multiple sectors independently', () => {
      const sector1 = sectorManager._ensureSector('sector-1');
      const sector2 = sectorManager._ensureSector('sector-2');
      
      expect(sector1.id).toBe('sector-1');
      expect(sector2.id).toBe('sector-2');
      expect(sectorManager.sectors.size).toBe(2);
    });
  });

  describe('serializer registration', () => {
    it('should register serializer for type', () => {
      const handlers = {
        save: vi.fn(),
        load: vi.fn()
      };
      
      sectorManager.registerSerializer('asteroid', handlers);
      
      expect(sectorManager.registry._map.get('asteroid')).toBe(handlers);
    });

    it('should allow multiple serializer registrations', () => {
      const asteroidsHandlers = { save: vi.fn(), load: vi.fn() };
      const planetsHandlers = { save: vi.fn(), load: vi.fn() };
      
      sectorManager.registerSerializer('asteroid', asteroidsHandlers);
      sectorManager.registerSerializer('planet', planetsHandlers);
      
      expect(sectorManager.registry._map.size).toBe(2);
    });
  });

  describe('save current sector', () => {
    beforeEach(() => {
      // Set up serializers for testing
      sectorManager.registerSerializer('asteroid', {
        save: (obj) => ({ mass: obj.mass, position: obj.position }),
        load: vi.fn()
      });
      sectorManager.registerSerializer('planet', {
        save: (obj) => ({ name: obj.name, radius: obj.radius }),
        load: vi.fn()
      });
    });

    it('should save entities to current sector', () => {
      sectorManager.currentSectorId = 'sector-1';
      const entities = [
        { getType: () => 'asteroid', mass: 100, position: [10, 20, 30] },
        { getType: () => 'planet', name: 'Earth', radius: 50 }
      ];
      
      sectorManager.saveCurrent(entities);
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.dynamic.entities).toHaveLength(2);
      expect(sector.dynamic.entities[0].type).toBe('asteroid');
      expect(sector.dynamic.entities[0].mass).toBe(100);
      expect(sector.dynamic.entities[1].type).toBe('planet');
      expect(sector.dynamic.entities[1].name).toBe('Earth');
    });

    it('should skip entities without getType', () => {
      sectorManager.currentSectorId = 'sector-1';
      const entities = [
        { getType: () => 'asteroid', mass: 100 },
        { mass: 50 } // No getType
      ];
      
      sectorManager.saveCurrent(entities);
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.dynamic.entities).toHaveLength(1);
    });

    it('should skip entities with no serializer', () => {
      sectorManager.currentSectorId = 'sector-1';
      const entities = [
        { getType: () => 'asteroid', mass: 100 },
        { getType: () => 'unknown-type', data: 'test' }
      ];
      
      sectorManager.saveCurrent(entities);
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.dynamic.entities).toHaveLength(1);
      expect(sector.dynamic.entities[0].type).toBe('asteroid');
    });

    it('should do nothing if no current sector', () => {
      sectorManager.currentSectorId = null;
      const entities = [
        { getType: () => 'asteroid', mass: 100 }
      ];
      
      expect(() => sectorManager.saveCurrent(entities)).not.toThrow();
      expect(sectorManager.sectors.size).toBe(0);
    });

    it('should overwrite previous save data', () => {
      sectorManager.currentSectorId = 'sector-1';
      const entities1 = [{ getType: () => 'asteroid', mass: 100 }];
      const entities2 = [{ getType: () => 'asteroid', mass: 200 }];
      
      sectorManager.saveCurrent(entities1);
      sectorManager.saveCurrent(entities2);
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.dynamic.entities).toHaveLength(1);
      expect(sector.dynamic.entities[0].mass).toBe(200);
    });
  });

  describe('load sector', () => {
    beforeEach(() => {
      sectorManager.registerSerializer('asteroid', {
        save: (obj) => ({ mass: obj.mass }),
        load: (state, context) => ({
          type: 'asteroid',
          mass: state.mass,
          mesh: { parent: null },
          getType: () => 'asteroid'
        })
      });
    });

    it('should load entities from sector', () => {
      const sector = sectorManager._ensureSector('sector-1');
      sector.dynamic.entities = [
        { type: 'asteroid', mass: 100 },
        { type: 'asteroid', mass: 200 }
      ];
      
      const entities = sectorManager.loadSector('sector-1', {});
      
      expect(entities).toHaveLength(2);
      expect(entities[0].mass).toBe(100);
      expect(entities[1].mass).toBe(200);
    });

    it('should set current sector id', () => {
      sectorManager.loadSector('sector-1', {});
      
      expect(sectorManager.currentSectorId).toBe('sector-1');
    });

    it('should return empty array for new sector', () => {
      const entities = sectorManager.loadSector('sector-new', {});
      
      expect(entities).toEqual([]);
    });

    it('should call onAsteroidFieldState callback if present', () => {
      const sector = sectorManager._ensureSector('sector-1');
      sector.asteroidField = { density: 0.5, radius: 100 };
      const onAsteroidFieldState = vi.fn();
      
      sectorManager.loadSector('sector-1', { onAsteroidFieldState });
      
      expect(onAsteroidFieldState).toHaveBeenCalledWith({ density: 0.5, radius: 100 });
    });

    it('should not call callback if no asteroid field', () => {
      const onAsteroidFieldState = vi.fn();
      
      sectorManager.loadSector('sector-1', { onAsteroidFieldState });
      
      expect(onAsteroidFieldState).not.toHaveBeenCalled();
    });

    it('should handle missing context', () => {
      const sector = sectorManager._ensureSector('sector-1');
      sector.dynamic.entities = [{ type: 'asteroid', mass: 100 }];
      
      expect(() => sectorManager.loadSector('sector-1')).not.toThrow();
    });
  });

  describe('switch sector', () => {
    let mockAsteroid1, mockAsteroid2, mockAsteroid3;

    beforeEach(() => {
      mockAsteroid1 = {
        getType: () => 'asteroid',
        mass: 100,
        mesh: { parent: mockGameEngine.scene }
      };
      mockAsteroid2 = {
        getType: () => 'asteroid',
        mass: 200,
        mesh: { parent: mockGameEngine.scene }
      };
      mockAsteroid3 = {
        getType: () => 'asteroid',
        mass: 300,
        mesh: { parent: null }
      };

      sectorManager.registerSerializer('asteroid', {
        save: (obj) => ({ mass: obj.mass }),
        load: (state) => ({
          type: 'asteroid',
          mass: state.mass,
          mesh: { parent: null },
          getType: () => 'asteroid'
        })
      });
    });

    it('should save current sector entities', () => {
      sectorManager.currentSectorId = 'sector-1';
      const gatherEntities = vi.fn(() => [mockAsteroid1, mockAsteroid2]);
      
      sectorManager.switchSector('sector-2', {}, [], gatherEntities);
      
      expect(gatherEntities).toHaveBeenCalled();
      const sector1 = sectorManager.sectors.get('sector-1');
      expect(sector1.dynamic.entities).toHaveLength(2);
    });

    it('should remove current sector entities from engine', () => {
      sectorManager.currentSectorId = 'sector-1';
      const gatherEntities = vi.fn(() => [mockAsteroid1, mockAsteroid2]);
      
      sectorManager.switchSector('sector-2', {}, [mockAsteroid1, mockAsteroid2], gatherEntities);
      
      expect(mockGameEngine.removeEntity).toHaveBeenCalledWith(mockAsteroid1);
      expect(mockGameEngine.removeEntity).toHaveBeenCalledWith(mockAsteroid2);
    });

    it('should remove meshes from scene', () => {
      sectorManager.currentSectorId = 'sector-1';
      const removeSpy = vi.fn();
      mockAsteroid1.mesh.parent.remove = removeSpy;
      const gatherEntities = vi.fn(() => [mockAsteroid1]);
      
      sectorManager.switchSector('sector-2', {}, [mockAsteroid1], gatherEntities);
      
      expect(removeSpy).toHaveBeenCalledWith(mockAsteroid1.mesh);
    });

    it('should load target sector entities', () => {
      const sector2 = sectorManager._ensureSector('sector-2');
      sector2.dynamic.entities = [{ type: 'asteroid', mass: 500 }];
      
      const entities = sectorManager.switchSector('sector-2', {}, [], () => []);
      
      expect(entities).toHaveLength(1);
      expect(entities[0].mass).toBe(500);
    });

    it('should add new entities to engine', () => {
      const sector2 = sectorManager._ensureSector('sector-2');
      sector2.dynamic.entities = [
        { type: 'asteroid', mass: 500 },
        { type: 'asteroid', mass: 600 }
      ];
      
      sectorManager.switchSector('sector-2', {}, [], () => []);
      
      expect(mockGameEngine.addEntity).toHaveBeenCalledTimes(2);
    });

    it('should add meshes to scene', () => {
      const sector2 = sectorManager._ensureSector('sector-2');
      sector2.dynamic.entities = [{ type: 'asteroid', mass: 500 }];
      
      sectorManager.switchSector('sector-2', {}, [], () => []);
      
      expect(mockGameEngine.scene.add).toHaveBeenCalled();
    });

    it('should update current sector id', () => {
      sectorManager.currentSectorId = 'sector-1';
      
      sectorManager.switchSector('sector-2', {}, [], () => []);
      
      expect(sectorManager.currentSectorId).toBe('sector-2');
    });

    it('should handle switching from null sector', () => {
      sectorManager.currentSectorId = null;
      const sector1 = sectorManager._ensureSector('sector-1');
      sector1.dynamic.entities = [{ type: 'asteroid', mass: 100 }];
      
      const entities = sectorManager.switchSector('sector-1', {}, [], () => []);
      
      expect(entities).toHaveLength(1);
    });

    it('should handle entities without meshes', () => {
      sectorManager.currentSectorId = 'sector-1';
      const entityWithoutMesh = { getType: () => 'asteroid', mass: 100 };
      const gatherEntities = vi.fn(() => [entityWithoutMesh]);
      
      expect(() => sectorManager.switchSector('sector-2', {}, [entityWithoutMesh], gatherEntities)).not.toThrow();
    });

    it('should handle missing removeEntity method', () => {
      delete mockGameEngine.removeEntity;
      sectorManager.currentSectorId = 'sector-1';
      const gatherEntities = vi.fn(() => [mockAsteroid1]);
      
      expect(() => sectorManager.switchSector('sector-2', {}, [mockAsteroid1], gatherEntities)).not.toThrow();
    });

    it('should handle missing addEntity method', () => {
      delete mockGameEngine.addEntity;
      const sector2 = sectorManager._ensureSector('sector-2');
      sector2.dynamic.entities = [{ type: 'asteroid', mass: 500 }];
      
      expect(() => sectorManager.switchSector('sector-2', {}, [], () => [])).not.toThrow();
    });
  });

  describe('asteroid field state management', () => {
    it('should save asteroid field state for current sector', () => {
      sectorManager.currentSectorId = 'sector-1';
      const fieldState = { density: 0.5, radius: 100, seed: 42 };
      
      sectorManager.saveAsteroidFieldState(fieldState);
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.asteroidField).toEqual(fieldState);
    });

    it('should not save if no current sector', () => {
      sectorManager.currentSectorId = null;
      const fieldState = { density: 0.5 };
      
      expect(() => sectorManager.saveAsteroidFieldState(fieldState)).not.toThrow();
      expect(sectorManager.sectors.size).toBe(0);
    });

    it('should create a copy of field state', () => {
      sectorManager.currentSectorId = 'sector-1';
      const fieldState = { density: 0.5, radius: 100 };
      
      sectorManager.saveAsteroidFieldState(fieldState);
      fieldState.density = 0.8;
      
      const sector = sectorManager.sectors.get('sector-1');
      expect(sector.asteroidField.density).toBe(0.5);
    });

    it('should get asteroid field state for current sector', () => {
      sectorManager.currentSectorId = 'sector-1';
      const fieldState = { density: 0.5, radius: 100 };
      sectorManager.saveAsteroidFieldState(fieldState);
      
      const retrieved = sectorManager.getAsteroidFieldState();
      
      expect(retrieved).toEqual(fieldState);
    });

    it('should get asteroid field state for specified sector', () => {
      sectorManager.currentSectorId = 'sector-1';
      const sector2 = sectorManager._ensureSector('sector-2');
      sector2.asteroidField = { density: 0.7, radius: 150 };
      
      const retrieved = sectorManager.getAsteroidFieldState('sector-2');
      
      expect(retrieved.density).toBe(0.7);
    });

    it('should return null for sector without asteroid field', () => {
      const retrieved = sectorManager.getAsteroidFieldState('sector-new');
      
      expect(retrieved).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    beforeEach(() => {
      sectorManager.registerSerializer('asteroid', {
        save: (obj) => ({ mass: obj.mass, position: obj.position }),
        load: (state) => ({
          type: 'asteroid',
          mass: state.mass,
          position: state.position,
          mesh: { parent: null },
          getType: () => 'asteroid'
        })
      });
    });

    it('should persist and restore sector data across switches', () => {
      // Start in sector-1
      sectorManager.currentSectorId = 'sector-1';
      const sector1Entities = [
        { getType: () => 'asteroid', mass: 100, position: [1, 2, 3], mesh: { parent: mockGameEngine.scene } }
      ];
      sectorManager.saveCurrent(sector1Entities);

      // Switch to sector-2
      sectorManager.switchSector('sector-2', {}, sector1Entities, () => sector1Entities);
      expect(sectorManager.currentSectorId).toBe('sector-2');

      // Save sector-2 entities
      const sector2Entities = [
        { getType: () => 'asteroid', mass: 200, position: [4, 5, 6], mesh: { parent: mockGameEngine.scene } }
      ];
      sectorManager.saveCurrent(sector2Entities);

      // Switch back to sector-1
      const restoredEntities = sectorManager.switchSector('sector-1', {}, sector2Entities, () => sector2Entities);

      // Verify sector-1 data was preserved
      expect(restoredEntities).toHaveLength(1);
      expect(restoredEntities[0].mass).toBe(100);
      expect(restoredEntities[0].position).toEqual([1, 2, 3]);
    });

    it('should maintain asteroid field state across switches', () => {
      // Set up sector-1 with asteroid field
      sectorManager.currentSectorId = 'sector-1';
      sectorManager.saveAsteroidFieldState({ density: 0.5, radius: 100 });

      // Switch to sector-2
      sectorManager.switchSector('sector-2', {}, [], () => []);
      sectorManager.saveAsteroidFieldState({ density: 0.8, radius: 200 });

      // Switch back to sector-1
      const onAsteroidFieldState = vi.fn();
      sectorManager.switchSector('sector-1', { onAsteroidFieldState }, [], () => []);

      // Verify asteroid field was restored
      expect(onAsteroidFieldState).toHaveBeenCalledWith({ density: 0.5, radius: 100 });
    });
  });
});
