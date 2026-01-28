
import * as THREE from 'three';
import { getShipType } from '../data/ShipTypes.js';
import { SHIP_EQUIPMENT } from '../data/ShipEquipmentData.js';
import { ShipDockingSystem } from '../systems/ShipDockingSystem.js';
const DEBUG = false;

export class Spaceship {
  constructor(shipType = 'Flea') {
    this._controlsDisabled = false;
    this.shipType = shipType;
    const typeConfig = getShipType(shipType);
    this.mesh = this.createSpaceshipMesh();
    this.thirdPersonGroup = new THREE.Group();
    this.thirdPersonLoaded = false;
    this.thirdPersonMode = false;
    this.thirdPersonVisualOffset = null;
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    // Position tracking for speed calculation during docking
    this.lastPosition = new THREE.Vector3(0, 0, 0);
    this.lastUpdateTime = Date.now();
    this.calculatedSpeed = 0;
    // Speed history for averaging (reduces erratic display during docking)
    this.speedHistory = [];
    this.speedHistoryMaxLength = 30; // Store the last 30 frames
    // Base movement properties from type (before equipment modifiers)
    this.baseMaxSpeed = typeConfig.stats.maxSpeed;
    this.baseAcceleration = typeConfig.stats.acceleration;
    this.baseRotationSpeed = typeConfig.stats.rotationSpeed;
    // Current stats (will be modified by equipment)
    this.maxSpeed = this.baseMaxSpeed;
    this.acceleration = this.baseAcceleration;
    this.rotationSpeed = this.baseRotationSpeed;
    this.throttle = 0;
    this.maxThrottle = 1;
    // Base hull stats (before equipment modifiers)
    this.baseMaxHullStrength = typeof typeConfig.hullStrength === 'number' ? typeConfig.hullStrength : 100;
    this.maxHullStrength = this.baseMaxHullStrength;
    this.hullStrength = this.maxHullStrength;
    // Player cash
    this.cash = 0;

    // Ship Equipment (default starting loadout)
    this.equippedWeapon = 'Laser 1';
    this.equippedHull = 'Medium Hull';
    this.equippedThrusters = 'Basic Thrusters';

    // Initialize docking system (handles all landing/takeoff logic)
    // Must be done before applyEquipmentModifiers() since it references dockingSystem
    this.dockingSystem = new ShipDockingSystem(this);

    // Apply equipment modifiers to stats
    this.applyEquipmentModifiers();

    // Player flags
    this.flags = {
      firingEnabled: true,
      isDocking: false,
      isDocked: false,
      isInCombat: false,
      dockingAuthorized: false,
      landingVectorLocked: false,
      landingAlignmentLocked: false,
      rotationLockAcquired: false,
      hasVisitedAridusPrime: false,
      hasVisitedOceanus: false,
      dockContext: null,
      docketPlanetId: null,
      dockedStationId: null
    };

    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    // Sync third person group if in third person mode
    if (this.thirdPersonMode) {
      this.syncThirdPerson();
    }
  }

  enableThirdPerson(modelRoot, activate = true) {
    // Attach loaded model root into thirdPersonGroup
    if (modelRoot && !this.thirdPersonLoaded) {
      this.thirdPersonGroup.add(modelRoot);
      this.thirdPersonLoaded = true;
    }
    // Allow preloading without activating third-person mode
    this.thirdPersonMode = !!activate;
    // Ensure visibility/transform reflects the chosen mode immediately
    this.syncThirdPerson();
  }

  disableThirdPerson() {
    this.thirdPersonMode = false;
  }


