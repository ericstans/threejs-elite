import { SerializerRegistry } from './serialization/SerializerRegistry.js';

/**
 * SectorManager handles save/load of sector state and switching between sectors.
 * Each sector can have: { id, seed?, blueprints?, dynamic: { entities: [...], removedIds: [...] } }
 */
export class SectorManager {
  constructor({ gameEngine, createByType }) {
    this.gameEngine = gameEngine;
    this.createByType = createByType; // (type, data, context) => instance
    this.registry = new SerializerRegistry();
    this.currentSectorId = null;
    this.sectors = new Map(); // id -> sector state object
  }

  registerSerializer(type, handlers) {
    this.registry.register(type, handlers);
  }

  // Save all live entities for current sector
  saveCurrent(entities) {
    if (!this.currentSectorId) return;
    const serialized = [];
    for (const e of entities) {
      if (!e.getType) continue;
      const state = this.registry.save(e);
      if (state) serialized.push(state);
    }
    const sector = this._ensureSector(this.currentSectorId);
    sector.dynamic = sector.dynamic || {};
    sector.dynamic.entities = serialized;
  }

  // Load sector by id (creates if missing); returns instantiated entities
  loadSector(id, context) {
    this.currentSectorId = id;
    const sector = this._ensureSector(id);
    const out = [];
    if (sector.dynamic && sector.dynamic.entities) {
      for (const state of sector.dynamic.entities) {
        const obj = this.registry.load(state, context);
        out.push(obj);
      }
    }
    // Provide asteroid field meta to caller via context hook if present
    if (sector.asteroidField && context && context.onAsteroidFieldState) {
      context.onAsteroidFieldState(sector.asteroidField);
    }
    return out;
  }

  switchSector(targetId, context, activeEntities, gatherEntitiesFn) {
    // Persist current
    if (this.currentSectorId) {
      this.saveCurrent(gatherEntitiesFn());
      // Remove current entities from engine
      for (const e of activeEntities) {
        if (e.mesh && e.mesh.parent) e.mesh.parent.remove(e.mesh);
        this.gameEngine.removeEntity && this.gameEngine.removeEntity(e);
      }
    }
    // Load target
    const newEntities = this.loadSector(targetId, context);
    for (const e of newEntities) {
      if (this.gameEngine.addEntity) this.gameEngine.addEntity(e);
      if (e.mesh && this.gameEngine.scene) this.gameEngine.scene.add(e.mesh);
    }
    return newEntities;
  }

  _ensureSector(id) {
    if (!this.sectors.has(id)) {
      this.sectors.set(id, { id, dynamic: { entities: [] }, asteroidField: null });
    }
    return this.sectors.get(id);
  }

  saveAsteroidFieldState(state) {
    if (!this.currentSectorId) return;
    const sector = this._ensureSector(this.currentSectorId);
    sector.asteroidField = { ...state };
  }

  getAsteroidFieldState(sectorId = this.currentSectorId) {
    const sector = this._ensureSector(sectorId);
    return sector.asteroidField;
  }
}
