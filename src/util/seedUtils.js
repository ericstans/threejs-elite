// Deterministic hashing + RNG helpers for hierarchical seeding.
// FNV-1a 32-bit hash implementation across concatenated parts.
export function hashSeed(...parts) {
  let h = 0x811c9dc5; // offset basis
  for (const part of parts) {
    const str = String(part);
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193) >>> 0; // FNV prime
    }
  }
  return h >>> 0;
}

// Mulberry32 PRNG (same algorithm as EnvironmentSystem._rng for convenience outside that class)
export function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ t >>> 15, 1 | t);
    r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
