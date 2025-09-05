import * as THREE from 'three';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
import { Asteroid } from './Asteroid.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { TargetingSystem } from './systems/TargetingSystem.js';
import { NavigationSystem } from './systems/NavigationSystem.js';
import { DockingManager } from './systems/DockingManager.js';
import { EnvironmentSystem } from './systems/EnvironmentSystem.js';
import { SoundManager } from './SoundManager.js';
import { MusicManager } from './MusicManager.js';
import { SectorManager } from './systems/SectorManager.js';
import { registerDefaultSerializers } from './systems/serialization/registerDefaultSerializers.js';
import { getSectorDefinition } from './systems/serialization/sectorDefinitions.js';
import { hashSeed } from './util/seedUtils.js';

import { NPCShip } from './NPCShip.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { ConversationSystem } from './ConversationSystem.js';
import { SpaceStation } from './SpaceStation.js';

class Game {
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.controls = new Controls(this.spaceship, this);
    this.ui = new UI();
    this.soundManager = new SoundManager();
    this.musicManager = new MusicManager();
    this.conversationSystem = new ConversationSystem();
    // Provide dockable query hook for conversation system
    this.conversationSystem._isPlanetDockable = (planetName) => {
      const planet = this.environmentSystem?.planets?.find(p => p.getName && p.getName() === planetName);
      return planet ? planet.dockable : true;
    };
    this.conversationSystem._getPlanetEntity = (planetName) => {
      return this.environmentSystem?.planets?.find(p => p.getName && p.getName() === planetName) || null;
    };
    this.conversationSystem._getStationForPlanet = (planetName) => {
      // Current environment tracks a single station (oceanusStation) possibly orbiting a planet
      const st = this.environmentSystem?.oceanusStation;
      if (st && st.planet && st.planet.getName && st.planet.getName() === planetName) return st;
      return null;
    };
    this.asteroids = [];
    // Sector persistence
    this.sectorManager = new SectorManager({
      gameEngine: this.gameEngine,
      createByType: () => null // creation handled by serializers directly
    });
    registerDefaultSerializers(this.sectorManager);
    this.activeSectorEntities = [];
    // Predefine sectors (seeded procedural asteroid fields)
    this.availableSectors = [
      { id: 'sector-1', name: 'Aridus Sector', seed: 0x1a2b, center: { x: -50, y: 50, z: -650 }, size: 1200 },
      { id: 'sector-2', name: 'random(33dd)', seed: 0x33dd, center: { x: 400, y: 0, z: -1200 }, size: 1400 },
      { id: 'sector-3', name: 'random(55aa)', seed: 0x55aa, center: { x: -600, y: -100, z: -300 }, size: 1000 },
      { id: 'sector-4', name: 'random(AAAA)', seed: 0xAAAA, center: { x: -600, y: -100, z: -300 }, size: 1000 },
      { id: 'sector-5', name: 'random(1234)', seed: 0x1234, center: { x: -200, y: 0, z: 0 }, size: 500 }
    ];
    // Combat system now owns lasers & explosions
    this.combatSystem = new CombatSystem({
      gameEngine: this.gameEngine,
      soundManager: this.soundManager,
      ui: this.ui,
      getSpaceship: () => this.spaceship,
      getCurrentTarget: () => this.targetingSystem.getCurrentCombatTarget(),
      onRequestTargetInfoUpdate: () => this.targetingSystem.updateTargetInfo(),
      getNPCShip: () => this.npcShip,
      getAsteroids: () => this.asteroids,
      onHitFeedback: () => this.ui.blinkCrosshairRed(),
      onNPCShipDestroyed: () => {
        const current = this.targetingSystem.getCurrentCombatTarget();
        if (current && current.getId && current.getId() === 'npcship') {
          // TargetingSystem will clear on next updateTargetInfo call
          this.targetingSystem.currentTarget = null;
          this.ui.clearTargetInfo();
        }
      },
      environmentSystem: () => this.environmentSystem
    });

