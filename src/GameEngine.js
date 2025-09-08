import * as THREE from 'three';
import { generateStarfieldEquirectTexture } from './util/generateStarfieldTexture.js';

const DRAW_DISTANCE = 8000;

export class GameEngine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, DRAW_DISTANCE);
    this.renderer = new THREE.WebGLRenderer({ antialias: false });

    this.setupRenderer();
    this.setupScene();
    this.setupLighting();
    this.setupSpatialAudio();

    this.clock = new THREE.Clock();
    this.entities = [];
  }

  setupRenderer() {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x000000);
    this.renderer.shadowMap.enabled = false; // Disable shadows for flat-shaded look
    document.body.appendChild(this.renderer.domElement);

    // Set equirectangular starfield background (white dots on black)
    const starfieldTexture = generateStarfieldEquirectTexture(2048, 600);
    this.scene.background = starfieldTexture;
    // Create supplemental parallax star layers (two shells with slight movement)
    this._createParallaxStars();
  }

  setupScene() {
  // Add spacedust (local space particles)
    this.createSpacedust();
  // Remove distant starfield points, now handled by background
  }

  createSpacedust() {
    // Add local spacedust particles
    const spacedustGeometry = new THREE.BufferGeometry();
    const spacedustCount = 1000;
    const spacedustPositions = new Float32Array(spacedustCount * 3);

    for (let i = 0; i < spacedustCount * 3; i++) {
      spacedustPositions[i] = (Math.random() - 0.5) * 8000;
    }

    spacedustGeometry.setAttribute('position', new THREE.BufferAttribute(spacedustPositions, 3));

    const spacedustMaterial = new THREE.PointsMaterial({
      color: 0x808080,
      size: 1,
      sizeAttenuation: false
    });

    const spacedust = new THREE.Points(spacedustGeometry, spacedustMaterial);
    this.scene.add(spacedust);
  }

  _createParallaxStars() {
    const makeLayer = (count, radius, size, opacity) => {
      const geom = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0;i < count;i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        const r = radius;
        positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
        positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
        positions[i * 3 + 2] = r * Math.cos(phi);
      }
      geom.setAttribute('position', new THREE.BufferAttribute(positions,3));
      const mat = new THREE.PointsMaterial({ color: 0xffffff, size, sizeAttenuation:false, transparent:true, opacity, depthWrite:false });
      const pts = new THREE.Points(geom, mat);
      pts.matrixAutoUpdate = false;
      this.scene.add(pts);
      return pts;
    };
    this.starParallaxNear = makeLayer(800, 3000, 3, 0.55);
    this.starParallaxFar  = makeLayer(1200, 6000, 2, 0.35);
  }

  createStarfield() {
    // Create a large sphere of distant stars
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    // Generate stars on a large sphere (radius 5000 units - closer for visibility)
    const radius = 5000;
    for (let i = 0; i < starCount; i++) {
      // Generate random points on sphere surface
      const theta = Math.random() * Math.PI * 2; // Azimuth angle
      const phi = Math.acos(2 * Math.random() - 1); // Polar angle

      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);

      starPositions[i * 3] = x;
      starPositions[i * 3 + 1] = y;
      starPositions[i * 3 + 2] = z;

      // Add some color variation (white to blue-white)
      const colorVariation = 0.8 + Math.random() * 0.2;
      starColors[i * 3] = colorVariation;     // Red
      starColors[i * 3 + 1] = colorVariation; // Green
      starColors[i * 3 + 2] = 1.0;            // Blue (slightly blue-tinted)
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMaterial = new THREE.PointsMaterial({
      size: 2,
      sizeAttenuation: false,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      depthWrite: false,
      depthTest: false
    });

    this.starfield = new THREE.Points(starGeometry, starMaterial);
    this.starfield.renderOrder = -1;
    this.scene.add(this.starfield);
  }

  setupLighting() {
    // Simple ambient lighting for flat shading
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    this.scene.add(directionalLight);
  }

  setupSpatialAudio() {
    // Create audio listener and add it to the camera
    this.audioListener = new THREE.AudioListener();
    this.camera.add(this.audioListener);

    // Create audio loader for loading sound files
    this.audioLoader = new THREE.AudioLoader();

    // Store audio buffers
    this.audioBuffers = {};

    // Generate procedural audio buffers for spatial sounds
    this.generateSpatialAudioBuffers();
  }

  generateSpatialAudioBuffers() {
    // Create audio context for generating procedural sounds
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Generate laser hit sound buffer
    this.audioBuffers.laserHit = this.generateLaserHitBuffer(audioContext);

    // Generate explosion sound buffer
    this.audioBuffers.explosion = this.generateExplosionBuffer(audioContext);
  }

  generateLaserHitBuffer(audioContext) {
    const sampleRate = audioContext.sampleRate;
    const duration = 0.25; // 250ms
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate metallic ping sound
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const frequency = 400 * Math.exp(-t * 3); // Frequency drops from 400Hz
      const amplitude = Math.exp(-t * 8) * 0.3; // Quick decay
      data[i] = Math.sin(2 * Math.PI * frequency * t) * amplitude;
    }

    return buffer;
  }

  generateExplosionBuffer(audioContext) {
    const sampleRate = audioContext.sampleRate;
    const duration = 1.5; // 1.5 seconds
    const length = sampleRate * duration;
    const buffer = audioContext.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate explosion rumble
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const frequency = 80 * Math.exp(-t * 0.5); // Low frequency rumble
      const amplitude = Math.exp(-t * 1.2) * 0.4; // Longer decay
      const noise = (Math.random() - 0.5) * 0.1; // Add some noise
      data[i] = (Math.sin(2 * Math.PI * frequency * t) + noise) * amplitude;
    }

    return buffer;
  }

  addEntity(entity) {
    this.entities.push(entity);
    if (entity.mesh) {
      this.scene.add(entity.mesh);
    }
  }

  removeEntity(entity) {
    const index = this.entities.indexOf(entity);
    if (index > -1) {
      this.entities.splice(index, 1);
      if (entity.mesh) {
        this.scene.remove(entity.mesh);
      }
    }
  }

  update(deltaTime) {
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime);
      }
    });
  }

  getResources() {
    return this.entities.filter(entity => entity.getType && entity.getType() === 'resource');
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const deltaTime = this.clock.getDelta();
    // Center starfield on player ship if available (do not rotate)
    if (this.spaceship && this.starfield) {
      this.starfield.position.copy(this.spaceship.getPosition());
      this.starfield.rotation.set(0, 0, 0); // Ensure no rotation is applied
    }
    // Parallax star layers: anchor roughly to camera but with slight lag for depth illusion
    if (this.camera) {
      const camPos = this.camera.position;
      if (this.starParallaxNear) {
        this.starParallaxNear.position.copy(camPos).multiplyScalar(0.92);
      }
      if (this.starParallaxFar) {
        this.starParallaxFar.position.copy(camPos).multiplyScalar(0.85);
      }
    }
    this.update(deltaTime);
    // UI cockpit parallax (if UI attached by outer Game)
    if (this.ui && this.spaceship) {
      try { this.ui.updateCockpitParallax(this.spaceship); } catch (_) {}
    }
    this.render();
    requestAnimationFrame(() => this.animate());
  }

  resize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Create spatial audio for laser hits
  createSpatialLaserHit(position) {
    if (!this.audioBuffers.laserHit) return;

    // Create invisible mesh for sound source
    const soundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    soundMesh.position.copy(position);
    this.scene.add(soundMesh);

    // Create positional audio
    const hitSound = new THREE.PositionalAudio(this.audioListener);
    hitSound.setBuffer(this.audioBuffers.laserHit);
    hitSound.setRefDistance(20); // Distance where volume reduction begins
    hitSound.setRolloffFactor(2); // How quickly volume decreases with distance
    hitSound.setVolume(0.4);
    hitSound.play();

    soundMesh.add(hitSound);

    // Clean up after sound finishes
    setTimeout(() => {
      this.scene.remove(soundMesh);
    }, 500);
  }

  // Create spatial audio for explosions
  createSpatialExplosion(position) {
    if (!this.audioBuffers.explosion) return;

    // Create invisible mesh for sound source
    const soundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.1, 0.1),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    soundMesh.position.copy(position);
    this.scene.add(soundMesh);

    // Create positional audio
    const explosionSound = new THREE.PositionalAudio(this.audioListener);
    explosionSound.setBuffer(this.audioBuffers.explosion);
    explosionSound.setRefDistance(50); // Larger distance for explosions
    explosionSound.setRolloffFactor(1.5); // Slower rolloff for explosions
    explosionSound.setVolume(0.6);
    explosionSound.play();

    soundMesh.add(explosionSound);

    // Clean up after sound finishes
    setTimeout(() => {
      this.scene.remove(soundMesh);
    }, 2000);
  }
}
