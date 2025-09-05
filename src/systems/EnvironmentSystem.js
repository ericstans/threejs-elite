import * as THREE from 'three';
import { Asteroid } from '../Asteroid.js';
import { SpaceStation } from '../SpaceStation.js';
import { Planet } from '../Planet.js';

/**
 * EnvironmentSystem creates and updates passive world elements:
 *  - Planets & orbital station (station update per-frame)
 *  - Asteroid field
 *  - Localized derelict stardust field near NPC ship
 * Exposes references needed by other systems (planets, station, asteroids, stardust object).
 */
export class EnvironmentSystem {
  constructor({ gameEngine, planetFactory, npcShipFactory, procedural = false }) {
    this.gameEngine = gameEngine;
    this.planetFactory = planetFactory; // function returning array of created planets
    this.npcShipFactory = npcShipFactory; // function returning npc ship (already constructed)
    this.planets = [];
    this.asteroids = [];
    this.oceanusStation = null;
    this.derelictStardust = null;
  // Additional procedural stardust field centered on planet cluster
  this.planetClusterStardust = null;
  // Procedural asteroid field state
  this.asteroidSeed = Date.now() & 0xffff; // simple default; will be overridden by sector load
  this.destroyedAsteroidIds = new Set();
  this.asteroidFieldCenter = new THREE.Vector3(-50, 50, -650);
  this.asteroidFieldSize = 1200;
    this.procedural = procedural; // if true, ignore provided planetFactory and generate
  }

  initProcedural(seed) {
    // Generate planets & optional stations deterministically
    this.clearPlanetsAndStations();
    // Remove any prior procedural stardust cluster
    if (this.planetClusterStardust && this.planetClusterStardust.parent) {
      this.planetClusterStardust.parent.remove(this.planetClusterStardust);
      this.planetClusterStardust = null;
    }
    const rand = this._rng(seed ^ 0x9e3779b9);
    const planetTypes = this._getPlanetArchetypes();
    const planetCount = 2 + Math.floor(rand() * 3); // 2-4 planets
    const radiusRange = [35, 110];
    const spread = 1800; // spatial extent
    const chosen = [];
    for (let i = 0; i < planetCount; i++) {
      const archetype = planetTypes[Math.floor(rand() * planetTypes.length)];
      const radius = radiusRange[0] + rand() * (radiusRange[1] - radiusRange[0]);
      const pos = new THREE.Vector3(
        (rand() - 0.5) * spread,
        (rand() - 0.5) * spread * 0.6,
        -400 - rand() * spread
      );
      const planet = new Planet(radius, pos, archetype.color, archetype.name, archetype.greeting);
      // Variation in rotation speed
      planet.rotationSpeed = 0.02 + rand() * 0.15;
  // Randomly mark some planets non-dockable (e.g., 50% chance)
  planet.dockable = rand() < 0.55;
      this.planets.push(planet);
      this.gameEngine.addEntity(planet);
      this.gameEngine.scene.add(planet.mesh);
      // Rare rings
      if (rand() < 0.18) this._addPlanetRings(planet, rand);
      // Rare moon
      if (rand() < 0.22) this._addMoon(planet, rand);
      chosen.push(planet);
    }
    // Random 0-2 stations around distinct planets
    const stationCount = Math.floor(rand() * 3); // 0,1,2
    const indices = [...Array(chosen.length).keys()];
    for (let s = 0; s < stationCount && indices.length; s++) {
      const idx = indices.splice(Math.floor(rand() * indices.length), 1)[0];
      const pl = chosen[idx];
      const station = new SpaceStation(pl, { orbitRadius: pl.radius * (2 + rand() * 1.5), size: pl.radius * (0.3 + rand() * 0.3) });
      this.gameEngine.addEntity(station);
      this.gameEngine.scene.add(station.mesh);
      // Track one (for targeting system compatibility expecting oceanusStation)
      if (!this.oceanusStation) this.oceanusStation = station;
    }
    // Large spanning stardust field covering region
    this._createWideStardust(rand);
  // Denser localized cluster field encompassing all planets
  this._createPlanetClusterStardust(rand);
  }

  init() {
    if (this.procedural) return; // skip non-procedural init here
    this.planets = this.planetFactory();
    for (const p of this.planets) this.gameEngine.addEntity(p);
    const oceanus = this.planets.find(p => p.getName && p.getName() === 'Oceanus') || this.planets[1];
    if (oceanus) {
      this.oceanusStation = new SpaceStation(oceanus, { orbitRadius: oceanus.radius * 2, size: oceanus.radius * 0.48 });
      this.gameEngine.addEntity(this.oceanusStation);
      this.gameEngine.scene.add(this.oceanusStation.mesh);
    }
  }

