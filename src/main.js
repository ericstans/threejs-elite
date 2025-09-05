import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
import { Laser } from './Laser.js';
import { Asteroid } from './Asteroid.js';
import { Explosion } from './Explosion.js';
import { SoundManager } from './SoundManager.js';
import { MusicManager } from './MusicManager.js';

import { NPCShip } from './NPCShip.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ConversationSystem } from './ConversationSystem.js';
import { SpaceStation } from './SpaceStation.js';

class Game {
  handleLaserAsteroidCollision(laser, asteroid, laserIndex, asteroidIndex) {
    this.ui.blinkCrosshairRed();
    // Remove the laser
    this.gameEngine.removeEntity(laser);
    this.lasers.splice(laserIndex, 1);
    // Damage the asteroid
    const wasDestroyed = asteroid.takeDamage(1);
    if (wasDestroyed) {
      // Asteroid destroyed - create large explosion at center
      const explosion = new Explosion(asteroid.getPosition(), asteroid.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      // Play spatial explosion sound
      this.gameEngine.createSpatialExplosion(asteroid.getPosition());
      // Remove asteroid
      this.gameEngine.removeEntity(asteroid);
      this.asteroids.splice(asteroidIndex, 1);
    } else {
      // Asteroid hit but not destroyed - create small explosion on surface
      const hitPosition = asteroid.getPosition().clone();
      // Add some randomness to the hit position
      hitPosition.x += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.y += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.z += (Math.random() - 0.5) * asteroid.getSize();
      const explosion = new Explosion(hitPosition, 0.3, 0.3);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      // Play spatial hit sound
      this.gameEngine.createSpatialLaserHit(hitPosition);
    }
  }
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.controls = new Controls(this.spaceship, this);
    this.ui = new UI();
    this.soundManager = new SoundManager();
    this.musicManager = new MusicManager();
    this.conversationSystem = new ConversationSystem();
    this.lasers = [];
    this.asteroids = [];
    this.explosions = [];
    this.currentTarget = null;
    this.currentNavTarget = null;
    this.planets = [];
    this.musicStarted = false;
    // Global flags
    this.globalFlags = {
      gameStarted: false,
      firstDocking: false,
      // Add more global flags as needed
    };

    this.setupGame();
    this.setupControls();
    this.start();

    // Third-person orbit parameters
    this.thirdPersonOrbitYaw = 0; // radians
    this.thirdPersonOrbitPitch = 0; // radians
    this.thirdPersonCameraDistance = 55; // matches default Z offset length (will recalc on toggle)
    this.thirdPersonOrbitActive = false; // becomes true after any drag
    this._orbitDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;
    this._initOrbitEventHandlers();
    // Orbit idle auto-exit
    this.thirdPersonOrbitIdleSeconds = 0;
    this.thirdPersonOrbitIdleThreshold = 3; // seconds
  }