    this.targetingSystem = new TargetingSystem({
      camera: this.gameEngine.camera,
      ui: this.ui,
      soundManager: this.soundManager,
      getSpaceship: () => this.spaceship,
      getAsteroids: () => this.asteroids,
      getNPCShip: () => this.npcShip,
      getPlanets: () => this.planets,
      getStation: () => this.oceanusStation
    });

    this.navigationSystem = new NavigationSystem({
      getSpaceship: () => this.spaceship,
      getNavTarget: () => this.targetingSystem.getCurrentNavTarget(),
      ui: this.ui
    });
    this.navigationSystem.assignCamera(this.gameEngine.camera);

    this.dockingManager = new DockingManager({
      ui: this.ui,
      getSpaceship: () => this.spaceship,
      getNavTarget: () => this.targetingSystem.getCurrentNavTarget(),
      clearCombatTarget: () => {
        if (this.targetingSystem.currentTarget) {
          this.targetingSystem.currentTarget.setTargeted && this.targetingSystem.currentTarget.setTargeted(false);
          this.targetingSystem.currentTarget = null;
          this.ui.clearTargetInfo();
        }
      }
    });

    // Backwards compatibility proxies so existing controls logic (T/Y clearing & comms) still works
    Object.defineProperty(this, 'currentTarget', {
      get: () => this.targetingSystem.getCurrentCombatTarget(),
      set: (val) => {
        const existing = this.targetingSystem.currentTarget;
        if (existing && existing !== val) {
          existing.setTargeted && existing.setTargeted(false);
          existing.setNavTargeted && existing.setNavTargeted(false);
        }
        this.targetingSystem.currentTarget = val;
      }
    });
    Object.defineProperty(this, 'currentNavTarget', {
      get: () => this.targetingSystem.getCurrentNavTarget(),
      set: (val) => {
        const existing = this.targetingSystem.currentNavTarget;
        if (existing && existing !== val) {
          existing.setNavTargeted && existing.setNavTargeted(false);
          existing.setTargeted && existing.setTargeted(false);
        }
        this.targetingSystem.currentNavTarget = val;
      }
    });
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