  syncThirdPerson() {
    if (this.thirdPersonMode) {
      if (this.flags.isDocked && this.dockingSystem.dockingTarget) {
        // When docked to a planet, ensure third-person model is properly positioned
        // relative to the planet's current rotation
        const planetPos = this.dockingSystem.dockingTarget.getPosition();
        const rotatedLandingPoint = this.dockingSystem.dockingPosition.clone().applyQuaternion(this.dockingSystem.dockingTarget.mesh.quaternion);
        const worldPos = planetPos.clone().add(rotatedLandingPoint);

        // Apply visual offset if needed
        if (this.thirdPersonVisualOffset) {
          const rotatedOffset = this.thirdPersonVisualOffset.clone().applyQuaternion(this.quaternion);
          worldPos.add(rotatedOffset);
        }

        this.thirdPersonGroup.position.copy(worldPos);
        this.thirdPersonGroup.quaternion.copy(this.quaternion);
        this.thirdPersonGroup.visible = true;
      } else {
        // Normal (non-docked) behavior
        // Base position is logical ship position (cockpit viewpoint)
        const basePos = this.position.clone();
        if (this.thirdPersonVisualOffset) {
          // Rotate offset by ship orientation so it stays attached properly
          const rotated = this.thirdPersonVisualOffset.clone().applyQuaternion(this.quaternion);
          basePos.add(rotated);
        }
        this.thirdPersonGroup.position.copy(basePos);
        this.thirdPersonGroup.quaternion.copy(this.quaternion);
        this.thirdPersonGroup.visible = true;
      }
    } else {
      this.thirdPersonGroup.visible = false;
    }
  }

  lockToStation(station) {
    // Freeze relative motion: attach ship to station but keep slight offset on vector start
    this.dockingSystem.dockingTarget = station;
    this.flags.landingVectorLocked = true;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.dockingSystem.landingVectorStation = station;
    // Capture current relative local offset so we preserve exact position at lock moment (no teleport)
    this.dockingSystem.landingVectorHoldOffset = 0;
    const worldPosAtLock = this.position.clone();
    this.landingVectorLocalOffset = station.mesh.worldToLocal(worldPosAtLock.clone());
    // Store along-axis distance to maintain longitudinal placement
    const start = station.getLandingVectorStartWorld();
    const dir = station.getLandingVectorDirectionWorld();
    this.landingVectorAlongDistance = worldPosAtLock.clone().sub(start).dot(dir);
    // Direction data for orientation
    // (dir already defined)
    // Orientation: align ship forward (-Z) with station slot normal (invert dir so facing down toward slot)
    const desiredForward = dir.clone().negate();
    const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
    const q = new THREE.Quaternion().setFromUnitVectors(currentForward.normalize(), desiredForward.normalize());
    this.quaternion.premultiply(q);
    this.rotation.setFromQuaternion(this.quaternion);
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    if (this.thirdPersonMode) {
      this.thirdPersonGroup.position.copy(this.position);
      this.thirdPersonGroup.quaternion.copy(this.quaternion);
    }
  }

