import * as THREE from 'three';
import { Explosion } from './Explosion.js';
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

    // External references (set by Game class)
    /** @type {any} */
    this.spaceship = null;
    /** @type {any} */
    this.ui = null;
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
    // --- Ship destruction sequence ---
    if (this.spaceship && typeof this.spaceship.hullStrength === 'number' && this.spaceship.hullStrength <= 0 && !this.spaceship._destroyed) {
      this.spaceship._destroyed = true;
      // Stop ship movement
      this.spaceship.velocity.set(0, 0, 0);
      this.spaceship.angularVelocity.set(0, 0, 0);
      // Disable controls and forcibly set speed/throttle to zero
      this.spaceship._controlsDisabled = true;
      this.spaceship.velocity.set(0, 0, 0);
      this.spaceship.angularVelocity.set(0, 0, 0);
      if (typeof this.spaceship.setThrottle === 'function') {
        this.spaceship.setThrottle(0);
      }
      // Overlay animated spiderweb crack effect on main canvas
      try {
        let crack = document.getElementById('canopy-crack-overlay');
        if (!crack) {
          crack = document.createElement('canvas');
          crack.id = 'canopy-crack-overlay';
          crack.style.position = 'fixed';
          crack.style.left = '0';
          crack.style.top = '0';
          crack.style.width = '100vw';
          crack.style.height = '100vh';
          crack.style.pointerEvents = 'none';
          crack.style.zIndex = '99999';
          document.body.appendChild(crack);
        }
        // Animate spiderweb cracks
        const canvas = crack instanceof HTMLCanvasElement ? crack : null;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          // Draw animated cracks (simple radial lines)
          const centerX = canvas.width/2, centerY = canvas.height/2;
          for (let i=0; i<16; i++) {
            const angle = (Math.PI*2) * (i/16) + Math.random()*0.2;
            const len = 180 + Math.random()*120;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(angle);
            ctx.beginPath();
            ctx.moveTo(0,0);
            ctx.lineTo(len, 0);
            ctx.strokeStyle = 'rgba(255,255,255,0.7)';
            ctx.lineWidth = 3;
            ctx.shadowColor = 'rgba(255,255,255,0.5)';
            ctx.shadowBlur = 8;
            ctx.stroke();
            ctx.restore();
          }
        }
      } catch(e) {}
      // Overlay cracks on Nav Target, Target, Radar UI (use actual panel elements)
      const crackOverlay = () => {
        const panels = [];
        if (this.ui && this.ui.navTargetUI && this.ui.navTargetUI.navTargetPanel) panels.push(this.ui.navTargetUI.navTargetPanel);
        if (this.ui && this.ui.targetUI && this.ui.targetUI.targetPanel) panels.push(this.ui.targetUI.targetPanel);
        if (this.ui && this.ui.radarUI && this.ui.radarUI.radarPanel) panels.push(this.ui.radarUI.radarPanel);
        panels.forEach(el => {
          if (el && !el.querySelector('.crack-svg')) {
            const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
            svg.classList.add('crack-svg');
            svg.setAttribute('width','100%');
            svg.setAttribute('height','100%');
            svg.style.position = 'absolute';
            svg.style.left = '0';
            svg.style.top = '0';
            svg.style.pointerEvents = 'none';
            svg.style.zIndex = '9999';
            for (let i=0; i<8; i++) {
              const angle = (Math.PI*2)*(i/8)+Math.random()*0.2;
              const x2 = 60+Math.cos(angle)*40;
              const y2 = 30+Math.sin(angle)*20;
              const line = document.createElementNS('http://www.w3.org/2000/svg','line');
              line.setAttribute('x1','60');
              line.setAttribute('y1','30');
              line.setAttribute('x2',String(x2));
              line.setAttribute('y2',String(y2));
              line.setAttribute('stroke','white');
              line.setAttribute('stroke-width','2');
              svg.appendChild(line);
            }
            el.appendChild(svg);
          }
        });
      };
      crackOverlay.call(this);
      // Play cracking sound
      try {
        const ctx = window.AudioContext ? new window.AudioContext() : null;
        if (ctx) {
          const osc = ctx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.value = 80 + Math.random()*40;
          const gain = ctx.createGain();
          gain.gain.value = 0.5;
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          gain.gain.setValueAtTime(0.5, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
          osc.stop(ctx.currentTime + 0.6);
          osc.onended = () => ctx.close();
        }
      } catch(e){}
      // Show 3D explosions (asteroid style) at ship position for 3 seconds
      if (!this._shipExplosionLoopActive) {
        this._shipExplosionLoopActive = true;
        let loopTime = 0;
        const spawnExplosion = () => {
          if (this.spaceship && loopTime < 3.0) {
            const pos = this.spaceship.getPosition();
            const size = 1.2 + Math.random()*0.7;
            const exp = new Explosion(pos.clone(), size, 0.5 + Math.random()*0.3);
            console.log('DEBUG: About to create explosion at', pos.toArray());
            this.entities.push(exp);
            console.log('DEBUG: Explosion object pushed to entities', exp);
            // Play explosion sound (much quieter)
            try {
              const ctx = window.AudioContext ? new window.AudioContext() : null;
              if (ctx) {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = 180 + Math.random()*60;
                const gain = ctx.createGain();
                gain.gain.value = 0.08;
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.25);
                osc.stop(ctx.currentTime + 0.3);
                osc.onended = () => ctx.close();
              }
            } catch(e){}
            loopTime += 0.18;
            setTimeout(spawnExplosion, 180);
          } else {
            this._shipExplosionLoopActive = false;
          }
        };
        spawnExplosion();
      }
    }
    this.entities.forEach(entity => {
      if (entity.update) {
        entity.update(deltaTime);
      }
    });

    // --- Planet collision and bounce for player ship ---
    if (this.spaceship) {
      // Simple bounce cooldown (prevents multiple bounces per frame)
      if (!this.spaceship._planetBounceCooldown) this.spaceship._planetBounceCooldown = 0;
      if (this.spaceship._planetBounceCooldown > 0) {
        this.spaceship._planetBounceCooldown -= deltaTime;
      }
      // Find all planets
      const planets = this.entities.filter(e => e.getType && e.getType() === 'planet');
      const shipPos = this.spaceship.getPosition();
      for (const planet of planets) {
        const planetPos = planet.getPosition();
        const r = planet.radius;
        const dist = shipPos.distanceTo(planetPos);
        if (dist < r + 1.5 && this.spaceship._planetBounceCooldown <= 0) { // 1.5 = ship radius fudge
          // Collision! Bounce off
          const normal = shipPos.clone().sub(planetPos).normalize();
          // Move ship just outside planet
          const bouncePos = planetPos.clone().add(normal.multiplyScalar(r + 2.0));
          this.spaceship.position.copy(bouncePos);
          this.spaceship.mesh.position.copy(bouncePos);
          // Bounce: reflect velocity, preserve speed
          const v = this.spaceship.velocity;
          const vDotN = v.dot(normal);
          const speed = v.length();
          this.spaceship.velocity.sub(normal.clone().multiplyScalar(2 * vDotN));
          this.spaceship.velocity.setLength(speed);

          // Hull damage
          let hullDamage = Math.floor(10 + Math.random() * 15);
          if (typeof this.spaceship.hullStrength === 'number') {
            this.spaceship.hullStrength = Math.max(0, this.spaceship.hullStrength - hullDamage);
          }
          // If UI exists, update ShipHealthUI
          if (this.ui && this.ui.shipHealthUI) {
            this.ui.shipHealthUI.update(this.spaceship);
          }

          // --- Synthesized crunch/bump sound ---
          try {
            const ctx = window.AudioContext ? new window.AudioContext() : null;
            if (ctx) {
              const osc = ctx.createOscillator();
              osc.type = 'square';
              osc.frequency.value = 120 + Math.random() * 40;
              const gain = ctx.createGain();
              gain.gain.value = 0.3;
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.start();
              gain.gain.setValueAtTime(0.3, ctx.currentTime);
              gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.18);
              osc.stop(ctx.currentTime + 0.2);
              osc.onended = () => ctx.close();
            }
          } catch (e) { /* ignore audio errors */ }

          // --- Flash screen red ---
          try {
            let flash = document.getElementById('planet-crunch-flash');
            if (!flash) {
              flash = document.createElement('div');
              flash.id = 'planet-crunch-flash';
              flash.style.position = 'fixed';
              flash.style.left = '0';
              flash.style.top = '0';
              flash.style.width = '100vw';
              flash.style.height = '100vh';
              flash.style.background = 'rgba(255,0,0,0.35)';
              flash.style.zIndex = '99999';
              flash.style.pointerEvents = 'none';
              flash.style.transition = 'opacity 0.2s';
              flash.style.opacity = '1';
              document.body.appendChild(flash);
            } else {
              flash.style.opacity = '1';
            }
            setTimeout(() => {
              if (flash) flash.style.opacity = '0';
            }, 180);
          } catch (e) { /* ignore flash errors */ }
          // Set bounce cooldown (0.3s)
          this.spaceship._planetBounceCooldown = 0.3;
          // Optionally: play sound, show effect, etc.
        }
      }
    }
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
      try { this.ui.updateCockpitParallax(this.spaceship); } catch (_) { /* Parallax update failed */ }
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
