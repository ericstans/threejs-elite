// Hybrid sector definitions: explicit entities + procedural (seeded) asteroid field
// This can be extended or externally loaded later.
export const sectorDefinitions = {
  'sector-1': {
    id: 'sector-1',
    name: 'Aridus Sector',
    planets: [
      { type: 'planet', name: 'Aridus Prime', radius: 80, color: 0x8B4513, greeting: 'Thank you for contacting Aridus Prime.', position: { x: 200, y: 0, z: -500 }, rotationSpeed: 0.05 },
      { type: 'planet', name: 'Oceanus', radius: 60, color: 0x4169E1, greeting: 'Thank you for contacting Oceanus.', position: { x: -300, y: 100, z: -800 }, rotationSpeed: 0.07 }
    ],
    stations: [
      { type: 'station', name: 'Oceanus Station', planetName: 'Oceanus', orbitRadius: 120, size: 28, orbitSpeed: 0.05 }
    ],
    asteroidField: { seed: 0x1a2b, destroyedIds: [], center: { x: -50, y: 50, z: -650 }, size: 1200 }
  }
};

export function getSectorDefinition(id) { return sectorDefinitions[id]; }