  clearPlanetsAndStations() {
    for (const p of this.planets) {
      if (p.mesh && p.mesh.parent) p.mesh.parent.remove(p.mesh);
      this.gameEngine.removeEntity && this.gameEngine.removeEntity(p);
    }
    this.planets = [];
    if (this.oceanusStation) {
      if (this.oceanusStation.mesh && this.oceanusStation.mesh.parent) this.oceanusStation.mesh.parent.remove(this.oceanusStation.mesh);
      this.gameEngine.removeEntity && this.gameEngine.removeEntity(this.oceanusStation);
      this.oceanusStation = null;
    }
  }

  _getPlanetArchetypes() {
    return [
      { name: 'Barren World', color: 0x8B7765, greeting: 'Static echo. No major traffic.' },
      { name: 'Ice World', color: 0x99d9ea, greeting: 'Subzero winds detected.' },
      { name: 'Verdant World', color: 0x228B22, greeting: 'A calm biosphere hums below.' },
      { name: 'Desert World', color: 0xC2B280, greeting: 'Thermal updrafts near equator.' },
      { name: 'Molten World', color: 0xFF4500, greeting: 'Surface activity extremely high.' },
      { name: 'Azure World', color: 0x1E90FF, greeting: 'Oceans dominate the surface.' },
      { name: 'Crimson World', color: 0x8B0000, greeting: 'Dust storms in upper atmosphere.' }
    ];
  }

  _addPlanetRings(planet, rand) {
    const inner = planet.radius * (1.4 + rand() * 0.3);
    const outer = inner + planet.radius * (0.6 + rand() * 0.5);
    const ringGeo = new THREE.RingGeometry(inner, outer, 64, 1);
    // tilt
    ringGeo.rotateX(Math.PI / 2 + (rand() - 0.5) * 0.6);
    const mat = new THREE.MeshBasicMaterial({ color: 0xcccccc, side: THREE.DoubleSide, transparent: true, opacity: 0.5 });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.copy(planet.mesh.position);
    this.gameEngine.scene.add(ring);
    planet.rings = ring;
  }

  _addMoon(planet, rand) {
    const moonRadius = planet.radius * (0.15 + rand() * 0.15);
    const dist = planet.radius * (3 + rand() * 2);
    const geo = new THREE.SphereGeometry(moonRadius, 8, 6);
    const mat = new THREE.MeshLambertMaterial({ color: 0xdddddd, flatShading: true });
    const moon = new THREE.Mesh(geo, mat);
    moon.userData.orbit = { center: planet.mesh.position.clone(), radius: dist, angle: rand() * Math.PI * 2, speed: 0.1 + rand() * 0.15 };
    moon.position.set(planet.mesh.position.x + dist, planet.mesh.position.y, planet.mesh.position.z);
    moon.userData.update = (dt) => {
      const o = moon.userData.orbit;
      o.angle += o.speed * dt * 0.05;
      moon.position.set(
        o.center.x + Math.cos(o.angle) * o.radius,
        o.center.y + (Math.sin(o.angle * 0.7) * o.radius * 0.05),
        o.center.z + Math.sin(o.angle) * o.radius
      );
    };
    this.gameEngine.scene.add(moon);
    planet.moon = moon;
  }

