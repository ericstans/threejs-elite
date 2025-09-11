import * as THREE from 'three';
import './assets/fonts/peaberry.css';
import { GameEngine } from './GameEngine.js';
import { Spaceship } from './Spaceship.js';
import { Planet } from './Planet.js';
import { Controls } from './Controls.js';
import { UI } from './UI.js';
// import { Asteroid } from './Asteroid.js';
import { CombatSystem } from './systems/CombatSystem.js';
import { TargetingSystem } from './systems/TargetingSystem.js';
import { NavigationSystem } from './systems/NavigationSystem.js';
import { DockingManager } from './systems/DockingManager.js';
import { EnvironmentSystem } from './systems/EnvironmentSystem.js';
import { SectorManager } from './systems/SectorManager.js';
import { CargoSystem } from './systems/CargoSystem.js';
import { ThirdPersonCamera } from './systems/ThirdPersonCamera.js';
import { GameStateManager } from './systems/GameStateManager.js';
import { AudioManager } from './systems/AudioManager.js';
import { registerDefaultSerializers } from './systems/serialization/registerDefaultSerializers.js';
import { getSectorDefinition, availableSectors } from './systems/serialization/sectorDefinitions.js';
import { hashSeed } from './util/seedUtils.js';

// import { NPCShip } from './NPCShip.js';
import { EngineParticles } from './EngineParticles.js';
import { ConversationSystem } from './ConversationSystem.js';
import { SpaceStation } from './SpaceStation.js';

const DEBUG = false;

