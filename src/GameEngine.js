import * as THREE from 'three';

export class GameEngine {
  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
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
  }

  setupScene() {
    // Add starfield background
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 1000;
    const starPositions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i++) {
      starPositions[i] = (Math.random() - 0.5) * 2000;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1,
      sizeAttenuation: false
    });
    
    const stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(stars);
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

  render() {
    this.renderer.render(this.scene, this.camera);
  }

  animate() {
    const deltaTime = this.clock.getDelta();
    this.update(deltaTime);
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