    // Environment system initialization
    this.environmentSystem = new EnvironmentSystem({
      gameEngine: this.gameEngine,
      planetFactory: () => {
        const p1 = new Planet(80, new THREE.Vector3(200, 0, -500), 0x8B4513, "Aridus Prime", "Thank you for contacting Aridus Prime.");
        const p2 = new Planet(60, new THREE.Vector3(-300, 100, -800), 0x4169E1, "Oceanus", "Thank you for contacting Oceanus.");
        return [p1, p2];
      },
      npcShipFactory: () => this.npcShip,
      procedural: false
    });
    // Aridus sector uses predefined planets; procedural sectors will regenerate on switch
    this.environmentSystem.init();
    const defaultSector = this.availableSectors[0];
    this.sectorManager.currentSectorId = defaultSector.id;
    const def = getSectorDefinition(defaultSector.id);
    if (def) {
      // Load explicit planets & station from definition once
      this.environmentSystem.clearPlanetsAndStations();
      const loadedPlanets = [];
      for (const p of def.planets) {
        const planet = new Planet(p.radius, new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color, p.name, p.greeting);
        planet.rotationSpeed = p.rotationSpeed ?? planet.rotationSpeed;
        this.environmentSystem.planets.push(planet);
        this.gameEngine.addEntity(planet);
        this.gameEngine.scene.add(planet.mesh);
        loadedPlanets.push(planet);
        // Attach moon if definition requests one
        if (p.hasMoon) {
          // Simple moon creation mirroring procedural helper (inline to avoid accessing private method)
          const moonRadius = planet.radius * 0.18;
          const dist = planet.radius * 3.6;
          const geo = new THREE.SphereGeometry(moonRadius, 8, 6);
          const mat = new THREE.MeshLambertMaterial({ color: 0xdddddd, flatShading: true });
          const moon = new THREE.Mesh(geo, mat);
          moon.userData.orbit = { center: planet.mesh.position.clone(), radius: dist, angle: Math.random() * Math.PI * 2, speed: 0.18 };
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
      }
      if (def.stations) {
        for (const s of def.stations) {
          const host = loadedPlanets.find(pl => pl.getName() === s.planetName) || loadedPlanets[0];
          if (host) {
            const station = new SpaceStation(host, { orbitRadius: s.orbitRadius, size: s.size, name: s.name, orbitSpeed: s.orbitSpeed });
            this.environmentSystem.oceanusStation = station; // keep compatibility reference
            this.gameEngine.addEntity(station);
            this.gameEngine.scene.add(station.mesh);
          }
        }
      }
      // Asteroid field seed from definition
      this.environmentSystem.configureAsteroidField(def.asteroidField);
      this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
    } else {
      // fallback to old behavior if definition missing
      let existingField = this.sectorManager.getAsteroidFieldState(defaultSector.id);
      if (!existingField) {
        this.environmentSystem.configureAsteroidField({ seed: defaultSector.seed, destroyedIds: [], center: defaultSector.center, size: defaultSector.size });
        this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
        existingField = this.environmentSystem.getAsteroidFieldState();
      } else {
        this.environmentSystem.configureAsteroidField(existingField);
      }
    }
    // Pre-cache other sectors' asteroid fields (only store seed/diff)
    for (let i = 1; i < this.availableSectors.length; i++) {
      const s = this.availableSectors[i];
      if (!this.sectorManager.getAsteroidFieldState(s.id)) {
        this.sectorManager.sectors.set(s.id, { id: s.id, dynamic: { entities: [] }, asteroidField: { seed: s.seed, destroyedIds: [], center: s.center, size: s.size } });
      }
    }
    // Backwards compatibility references
    this.planets = this.environmentSystem.planets;
    this.oceanusStation = this.environmentSystem.oceanusStation;
    this.asteroids = this.environmentSystem.asteroids;

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
    // Create stardust around derelict vessel
    this.environmentSystem.createDerelictStardustField(npcShipPos);

    // Position camera at spaceship center (cockpit view)
    this.gameEngine.camera.position.set(0, 0, 0);
    this.gameEngine.camera.rotation.set(0, 0, 0);
  }

  // createDerelictStardustField & createAsteroidField removed (handled by EnvironmentSystem)

