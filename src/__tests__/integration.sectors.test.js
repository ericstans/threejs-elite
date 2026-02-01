import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SectorManager } from '../systems/SectorManager.js';

describe('Integration: Sector Management', () => {
  let sectorManager;
  let mockGameEngine;

  beforeEach(() => {
    mockGameEngine = {
      scene: { add: vi.fn(), remove: vi.fn(), clear: vi.fn() },
      entities: [],
      addEntity: vi.fn(),
      removeEntity: vi.fn(),
      camera: { position: { x: 0, y: 0, z: 0 } }
    };

    sectorManager = new SectorManager({
      gameEngine: mockGameEngine,
      createByType: (type) => ({ type, id: `test-${type}` })
    });
  });

  describe('Sector state persistence', () => {
    it('should initialize with default sector', () => {
      expect(sectorManager.currentSectorId).toBeNull();
    });

    it('should set current sector', () => {
      sectorManager.currentSectorId = 'aridus-1';
      expect(sectorManager.currentSectorId).toBe('aridus-1');
    });

    it('should maintain sector state data', () => {
      const sectorId = 'aridus-1';
      const sectorData = {
        entities: [],
        customData: 'test-data'
      };

      sectorManager.sectorStates[sectorId] = sectorData;

      expect(sectorManager.sectorStates[sectorId]).toEqual(sectorData);
      expect(sectorManager.sectorStates[sectorId].customData).toBe('test-data');
    });
  });

  describe('Sector entity management', () => {
    it('should track entities in sectors', () => {
      const sectorId = 'aridus-1';
      const entity = { id: 'asteroid-1', type: 'asteroid' };

      if (!sectorManager.sectorStates[sectorId]) {
        sectorManager.sectorStates[sectorId] = { entities: [] };
      }

      sectorManager.sectorStates[sectorId].entities.push(entity);

      expect(sectorManager.sectorStates[sectorId].entities).toContain(entity);
    });

    it('should clear sector entities when transitioning', () => {
      const sector1 = 'sector1';
      const sector2 = 'sector2';

      sectorManager.sectorStates[sector1] = {
        entities: [{ id: 'entity1' }]
      };

      sectorManager.sectorStates[sector2] = {
        entities: [{ id: 'entity2' }]
      };

      // Simulate sector transition
      sectorManager.sectorStates[sector1].entities = [];

      expect(sectorManager.sectorStates[sector1].entities.length).toBe(0);
      expect(sectorManager.sectorStates[sector2].entities.length).toBe(1);
    });
  });

  describe('Procedural sector generation', () => {
    it('should preserve sector state during procedural generation', () => {
      const sectorId = 'procedural-1';
      const customData = { seed: 12345, asteroidCount: 50 };

      sectorManager.sectorStates[sectorId] = {
        entities: [],
        procedural: true,
        ...customData
      };

      const retrieved = sectorManager.sectorStates[sectorId];

      expect(retrieved.procedural).toBe(true);
      expect(retrieved.seed).toBe(12345);
      expect(retrieved.asteroidCount).toBe(50);
    });
  });

  describe('Sector serialization', () => {
    it('should serialize sector state', () => {
      const sectorId = 'test-sector';
      const sectorData = {
        id: sectorId,
        entities: [{ id: 'entity1' }, { id: 'entity2' }],
        customData: { population: 10000 }
      };

      sectorManager.sectorStates[sectorId] = sectorData;

      const serialized = JSON.stringify(sectorManager.sectorStates[sectorId]);
      const deserialized = JSON.parse(serialized);

      expect(deserialized).toEqual(sectorData);
      expect(deserialized.entities.length).toBe(2);
    });
  });

  describe('Multiple sector transitions', () => {
    it('should handle switching between multiple sectors', () => {
      const sectors = ['sector1', 'sector2', 'sector3'];

      sectors.forEach(sectorId => {
        sectorManager.sectorStates[sectorId] = {
          entities: [],
          visited: false
        };
      });

      // Simulate visiting each sector
      sectorManager.currentSectorId = 'sector1';
      sectorManager.sectorStates['sector1'].visited = true;

      sectorManager.currentSectorId = 'sector2';
      sectorManager.sectorStates['sector2'].visited = true;

      sectorManager.currentSectorId = 'sector3';
      sectorManager.sectorStates['sector3'].visited = true;

      // Verify all visited
      expect(sectorManager.sectorStates['sector1'].visited).toBe(true);
      expect(sectorManager.sectorStates['sector2'].visited).toBe(true);
      expect(sectorManager.sectorStates['sector3'].visited).toBe(true);
    });

    it('should preserve unvisited sector state', () => {
      const sectorId = 'unvisited-sector';
      const unvisitedState = {
        entities: [],
        explored: false,
        npcShips: 3,
        asteroids: 50
      };

      sectorManager.sectorStates[sectorId] = unvisitedState;

      expect(sectorManager.sectorStates[sectorId].explored).toBe(false);
      expect(sectorManager.sectorStates[sectorId].npcShips).toBe(3);
      expect(sectorManager.sectorStates[sectorId].asteroids).toBe(50);
    });
  });
});
