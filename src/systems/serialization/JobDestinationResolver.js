// Deterministic resolver for destinations that offer the "jobs" service
// Includes:
// - Handcrafted sector definitions (planets/stations listing 'jobs')
// - Hybrid extras (procedural planets added to handcrafted sectors)
// - Fully procedural sectors (planets and a few stations)
//
// The resolver mirrors the seeding patterns used in EnvironmentSystem.initProcedural
// and main.performSectorSwitch() for hybrid extras so names and service flags
// are stable across sessions given the same seeds.

import { getSectorDefinition } from './sectorDefinitions.js';
import { hashSeed, mulberry32 } from '../../util/seedUtils.js';

// Keep this in sync with EnvironmentSystem._getPlanetArchetypes() names
const PLANET_ARCHETYPE_NAMES = [
  'Barren World',
  'Ice World',
  'Verdant World',
  'Desert World',
  'Molten World',
  'Azure World',
  'Crimson World'
];

// Roman numeral helpers to mirror EnvironmentSystem.applyRomanNumeralsForDuplicatePlanets()
function stripRoman(name) {
  if (!name) return name;
  const m = name.match(/^(.*)\s+([IVXLCDM]+)$/);
  if (!m) return name;
  const roman = m[2];
  if (/^[IVXLCDM]+$/.test(roman)) return m[1];
  return name;
}

