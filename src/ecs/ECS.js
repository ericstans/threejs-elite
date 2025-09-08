// Lightweight ECS core (incremental, non-breaking)
// Entity = numeric id. Components stored in sparse maps by component name.

let NEXT_ENTITY_ID = 1;

export class ECSRegistry {
  constructor() {
    this.entities = new Set();
    this.components = new Map(); // key -> Map(entityId, componentData)
    this.systems = []; // { order, update(registry, dt) }
  }

  createEntity() {
    const id = NEXT_ENTITY_ID++;
    this.entities.add(id);
    return id;
  }

  destroyEntity(id) {
    this.entities.delete(id);
    for (const store of this.components.values()) {
      store.delete(id);
    }
  }

  // Component store helpers
  _ensureStore(name) {
    if (!this.components.has(name)) this.components.set(name, new Map());
    return this.components.get(name);
  }

  addComponent(id, name, data) {
    this._ensureStore(name).set(id, data);
  }

  getComponent(id, name) {
    return this.components.get(name)?.get(id);
  }

  removeComponent(id, name) {
    this.components.get(name)?.delete(id);
  }

  view(...names) {
    // Return iterable of entity ids that have all listed components
    if (names.length === 0) return [];
    const stores = names.map(n => this.components.get(n));
    if (stores.some(s => !s)) return [];
    // Pick smallest store to iterate
    stores.sort((a,b)=>a.size - b.size);
    const smallest = stores[0];
    const result = [];
    for (const id of smallest.keys()) {
      let ok = true;
      for (let i = 1;i < stores.length;i++) {
        if (!stores[i].has(id)) { ok = false; break; }
      }
      if (ok) result.push(id);
    }
    return result;
  }

  registerSystem(system, order = 0) {
    this.systems.push({ system, order });
    this.systems.sort((a,b)=>a.order - b.order);
  }

  update(dt) {
    for (const { system } of this.systems) {
      system.update(this, dt);
    }
  }
}

// Helper: shallow serialize entity components (for later save-game diffing)
export function serializeEntity(registry, id) {
  const out = { id, components: {} };
  for (const [name, store] of registry.components.entries()) {
    if (store.has(id)) out.components[name] = { ...store.get(id) };
  }
  return out;
}
