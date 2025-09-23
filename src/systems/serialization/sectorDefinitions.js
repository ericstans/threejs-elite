import { aridusPrimeConversation } from '../../conversations/planets/aridusPrime.js';
import { oceanusConversation } from '../../conversations/planets/oceanus.js';
import { getTradeableItems } from '../../data/CargoItemsData.js';

// Available sectors configuration for the sector map
export const availableSectors = [
  { id: 'sector-1', name: 'Aridus Sector', center: { x: -50, y: 50, z: -650 }, size: 1200 },
  { id: 'sector-2', name: 'Zephyrus Spur', center: { x: 400, y: 0, z: -1200 }, size: 1400 },
  { id: 'sector-3', name: 'Aberrant Sector', center: { x: -600, y: -100, z: -300 }, size: 5000 },
  ...buildProceduralSectors(47)
];

function buildProceduralSectors(count) {
  const sectors = [];
  for (let i = 0; i < count; i++) {
    const seed = Math.floor(Math.random() * 0xFFFF);
    sectors.push({
      id: `sector-proc-${i}`,
      name: `random(${seed.toString(16).toUpperCase().padStart(4, '0')})`,
      seed,
      center: { x: -200, y: 0, z: 0 },
      size: 500
    });
  }
  return sectors;
}

export const sectorDefinitions = {
  'sector-1': {
    id: 'sector-1',
    name: 'Aridus Sector',
    planets: [
      { type: 'planet', name: 'Aridus Prime', radius: 80, color: 0x8B4513, greeting: aridusPrimeConversation.greeting, position: { x: 200, y: 0, z: -500 }, rotationSpeed: 0.05, conversation: aridusPrimeConversation, services: ['refuel+repair', 'shipyard', 'outfitting', 'commodities', 'rumors', 'jobs'], commodities: getTradeableItems().map(item => item.name) },
      { type: 'planet', name: 'Oceanus', radius: 60, color: 0x4169E1, greeting: oceanusConversation.greeting, position: { x: -300, y: 100, z: -800 }, rotationSpeed: 0.07, conversation: oceanusConversation, services: [] }
    ],
    stations: [
      { type: 'station', name: 'Oceanus Station', planetName: 'Oceanus', orbitRadius: 135, size: 28, orbitSpeed: 0.02, services: ['refuel+repair', 'shipyard', 'outfitting', 'commodities', 'rumors', 'jobs'], commodities: getTradeableItems().map(item => item.name) /*conversation: oceanusConversation */ }
    ],
    npcShips: [
      {
        type: 'npcShip',
        name: 'Flea MkII',
        pilotName: 'Narayan',
        shipType: 'Flea',
        position: { x: -50 + 60, y: 50, z: -650 },
        patrolWaypoints: [
          { x: -50 + 60, y: 50, z: -650 },    // Start position
          { x: -50 + 200, y: 50, z: -650 },   // Move right
          { x: -50 + 200, y: 50, z: -750 },   // Move forward
          { x: -50 - 100, y: 50, z: -750 },   // Move left
          { x: -50 - 100, y: 50, z: -650 },   // Move back
          { x: -50 + 60, y: 50, z: -650 }     // Return to start
        ]
        //conversation: genericProceduralShipConversation
      },
      {
        type: 'npcShip',
        name: 'Arrow MkI',
        pilotName: 'Jax',
        shipType: 'Arrow',
        position: { x: -50 + 120, y: 50, z: -650 },
        patrolWaypoints: [
          { x: -50 + 120, y: 50, z: -650 },
          { x: -50 + 220, y: 50, z: -650 },
          { x: -50 + 220, y: 50, z: -750 },
          { x: -50, y: 50, z: -750 },
          { x: -50, y: 50, z: -650 },
          { x: -50 + 120, y: 50, z: -650 }
        ]
      }
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
    stations: [],
    npcShips: [],
    asteroidField: { seed: 0x33dd, destroyedIds: [], center: { x: 400, y: 0, z: -1200 }, size: 1400 },
    // Procedural weighting for services (applies to hybrid extras and resolver)
    planetServiceWeights: { 'refuel+repair': 1, commodities: 0.55, jobs: 0.30 },
    stationServiceWeights: { 'refuel+repair': 1, commodities: 1, shipyard: 0.5, outfitting: 0.5, jobs: 0.9 },
    hybridProceduralExtras: {
      proceduralPlanetCount: 3, // number of additional procedural planets to spawn
      seedOffset: 0x9e // unique offset so procedural portion differs from baseline seed
    },
    soundtracks: ['ambientb']
  },
  'sector-3': {
    id: 'sector-3',
    name: 'Aberrant Sector',
    planets: [],
    stations: [],
    npcShips: [],
    asteroidField: { seed: 0x33dd, destroyedIds: [], center: { x: 400, y: 0, z: -1200 }, size: 1400 },
    // Fully procedural sector weighting for services
    planetServiceWeights: { 'refuel+repair': 0, commodities: 0, shipyard: 0, outfitting: 0, jobs: 0, rumors: 0 },
    stationServiceWeights: { 'refuel+repair': 1, commodities: 0, shipyard: 0, outfitting: 0, jobs: 0, rumors: 0 },
    hybridProceduralExtras: {
      proceduralPlanetCount: 50, // number of additional procedural planets to spawn
      seedOffset: 0x9f // unique offset so procedural portion differs from baseline seed
    },
    soundtracks: ['aberrant']
  }
};

export function getSectorDefinition(id) { return sectorDefinitions[id]; }