class Game {
  constructor() {
    this.gameEngine = new GameEngine();
    this.spaceship = new Spaceship();
    this.engineParticles = new EngineParticles(this.gameEngine.scene, this.spaceship);
    // Expose spaceship to engine for starfield & UI parallax logic
    this.gameEngine.spaceship = this.spaceship;
    this.controls = new Controls(this.spaceship, this);
    this.conversationSystem = new ConversationSystem();
    this.ui = new UI(this.conversationSystem);
    // Expose UI to engine for per-frame parallax callback
    this.gameEngine.ui = this.ui;
    // Provide dockable query hook for conversation system
    this.conversationSystem._isPlanetDockable = (planetName) => {
      const planet = this.environmentSystem?.planets?.find(p => p.getName && p.getName() === planetName);
      return planet ? planet.dockable : true;
    };
    this.conversationSystem._getPlanetEntity = (planetName) => {
      // Check planets first
      const planet = this.environmentSystem?.planets?.find(p => p.getName && p.getName() === planetName);
      if (planet) return planet;

      // Check NPC ships
      const npcShip = this.environmentSystem?.npcShips?.find(npc => npc.getName && npc.getName() === planetName);
      if (npcShip) return npcShip;

      return null;
    };
    this.conversationSystem._getStationForPlanet = (planetName) => {
      // Find station orbiting the specified planet
      const stations = this.environmentSystem?.stations || [];
      return stations.find(st => st.planet && st.planet.getName && st.planet.getName() === planetName) || null;
    };

    // Station detection and docking hooks
    this.conversationSystem.setStationDetectionHook((targetName) => {
      // Check if it's a known station
      const stations = this.environmentSystem?.stations || [];
      return targetName === 'Oceanus Station' ||
             stations.some(station => station.getName && station.getName() === targetName);
    });

    this.conversationSystem.setStationDockableHook((stationName) => {
      // Check if station is dockable
      const stations = this.environmentSystem?.stations || [];
      const station = stations.find(st => st.getName && st.getName() === stationName);
      if (station) {
        return station.dockable !== false;
      }
      return true; // default to dockable
    });
    this.asteroids = [];
    // Audio management system (creates SoundManager and MusicManager internally)
    this.audioManager = new AudioManager(this, this.spaceship, null);
    // Game state management system
    this.gameStateManager = new GameStateManager(this.audioManager.musicManager, this.audioManager.soundManager);
    // Update AudioManager with GameStateManager reference
    this.audioManager.setGameStateManager(this.gameStateManager);
    // Third-person camera system
    this.thirdPersonCamera = new ThirdPersonCamera(this.gameEngine, this.spaceship, this.ui, this.engineParticles);
    // Sector persistence
    this.sectorManager = new SectorManager({
      gameEngine: this.gameEngine,
      createByType: () => null // creation handled by serializers directly
    });
    registerDefaultSerializers(this.sectorManager);
    this.activeSectorEntities = [];
    // Predefine sectors (seeded procedural asteroid fields)
    this.availableSectors = availableSectors;
    // Combat system now owns lasers & explosions
    this.combatSystem = new CombatSystem({
      gameEngine: this.gameEngine,
      soundManager: this.audioManager.soundManager,
      ui: this.ui,
      getSpaceship: () => this.spaceship,
      getCurrentTarget: () => this.targetingSystem.getCurrentCombatTarget(),
      onRequestTargetInfoUpdate: () => this.targetingSystem.updateTargetInfo(),
      getNPCShips: () => this.npcShips,
      getAsteroids: () => this.asteroids,
      onHitFeedback: () => this.ui.blinkCrosshairRed(),
      onNPCShipHit: () => {
        this.audioManager.onCombatStart();
      },
      onNPCShipDestroyed: () => {
        const current = this.targetingSystem.getCurrentCombatTarget();
        if (current && current.getId && current.getId().startsWith('npcship-')) {
          // TargetingSystem will clear on next updateTargetInfo call
          this.targetingSystem.currentTarget = null;
          this.ui.clearTargetInfo();
        }

        // Check if any remaining NPC ships are hostile
        const hasHostileShips = this.npcShips && this.npcShips.some(npc =>
          npc.isAlive && npc.isAlive() && npc.isHostile && npc.isHostile()
        );

        // Only clear combat flag if no hostile ships remain
        if (!hasHostileShips) {
          this.audioManager.onCombatEnd();
        }
      },
      environmentSystem: () => this.environmentSystem
    });

    // Targeting system will be created after environment system

    // Navigation system will be created after targeting system

    // Docking manager will be created after targeting system

    // Backwards compatibility proxies will be created after targeting system
    this.planets = [];
    // Global flags are now managed by GameStateManager

    this.setupGame();
    this.setupControls();

    // Initialize OptionsUI with game reference
    this.ui.setGame(this);

    this.start().catch(console.error);
  }

  // Third-person camera event handlers are now handled by ThirdPersonCamera system

  initThirdPerson() {
    this.thirdPersonCamera.initThirdPerson();
  }

  calibrateThirdPersonCamera() {
    this.thirdPersonCamera.calibrateThirdPersonCamera();
  }