function toRoman(num) {
  /** @type {Array<[number,string]>} */
  const map = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
    [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
    [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
  ];
  let n = Math.max(1, Math.floor(num));
  let out = '';
  for (const [val, sym] of map) {
    while (n >= val) { out += sym; n -= val; }
  }
  return out;
}

function applyRomanNumeralsToList(names) {
  // names: array of base names (may already contain roman suffixes); returns array of romanized names
  const bases = names.map(n => stripRoman(n));
  const counts = new Map();
  for (const base of bases) counts.set(base, (counts.get(base) || 0) + 1);
  const seen = new Map();
  return bases.map(base => {
    const total = counts.get(base) || 0;
    const idx = (seen.get(base) || 0) + 1;
    seen.set(base, idx);
    if (total > 1) {
      return idx === 1 ? base : `${base} ${toRoman(idx)}`;
    }
    return base;
  });
}

// Deterministic service assignment helpers
export function computePlanetServicesForSeed(pSeed, weights) {
  const rng = mulberry32(pSeed);
  const services = [];
  // Baseline defaults
  const w = weights || { 'refuel+repair': 1, commodities: 0.5, jobs: 0.35 };
  if (rng() < (w['refuel+repair'] ?? 1)) services.push('refuel+repair');
  if (rng() < (w['commodities'] ?? 0)) services.push('commodities');
  if (rng() < (w['jobs'] ?? 0)) services.push('jobs');
  return services.length ? services : ['refuel+repair'];
}

export function computeStationServicesForSeed(sSeed, weights) {
  const rng = mulberry32(sSeed);
  const services = [];
  const w = weights || { 'refuel+repair': 1, commodities: 1, shipyard: 0.5, outfitting: 0.5, jobs: 0.9 };
  if (rng() < (w['refuel+repair'] ?? 1)) services.push('refuel+repair');
  if (rng() < (w['commodities'] ?? 0)) services.push('commodities');
  if (rng() < (w['shipyard'] ?? 0)) services.push('shipyard');
  if (rng() < (w['outfitting'] ?? 0)) services.push('outfitting');
  if (rng() < (w['jobs'] ?? 0)) services.push('jobs');
  // Ensure at least a useful baseline
  if (!services.length) services.push('refuel+repair');
  return services;
}

function hasJobs(services) {
  return Array.isArray(services) && services.includes('jobs');
}

function enumerateHandcrafted(def) {
  const out = [];
  if (!def) return out;
  if (Array.isArray(def.planets)) {
    for (const p of def.planets) {
      if (hasJobs(p.services)) out.push({ type: 'planet', name: p.name });
    }
  }
  if (Array.isArray(def.stations)) {
    for (const s of def.stations) {
      if (hasJobs(s.services)) out.push({ type: 'station', name: s.name });
    }
  }
  return out;
}

function enumerateHybridExtrasJobs(def, sectorMeta) {
  const out = [];
  if (!def || !def.hybridProceduralExtras || !sectorMeta) return out;
  const extras = def.hybridProceduralExtras;
  const baseSeed = sectorMeta.seed ?? 0;
  const hybridSeed = (baseSeed ^ (extras.seedOffset || 0x9e)) >>> 0;
  const count = extras.proceduralPlanetCount || 0;
  const pWeights = def.planetServiceWeights;
  // First, generate all base names so we can romanize deterministically across extras
  const baseNames = [];
  const servicesList = [];
  for (let i = 0; i < count; i++) {
    const pSeed = hashSeed(hybridSeed, 'hybridExtra', i);
    const prng = mulberry32(pSeed);
    const baseName = PLANET_ARCHETYPE_NAMES[Math.floor(prng() * PLANET_ARCHETYPE_NAMES.length)];
    baseNames.push(baseName);
    servicesList.push(computePlanetServicesForSeed(pSeed, pWeights));
  }
  const romanized = applyRomanNumeralsToList(baseNames);
  for (let i = 0; i < count; i++) {
    const services = servicesList[i];
    if (hasJobs(services)) out.push({ type: 'planet', name: romanized[i] });
  }
  return out;
}

function enumerateFullyProceduralJobs(sectorMeta) {
  const out = [];
  if (!sectorMeta) return out;
  const seed = sectorMeta.seed ?? 0;
  // Planet count: 2..4 (same as EnvironmentSystem.initProcedural)
  const countRng = mulberry32(hashSeed(seed, 'planetCount'));
  const planetCount = 2 + Math.floor(countRng() * 3);
  const def = getSectorDefinition(sectorMeta.id);
  const pWeights = def?.planetServiceWeights;
  const sWeights = def?.stationServiceWeights;
  // Planets: generate all base names and services, then romanize so names match runtime before station creation
  const planetBaseNames = [];
  const planetServices = [];
  for (let i = 0; i < planetCount; i++) {
    const pSeed = hashSeed(seed, 'planet', i);
    const prng = mulberry32(pSeed);
    const baseName = PLANET_ARCHETYPE_NAMES[Math.floor(prng() * PLANET_ARCHETYPE_NAMES.length)];
    planetBaseNames.push(baseName);
    planetServices.push(computePlanetServicesForSeed(pSeed, pWeights));
  }
  const romanizedPlanetNames = applyRomanNumeralsToList(planetBaseNames);
  for (let i = 0; i < planetCount; i++) {
    if (hasJobs(planetServices[i])) out.push({ type: 'planet', name: romanizedPlanetNames[i] });
  }
  // Stations: 0..2 attached to unique planets (same uniqueness rule as EnvironmentSystem)
  const stationCountRng = mulberry32(hashSeed(seed, 'stationCount'));
  const stationCount = Math.floor(stationCountRng() * 3);
  const indices = [...Array(planetCount).keys()];
  for (let s = 0; s < stationCount && indices.length; s++) {
    const idxPickRng = mulberry32(hashSeed(seed, 'stationIndex', s));
    const idx = indices.splice(Math.floor(idxPickRng() * indices.length), 1)[0];
    // Use the romanized planet name to mirror runtime behavior (stations created after romanization)
    const planetName = romanizedPlanetNames[idx];
    const sSeed = hashSeed(seed, 'station', s);
    const services = computeStationServicesForSeed(sSeed, sWeights);
    const stationName = `${planetName} Station`;
    if (hasJobs(services)) out.push({ type: 'station', name: stationName });
  }
  return out;
}

export function enumerateJobsServiceLocations(availableSectors) {
  const results = [];
  for (const s of availableSectors || []) {
    const def = getSectorDefinition(s.id);
    // Handcrafted parts
    const crafted = enumerateHandcrafted(def);
    for (const loc of crafted) results.push({ sectorId: s.id, sectorName: s.name, locationName: loc.name, type: loc.type });
    // Hybrid extras
    const hybrids = enumerateHybridExtrasJobs(def, s);
    for (const loc of hybrids) results.push({ sectorId: s.id, sectorName: s.name, locationName: loc.name, type: loc.type });
    // Fully procedural (no definition)
    if (!def) {
      const proc = enumerateFullyProceduralJobs(s);
      for (const loc of proc) results.push({ sectorId: s.id, sectorName: s.name, locationName: loc.name, type: loc.type });
    }
  }
  return results;
}

export function pickRandomJobsDestination(ctx, availableSectors) {
  const all = enumerateJobsServiceLocations(availableSectors);
  if (all.length === 0) return null;
  // Prefer different sector when possible
  const other = all.filter(d => d.sectorId !== ctx.sectorId);
  const pool = other.length ? other : all;
  const choice = pool[Math.floor(Math.random() * pool.length)];
  return choice ? { sectorId: choice.sectorId, sectorName: choice.sectorName, locationName: choice.locationName } : null;
}