  _initOrbitEventHandlers() {
    // Prevent context menu so right-drag feels natural
    document.addEventListener('contextmenu', (e) => {
      if (this.spaceship.thirdPersonMode) e.preventDefault();
    });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.spaceship.thirdPersonMode) {
        this._orbitDragging = true;
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
        this.thirdPersonOrbitIdleSeconds = 0;
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this._orbitDragging = false;
      }
    });
    document.addEventListener('mouseleave', () => { this._orbitDragging = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this._orbitDragging) return;
      const dx = e.clientX - this._lastMouseX;
      const dy = e.clientY - this._lastMouseY;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
      const ROT_SPEED = 0.005; // radians per px
      this.thirdPersonOrbitYaw = (this.thirdPersonOrbitYaw + dx * ROT_SPEED) % (Math.PI * 2);
      // Clamp pitch to avoid flip
      this.thirdPersonOrbitPitch = Math.max(-1.2, Math.min(1.2, this.thirdPersonOrbitPitch + dy * ROT_SPEED));
      this.thirdPersonOrbitActive = true;
      this.thirdPersonOrbitIdleSeconds = 0;
    });
    // Scroll to zoom distance (optional)
    document.addEventListener('wheel', (e) => {
      if (!this.spaceship.thirdPersonMode) return;
      const delta = e.deltaY * 0.05;
      this.thirdPersonCameraDistance = Math.max(10, Math.min(200, this.thirdPersonCameraDistance + delta));
      if (this.thirdPersonOrbitActive) e.preventDefault();
      if (this.thirdPersonOrbitActive) this.thirdPersonOrbitIdleSeconds = 0;
    }, { passive: false });
  }

  initThirdPerson() {
    this.thirdPersonInitialized = true;
    // Load FBX model (ship2.fbx) similar to NPCShip but reused for player
    const loader = new FBXLoader();
    loader.load(
      new URL('./assets/fbx/ship2.fbx', import.meta.url).href,
      (object) => {
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
              child.material = new THREE.MeshStandardMaterial({ color: 0xccccff, emissive: 0x222244 });
            }
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.visible = true;
          }
        });
        // Center & scale similar to NPCShip
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        object.position.sub(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5;
        const scale = targetSize / maxDim;
        object.scale.setScalar(scale);
        // Store scaled size for automatic camera calibration
        const scaledBox = new THREE.Box3().setFromObject(object);
        const scaledSize = new THREE.Vector3();
        scaledBox.getSize(scaledSize);
        this.spaceship.thirdPersonModelSize = scaledSize.clone();
        // Default: no manual visual offset; keep logical position at model center
        this.spaceship.thirdPersonVisualOffset = new THREE.Vector3(0, 0, 0);
        // Add group to scene and to spaceship
        this.spaceship.enableThirdPerson(object);
        this.gameEngine.scene.add(this.spaceship.thirdPersonGroup);
        // Hide cockpit-only mesh when third person active
        this.spaceship.mesh.visible = false;
        // If already in third-person when model finishes loading, calibrate camera now
        if (this.spaceship.thirdPersonMode) {
          this.calibrateThirdPersonCamera();
        }
      },
      undefined,
      (err) => {
        console.error('Failed to load player third-person model', err);
      }
    );
  }

  calibrateThirdPersonCamera() {
    // Derive camera offset dynamically from model size so we avoid hardcoded magic numbers
    const size = this.spaceship.thirdPersonModelSize || new THREE.Vector3(5, 5, 10);
    const largest = Math.max(size.x, size.y, size.z);
    // Distance: a few times largest dimension so full ship is visible
    const distance = largest * 3.0; // tweak factor as desired
    const height = size.y * 0.7; // slightly above center
    // Camera sits behind ship along +Z (ship forward is -Z)
    this.thirdPersonCameraOffset = new THREE.Vector3(0, height, distance);
    this.thirdPersonCameraDistance = this.thirdPersonCameraOffset.length();
    // Reset orbit state to follow mode initial
    this.thirdPersonOrbitYaw = 0; // looking forward
    this.thirdPersonOrbitPitch = Math.asin(height / this.thirdPersonCameraDistance);
    this.thirdPersonOrbitActive = false;
    // Auto raise model so it isn't visually low: shift model up by a fraction of its height.
    // This keeps logic origin (ship position) roughly at an anchor below geometric center.
    if (this.spaceship.thirdPersonVisualOffset) {
      const verticalOffsetRatio = 25; // raise by 95% of model height; adjust if still low
      this.spaceship.thirdPersonVisualOffset.y = size.y * verticalOffsetRatio;
    }
  }

  toggleThirdPerson() {
    const switchingToThird = !this.spaceship.thirdPersonMode;
    // Capture camera position (first-person viewpoint) before switching to third person
    if (switchingToThird) {
      if (!this.lastFirstPersonCameraPos) this.lastFirstPersonCameraPos = new THREE.Vector3();
      this.lastFirstPersonCameraPos.copy(this.gameEngine.camera.position);
    }
    this.spaceship.toggleThirdPerson();
    if (switchingToThird) {
      // Activating third person: ensure group in scene & hide cockpit mesh
      if (!this.spaceship.thirdPersonLoaded) {
        // model still loading or not yet loaded
      }
      if (!this.spaceship.thirdPersonGroup.parent) {
        this.gameEngine.scene.add(this.spaceship.thirdPersonGroup);
      }
      this.spaceship.mesh.visible = false;
      // Calibrate camera offset automatically from model size (or fallback defaults)
      this.calibrateThirdPersonCamera();
      // Switch UI to third-person layout
      this.ui.applyThirdPersonLayout && this.ui.applyThirdPersonLayout();
      // Ensure 3D model visible & centered exactly where first-person camera was
      this.spaceship.thirdPersonGroup.visible = true;
      const spawnPos = (this.lastFirstPersonCameraPos) ? this.lastFirstPersonCameraPos : this.spaceship.getPosition();
      this.spaceship.thirdPersonGroup.position.copy(spawnPos);
      // Also keep internal ship logical position at that point to avoid jump
      this.spaceship.position.copy(spawnPos);
      const shipQuat = this.spaceship.quaternion.clone();
      this.spaceship.thirdPersonGroup.quaternion.copy(shipQuat);
      // Initialize orbit distance & angles from current offset vector
      this.thirdPersonCameraDistance = this.thirdPersonCameraOffset.length();
      this.thirdPersonOrbitYaw = 0; // forward
      // derive pitch from existing offset
      const off = this.thirdPersonCameraOffset;
      this.thirdPersonOrbitPitch = Math.asin(off.y / off.length());
      this.thirdPersonOrbitActive = false;
    } else {
      // Return to cockpit
      this.spaceship.mesh.visible = false; // still hidden because cockpit view uses camera at ship pos
      // camera will be reset each frame in update
      this.ui.applyFirstPersonLayout && this.ui.applyFirstPersonLayout();
      // Hide third-person visual representation
      this.spaceship.thirdPersonGroup.visible = false;
      this.thirdPersonOrbitActive = false;
    }
  }

  setupGame() {
    // Add spaceship to game engine for physics updates, but don't render the mesh
    this.gameEngine.addEntity(this.spaceship);
    // Hide the spaceship mesh since we're in cockpit view
    this.spaceship.mesh.visible = false;

    // Create planets (10x larger and much farther apart)
    // Scaled up: planets now 4x previous radii (20->80, 15->60)
    const planet1 = new Planet(80, new THREE.Vector3(200, 0, -500), 0x8B4513, "Aridus Prime", "Thank you for contacting Aridus Prime."); // Brown planet (4x size)
    const planet2 = new Planet(60, new THREE.Vector3(-300, 100, -800), 0x4169E1, "Oceanus", "Thank you for contacting Oceanus."); // Blue planet (4x size)

    this.planets.push(planet1);
    this.planets.push(planet2);
    this.gameEngine.addEntity(planet1);
    this.gameEngine.addEntity(planet2);

    // Add an orbital space station around Oceanus
    // Space station: only 2x its former absolute size (previous size ~7.2). New size target ~14.4 => factor 14.4 / 60 = 0.24.
    // Also adjust orbit so it isn't pushed too far out by planet scaling (use 2x original orbit distance: old 15*4=60, new 60*2=120).
    // Double previous station size (0.24 -> 0.48 radius factor)
    this.oceanusStation = new SpaceStation(planet2, { orbitRadius: planet2.radius * 2, size: planet2.radius * 0.48 });
    this.gameEngine.addEntity(this.oceanusStation);
    this.gameEngine.scene.add(this.oceanusStation.mesh);

    // Create asteroid field between the planets
    this.createAsteroidField();

    // --- Add static NPC ship near the asteroid field ---
    // Place it 60 units beside the field center
    const npcShipPos = new THREE.Vector3(-50 + 60, 50, -650);
    this.npcShip = new NPCShip(npcShipPos);
    // Wait for FBX to load, then add to scene
    const addNPC = () => {
      if (this.npcShip.loaded && this.npcShip.mesh.children.length > 0) {
        this.gameEngine.scene.add(this.npcShip.mesh);
      } else {
        setTimeout(addNPC, 100);
      }
    };
    addNPC();
    // Create a dense stardust field localized around the derelict vessel
    this.createDerelictStardustField(npcShipPos);

    // Position camera at spaceship center (cockpit view)
    this.gameEngine.camera.position.set(0, 0, 0);
    this.gameEngine.camera.rotation.set(0, 0, 0);
  }

  createDerelictStardustField(center) {
    // Parameters for local stardust
    const particleCount = 50; // denser than general background
    const radius = 250; // spherical radius around derelict
    const innerVoid = 25; // keep a small hollow so ship remains readable
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const tmpColor = new THREE.Color();
    let i = 0;
    for (let p = 0; p < particleCount; p++) {
      // Rejection sample to enforce hollow inner sphere
      let x, y, z, d;
      do {
        x = (Math.random() * 2 - 1);
        y = (Math.random() * 2 - 1);
        z = (Math.random() * 2 - 1);
        d = Math.sqrt(x * x + y * y + z * z);
      } while (d === 0 || d > 1 || d * radius < innerVoid);
      const falloff = d; // 0..1
      const rScaled = d * radius;
      // Slight clustering bias toward mid-shell: distort radius
      const bias = Math.pow(falloff, 0.6);
      const finalR = bias * radius;
      const px = center.x + x / d * finalR;
      const py = center.y + y / d * finalR;
      const pz = center.z + z / d * finalR;
      positions[i] = px; positions[i + 1] = py; positions[i + 2] = pz;
      // Color: faint bluish-white variance
      const hueJitter = 0.58 + (Math.random() - 0.5) * 0.04; // around blue/cyan
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
    // Mild slow rotation for subtle motion
    points.userData.update = (dt) => {
      points.rotation.y += dt * 0.0005; // gentle spin
    };
    this.derelictStardust = points;
    this.gameEngine.scene.add(points);
    // Hook into game loop via simple array or direct call in update
    if (!this._extraUpdatables) this._extraUpdatables = [];
    this._extraUpdatables.push(points);
  }

  createAsteroidField() {
    // Create asteroid field between the two planets (scaled up for new planet distances)
    const asteroidCount = 25;
    const fieldCenter = new THREE.Vector3(-50, 50, -650); // Keep center same for now
    const fieldSize = 1200; // Expand field size 4x to match planet scale increase

    for (let i = 0; i < asteroidCount; i++) {
      // Random position within the field
      const position = new THREE.Vector3(
        fieldCenter.x + (Math.random() - 0.5) * fieldSize,
        fieldCenter.y + (Math.random() - 0.5) * fieldSize,
        fieldCenter.z + (Math.random() - 0.5) * fieldSize
      );

      // Random size between 0.5 and 2.0
      const size = 0.5 + Math.random() * 1.5;

      const asteroid = new Asteroid(position, size);
      this.asteroids.push(asteroid);
      this.gameEngine.addEntity(asteroid);
    }
  }

  setupControls() {
    // Handle shooting
    this.controls.setOnShoot(() => {
      if (this.spaceship.flags.firingEnabled) {
        this.shootLaser();
      }
    });

    // Handle targeting
    this.controls.setOnTarget(() => {
      this.targetNearestAsteroid();
    });

    // Handle navigation targeting
    this.controls.setOnNavTarget(() => {
      this.targetNearestPlanet();
    });

    // Handle communications (V key: only for current target)
    this.controls.setOnComms(() => {
      if (this.currentTarget && this.currentTarget.isCommable) {
        this.openComms();
      }
    });

    // Handle nav target comms (C key)
    this.controls.setOnNavComms(() => {
      if (this.currentNavTarget && this.currentNavTarget.isCommable) {
        this.openNavComms();
      }
    });

    // Handle closing communications
    this.controls.setOnCloseComms(() => {
      this.closeComms();
    });

    // Handle conversation option selection
    this.controls.setOnCommsOption((optionNumber) => {
      this.selectCommsOption(optionNumber);
    });

    // Handle UI click selection
    this.ui.setOnCommsOptionClick((optionNumber) => {
      this.selectCommsOption(optionNumber);
    });

    // Handle window resize
    this.controls.setOnResize(() => {
      this.gameEngine.resize();
    });
  }

  shootLaser() {
    // Get spaceship position and forward direction
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();

    // Calculate forward direction from spaceship rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(spaceshipRot);

    // Check if we have a target and apply auto-aim
    let laserDirection = forward;
    if (this.currentTarget && this.currentTarget.isAlive()) {
      const targetPos = this.currentTarget.getPosition();
      const targetDirection = targetPos.clone().sub(spaceshipPos).normalize();

      // Calculate angle between forward direction and target direction
      const angle = forward.angleTo(targetDirection);
      const maxAngle = Math.PI / 18; // 10 degrees in radians

      // If target is within 10 degrees, aim at it
      if (angle <= maxAngle) {
        laserDirection = targetDirection;
      }
    }

    // Create laser slightly in front of spaceship
    const laserStartPos = spaceshipPos.clone().add(forward.clone().multiplyScalar(2));

    // Create new laser with calculated direction
    const laser = new Laser(laserStartPos, laserDirection);
    this.lasers.push(laser);
    this.gameEngine.addEntity(laser);

    // Play laser sound
    this.soundManager.playLaserSound();
  }

  update(deltaTime) {
    // Update controls
    this.controls.update(deltaTime);

    // Check for nav target proximity and auto-slow
    this.checkNavTargetProximity();

    // Update spaceship (includes docking logic)
    this.spaceship.update(deltaTime);
    // Update any extra updatables (like rotating stardust field)
    if (this._extraUpdatables) {
      for (const obj of this._extraUpdatables) {
        if (obj.userData && typeof obj.userData.update === 'function') {
          obj.userData.update(deltaTime);
        }
      }
    }
    // Handle orbit idle timeout
    if (this.spaceship.thirdPersonMode && this.thirdPersonOrbitActive) {
      this.thirdPersonOrbitIdleSeconds += deltaTime;
      if (this.thirdPersonOrbitIdleSeconds >= this.thirdPersonOrbitIdleThreshold) {
        this.thirdPersonOrbitActive = false; // auto-exit back to follow
      }
    }

    // Update station orbit
    if (this.oceanusStation) {
      this.oceanusStation.update(deltaTime);
    }

    // Update UI
    // Pass targetSpeed, currentSpeed, and maxSpeed for UI
    const targetSpeed = this.spaceship.getThrottle() * this.spaceship.maxSpeed;
    const currentSpeed = this.spaceship.getSpeed();
    const maxSpeed = this.spaceship.maxSpeed;
    this.ui.updateThrottle(targetSpeed, currentSpeed, maxSpeed);

    // Update debug flags display (only in dev mode)
    this.ui.updateFlagsDisplay(this.spaceship.getAllFlags(), this.getAllGlobalFlags());

    // Landing alignment status update
    if (this.spaceship.getFlag('landingVectorLocked') && this.spaceship.getFlag('landingAlignmentLocked') && this.ui.dockingStatus.textContent !== 'ALIGNMENT LOCK ACQUIRED') {
      this.ui.updateDockingStatus('ALIGNMENT LOCK ACQUIRED');
    }
    if (this.spaceship.getFlag('rotationLockAcquired') && this.ui.dockingStatus.textContent !== 'ROTATION LOCK ACQUIRED') {
      this.ui.updateDockingStatus('ROTATION LOCK ACQUIRED');
    }
    if (this.spaceship.flags.stationDocked && this.ui.dockingStatus.textContent !== 'DOCKING COMPLETE') {
      this.ui.updateDockingStatus('DOCKING COMPLETE');
    }
    // Fail-safe: if docking authorized but vector still hidden, reveal it (unless alignment lock already achieved, in which case it was intentionally hidden)
    if (this.spaceship.getFlag('dockingAuthorized') && !this.spaceship.getFlag('landingAlignmentLocked') && this.currentNavTarget && this.currentNavTarget.setLandingVectorVisible) {
      this.currentNavTarget.setLandingVectorVisible(true);
    }

    // Handle docking completion
    if (this.spaceship.flags.isDocked && this.spaceship.dockingProgress === 1) {
      this.ui.updateDockingStatus('DOCKING COMPLETE');
      this.ui.hideDockingStatus();
      console.log('Docking completed! Ship is now docked on', this.currentNavTarget?.getName());
    }

    // Update and cleanup lasers
    this.updateLasers(deltaTime);

    // Update and cleanup explosions
    this.updateExplosions(deltaTime);

    // Check for laser-asteroid collisions
    this.checkCollisions();

    // Update target information
    this.updateTargetInfo();

    // --- Update auto-aim cone color (homing radius indicator) ---
    // Default: green (not in range)
    let homingActive = false;
    if (this.currentTarget && this.currentTarget.isAlive()) {
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentTarget.getPosition();
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyEuler(this.spaceship.getRotation());
      const toTarget = targetPos.clone().sub(spaceshipPos).normalize();
      const angle = forward.angleTo(toTarget);
      const maxAngle = Math.PI / 18; // 10 degrees in radians (same as auto-aim)
      if (angle <= maxAngle) {
        homingActive = true;
      }
    }
    if (homingActive) {
      this.ui.autoAimCone.style.border = '1px solid #ff0000'; // Red if homing active
    } else {
      this.ui.autoAimCone.style.border = '1px solid #00ff00'; // Green if not
    }

    // Update nav target information
    this.updateNavTargetInfo();

    // Update camera to follow spaceship position and rotation exactly
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();
    if (this.spaceship.thirdPersonMode && this.thirdPersonCameraOffset) {
      if (this.thirdPersonOrbitActive) {
        // Orbit mode: compute offset in world space using spherical angles independent of ship roll
        const r = this.thirdPersonCameraDistance;
        const cp = Math.cos(this.thirdPersonOrbitPitch);
        const sp = Math.sin(this.thirdPersonOrbitPitch);
        const cy = Math.cos(this.thirdPersonOrbitYaw);
        const sy = Math.sin(this.thirdPersonOrbitYaw);
        const offset = new THREE.Vector3(r * sy * cp, r * sp, r * cy * cp); // z forward
        const camPos = spaceshipPos.clone().add(offset);
        this.gameEngine.camera.position.copy(camPos);
        this.gameEngine.camera.lookAt(spaceshipPos);
      } else {
        // Follow mode (previous behavior with full ship rotation)
        const shipQuat = this.spaceship.quaternion.clone();
        const offsetWorld = this.thirdPersonCameraOffset.clone().applyQuaternion(shipQuat);
        const camPos = spaceshipPos.clone().add(offsetWorld);
        this.gameEngine.camera.position.copy(camPos);
        this.gameEngine.camera.quaternion.copy(shipQuat);
      }
    } else {
      this.gameEngine.camera.position.copy(spaceshipPos);
      this.gameEngine.camera.rotation.copy(spaceshipRot);
    }

    // Update continuous engine rumble based on throttle & docking (station or planet)
    // Stop engine sound completely when docked, restart when undocked
    let isActuallyDocked = false;
    if (this.spaceship.flags.isDocked) {
      if (this.spaceship.dockingTarget && this.spaceship.dockingTarget.getPosition && !this.spaceship.takeoffActive) {
        isActuallyDocked = true;
      }
      if (this.spaceship.flags.stationDocked) {
        isActuallyDocked = true;
      }
    }
    if (!this._lastEngineDocked) this._lastEngineDocked = false;
    if (isActuallyDocked && !this._lastEngineDocked) {
      this.soundManager.stopEngineRumble();
    }
    if (!isActuallyDocked && this._lastEngineDocked) {
      // Resume engine rumble on undock
      this.soundManager.updateEngineRumble(this.spaceship.getThrottle(), false);
    }
    this._lastEngineDocked = isActuallyDocked;
    if (!isActuallyDocked) {
      this.soundManager.updateEngineRumble(this.spaceship.getThrottle(), false);
    }
    // Check landing vector acquisition if applicable
    this.checkLandingVectorLock();
    // Hide crosshair and auto-aim cone if firing is disabled
    if (!this.spaceship.flags.firingEnabled) {
      this.ui.crosshair.style.display = 'none';
      this.ui.autoAimCone.style.display = 'none';
    } else {
      this.ui.crosshair.style.display = 'block';
      this.ui.autoAimCone.style.display = 'block';
    }
  }

  updateLasers(deltaTime) {
    // Update lasers and remove expired ones
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      const shouldDestroy = laser.update(deltaTime);

      if (shouldDestroy) {
        this.gameEngine.removeEntity(laser);
        this.lasers.splice(i, 1);
      }
    }
  }

  updateExplosions(deltaTime) {
    // Update explosions and remove expired ones
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const shouldDestroy = explosion.update(deltaTime);

      if (shouldDestroy) {
        this.gameEngine.removeEntity(explosion);
        this.explosions.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    // Check each laser against each asteroid and the NPC ship
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      let hit = false;
      // Asteroids
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        if (!asteroid.isAlive()) continue;
        const distance = laser.getPosition().distanceTo(asteroid.getPosition());
        const collisionRadius = asteroid.getSize() + 0.1;
        if (distance < collisionRadius) {
          this.handleLaserAsteroidCollision(laser, asteroid, i, j);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      // NPC Ship
      if (this.npcShip && this.npcShip.loaded && this.npcShip.isAlive()) {
        const npcPos = this.npcShip.getWorldPosition();
        const npcRadius = this.npcShip.getSize() + 0.1;
        const distance = laser.getPosition().distanceTo(npcPos);
        if (distance < npcRadius) {
          this.handleLaserNPCShipCollision(laser, this.npcShip, i);
          continue;
        }
      }
    }
  }

  handleLaserNPCShipCollision(laser, npcShip, laserIndex) {
    this.ui.blinkCrosshairRed();
    // Remove the laser
    this.gameEngine.removeEntity(laser);
    this.lasers.splice(laserIndex, 1);
    // Calculate intersection point between laser and NPC ship bounding sphere
    const laserStart = laser.getPosition();
    const laserDir = laser.direction.clone().normalize();
    const sphereCenter = npcShip.getWorldPosition();
    const sphereRadius = npcShip.getSize();
    // Ray-sphere intersection
    const toCenter = sphereCenter.clone().sub(laserStart);
    const tProj = toCenter.dot(laserDir);
    let hitPosition = laserStart.clone().add(laserDir.clone().multiplyScalar(tProj));
    // Clamp to sphere surface
    const distToCenter = hitPosition.distanceTo(sphereCenter);
    if (distToCenter > sphereRadius) {
      hitPosition = sphereCenter.clone().add(
        hitPosition.clone().sub(sphereCenter).normalize().multiplyScalar(sphereRadius)
      );
    }
    // Damage the NPC ship
    const wasNPCDestroyed = npcShip.takeDamage(1);
    // If NPC ship currently targeted, refresh target info for updated health
    if (!wasNPCDestroyed && this.currentTarget && this.currentTarget.getId && this.currentTarget.getId() === 'npcship') {
      // Directly call updateTargetInfo so UI reflects new health immediately
      this.updateTargetInfo();
    }
    if (wasNPCDestroyed) {
      // NPC ship destroyed - create large explosion at center
      const explosion = new Explosion(hitPosition, npcShip.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      // Play spatial explosion sound
      this.gameEngine.createSpatialExplosion(hitPosition);
      // Clear target if it was the NPC ship
      if (this.currentTarget && this.currentTarget.getId && this.currentTarget.getId() === 'npcship') {
        this.currentTarget = null;
        this.ui.clearTargetInfo();
      }
      // Remove NPC ship from scene handled in destroy()
    } else {
      // NPC ship hit but not destroyed - create small explosion on surface
      const explosion = new Explosion(hitPosition, 0.3, 0.3);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      // Play spatial hit sound
      this.gameEngine.createSpatialLaserHit(hitPosition);
    }
  }

  targetNearestAsteroid() {
    // Clear current target
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
      this.currentTarget = null;
    }

    // Find asteroid or NPC ship closest to crosshair (center of screen)
    const camera = this.gameEngine.camera;
    const crosshairCenter = new THREE.Vector2(0, 0); // Center of screen in NDC
    let closestTarget = null;
    let closestScreenDistance = Infinity;

    // Combine asteroids and NPC ship into one array
    const targetables = [...this.asteroids];
    if (this.npcShip && this.npcShip.loaded && this.npcShip.mesh) {
      // Find the first visible mesh inside the NPCShip group
      let meshCenter = null;
      this.npcShip.mesh.traverse(child => {
        if (!meshCenter && child.isMesh) {
          // Get world position of the mesh
          meshCenter = new THREE.Vector3();
          child.getWorldPosition(meshCenter);
        }
      });
      if (meshCenter) {
        targetables.push({
          getPosition: () => meshCenter,
          isAlive: () => this.npcShip.isAlive(),
          setTargeted: (v) => { this.npcShip.mesh.userData.targeted = v; },
          getId: () => 'npcship',
          getName: () => 'Derelict Cruiser',
          getMass: () => 1000,
          getHealth: () => this.npcShip.getHealth(),
          getMaxHealth: () => this.npcShip.getMaxHealth(),
          isCommable: true
        });
      }
    }

    for (const obj of targetables) {
      if (!obj.isAlive()) continue;
      // Convert 3D position to 2D screen coordinates
      const pos = obj.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      // Check if in front of camera
      if (screenPos.z > 1) continue;
      // Calculate distance from crosshair center
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closestTarget = obj;
      }
    }

    // Set new target
    if (closestTarget) {
      this.currentTarget = closestTarget;
      this.currentTarget.setTargeted(true);
      // Play target selected sound
      this.soundManager.playTargetSelectedSound();
    }
  }

  updateTargetInfo() {
    if (this.currentTarget && this.currentTarget.isAlive()) {
      // Update target information in UI
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);

      this.ui.updateTargetInfo({
        id: this.currentTarget.getId(),
        mass: this.currentTarget.getMass(),
        distance: distance,
        health: this.currentTarget.getHealth(),
        maxHealth: this.currentTarget.getMaxHealth(),
        isCommable: this.currentTarget.isCommable
      }, targetPos, this.gameEngine.camera);
    } else {
      // Clear target if destroyed or invalid
      if (this.currentTarget) {
        this.currentTarget.setTargeted(false);
        this.currentTarget = null;
      }
      this.ui.clearTargetInfo();
    }
  }

  targetNearestPlanet() {
    // Block nav target changes while docking or docked
    if (this.spaceship.flags.isDocked || this.spaceship.flags.isDocking || this.spaceship.flags.landingVectorLocked) {
      return;
    }
    // Clear current nav target
    if (this.currentNavTarget) {
      this.currentNavTarget.setNavTargeted(false);
      this.currentNavTarget = null;
    }

    // Find planet closest to crosshair (center of screen)
    const camera = this.gameEngine.camera;
    const crosshairCenter = new THREE.Vector2(0, 0); // Center of screen in NDC
    let closestPlanet = null;
    let closestScreenDistance = Infinity;

    const navTargets = [...this.planets];
    if (this.oceanusStation) navTargets.push(this.oceanusStation);

    for (const target of navTargets) {
      const pos = target.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      if (screenPos.z > 1) continue;
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closestPlanet = target;
      }
    }

    // Set new nav target
    if (closestPlanet) {
      this.currentNavTarget = closestPlanet;
      this.currentNavTarget.setNavTargeted(true);

      // Play target selected sound
      this.soundManager.playTargetSelectedSound();
    }
  }

  checkNavTargetProximity() {
    if (!this.currentNavTarget) return;

    const spaceshipPos = this.spaceship.getPosition();
    const targetPos = this.currentNavTarget.getPosition();
    const distance = spaceshipPos.distanceTo(targetPos);

    // Check if nav target is within 100 units
    if (distance <= 100) {
      // Check if nav target is in the crosshair (center of screen)
      const camera = this.gameEngine.camera;
      const screenPos = targetPos.clone();
      screenPos.project(camera);

      // Check if target is in front of camera and near center of screen
      if (screenPos.z <= 1 && Math.abs(screenPos.x) < 0.1 && Math.abs(screenPos.y) < 0.1) {
        // Nav target is in crosshair and within 100 units - slow to stop
        this.spaceship.setThrottle(0);
      }
    }
  }

  updateNavTargetInfo() {
    if (this.currentNavTarget) {
      // Update nav target information in UI
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentNavTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);

      this.ui.updateNavTargetInfo({
        id: this.currentNavTarget.getId(),
        name: this.currentNavTarget.getName(),
        mass: this.currentNavTarget.getMass(),
        distance: distance,
        isCommable: this.currentNavTarget.isCommable
      }, targetPos, this.gameEngine.camera);
    } else {
      this.ui.clearNavTargetInfo();
    }
  }

  openComms() {
    // Only open comms if we have a commable current target
    if (this.currentTarget && this.currentTarget.isCommable) {
      // Set comm target in docking range flag BEFORE generating options
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      const inDockingRange = distance <= 200;
      this.spaceship.setFlag('commTargetInDockingRange', inDockingRange);
      const targetName = this.currentTarget.getName ? this.currentTarget.getName() : 'Unknown';
      const greeting = this.conversationSystem.getGreeting ? this.conversationSystem.getGreeting(targetName) : 'No response.';
      const playerFlags = this.spaceship.getAllFlags();
      const initialOptions = this.conversationSystem.getInitialOptions ? this.conversationSystem.getInitialOptions(targetName, playerFlags) : [{ id: 'end', text: 'End Transmission' }];
      this.ui.showCommsModal(targetName, greeting, initialOptions);
      this.currentConversationNode = 'initial';
    }
  }

  openNavComms() {
    // Only open comms if we have a nav target and it's commable
    if (this.currentNavTarget && this.currentNavTarget.isCommable) {
      // Set comm target in docking range flag BEFORE generating options
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentNavTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      const inDockingRange = distance <= 200;
      this.spaceship.setFlag('commTargetInDockingRange', inDockingRange);
      const planetName = this.currentNavTarget.getName();
      const greeting = this.conversationSystem.getGreeting(planetName);
      const playerFlags = this.spaceship.getAllFlags();
      const initialOptions = this.conversationSystem.getInitialOptions(planetName, playerFlags);
      this.ui.showCommsModal(planetName, greeting, initialOptions);
      this.currentConversationNode = 'initial';
    }
  }

  closeComms() {
    this.ui.hideCommsModal();
    this.currentConversationNode = null;

    // Clear comm target in docking range flag
    this.spaceship.setFlag('commTargetInDockingRange', null);
  }

  // Global flag management methods
  setGlobalFlag(flagName, value) {
    this.globalFlags[flagName] = value;
  }

  getGlobalFlag(flagName) {
    return this.globalFlags[flagName] || false;
  }

  hasGlobalFlag(flagName) {
    return this.globalFlags.hasOwnProperty(flagName) && this.globalFlags[flagName];
  }

  getAllGlobalFlags() {
    return { ...this.globalFlags };
  }

  // Process flags from conversation options
  processFlags(flags) {
    if (flags.player) {
      for (const [flagName, value] of Object.entries(flags.player)) {
        this.spaceship.setFlag(flagName, value);
        console.log(`Set player flag: ${flagName} = ${value}`);

        // Handle special flag actions
        if (flagName === 'isDocking' && value === true) {
          this.startDockingProcess();
        }
        if (flagName === 'dockingAuthorized' && value === true) {
          // New station flow: show authorization message
          this.ui.showDockingStatus();
          this.ui.updateDockingStatus('AUTHORIZED -- PROCEED TO LANDING VECTOR');
          // Reveal landing vector guidance now that authorization granted
          if (this.currentNavTarget && this.currentNavTarget.setLandingVectorVisible) {
            this.currentNavTarget.setLandingVectorVisible(true);
          }
        }
      }
    }

    if (flags.global) {
      for (const [flagName, value] of Object.entries(flags.global)) {
        this.setGlobalFlag(flagName, value);
        console.log(`Set global flag: ${flagName} = ${value}`);
      }
    }
  }

  startDockingProcess() {
    if (this.currentNavTarget) {
      // Clear current target when docking (but keep nav target)
      if (this.currentTarget) {
        this.currentTarget = null;
        this.ui.clearTargetInfo();
      }

      // Show docking UI
      this.ui.showDockingStatus();

      // Start docking sequence
      this.spaceship.startDocking(this.currentNavTarget);

      console.log('Docking process started with', this.currentNavTarget.getName());
    }
  }

  checkLandingVectorLock() {
    // Only if docking authorized, not already locked, and nav target is a station
    if (!this.currentNavTarget || !this.spaceship.getFlag('dockingAuthorized') || this.spaceship.getFlag('landingVectorLocked')) return;
    if (!this.currentNavTarget.getLandingVectorStartWorld) return; // ensure station
    const station = this.currentNavTarget;
    const start = station.getLandingVectorStartWorld();
    const dir = station.getLandingVectorDirectionWorld();
    const length = station.getLandingVectorLength();
    const shipPos = this.spaceship.getPosition();
    // Project ship position onto vector
    const toShip = shipPos.clone().sub(start);
    const proj = toShip.dot(dir);
    if (proj < 0 || proj > length) return; // outside segment
    // Radial distance from axis
    const closestPoint = start.clone().add(dir.clone().multiplyScalar(proj));
    const radialDist = shipPos.distanceTo(closestPoint);
    // Expanded capture tolerance (logic-only) to make locking easier without changing visual thickness.
    // Previously 0.15 * size; now using multiplier constant for easier tuning.
    const LANDING_VECTOR_CAPTURE_FACTOR = 0.30; // was 0.15
    const tolerance = this.currentNavTarget.size * LANDING_VECTOR_CAPTURE_FACTOR; // acceptable distance from line
    const forwardVelocity = this.spaceship.velocity.dot(dir); // toward slot if negative? depends on dir (dir is up). Allow near-zero
    if (radialDist < tolerance) {
      // Lock ship
      this.spaceship.lockToStation(station);
      this.ui.updateDockingStatus('LANDING VECTOR ACQUIRED');
      console.log('Landing vector lock achieved.');
    }
  }

  initiatePlanetTakeoff() {
    // Only proceed if currently docked to a planet
    if (!this.spaceship.flags.isDocked || this.spaceship.flags.stationDocked) return;
    const planet = this.spaceship.dockingTarget;
    if (!planet) return;
    // Use smooth takeoff sequence (keeps isDocked true until ascent completes)
    if (this.spaceship.startPlanetTakeoff) {
      this.spaceship.startPlanetTakeoff(planet, this.gameEngine.scene);
    }
  }

  selectCommsOption(optionNumber) {
    if (!this.ui.isCommsModalVisible() || !this.currentNavTarget) {
      return;
    }

    const planetName = this.currentNavTarget.getName();
    let options = [];
    let nodeId = this.currentConversationNode;

    // Get current options from the modal
    const optionElements = this.ui.commsOptions.children;
    if (optionNumber <= optionElements.length) {
      const selectedOption = optionElements[optionNumber - 1];
      const optionId = selectedOption.dataset.optionId;

      // Handle special cases
      if (optionId === 'end' || optionId === 'confirm_dock' || optionId === 'confirm_takeoff') {
        // Check if this option has flags to set before closing
        if (selectedOption.dataset.flags) {
          try {
            const flags = JSON.parse(selectedOption.dataset.flags);
            this.processFlags(flags);
          } catch (e) {
            console.warn('Invalid flags data:', selectedOption.dataset.flags);
          }
        }
        if (optionId === 'confirm_takeoff') {
          this.initiatePlanetTakeoff();
        }
        this.closeComms();
        return;
      }

      // Station-specific docking flow: request docking -> authorization granted
      if (optionId === 'docking' && this.currentNavTarget && this.currentNavTarget.getLandingVectorStartWorld) {
        // Grant docking authorization
        this.spaceship.setFlag('dockingAuthorized', true);
        this.ui.showDockingStatus();
        this.ui.updateDockingStatus('LANDING AUTHORIZED \n PROCEED TO LANDING VECTOR');
        this.closeComms();
        return;
      }

      // Check if this option has flags to set
      if (selectedOption.dataset.flags) {
        try {
          const flags = JSON.parse(selectedOption.dataset.flags);
          this.processFlags(flags);
        } catch (e) {
          console.warn('Invalid flags data:', selectedOption.dataset.flags);
        }
      }

      if (optionId === 'back_info') {
        // Go back to information node
        nodeId = 'information';
      } else {
        // Navigate to the selected conversation node
        nodeId = optionId;
      }

      // Get the conversation node
      const playerFlags = this.spaceship.getAllFlags();
      const conversationNode = this.conversationSystem.getConversationNode(planetName, nodeId, playerFlags);
      if (conversationNode) {
        this.ui.updateCommsModal(conversationNode.response, conversationNode.options);
        this.currentConversationNode = nodeId;
      }
    }
  }



  start() {
    // Override the game engine's update to include our custom update
    const originalUpdate = this.gameEngine.update.bind(this.gameEngine);
    this.gameEngine.update = (deltaTime) => {
      originalUpdate(deltaTime);
      this.update(deltaTime);
    };

    // Start the game loop
    this.gameEngine.animate();
  }
}

// Start the game
new Game();