  _createWideStardust(rand) {
    // Remove prior field if any
    if (this.derelictStardust && this.derelictStardust.parent) this.derelictStardust.parent.remove(this.derelictStardust);
    const particleCount = 400;
    // Base span doubled (was 3000). Will be dynamically increased below if planets exceed bounds.
    let span = 6000;

    // Dynamically size starfield so it always fully contains all planets (avoid visual clipping/edge popping)
    if (this.planets && this.planets.length) {
      let maxAbsX = 0, maxAbsY = 0, minZ = 0;
      for (const p of this.planets) {
        const pos = p.mesh ? p.mesh.position : p.position || p; // fallback
        if (!pos) continue;
        if (Math.abs(pos.x) > maxAbsX) maxAbsX = Math.abs(pos.x);
        if (Math.abs(pos.y) > maxAbsY) maxAbsY = Math.abs(pos.y);
        if (pos.z < minZ) minZ = pos.z;
      }
      // X extent requirement: span/2 >= maxAbsX  => span >= maxAbsX * 2
      const needSpanX = maxAbsX * 2;
      // Y extent requirement: y half-range = span * 0.2  => span >= maxAbsY / 0.2
      const needSpanY = maxAbsY * 5; // (1 / 0.2) = 5
      // Z extent requirement: starfield points go from -200 to -(span + 200) (negative direction) => ensure -(span + 200) <= minZ
      // Rearranged: span >= -minZ - 200
      const needSpanZ = (-minZ - 200);
      span = Math.max(span, needSpanX, needSpanY, needSpanZ);
    }
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const tmp = new THREE.Color();
    // Collect planet colors (if any) for tinting
    const planetColors = (this.planets || []).map(p => new THREE.Color(p.color));
    let i = 0;
    for (let p = 0; p < particleCount; p++) {
      const x = (rand() - 0.5) * span;
      const y = (rand() - 0.5) * span * 0.4; // vertical compression maintained
      const z = - (rand()) * span - 200;     // depth extends further with larger span
      positions[i] = x; positions[i + 1] = y; positions[i + 2] = z;
      if (planetColors.length > 0 && rand() < 0.75) {
        // Choose a planet color and jitter toward/away slightly in HSL space
        const base = planetColors[Math.floor(rand() * planetColors.length)].clone();
        // Convert to HSL
        const hsl = { h: 0, s: 0, l: 0 };
        base.getHSL(hsl);
        hsl.h = (hsl.h + (rand() - 0.5) * 0.04 + 1) % 1;
        hsl.s = Math.min(1, Math.max(0, hsl.s * (0.7 + rand() * 0.6)));
        hsl.l = Math.min(1, Math.max(0, hsl.l * (0.8 + rand() * 0.4)));
        tmp.setHSL(hsl.h, hsl.s, hsl.l);
      } else {
        // Fallback neutral bluish glow
        tmp.setHSL(0.58 + (rand() - 0.5) * 0.05, 0.2 + rand() * 0.2, 0.5 + rand() * 0.3);
      }
      colors[i] = tmp.r; colors[i + 1] = tmp.g; colors[i + 2] = tmp.b;
      i += 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({ size: 1.0, sizeAttenuation: true, vertexColors: true, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false });
    const points = new THREE.Points(geometry, material);
    points.userData.update = (dt) => { points.rotation.y += dt * 0.00015; };
    this.derelictStardust = points;
    this.gameEngine.scene.add(points);
  }

  _createPlanetClusterStardust(rand) {
    if (!this.planets || this.planets.length === 0) return;
    // Remove previous cluster
    if (this.planetClusterStardust && this.planetClusterStardust.parent) {
      this.planetClusterStardust.parent.remove(this.planetClusterStardust);
    }
    // Compute average center of planet positions
    const center = new THREE.Vector3();
    for (const p of this.planets) {
      center.add(p.mesh ? p.mesh.position : p.position || new THREE.Vector3());
    }
    center.multiplyScalar(1 / this.planets.length);
    // Compute max distance from center (include planet radius) to size field
    let maxDist = 0;
    for (const p of this.planets) {
      const pos = p.mesh ? p.mesh.position : p.position || new THREE.Vector3();
      const d = pos.distanceTo(center) + (p.radius || 0);
      if (d > maxDist) maxDist = d;
    }
    // Add margin so planets sit well inside
    const radius = maxDist + 600; // generous padding
    const particleCount = Math.min(3500, Math.max(1200, Math.floor(radius * 0.6))); // density scaling with cap
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const tmp = new THREE.Color();
    const planetColors = (this.planets || []).map(p => new THREE.Color(p.color));
    let i = 0;
    for (let n = 0; n < particleCount; n++) {
      // Random point in sphere (rejection sampling)
      let x, y, z, d2;
      do {
        x = (rand() * 2 - 1);
        y = (rand() * 2 - 1);
        z = (rand() * 2 - 1);
        d2 = x * x + y * y + z * z;
      } while (d2 > 1);
      const d = Math.sqrt(d2);
      // Slightly bias density towards shell for visual depth (expand radius by d^0.75)
      const r = Math.pow(d, 0.75) * radius;
      const px = center.x + x * r;
      const py = center.y + y * r * 0.6; // vertical squash for disc-like feel
      const pz = center.z + z * r;
      positions[i] = px; positions[i + 1] = py; positions[i + 2] = pz;
      if (planetColors.length && rand() < 0.85) {
        const base = planetColors[Math.floor(rand() * planetColors.length)].clone();
        const hsl = { h: 0, s: 0, l: 0 };
        base.getHSL(hsl);
        hsl.h = (hsl.h + (rand() - 0.5) * 0.06 + 1) % 1;
        hsl.s = Math.min(1, Math.max(0, hsl.s * (0.6 + rand() * 0.8)));
        hsl.l = Math.min(1, Math.max(0, hsl.l * (0.7 + rand() * 0.5)));
        tmp.setHSL(hsl.h, hsl.s, hsl.l);
      } else {
        tmp.setHSL(0.58 + (rand() - 0.5) * 0.03, 0.25 + rand() * 0.3, 0.55 + rand() * 0.25);
      }
      colors[i] = tmp.r; colors[i + 1] = tmp.g; colors[i + 2] = tmp.b;
      i += 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 1.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'PlanetClusterStardust';
    points.userData.update = (dt) => { points.rotation.y += dt * 0.0001; };
    this.planetClusterStardust = points;
    this.gameEngine.scene.add(points);
  }

  // Deterministic pseudo-random generator (Mulberry32) to allow consistent regeneration
  _rng(seed) {
    let t = seed >>> 0;
    return function() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ t >>> 15, 1 | t);
      r ^= r + Math.imul(r ^ r >>> 7, 61 | r);
      return ((r ^ r >>> 14) >>> 0) / 4294967296;
    };
  }

