import * as THREE from 'three';
import { Asteroid } from '../Asteroid.js';
import { SpaceStation } from '../SpaceStation.js';

/**
 * EnvironmentSystem creates and updates passive world elements:
 *  - Planets & orbital station (station update per-frame)
 *  - Asteroid field
 *  - Localized derelict stardust field near NPC ship
 * Exposes references needed by other systems (planets, station, asteroids, stardust object).
 */
export class EnvironmentSystem {
  constructor({ gameEngine, planetFactory, npcShipFactory }) {
    this.gameEngine = gameEngine;
    this.planetFactory = planetFactory; // function returning array of created planets
    this.npcShipFactory = npcShipFactory; // function returning npc ship (already constructed)
    this.planets = [];
    this.asteroids = [];
    this.oceanusStation = null;
    this.derelictStardust = null;
  // Procedural asteroid field state
  this.asteroidSeed = Date.now() & 0xffff; // simple default; will be overridden by sector load
  this.destroyedAsteroidIds = new Set();
  this.asteroidFieldCenter = new THREE.Vector3(-50, 50, -650);
  this.asteroidFieldSize = 1200;
  }

  init() {
    // Planets
    this.planets = this.planetFactory();
    for (const p of this.planets) this.gameEngine.addEntity(p);
    const oceanus = this.planets.find(p => p.getName && p.getName() === 'Oceanus') || this.planets[1];
    if (oceanus) {
      // Station scaled relative to planet size
      this.oceanusStation = new SpaceStation(oceanus, { orbitRadius: oceanus.radius * 2, size: oceanus.radius * 0.48 });
      this.gameEngine.addEntity(this.oceanusStation);
      this.gameEngine.scene.add(this.oceanusStation.mesh);
    }
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