  setupControls() {
    // Handle shooting
    this.controls.setOnShoot(() => {
      if (this.spaceship.flags.firingEnabled) {
        this.combatSystem.shootLaser();
      }
    });

    // Handle targeting
    this.controls.setOnTarget(() => {
      this.targetingSystem.targetNearestCombat();
    });

    // Handle navigation targeting
    this.controls.setOnNavTarget(() => {
      this.targetingSystem.targetNearestNav();
    });

    // Handle communications (V key: only for current target)
    this.controls.setOnComms(() => {
      const tgt = this.targetingSystem.getCurrentCombatTarget();
      if (tgt && tgt.isCommable) this.openComms();
    });

    // Handle nav target comms (C key)
    this.controls.setOnNavComms(() => {
      const nav = this.targetingSystem.getCurrentNavTarget();
      if (nav && nav.isCommable) this.openNavComms();
    });

    // Handle closing communications
    this.controls.setOnCloseComms(() => {
      this.closeComms();
    });

    // Map toggle
    this.controls.setOnMapToggle(() => {
      if (this.ui.mapModal.style.display === 'block') {
        this.ui.hideMapModal();
      } else {
        this.ui.showMapModal(this.availableSectors);
      }
    });

    // Map selection
    this.ui.setOnMapSelect((sectorId) => {
      this.switchSector(sectorId);
      this.ui.hideMapModal();
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

  // Legacy method retained temporarily for backward compatibility; delegates to combatSystem
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
    this.combatSystem.shootLaser();
  }

  update(deltaTime) {
    // Update controls
    this.controls.update(deltaTime);

    // Navigation (auto-slow + landing vector lock)
    this.navigationSystem.update(deltaTime);

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

    // Docking UI/status
    this.dockingManager.update(deltaTime);

    // Combat system update (lasers, explosions, collisions)
    this.combatSystem.update(deltaTime);

    // Persist asteroid field diff every frame (cheap to store small object)
    if (this.environmentSystem) {
      this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
    }

    // Update target info (combat) via targeting system
    this.targetingSystem.updateTargetInfo();

    // --- Update auto-aim cone color (homing radius indicator) ---
    // Default: green (not in range)
    const homingActive = this.targetingSystem.computeHomingState();
    if (homingActive) {
      this.ui.autoAimCone.style.border = '1px solid #ff0000'; // Red if homing active
    } else {
      this.ui.autoAimCone.style.border = '1px solid #00ff00'; // Green if not
    }

    this.targetingSystem.updateNavTargetInfo();

    // Radar update: include planets, station, asteroids (simple union)
    if (this.ui.updateRadar) {
      const playerPos = this.spaceship.getPosition();
      const playerQuat = this.spaceship.mesh.quaternion.clone();
  const targets = [];
  if (this.environmentSystem?.planets) targets.push(...this.environmentSystem.planets);
  if (this.environmentSystem?.oceanusStation) targets.push(this.environmentSystem.oceanusStation);
  if (this.npcShip && this.npcShip.isAlive && this.npcShip.isAlive()) targets.push(this.npcShip);
  if (this.asteroids) targets.push(...this.asteroids);
      // Flag nav-targetable vs combat-targetable (approx)
      const curCombat = this.targetingSystem.getCurrentCombatTarget?.();
      const curNav = this.targetingSystem.getCurrentNavTarget?.();
      const curCombatId = curCombat?.getId ? curCombat.getId() : null;
      const curNavId = curNav?.getId ? curNav.getId() : null;
      for (const t of targets) {
        // NPC ship lacks getName; keep red unless we want a distinct color later
        t.isNavTargetable = !!t.getName; // planets & station remain yellow
        const tId = t.getId ? t.getId() : null;
        const combatMatch = (t === curCombat) || (tId && curCombatId && tId === curCombatId);
        const navMatch = (t === curNav) || (tId && curNavId && tId === curNavId);
        t._radarHighlight = combatMatch || navMatch;
      }
      this.ui.updateRadar(playerPos, playerQuat, targets);
    }

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
    // (landing vector lock handled by navigationSystem)
    // Hide crosshair and auto-aim cone if firing is disabled
    if (!this.spaceship.flags.firingEnabled) {
      this.ui.crosshair.style.display = 'none';
      this.ui.autoAimCone.style.display = 'none';
    } else {
      this.ui.crosshair.style.display = 'block';
      this.ui.autoAimCone.style.display = 'block';
    }
  }

  switchSector(sectorId) {
    if (this.sectorManager.currentSectorId === sectorId) return; // already there
    if (this.environmentSystem) {
      this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
    }
    // Clear combat & nav targets prior to environment regeneration
    if (this.targetingSystem) {
      const currentCombat = this.targetingSystem.getCurrentCombatTarget?.();
      if (currentCombat && currentCombat.setTargeted) currentCombat.setTargeted(false);
      this.targetingSystem.currentTarget = null;
      this.ui.clearTargetInfo && this.ui.clearTargetInfo();
      const currentNav = this.targetingSystem.getCurrentNavTarget?.();
      if (currentNav && currentNav.setNavTargeted) currentNav.setNavTargeted(false);
      this.targetingSystem.currentNavTarget = null;
      this.ui.clearNavTargetInfo && this.ui.clearNavTargetInfo();
    }
    this.currentTarget = null;
    this.currentNavTarget = null;
    this.sectorManager.currentSectorId = sectorId;
    const fieldState = this.sectorManager.getAsteroidFieldState(sectorId);
    const sMeta = this.availableSectors.find(s => s.id === sectorId);
    // Hybrid logic: sector-1 = handcrafted only, sector-2 = handcrafted + procedural extras, others = fully procedural
    const def = getSectorDefinition(sectorId);
    if (def && sectorId === 'sector-1') {
      this.environmentSystem.procedural = false;
      this.environmentSystem.clearPlanetsAndStations();
      const loadedPlanets = [];
      for (const p of def.planets) {
        const planet = new Planet(p.radius, new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color, p.name, p.greeting);
        planet.rotationSpeed = p.rotationSpeed ?? planet.rotationSpeed;
        this.environmentSystem.planets.push(planet);
        this.gameEngine.addEntity(planet);
        this.gameEngine.scene.add(planet.mesh);
        loadedPlanets.push(planet);
      }
      if (def.stations) {
        for (const s of def.stations) {
          const host = loadedPlanets.find(pl => pl.getName() === s.planetName) || loadedPlanets[0];
          if (host) {
            const station = new SpaceStation(host, { orbitRadius: s.orbitRadius, size: s.size, name: s.name, orbitSpeed: s.orbitSpeed });
            this.environmentSystem.oceanusStation = station;
            this.gameEngine.addEntity(station);
            this.gameEngine.scene.add(station.mesh);
          }
        }
      }
  } else if (def && sectorId === 'sector-2') {
      // Hybrid: load base planets then add procedural extras
      this.environmentSystem.procedural = false; // We'll manually add procedural extras; avoid full procedural reset
      this.environmentSystem.clearPlanetsAndStations();
      const loadedPlanets = [];
      for (const p of def.planets) {
        const planet = new Planet(p.radius, new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color, p.name, p.greeting);
        planet.rotationSpeed = p.rotationSpeed ?? planet.rotationSpeed;
        this.environmentSystem.planets.push(planet);
        this.gameEngine.addEntity(planet);
        this.gameEngine.scene.add(planet.mesh);
        loadedPlanets.push(planet);
      }
      // Add procedural extras using hierarchical seeds (stable irrespective of generation order elsewhere)
      const extrasCfg = def.hybridProceduralExtras || { proceduralPlanetCount: 3, seedOffset: 0x9e };
      const baseSeed = (sMeta ? sMeta.seed : (Date.now() & 0xffff));
      const hybridSeed = baseSeed ^ (extrasCfg.seedOffset || 0x9e);
      const archetypes = this.environmentSystem._getPlanetArchetypes ? this.environmentSystem._getPlanetArchetypes() : [];
      const spread = 1800;
      const count = (extrasCfg.proceduralPlanetCount || 3);
      for (let i = 0; i < count; i++) {
        if (!archetypes.length) break;
        const pSeed = hashSeed(hybridSeed, 'hybridExtra', i);
        const prng = this.environmentSystem._rng ? this.environmentSystem._rng(pSeed) : (()=>Math.random());
        const a = archetypes[Math.floor(prng() * archetypes.length)];
        const radius = 40 + prng() * 55;
        const pos = new THREE.Vector3((prng() - 0.5) * spread, (prng() - 0.5) * spread * 0.5, -600 - prng() * spread);
        const planet = new Planet(radius, pos, a.color, a.name, a.greeting);
        planet.rotationSpeed = 0.02 + prng() * 0.12;
        planet.dockable = prng() < 0.55;
        this.environmentSystem.planets.push(planet);
        this.gameEngine.addEntity(planet);
        this.gameEngine.scene.add(planet.mesh);
        if (prng() < 0.18 && this.environmentSystem._addPlanetRings) this.environmentSystem._addPlanetRings(planet, prng);
        if (prng() < 0.22 && this.environmentSystem._addMoon) this.environmentSystem._addMoon(planet, prng);
      }
      // Optional: no stations defined; could add future procedural station logic here
      const wideRand = this.environmentSystem._rng(hashSeed(hybridSeed, 'wide'));
      const clusterRand = this.environmentSystem._rng(hashSeed(hybridSeed, 'cluster'));
      if (this.environmentSystem._createWideStardust) this.environmentSystem._createWideStardust(wideRand);
      if (this.environmentSystem._createPlanetClusterStardust) this.environmentSystem._createPlanetClusterStardust(clusterRand);
    } else {
      // Fully procedural for all other sectors
      this.environmentSystem.procedural = true;
      this.environmentSystem.initProcedural(sMeta ? sMeta.seed : (Date.now() & 0xffff));
    }
    if (fieldState) {
      this.environmentSystem.configureAsteroidField(fieldState);
    } else {
      const fallback = sMeta || { seed: Date.now() & 0xffff, center: { x: 0, y: 0, z: -800 }, size: 1200 };
      this.environmentSystem.configureAsteroidField({ seed: fallback.seed, destroyedIds: [], center: fallback.center, size: fallback.size });
      this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
    }
    // Move player near new sector center for immediate feedback
    const activeSector = this.availableSectors.find(s => s.id === sectorId);
    if (activeSector && activeSector.center) {
      this.spaceship.position.set(activeSector.center.x, activeSector.center.y, activeSector.center.z + 150); // offset slightly in front
      this.gameEngine.camera.position.copy(this.spaceship.position);
    }
    this.asteroids = this.environmentSystem.asteroids;
    this.planets = this.environmentSystem.planets;
    this.oceanusStation = this.environmentSystem.oceanusStation;
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

  // (updateNavTargetInfo removed - handled by TargetingSystem)

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
    const DOCKING_MAX_RANGE = 500;
    // Only open comms if we have a nav target and it's commable
    if (this.currentNavTarget && this.currentNavTarget.isCommable) {
      // Set comm target in docking range flag BEFORE generating options
      const spaceshipPos = this.spaceship.getPosition();
      const targetPos = this.currentNavTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      const inDockingRange = distance <= DOCKING_MAX_RANGE;
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
    // Delegate docking-related flag handling
    this.dockingManager.processFlags(flags);
    if (flags.global) {
      for (const [flagName, value] of Object.entries(flags.global)) {
        this.setGlobalFlag(flagName, value);
      }
    }
  }

  // startDockingProcess removed (handled by DockingManager)

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
        if (optionId === 'confirm_dock') {
          // Determine if docking target is a planet (no station landing vector API)
          const target = this.currentNavTarget;
          if (target && !target.getLandingVectorStartWorld) {
            // Planet docking context
            this.spaceship.flags.dockContext = 'planet';
            this.spaceship.flags.docketPlanetId = target.id || (target.getId && target.getId()) || null;
            this.spaceship.flags.dockedStationId = null;
          } else if (target && target.getLandingVectorStartWorld) {
            // Station docking context begins authorization stage
            this.spaceship.flags.dockContext = 'station';
            this.spaceship.flags.docketPlanetId = null;
            this.spaceship.flags.dockedStationId = target.id || (target.getId && target.getId()) || null;
          }
        }
        if (optionId === 'confirm_takeoff') {
          this.initiatePlanetTakeoff();
          // Clear docking context on takeoff start
          this.spaceship.flags.dockContext = null;
          this.spaceship.flags.docketPlanetId = null;
          this.spaceship.flags.dockedStationId = null;
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
  // Station docking context (authorization before physical dock)
  this.spaceship.flags.dockContext = 'station';
  this.spaceship.flags.docketPlanetId = null;
  const station = this.currentNavTarget;
  this.spaceship.flags.dockedStationId = station.id || (station.getId && station.getId()) || null;
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