  createSpaceshipMesh() {
    // Create a simple spaceship geometry (cockpit view)
    const group = new THREE.Group();

    // Main body - using MeshPhysicalMaterial for better appearance
    const bodyGeometry = new THREE.ConeGeometry(0.3, 2, 8);

    // Generate a vibrant random color for the ship body
    const randomHue = Math.random() * 360;
    const saturation = 0.9;  // Very high saturation for vibrant colors
    const lightness = 0.5;   // Medium lightness for good visibility
    const shipColor = new THREE.Color().setHSL(randomHue / 360, saturation, lightness);

    // Create emissive color based on the ship color for subtle glow
    const emissiveColor = shipColor.clone().multiplyScalar(0.3);

    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: shipColor,
      metalness: 0.2,         // Lower metalness to show more base color
      roughness: 0.6,         // Higher roughness to show less environment reflection
      emissive: emissiveColor, // Subtle glow matching the base color
      emissiveIntensity: 0.3,  // Increased glow intensity
      flatShading: true
    });

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);

    // Wings - using similar material but slightly darker
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3);
    const wingColor = shipColor.clone().multiplyScalar(0.8); // Darker than body
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: wingColor,
      metalness: 0.2,
      roughness: 0.6,
      emissive: emissiveColor.clone().multiplyScalar(0.8),
      emissiveIntensity: 0.3,
      flatShading: true
    });

    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0);
    group.add(leftWing);

    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0);
    group.add(rightWing);

    // Cockpit - using enhanced glass material
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4444ff,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.8,
      opacity: 0.7,
      transparent: true,
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      ior: 1.5,
      reflectivity: 0.9,
      flatShading: true
    });

    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.2, 0.5);
    group.add(cockpit);

    return group;
  }

  update(deltaTime) {
    // Store last position for speed calculation only during docking/takeoff sequences
    if (this.flags.isDocking || this.dockingSystem.takeoffActive) {
      this.lastPosition.copy(this.position);
    }

    // Block all movement and control if destroyed
    if (this._controlsDisabled) {
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      if (typeof this.setThrottle === 'function') this.setThrottle(0);
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      this.mesh.quaternion.copy(this.quaternion);
      this.syncThirdPerson();
      return;
    }
    // Debug: Check if ship gets detached unexpectedly
    if (this.flags.isDocked && this.flags.stationDocked && this.mesh.parent === null) {
      if (DEBUG) console.log('WARNING: Ship detached from station unexpectedly!');
      if (DEBUG) console.trace();
    }

    // Handle docking
    this.dockingSystem.updateDocking(deltaTime);

    // Final station turnaround phase (runs before other movement once initiated)
    if (this.dockingSystem.updateFinalTurn(deltaTime)) {
      return; // Skip rest while turning
    }

    // Smooth takeoff (planet or station) - runs before any other movement once active
    if (this.dockingSystem.updateTakeoff(deltaTime)) {
      return;
    }

    // Follow station landing vector if locked (but not yet docked)
    if (this.dockingSystem.updateLandingVector(deltaTime)) {
      return; // Skip normal movement while locked
    }

    // If docked, update docked state
    if (this.dockingSystem.updateDockedState()) {
      return;
    }

    // If docking, set throttle to 0 and let ship coast to stop
    if (this.flags.isDocking) {
      this.throttle = 0;
      // Don't apply normal movement during docking - let updateDocking handle it
      this.velocity.multiplyScalar(0.98); // Apply drag
      this.angularVelocity.multiplyScalar(0.9); // Apply angular drag
      this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
      this.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(this.angularVelocity.clone().normalize(), this.angularVelocity.length() * deltaTime));
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      this.syncThirdPerson();
      return;
    }

    // Apply throttle as target speed (0-1 throttle = 0-maxSpeed target)
    const targetSpeed = this.throttle * this.maxSpeed;
    const currentSpeed = this.getSpeed();
    const speedDifference = targetSpeed - currentSpeed;

    // Apply acceleration/deceleration based on speed difference
    if (Math.abs(speedDifference) > 0.1) {
      const accelerationDirection = Math.sign(speedDifference);
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.quaternion);
      const forwardNorm = forward.clone().normalize();
      const vForward = this.velocity.dot(forwardNorm);
      const forwardForce = accelerationDirection * this.acceleration * deltaTime;
      this.velocity.add(forward.clone().multiplyScalar(forwardForce));
      // Prevent overshoot into reverse if throttle is zero or positive
      if (this.throttle >= 0) {
        const newVForward = this.velocity.dot(forwardNorm);
        // If we were moving forward and now would move backward, clamp to zero
        if (vForward > 0 && newVForward < 0) {
          // Remove forward component, keep any lateral velocity
          const lateral = this.velocity.clone().sub(forwardNorm.clone().multiplyScalar(newVForward));
          this.velocity.copy(lateral);
        }
      }
    }

    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Apply angular velocity to quaternion (local space rotation)
    const angularQuaternion = new THREE.Quaternion();
    angularQuaternion.setFromAxisAngle(this.angularVelocity.clone().normalize(), this.angularVelocity.length() * deltaTime);
    this.quaternion.multiply(angularQuaternion);

    // Update Euler rotation for mesh display
    this.rotation.setFromQuaternion(this.quaternion);

    // Apply drag (minimal in space, but nice for control feel)
    this.velocity.multiplyScalar(0.999);
    this.angularVelocity.multiplyScalar(0.99);

    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    this.syncThirdPerson();

    // --- Clamp: prevent unintentional backward drift when throttle >= 0 ---
    if (this.throttle >= 0) {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).normalize();
      const vForward = this.velocity.dot(forward);
      if (vForward < 0) {
        // Remove backward component, keep any lateral velocity
        const lateral = this.velocity.clone().sub(forward.clone().multiplyScalar(vForward));
        this.velocity.copy(lateral);
      }
    }
  }

  // Control methods
  pitch(amount) {
    // Apply pitch around local X-axis
    const pitchForce = amount * this.rotationSpeed;
    this.angularVelocity.x += pitchForce;
  }

  yaw(amount) {
    // Apply yaw around local Y-axis
    const yawForce = amount * this.rotationSpeed;
    this.angularVelocity.y += yawForce;
  }

  roll(amount) {
    // Apply roll around local Z-axis
    const rollForce = amount * this.rotationSpeed;
    this.angularVelocity.z += rollForce;
  }

  setThrottle(throttle) {
    this.throttle = Math.max(0, Math.min(this.maxThrottle, throttle));
  }

  getThrottle() {
    return this.throttle;
  }

  getSpeed() {
    return this.velocity.length();
  }

  // Calculate actual movement speed based on position changes
  // Used primarily during docking and takeoff when velocity doesn't reflect actual movement
  calculateActualSpeed() {
    // Only calculate position-based speed during automated sequences
    if (!this.flags.isDocking && !this.dockingSystem.takeoffActive) {
      // During normal flight, return the regular velocity-based speed
      return this.velocity.length();
    }

    const now = Date.now();
    const timeElapsed = (now - this.lastUpdateTime) / 1000; // Convert to seconds

    if (timeElapsed > 0) {
      // Calculate distance moved since last update
      const distance = this.position.distanceTo(this.lastPosition);
      // Calculate speed (units per second)
      const instantSpeed = distance / timeElapsed;

      // Only add to speed history if the value is reasonable
      // Exclude values that exceed maxSpeed which are likely measurement errors
      if (instantSpeed <= this.maxSpeed) {
        this.speedHistory.push(instantSpeed);

        // Keep history within maximum length
        if (this.speedHistory.length > this.speedHistoryMaxLength) {
          this.speedHistory.shift(); // Remove oldest entry
        }
      }

      // Calculate average speed from history, filtering out any values that exceed maxSpeed
      if (this.speedHistory.length > 0) {
        const validSpeeds = this.speedHistory.filter(speed => speed <= this.maxSpeed);
        if (validSpeeds.length > 0) {
          const sum = validSpeeds.reduce((a, b) => a + b, 0);
          this.calculatedSpeed = sum / validSpeeds.length;
        } else {
          // If all speeds were filtered out, use the minimum of instant speed and max speed
          this.calculatedSpeed = Math.min(instantSpeed, this.maxSpeed);
        }
      } else {
        // If history is empty, use the minimum of instant speed and max speed
        this.calculatedSpeed = Math.min(instantSpeed, this.maxSpeed);
      }

      // Update last position and time for next calculation
      this.lastPosition.copy(this.position);
      this.lastUpdateTime = now;
    }

    return this.calculatedSpeed;
  }

  getSpeedPerMinute() {
    return this.velocity.length() * 60; // Convert from units/second to units/minute
  }

  getSpeedPercentage() {
    return Math.min(this.getSpeed() / this.maxSpeed, 1.0);
  }

  // Reset speed history when docking state changes
  resetSpeedHistory() {
    this.speedHistory = [];
    this.calculatedSpeed = 0;
  }

  getPosition() {
    return this.position.clone();
  }

  // Flag management methods
  setFlag(flagName, value) {
    this.flags[flagName] = value;
  }

  getFlag(flagName) {
    return this.flags[flagName] || false;
  }

  hasFlag(flagName) {
    return Object.prototype.hasOwnProperty.call(this.flags, flagName) && this.flags[flagName];
  }

  getAllFlags() {
    return { ...this.flags };
  }

  // Docking methods (delegate to dockingSystem)
  startDocking(targetPlanet) {
    this.dockingSystem.startDocking(targetPlanet);
  }

  getRotation() {
    return this.rotation.clone();
  }

  startPlanetTakeoff(planet, scene) {
    this.dockingSystem.startPlanetTakeoff(planet, scene);
  }

  startStationTakeoff(station, scene) {
    this.dockingSystem.startStationTakeoff(station, scene);
  }

  // When launching/takeoff completes
  completeTakeoff() {
    this.dockingSystem.completeTakeoff();
  }

  // Cash management methods
  getCash() {
    return this.cash;
  }

  addCash(amount) {
    this.cash += amount;
    return this.cash;
  }

  removeCash(amount) {
    this.cash = Math.max(0, this.cash - amount);
    return this.cash;
  }

  setCash(amount) {
    this.cash = Math.max(0, amount);
    return this.cash;
  }

  // Apply equipment modifiers to ship stats
  applyEquipmentModifiers() {
    // Start with base stats
    let speedMultiplier = 1.0;
    let thrustMultiplier = 1.0;
    let maneuverabilityMultiplier = 1.0;
    let armor = 0;

    // Apply hull modifiers
    if (this.equippedHull && SHIP_EQUIPMENT.HULLS[this.equippedHull]) {
      const hull = SHIP_EQUIPMENT.HULLS[this.equippedHull];
      speedMultiplier *= hull.speed || 1.0;
      maneuverabilityMultiplier *= hull.maneuverability || 1.0;
      armor = hull.armor || 0;
    }

    // Apply thruster modifiers
    if (this.equippedThrusters && SHIP_EQUIPMENT.THRUSTERS[this.equippedThrusters]) {
      const thrusters = SHIP_EQUIPMENT.THRUSTERS[this.equippedThrusters];
      thrustMultiplier *= thrusters.thrust || 1.0;
      maneuverabilityMultiplier *= thrusters.maneuverability || 1.0;
    }

    // Calculate final stats
    this.maxSpeed = this.baseMaxSpeed * speedMultiplier;
    this.acceleration = this.baseAcceleration * thrustMultiplier;
    this.rotationSpeed = this.baseRotationSpeed * maneuverabilityMultiplier;

    // Update max hull strength based on armor
    const previousMaxHull = this.maxHullStrength;
    this.maxHullStrength = this.baseMaxHullStrength + armor;

    // If hull strength was at max, keep it at max with new value
    if (this.hullStrength >= previousMaxHull) {
      this.hullStrength = this.maxHullStrength;
    }

    // Update docking speed to match new max speed
    this.dockingSystem.updateDockingSpeed();

    if (DEBUG) {
      console.log('Equipment modifiers applied:', {
        maxSpeed: this.maxSpeed,
        acceleration: this.acceleration,
        rotationSpeed: this.rotationSpeed,
        maxHullStrength: this.maxHullStrength
      });
    }
  }

  // Get current weapon stats
  getWeaponStats() {
    if (this.equippedWeapon && SHIP_EQUIPMENT.WEAPONS[this.equippedWeapon]) {
      return SHIP_EQUIPMENT.WEAPONS[this.equippedWeapon];
    }
    // Return default if no weapon equipped
    return {
      damage: 1,
      velocity: 100,
      cooldown: 0.5,
      range: 300
    };
  }
}
