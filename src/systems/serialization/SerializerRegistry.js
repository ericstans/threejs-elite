// Simple registry mapping type -> { save(object), load(state, context) }
export class SerializerRegistry {
  constructor() { this._map = new Map(); }
  register(type, handlers) { this._map.set(type, handlers); }
  save(obj) {
    const type = obj.getType?.();
    if (!type || !this._map.has(type)) return null;
    const { save } = this._map.get(type);
    return { type, ...save(obj) };
  }
  load(state, context) {
    const { type } = state;
    const handlers = this._map.get(type);
    if (!handlers) throw new Error('No serializer for type ' + type);
    return handlers.load(state, context);
  }
}
