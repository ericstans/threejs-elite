import * as THREE from 'three';
import { Asteroid } from '../Asteroid.js';
import { SpaceStation } from '../SpaceStation.js';
import { Planet } from '../Planet.js';
import { hashSeed } from '../util/seedUtils.js';

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
    // Hierarchical deterministic generation using namespaced hash seeds.
    this.clearPlanetsAndStations();
    if (this.planetClusterStardust && this.planetClusterStardust.parent) {
      this.planetClusterStardust.parent.remove(this.planetClusterStardust);
      this.planetClusterStardust = null;
    }
    this._stardustTime = 0;
    const planetTypes = this._getPlanetArchetypes();
    const radiusRange = [35, 110];
    const spread = 1800;
    const countRng = this._rng(hashSeed(seed, 'planetCount'));
    const planetCount = 2 + Math.floor(countRng() * 3);
    const chosen = [];
    for (let i = 0; i < planetCount; i++) {
      const pSeed = hashSeed(seed, 'planet', i);
      const prng = this._rng(pSeed);
      const archetype = planetTypes[Math.floor(prng() * planetTypes.length)];
      const radius = radiusRange[0] + prng() * (radiusRange[1] - radiusRange[0]);
      const pos = new THREE.Vector3(
        (prng() - 0.5) * spread,
        (prng() - 0.5) * spread * 0.6,
        -400 - prng() * spread
      );
      const planet = new Planet(radius, pos, archetype.color, archetype.name, archetype.greeting);
      planet.rotationSpeed = 0.02 + prng() * 0.15;
      planet.dockable = prng() < 0.55;
      this.planets.push(planet);
      this.gameEngine.addEntity(planet);
      this.gameEngine.scene.add(planet.mesh);
      if (prng() < 0.18) this._addPlanetRings(planet, prng);
      if (prng() < 0.22) this._addMoon(planet, prng);
      chosen.push(planet);
    }
    const stationCountRng = this._rng(hashSeed(seed, 'stationCount'));
    const stationCount = Math.floor(stationCountRng() * 3);
    const indices = [...Array(chosen.length).keys()];
    for (let s = 0; s < stationCount && indices.length; s++) {
      const idxPickRng = this._rng(hashSeed(seed, 'stationIndex', s));
      const idx = indices.splice(Math.floor(idxPickRng() * indices.length), 1)[0];
      const pl = chosen[idx];
      const stRng = this._rng(hashSeed(seed, 'station', s));
      const station = new SpaceStation(pl, { orbitRadius: pl.radius * (2 + stRng() * 1.5), size: pl.radius * (0.3 + stRng() * 0.3) });
      this.gameEngine.addEntity(station);
      this.gameEngine.scene.add(station.mesh);
      if (!this.oceanusStation) this.oceanusStation = station;
    }
    const wideRand = this._rng(hashSeed(seed, 'stardustWide'));
    const clusterRand = this._rng(hashSeed(seed, 'stardustCluster'));
    this._createWideStardust(wideRand);
    this._createPlanetClusterStardust(clusterRand);
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
      // Remove attached ring if it was created unparented in older sessions
      if (p.rings) {
        if (p.rings.parent) p.rings.parent.remove(p.rings);
        p.rings = null;
      }
      // Remove moon
      if (p.moon) {
        if (p.moon.parent) p.moon.parent.remove(p.moon);
        p.moon = null;
      }
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
  // Parent ring to planet so it follows position (prevents orphaned rings on sector reload)
  ring.position.set(0, 0, 0);
  planet.mesh.add(ring);
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
  // Provide  nav-target interface (moons are nav-targetable but NOT commable)
  moon.userData.navId = `${planet.id}-moon-${Math.random().toString(36).substr(2,5)}`;
  moon.userData.navName = `${planet.getName()} Moon`;
  moon.userData.navMass = Math.pow(moonRadius, 3) * 800; // arbitrary mass scaling
  moon.userData.isNavTargeted = false;
  moon.userData.isCommable = false; // explicitly not commable
  moon.getId = () => moon.userData.navId;
  moon.getName = () => moon.userData.navName;
  moon.getMass = () => moon.userData.navMass;
  moon.setNavTargeted = (v) => { moon.userData.isNavTargeted = v; };
  moon.isNavTarget = () => moon.userData.isNavTargeted;
  moon.getPosition = () => moon.position.clone();
  moon.getType = () => 'moon';
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
    const points = this._buildInterstitialStardust({
      positions,
      colors,
      baseSize: 14.0,
      sizeJitter: 9.0,
      saturation: 0.65,
      fogDensity: 0.00018,
      noiseThreshold: 0.18,
      noiseScale: 0.0025,
      opacity: 0.9,
      rotationSpeed: 0.00015
    });
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
    const points = this._buildInterstitialStardust({
      positions,
      colors,
      baseSize: 22.0,
      sizeJitter: 16.0,
      saturation: 0.55,
      fogDensity: 0.00022,
      noiseThreshold: 0.25,
      noiseScale: 0.0035,
      opacity: 0.95,
      rotationSpeed: 0.0001
    });
    points.name = 'PlanetClusterStardust';
    this.planetClusterStardust = points;
    this.gameEngine.scene.add(points);
  }

  _buildInterstitialStardust({ positions, colors, baseSize, sizeJitter, saturation, fogDensity, noiseThreshold, noiseScale, opacity, rotationSpeed }) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const count = positions.length / 3;
    const sizes = new Float32Array(count);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      sizes[i] = baseSize + Math.random() * sizeJitter;
      seeds[i] = Math.random() * 1000.0;
    }
    geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    const material = this._getStardustMaterial({ saturation, fogDensity, noiseThreshold, noiseScale, opacity });
    const points = new THREE.Points(geometry, material);
    points.userData.rotationSpeed = rotationSpeed;
    return points;
  }

  _getStardustMaterial({ saturation, fogDensity, noiseThreshold, noiseScale, opacity }) {
    // Cache by parameter signature to avoid many program variants
    this._stardustMaterialCache = this._stardustMaterialCache || {};
    const key = [saturation, fogDensity, noiseThreshold, noiseScale, opacity].join(':');
    if (this._stardustMaterialCache[key]) return this._stardustMaterialCache[key];
    const uniforms = {
      uTime: { value: 0 },
      uSaturation: { value: saturation },
      uFogDensity: { value: fogDensity },
      uNoiseThreshold: { value: noiseThreshold },
      uNoiseScale: { value: noiseScale },
      uOpacity: { value: opacity }
    };
    const vertex = /* glsl */`
      uniform float uTime;
      attribute float aSize;
      attribute float aSeed;
  attribute vec3 color; // added: geometry color attribute for per-point tint
      varying vec3 vColor;
      varying float vSeed;
      varying vec3 vWorldPos;
      void main(){
        vColor = color;
        vSeed = aSeed;
        vec3 pos = position;
        // Gentle drift using seed-based offset
        float drift = sin(uTime*0.05 + aSeed*0.37);
        pos.x += drift * 8.0;
        pos.y += sin(uTime*0.04 + aSeed*0.19)*4.0;
        vec4 mvPosition = modelViewMatrix * vec4(pos,1.0);
        gl_PointSize = aSize * (120.0 / -mvPosition.z); // perspective size attenuation
        vWorldPos = (modelMatrix * vec4(pos,1.0)).xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `;
    const fragment = /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform float uSaturation;
      uniform float uFogDensity;
      uniform float uNoiseThreshold;
      uniform float uNoiseScale;
      uniform float uOpacity;
      varying vec3 vColor;
      varying float vSeed;
      varying vec3 vWorldPos;

      // Simple 3D hash noise
      float hash31(vec3 p){
        p = fract(p*0.1031);
        p += dot(p, p.yzx + 19.19);
        return fract((p.x+p.y)*p.z);
      }
      float noise3(vec3 p){
        vec3 i = floor(p);
        vec3 f = fract(p);
        // Trilinear interpolation of hashed values
        float n000 = hash31(i + vec3(0.0,0.0,0.0));
        float n100 = hash31(i + vec3(1.0,0.0,0.0));
        float n010 = hash31(i + vec3(0.0,1.0,0.0));
        float n110 = hash31(i + vec3(1.0,1.0,0.0));
        float n001 = hash31(i + vec3(0.0,0.0,1.0));
        float n101 = hash31(i + vec3(1.0,0.0,1.0));
        float n011 = hash31(i + vec3(0.0,1.0,1.0));
        float n111 = hash31(i + vec3(1.0,1.0,1.0));
        vec3 u = f*f*(3.0-2.0*f);
        float nx00 = mix(n000, n100, u.x);
        float nx10 = mix(n010, n110, u.x);
        float nx01 = mix(n001, n101, u.x);
        float nx11 = mix(n011, n111, u.x);
        float nxy0 = mix(nx00, nx10, u.y);
        float nxy1 = mix(nx01, nx11, u.y);
        return mix(nxy0, nxy1, u.z);
      }

      vec3 gradeColor(vec3 c){
        float l = dot(c, vec3(0.299,0.587,0.114));
        // Reduce saturation then re-add subtle hue shift using seed/time
        vec3 desat = mix(vec3(l), c, uSaturation);
        float hueShift = sin(uTime*0.03 + vSeed*0.17)*0.08;
        desat.r += hueShift*0.15; // gentle warm/cool flicker
        desat.b += -hueShift*0.15;
        return clamp(desat,0.0,1.0);
      }

      void main(){
        // Radial alpha falloff
        vec2 uv = gl_PointCoord*2.0-1.0;
        float r = dot(uv,uv);
        if(r>1.0) discard; // circle
        float radial = pow(1.0 - r, 1.5);
        // Layered noise for density variation
        float n = noise3(vWorldPos * uNoiseScale + vSeed*0.1 + uTime*0.01);
        n = (n + noise3(vWorldPos * (uNoiseScale*2.1) + uTime*0.015))/2.0;
        if(n < uNoiseThreshold) discard; // sparse holes
        float alpha = radial * (n - uNoiseThreshold) / (1.0 - uNoiseThreshold);
        // Depth based fog fade (simulate attenuation)
        float dist = length(vWorldPos);
        float fog = exp(-dist * uFogDensity);
        vec3 col = gradeColor(vColor);
        alpha *= fog * uOpacity;
        // Soft fringe
        alpha *= smoothstep(0.0,0.4,radial);
        if(alpha < 0.02) discard;
        gl_FragColor = vec4(col, alpha);
      }
    `;
    const material = new THREE.ShaderMaterial({
      uniforms,
      vertexShader: vertex,
      fragmentShader: fragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this._stardustMaterialCache[key] = material;
    return material;
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
    this._stardustTime += deltaTime;
    const updateDust = (points) => {
      if (!points) return;
      points.rotation.y += deltaTime * (points.userData.rotationSpeed || 0.0001);
      const mat = points.material;
      if (mat && mat.uniforms && mat.uniforms.uTime) {
        mat.uniforms.uTime.value = this._stardustTime;
      }
    };
    updateDust(this.derelictStardust);
    updateDust(this.planetClusterStardust);
  }
}