  toggleThirdPerson() {
    this.thirdPersonCamera.toggleThirdPerson();
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
        const p1 = new Planet(80, new THREE.Vector3(200, 0, -500), 0x8B4513, 'Aridus Prime', 'Thank you for contacting Aridus Prime.');
        const p2 = new Planet(60, new THREE.Vector3(-300, 100, -800), 0x4169E1, 'Oceanus', 'Thank you for contacting Oceanus.');
        return [p1, p2];
      },
      npcShipFactory: () => this.npcShips[0], // Legacy compatibility - return first NPC ship
      procedural: false
    });
    // Aridus sector uses predefined planets; procedural sectors will regenerate on switch
    this.environmentSystem.init();

    // Targeting system initialization (after environment system)
    this.targetingSystem = new TargetingSystem({
      camera: this.gameEngine.camera,
      ui: this.ui,
      soundManager: this.audioManager.soundManager,
      getSpaceship: () => this.spaceship,
      getAsteroids: () => this.asteroids,
      getNPCShips: () => this.npcShips,
      getPlanets: () => this.planets,
      getStations: () => {
        const stations = this.environmentSystem.stations;
        console.log('Main.js getStations callback: returning', stations.length, 'stations');
        return stations;
      },
      getResources: () => this.gameEngine.getResources()
    });

    // Navigation system initialization (after targeting system)
    this.navigationSystem = new NavigationSystem({
      getSpaceship: () => this.spaceship,
      getNavTarget: () => this.targetingSystem.getCurrentNavTarget(),
      ui: this.ui
    });
    this.navigationSystem.assignCamera(this.gameEngine.camera);

    // Docking manager initialization (after targeting system)
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
      },
      clearNavTarget: () => {
        if (this.targetingSystem.currentNavTarget) {
          if (this.targetingSystem.currentNavTarget.setNavTargeted) this.targetingSystem.currentNavTarget.setNavTargeted(false);
          this.targetingSystem.currentNavTarget = null;
          this.ui.clearNavTargetInfo && this.ui.clearNavTargetInfo();
        }
      },
      environmentSystem: () => this.environmentSystem
    });

    // Backwards compatibility proxies (after targeting system)
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

    // Cargo system initialization
    this.cargoSystem = new CargoSystem({
      getSpaceship: () => this.spaceship,
      getResources: () => this.gameEngine.getResources(),
      gameEngine: this.gameEngine,
      cargoUI: this.ui.cargoUI,
      soundManager: this.audioManager.soundManager,
      targetingSystem: this.targetingSystem
    });

    const defaultSector = this.availableSectors[0];
    this.sectorManager.currentSectorId = defaultSector.id;
    const def = getSectorDefinition(defaultSector.id);
    if (def) {
      // Load conversations from sector definition
      this.conversationSystem.loadConversationsFromSector(def);
      // Load explicit planets & station from definition once
      this.environmentSystem.clearPlanetsAndStations();
      const loadedPlanets = [];
      for (const p of def.planets) {
        const planet = new Planet(p.radius, new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color, p.name, p.greeting, p.services);
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
          // Nav-target interface (not commable)
          moon.userData.navId = `${planet.id}-moon-${Math.random().toString(36).substr(2,5)}`;
          moon.userData.navName = `${planet.getName()} Moon`;
          moon.userData.navMass = Math.pow(moonRadius, 3) * 800;
          moon.userData.isNavTargeted = false;
          moon.userData.isCommable = false; // not commable
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
      }
      if (def.stations) {
        for (const s of def.stations) {
          const host = loadedPlanets.find(pl => pl.getName() === s.planetName) || loadedPlanets[0];
          if (host) {
            const station = new SpaceStation(host, { orbitRadius: s.orbitRadius, size: s.size, name: s.name, orbitSpeed: s.orbitSpeed, services: s.services });
            this.environmentSystem.stations.push(station);
            this.gameEngine.addEntity(station);
            this.gameEngine.scene.add(station.mesh);
          }
        }
      }
      // Load NPC ships from definition
      if (def.npcShips && def.npcShips.length > 0) {
        this.environmentSystem.createNPCShipsFromDefinition(def.npcShips);
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
    this.oceanusStation = this.environmentSystem.oceanusStation; // Getter for backwards compatibility
    this.asteroids = this.environmentSystem.asteroids;
    this.npcShips = this.environmentSystem.npcShips;

    // NPC ships are now loaded from sector definitions

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

    // Handle services menu (S key)
    this.controls.setOnServices(() => {
      this.openServices();
    });

    // Handle closing services
    this.controls.setOnCloseServices(() => {
      this.closeServices();
    });

    // Map toggle
    this.controls.setOnMapToggle(() => {
      // Disable map when docked
      if (this.spaceship.flags.isDocked) {
        return;
      }
      
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
    const _laser = new Laser(laserStartPos, laserDirection);
    this.combatSystem.shootLaser();
  }

  // Pause/Resume functionality
  pause() {
    this.gameStateManager.pause();
  }

  resume() {
    this.gameStateManager.resume();
  }

  update(deltaTime) {
    // Skip update if paused
    if (this.gameStateManager.isGamePaused) return;
    // Update controls
    this.controls.update(deltaTime);

    // Navigation (auto-slow + landing vector lock)
    this.navigationSystem.update(deltaTime);

    // Update spaceship (includes docking logic)
    this.spaceship.update(deltaTime);

    // Update engine particles
    if (this.engineParticles) {
      const throttle = this.spaceship.getThrottle();
      this.engineParticles.update(deltaTime, throttle);
    }

    // Update any extra updatables (like rotating stardust field)
    if (this._extraUpdatables) {
      for (const obj of this._extraUpdatables) {
        if (obj.userData && typeof obj.userData.update === 'function') {
          obj.userData.update(deltaTime);
        }
      }
    }
    // Update third-person camera system
    this.thirdPersonCamera.update(deltaTime);

    // Update station orbits
    for (const station of this.environmentSystem.stations) {
      station.update(deltaTime);
    }

    // Update UI
    // Pass targetSpeed, currentSpeed, and maxSpeed for UI
    const targetSpeed = this.spaceship.getThrottle() * this.spaceship.maxSpeed;
    let currentSpeed = this.spaceship.getSpeed();
    const maxSpeed = this.spaceship.maxSpeed;
    
    // If docking, show docking speed instead of 0
    if (this.spaceship.flags.isDocking && currentSpeed < 0.1) {
      currentSpeed = this.spaceship.dockingSpeed;
    }
    
    this.ui.updateThrottle(targetSpeed, currentSpeed, maxSpeed);

    // Update debug flags display (only in dev mode)
    this.ui.updateFlagsDisplay(this.spaceship.getAllFlags(), this.getAllGlobalFlags());

    // Update cash display
    this.ui.updateCashDisplay(this.spaceship.getCash());

    // Docking UI/status
    this.dockingManager.update(deltaTime);

    // Combat system update (lasers, explosions, collisions)
    this.combatSystem.update(deltaTime);

    // Cargo system update (resource collection and magnetism)
    this.cargoSystem.update(deltaTime);

    // Audio manager update (handles music and sound transitions)
    this.audioManager.update();

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
      if (this.environmentSystem?.stations) targets.push(...this.environmentSystem.stations);
      // Include moons (nav-targetable, non-commable)
      if (this.environmentSystem?.planets) {
        for (const p of this.environmentSystem.planets) {
          if (p.moon) targets.push(p.moon);
        }
      }
      if (this.npcShips) targets.push(...this.npcShips.filter(npc => npc.isAlive && npc.isAlive()));
      if (this.asteroids) targets.push(...this.asteroids);
      if (this.gameEngine) targets.push(...this.gameEngine.getResources());
      // Flag nav-targetable vs combat-targetable (approx)
      const curCombat = this.targetingSystem.getCurrentCombatTarget?.();
      const curNav = this.targetingSystem.getCurrentNavTarget?.();
      const curCombatId = curCombat?.getId ? curCombat.getId() : null;
      const curNavId = curNav?.getId ? curNav.getId() : null;
      for (const t of targets) {
        // Set targeting properties based on entity type
        if (t.getType && t.getType() === 'resource') {
          // Resources are combat-targetable but not nav-targetable
          t.isNavTargetable = false;
          t.isCombatTargetable = true;
        } else {
          // NPC ship lacks getName; keep red unless we want a distinct color later
          t.isNavTargetable = !!t.getName; // planets & station remain yellow
        }
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
    if (this.spaceship.thirdPersonMode) {
      // Third-person camera positioning is handled by ThirdPersonCamera system
      // The system updates the camera position in its update() method
    } else {
      this.gameEngine.camera.position.copy(spaceshipPos);
      this.gameEngine.camera.rotation.copy(spaceshipRot);
    }

    // Update engine rumble based on throttle & docking (station or planet)
    this.audioManager.updateEngineRumble(this.spaceship);
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
    // Generic sector loading: handcrafted definitions take precedence over procedural generation
    const def = getSectorDefinition(sectorId);
    if (def) {
      // Load conversations from sector definition
      this.conversationSystem.loadConversationsFromSector(def);
      this.environmentSystem.procedural = false;
      this.environmentSystem.clearPlanetsAndStations();

      // Load handcrafted planets
      const loadedPlanets = [];
      for (const p of def.planets) {
        const planet = new Planet(p.radius, new THREE.Vector3(p.position.x, p.position.y, p.position.z), p.color, p.name, p.greeting, p.services);
        planet.rotationSpeed = p.rotationSpeed ?? planet.rotationSpeed;
        this.environmentSystem.planets.push(planet);
        this.gameEngine.addEntity(planet);
        this.gameEngine.scene.add(planet.mesh);
        loadedPlanets.push(planet);
        // Attach moon if definition requests one
        if (p.hasMoon) {
          const moonRadius = planet.radius * 0.18;
          const dist = planet.radius * 3.6;
          const geo = new THREE.SphereGeometry(moonRadius, 8, 6);
          const mat = new THREE.MeshLambertMaterial({ color: 0x888888 });
          const moon = new THREE.Mesh(geo, mat);
          moon.position.set(dist, 0, 0);
          planet.moon = moon;
          planet.mesh.add(moon);
        }
      }

      // Load handcrafted stations
      for (const s of def.stations) {
        const host = loadedPlanets.find(pl => pl.getName() === s.planetName) || loadedPlanets[0];
        if (host) {
          const station = new SpaceStation(host, { orbitRadius: s.orbitRadius, size: s.size, name: s.name, orbitSpeed: s.orbitSpeed, services: s.services });
          this.environmentSystem.stations.push(station);
          this.gameEngine.addEntity(station);
          this.gameEngine.scene.add(station.mesh);
        }
      }

      // Load handcrafted NPC ships
      this.environmentSystem.createNPCShipsFromDefinition(def.npcShips);
      this.npcShips = this.environmentSystem.npcShips;

      // Add procedural extras if specified
      if (def.hybridProceduralExtras) {
        const extrasCfg = def.hybridProceduralExtras;
        const baseSeed = (sMeta ? sMeta.seed : (Date.now() & 0xffff));
        const hybridSeed = baseSeed ^ (extrasCfg.seedOffset || 0x9e);
        const archetypes = this.environmentSystem._getPlanetArchetypes ? this.environmentSystem._getPlanetArchetypes() : [];
        const spread = sMeta ? sMeta.size : 1800;
        const count = (extrasCfg.proceduralPlanetCount || 0);
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
        // Add procedural stardust
        const wideRand = this.environmentSystem._rng(hashSeed(hybridSeed, 'wide'));
        const clusterRand = this.environmentSystem._rng(hashSeed(hybridSeed, 'cluster'));
        if (this.environmentSystem._createWideStardust) this.environmentSystem._createWideStardust(wideRand);
        if (this.environmentSystem._createPlanetClusterStardust) this.environmentSystem._createPlanetClusterStardust(clusterRand);
      }
    } else {
      // Fully procedural for sectors without definitions
      this.environmentSystem.procedural = true;
      this.environmentSystem.initProcedural(sMeta ? sMeta.seed : (Date.now() & 0xffff), sMeta ? sMeta.size : 1800);
    }
    if (fieldState) {
      this.environmentSystem.configureAsteroidField(fieldState);
    } else {
      const fallback = sMeta || { seed: Date.now() & 0xffff, center: { x: 0, y: 0, z: -800 }, size: 1200 };
      this.environmentSystem.configureAsteroidField({ seed: fallback.seed, destroyedIds: [], center: fallback.center, size: fallback.size });
      this.sectorManager.saveAsteroidFieldState(this.environmentSystem.getAsteroidFieldState());
    }
    // Clear combat flag when switching sectors
    this.spaceship.flags.isInCombat = false;

    // Set soundtracks from sector definition if provided, otherwise use default
    this.audioManager.setSectorSoundtracks(def);

    // Note: Sector soundtrack changes wait for current track to finish naturally
    // The MusicManager will pick up the new soundtracks on the next track

    // Move player near new sector center for immediate feedback
    const activeSector = this.availableSectors.find(s => s.id === sectorId);
    if (activeSector && activeSector.center) {
      this.spaceship.position.set(activeSector.center.x, activeSector.center.y, activeSector.center.z + 150); // offset slightly in front
      this.gameEngine.camera.position.copy(this.spaceship.position);
    }
    this.asteroids = this.environmentSystem.asteroids;
    this.planets = this.environmentSystem.planets;
    this.oceanusStation = this.environmentSystem.oceanusStation; // Getter for backwards compatibility
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
      this.commsModalType = 'combat'; // Track that this is a combat target comms modal
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
      this.commsModalType = 'nav'; // Track that this is a nav target comms modal
    }
  }

  closeComms() {
    this.ui.hideCommsModal();
    this.currentConversationNode = null;
    this.commsModalType = null;

    // Clear comm target in docking range flag
    this.spaceship.setFlag('commTargetInDockingRange', null);
  }

  openServices() {
    // Only open services if docked
    if (!this.spaceship.flags.isDocked) {
      return;
    }

    // Get the docked entity (planet or station)
    let dockedEntity = null;
    if (this.spaceship.flags.dockContext === 'planet') {
      dockedEntity = this.environmentSystem.planets.find(p => p.id === this.spaceship.flags.docketPlanetId);
    } else if (this.spaceship.flags.dockContext === 'station') {
      // Find the station the player is docked with
      const dockedStationId = this.spaceship.flags.dockedStationId;
      dockedEntity = this.environmentSystem.stations.find(s => s.id === dockedStationId) || this.environmentSystem.oceanusStation;
    }

    if (dockedEntity && dockedEntity.services) {
      this.ui.showServices(dockedEntity.services, dockedEntity.getName());
    }
  }

  closeServices() {
    this.ui.hideServices();
  }

  // Global flag management methods
  setGlobalFlag(flagName, value) {
    this.gameStateManager.setGlobalFlag(flagName, value);
  }

  getGlobalFlag(flagName) {
    return this.gameStateManager.getGlobalFlag(flagName);
  }

  hasGlobalFlag(flagName) {
    return this.gameStateManager.hasGlobalFlag(flagName);
  }

  getAllGlobalFlags() {
    return this.gameStateManager.getAllGlobalFlags();
  }

  // Audio management methods are now handled by AudioManager

  // Process flags from conversation options
  processFlags(flags) {
    // Delegate docking-related flag handling
    this.dockingManager.processFlags(flags);
    // Delegate global flag handling
    this.gameStateManager.processFlags(flags);
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
    const _forwardVelocity = this.spaceship.velocity.dot(dir); // toward slot if negative? depends on dir (dir is up). Allow near-zero
    if (radialDist < tolerance) {
      // Lock ship
      this.spaceship.lockToStation(station);
      this.ui.updateDockingStatus('LANDING VECTOR ACQUIRED');
      if (DEBUG) console.log('Landing vector lock achieved.');
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

  initiateStationTakeoff() {
    // Only proceed if currently docked to a station
    if (!this.spaceship.flags.isDocked || !this.spaceship.flags.stationDocked) return;
    const station = this.spaceship.dockedStation;
    if (!station) return;
    // Use smooth takeoff sequence (keeps isDocked true until ascent completes)
    if (this.spaceship.startStationTakeoff) {
      this.spaceship.startStationTakeoff(station, this.gameEngine.scene);
    }
  }

  selectCommsOption(optionNumber) {
    if (!this.ui.isCommsModalVisible()) {
      return;
    }

    // Determine if we're talking to a nav target or combat target based on modal type
    let currentTarget;
    if (this.commsModalType === 'combat') {
      currentTarget = this.currentTarget;
    } else if (this.commsModalType === 'nav') {
      currentTarget = this.currentNavTarget;
    } else {
      // Fallback to old logic if modal type is not set
      currentTarget = this.currentNavTarget || this.currentTarget;
    }

    if (!currentTarget) {
      return;
    }

    const planetName = currentTarget.getName();
    const _options = [];
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
          } catch (_e) {
            if (DEBUG) console.warn('Invalid flags data:', selectedOption.dataset.flags);
          }
        }
        if (optionId === 'confirm_dock') {
          // Only allow docking with nav targets
          const target = this.currentNavTarget;
          if (target) {
            if (!target.getLandingVectorStartWorld) {
              // Planet docking context
              this.spaceship.flags.dockContext = 'planet';
              this.spaceship.flags.docketPlanetId = target.id || (target.getId && target.getId()) || null;
              this.spaceship.flags.dockedStationId = null;
            } else if (target.getLandingVectorStartWorld) {
              // Station docking context begins authorization stage
              this.spaceship.flags.dockContext = 'station';
              this.spaceship.flags.docketPlanetId = null;
              this.spaceship.flags.dockedStationId = target.id || (target.getId && target.getId()) || null;
            }
          }
        }
        if (optionId === 'confirm_takeoff') {
          // Determine if this is a planet or station takeoff
          if (this.spaceship.flags.stationDocked) {
            this.initiateStationTakeoff();
          } else {
            this.initiatePlanetTakeoff();
          }
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
        } catch (_e) {
          if (DEBUG) console.warn('Invalid flags data:', selectedOption.dataset.flags);
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



  async start() {
    // Initialize audio systems
    await this.audioManager.initialize();
    
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
const game = new Game();

// Hide UI and cockpit initially until title is dismissed
game.ui.uiContainer.style.display = 'none';
game.ui.cockpitWrapper.style.display = 'none';

// Show title overlay at start
setTimeout(() => {
  game.ui.showTitle();
  game.ui.setOnTitleDismiss(() => {
    console.log('Title dismissed - game ready');
    // Show UI and cockpit after title is dismissed
    game.ui.uiContainer.style.display = 'block';
    game.ui.cockpitWrapper.style.display = 'block';

    // Recalculate radar size now that cockpit is visible
    setTimeout(() => {
      if (game.ui._updateRadarSize) {
        game.ui._updateRadarSize();
      }
    }, 100);

    // Setup tutorial callbacks
    game.ui.setOnTutorialPause(() => {
      game.gameStateManager.pause();
      console.log('Game paused for tutorial');
    });

    game.ui.setOnTutorialResume(() => {
      game.gameStateManager.resume();
      console.log('Game resumed after tutorial');
    });

    game.ui.setOnTutorialComplete(() => {
      console.log('Tutorial completed');
    });

    game.ui.setOnTutorialSkip(() => {
      console.log('Tutorial skipped');
    });

    // Check for URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const skipTutorial = urlParams.get('skiptutorial') === '1';
    const startWithCargo = urlParams.get('startWithCargo') === '1';
    
    // Add test cargo if requested
    if (startWithCargo) {
      game.cargoSystem.addTestCargo();
      console.log('Test cargo added via URL parameter');
    }
    
    // Start tutorial after 3 seconds (unless skipped)
    if (!skipTutorial) {
      setTimeout(() => {
        game.ui.showTutorial();
      }, 3000);
    } else {
      console.log('Tutorial skipped via URL parameter');
    }
  });
}, 1000); // Small delay to ensure everything is loaded

// Font loading verification
document.fonts.ready.then(() => {
  if (document.fonts.check('16px PeaberryMono')) {
    if (DEBUG) console.log('PeaberryMono font loaded successfully');
  }
});