  configureAsteroidField({ seed, destroyedIds = [], center, size }) {
    this.clearAsteroidField();
    this.asteroidSeed = seed;
    this.destroyedAsteroidIds = new Set(destroyedIds);
    if (center) this.asteroidFieldCenter = new THREE.Vector3(center.x, center.y, center.z);
    if (size) this.asteroidFieldSize = size;
    this._generateAsteroidField();
  }

  clearAsteroidField() {
    for (const a of this.asteroids) {
      if (this.gameEngine.removeEntity) this.gameEngine.removeEntity(a);
      if (a.mesh && a.mesh.parent) a.mesh.parent.remove(a.mesh);
    }
    this.asteroids.length = 0;
  }

  _generateAsteroidField() {
    const asteroidCount = 25;
    const fieldCenter = this.asteroidFieldCenter.clone();
    const fieldSize = this.asteroidFieldSize;
    const rand = this._rng(this.asteroidSeed);
    for (let i = 0; i < asteroidCount; i++) {
      const idSeed = Math.floor(rand() * 1e9).toString(36);
      if (this.destroyedAsteroidIds.has(idSeed)) continue; // skip destroyed asteroids
      const position = new THREE.Vector3(
        fieldCenter.x + (rand() - 0.5) * fieldSize,
        fieldCenter.y + (rand() - 0.5) * fieldSize,
        fieldCenter.z + (rand() - 0.5) * fieldSize
      );
      const size = 0.5 + rand() * 1.5;
      const asteroid = new Asteroid(position, size);
      // Overwrite generated random id with deterministic idSeed for persistence mapping
      asteroid.id = idSeed;
      this.asteroids.push(asteroid);
      this.gameEngine.addEntity(asteroid);
    }
  }

  // Call this when an asteroid is destroyed so future regenerations omit it
  markAsteroidDestroyed(asteroid) {
    if (asteroid && asteroid.id) {
      this.destroyedAsteroidIds.add(asteroid.id);
    }
  }

  getAsteroidFieldState() {
    return {
      seed: this.asteroidSeed,
  destroyedIds: Array.from(this.destroyedAsteroidIds),
  center: { x: this.asteroidFieldCenter.x, y: this.asteroidFieldCenter.y, z: this.asteroidFieldCenter.z },
  size: this.asteroidFieldSize
    };
  }

  // Backward compatible method (legacy calls in main.js)
  createAsteroidField() {
    if (!this.asteroids.length) {
      this._generateAsteroidField();
    }
  }

  createDerelictStardustField(center) {
    const particleCount = 50;
    const radius = 250;
    const innerVoid = 25;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const tmpColor = new THREE.Color();
    let i = 0;
    for (let p = 0; p < particleCount; p++) {
      let x, y, z, d;
      do {
        x = (Math.random() * 2 - 1);
        y = (Math.random() * 2 - 1);
        z = (Math.random() * 2 - 1);
        d = Math.sqrt(x * x + y * y + z * z);
      } while (d === 0 || d > 1 || d * radius < innerVoid);
      const falloff = d;
      const bias = Math.pow(falloff, 0.6);
      const finalR = bias * radius;
      const px = center.x + x / d * finalR;
      const py = center.y + y / d * finalR;
      const pz = center.z + z / d * finalR;
      positions[i] = px; positions[i + 1] = py; positions[i + 2] = pz;
      const hueJitter = 0.58 + (Math.random() - 0.5) * 0.04;
      const sat = 0.15 + Math.random() * 0.2;
      const val = 0.7 + Math.random() * 0.3;
      tmpColor.setHSL(hueJitter, sat, val);
      colors[i] = tmpColor.r; colors[i + 1] = tmpColor.g; colors[i + 2] = tmpColor.b;
      i += 3;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const material = new THREE.PointsMaterial({
      size: 1.2,
      sizeAttenuation: true,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.name = 'DerelictStardustField';
    points.userData.update = (dt) => { points.rotation.y += dt * 0.0005; };
    this.derelictStardust = points;
    this.gameEngine.scene.add(points);
  }

  update(deltaTime) {
    if (this.oceanusStation) this.oceanusStation.update(deltaTime);
    // Stardust rotation handled via userData.update if needed by main (or we can call here):
    if (this.derelictStardust && this.derelictStardust.userData.update) {
      this.derelictStardust.userData.update(deltaTime);
    }
  }
}