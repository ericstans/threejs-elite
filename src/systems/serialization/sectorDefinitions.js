// Hybrid sector definitions: explicit entities + procedural (seeded) asteroid field
// This can be extended or externally loaded later.
export const sectorDefinitions = {
  'sector-1': {
    id: 'sector-1',
    name: 'Aridus Sector',
    planets: [
      { type: 'planet', name: 'Aridus Prime', radius: 80, color: 0x8B4513, greeting: 'Thank you for contacting Aridus Prime.', position: { x: 200, y: 0, z: -500 }, rotationSpeed: 0.05 },
      { type: 'planet', name: 'Oceanus', radius: 60, color: 0x4169E1, greeting: 'Thank you for contacting Oceanus.', position: { x: -300, y: 100, z: -800 }, rotationSpeed: 0.07 },
      { type: 'planet', name: 'Helia Minor', radius: 45, color: 0xdaa520, greeting: 'Helia Minor control online.', position: { x: 480, y: 60, z: -900 }, rotationSpeed: 0.09, hasMoon: true }
    ],
    stations: [
      { type: 'station', name: 'Oceanus Station', planetName: 'Oceanus', orbitRadius: 120, size: 28, orbitSpeed: 0.05 }
    ],
    asteroidField: { seed: 0x1a2b, destroyedIds: [], center: { x: -50, y: 50, z: -650 }, size: 1200 }
  },
  // Sector-2: Hybrid - some explicit handcrafted planets + allow procedural augment (flag hybrid:true)
  'sector-2': {
    id: 'sector-2',
    name: 'Hybrid Fringe',
    hybrid: true,
    planets: [
      { type: 'planet', name: 'Vestige', radius: 72, color: 0x555577, greeting: 'Vestige relay active.', position: { x: -150, y: -40, z: -700 }, rotationSpeed: 0.04, hasMoon: false },
      { type: 'planet', name: 'Chroma', radius: 52, color: 0x44aa88, greeting: 'Chroma spectrum balanced.', position: { x: 340, y: 80, z: -1050 }, rotationSpeed: 0.11, hasMoon: true }
    ],
    stations: [
      { type: 'station', name: 'Chroma Outpost', planetName: 'Chroma', orbitRadius: 140, size: 24, orbitSpeed: 0.06 }
    ],
    asteroidField: { seed: 0x33dd, destroyedIds: [], center: { x: 400, y: 0, z: -1200 }, size: 1400 }
  },
  // Sector-3: Legacy style (old system) - will be constructed via factory path, not definition usage in switchSector
  'sector-3': {
    id: 'sector-3',
    name: 'Legacy Expanse',
    legacy: true,
    // Keep minimal data for asteroid field only; planets created by factory code path
    asteroidField: { seed: 0x55aa, destroyedIds: [], center: { x: -600, y: -100, z: -300 }, size: 1000 }
  }
};

export function getSectorDefinition(id) { return sectorDefinitions[id]; }