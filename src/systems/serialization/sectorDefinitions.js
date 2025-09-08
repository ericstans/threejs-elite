// Hybrid sector definitions: explicit entities + procedural (seeded) asteroid field
// This can be extended or externally loaded later.
import { aridusPrimeConversation } from '../../conversations/aridusPrime.js';
import { oceanusConversation } from '../../conversations/oceanus.js';

// Available sectors configuration for the sector map
export const availableSectors = [
  { id: 'sector-1', name: 'Aridus Sector', center: { x: -50, y: 50, z: -650 }, size: 1200 },
  { id: 'sector-2', name: 'Zephyrus Spur', center: { x: 400, y: 0, z: -1200 }, size: 1400 },
  { id: 'sector-3', name: 'random(55aa)', seed: 0x55aa, center: { x: -600, y: -100, z: -300 }, size: 1000 },
  { id: 'sector-4', name: 'random(AAAA)', seed: 0xAAAA, center: { x: -600, y: -100, z: -300 }, size: 1000 },
  { id: 'sector-5', name: 'random(1234)', seed: 0x1234, center: { x: -200, y: 0, z: 0 }, size: 500 }
];

export const sectorDefinitions = {
  'sector-1': {
    id: 'sector-1',
    name: 'Aridus Sector',
    planets: [
      { type: 'planet', name: 'Aridus Prime', radius: 80, color: 0x8B4513, greeting: 'Thank you for contacting Aridus Prime.', position: { x: 200, y: 0, z: -500 }, rotationSpeed: 0.05, conversation: aridusPrimeConversation },
      { type: 'planet', name: 'Oceanus', radius: 60, color: 0x4169E1, greeting: 'Thank you for contacting Oceanus.', position: { x: -300, y: 100, z: -800 }, rotationSpeed: 0.07, conversation: oceanusConversation },
      { type: 'planet', name: 'Helia Minor', radius: 45, color: 0xdaa520, greeting: 'Helia Minor control online.', position: { x: 480, y: 60, z: -900 }, rotationSpeed: 0.09, hasMoon: true }
    ],
    stations: [
      { type: 'station', name: 'Oceanus Station', planetName: 'Oceanus', orbitRadius: 120, size: 28, orbitSpeed: 0.05 /*conversation: oceanusConversation */ }
    ],
    asteroidField: { seed: 0x1a2b, destroyedIds: [], center: { x: -50, y: 50, z: -650 }, size: 1200 },
    soundtracks: ['ambient']
  },
  'sector-2': {
    id: 'sector-2',
    name: 'Zephyrus Spur',
    // Two handcrafted anchor planets
    planets: [
      { type: 'planet', name: 'Zephyrus Alpha', radius: 70, color: 0x446677, greeting: 'Zephyrus Alpha relay active.', position: { x: 600, y: 40, z: -1400 }, rotationSpeed: 0.06 },
      { type: 'planet', name: 'Vela Gate', radius: 55, color: 0x8844aa, greeting: 'Vela Gate administrative uplink.', position: { x: -520, y: -60, z: -1100 }, rotationSpeed: 0.08 }
      // Three additional planets will be procedurally generated on load (not listed here)
    ],
    // Optionally a station could be added later; leave empty for now
    stations: [],
    asteroidField: { seed: 0x33dd, destroyedIds: [], center: { x: 400, y: 0, z: -1200 }, size: 1400 },
    hybridProceduralExtras: {
      proceduralPlanetCount: 3, // number of additional procedural planets to spawn
      seedOffset: 0x9e // unique offset so procedural portion differs from baseline seed
    },
    soundtracks: ['ambientb']
  }
};

export function getSectorDefinition(id) { return sectorDefinitions[id]; }
