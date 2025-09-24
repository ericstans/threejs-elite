import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { getShipType } from './ShipTypes.js';
import { replaceCockpitMaterials } from './util/shipMaterialUtils.js';
import { Laser } from './Laser.js';
import { LASER_SPEED } from './data/constants.js';

const DEBUG = false;

export class NPCShip {
  constructor(position = new THREE.Vector3(0, 0, 0), name = 'Derelict Cruiser', conversation = null, shipType = 'Flea') {
    this.mesh = new THREE.Group();
    this.position = position.clone();
    this.name = name;
    this.conversation = conversation;
    this.loaded = false;
    this.health = 10;
    this.maxHealth = 10;
    this.destroyed = false;
    this.size = 1.25;
    this.npcFlags = { isHostile: false };
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    this.patrolWaypoints = [];
    this.currentWaypointIndex = 0;
    this.waypointReachedDistance = 50;
    this.patrolActive = false;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();

  // --- Combat / AI ---
  this._gameEngine = null; // set via attachGameContext
  this._getPlayerShip = null; // optional accessor
  this.npcLasers = [];
  this.fireCooldown = 1.2; // seconds between shots
  this._fireTimer = 0;
  this.engagementRange = 300; // match UI/CombatSystem range
  this.preferredDistance = 180; // try to keep roughly this distance when hostile
  this.fireConeRadians = Math.PI / 6; // ~30 degrees for reliability
  this._aiTime = 0; // accumulator for smooth orbit/strafe

    // --- Ship type config ---
    this.shipType = shipType;
    const typeConfig = getShipType(shipType);
    // Apply 0.95 scaling factor to NPC stats
    this.maxSpeed = typeConfig.stats.maxSpeed * 0.95;
    this.acceleration = typeConfig.stats.acceleration * 0.95;
    this.rotationSpeed = typeConfig.stats.rotationSpeed * 0.95;
    this.modelFile = typeConfig.model;
    this.modelScale = typeConfig.scale;
    this.exhaustType = typeConfig.exhaust;

    this.loadModel();
  }

  getType() { return 'npcShip'; }

  // Provide stable id for targeting / radar systems
  getId() { return 'npcship'; }

  // Navigation targeting methods (similar to Planet)
  getName() {
    return this.name;
  }

  getMass() {
    return this.size * this.size * this.size * 100; // Approximate mass based on size
  }

  setNavTargeted(targeted) {
    this.isNavTargeted = targeted;
  }

  isNavTarget() {
    return this.isNavTargeted || false;
  }

  isCommable() {
    return this.conversation !== null;
  }

  // NPC flag management
  setNPCFlag(flagName, value) {
    this.npcFlags[flagName] = value;
  }

  getNPCFlag(flagName) {
    return this.npcFlags[flagName];
  }

  isHostile() {
    return this.npcFlags.isHostile;
  }

  serializeState() {
    return {
      position: { x: this.position.x, y: this.position.y, z: this.position.z },
      name: this.name,
      conversation: this.conversation,
      health: this.health,
      maxHealth: this.maxHealth,
      destroyed: this.destroyed,
      npcFlags: this.npcFlags,
      patrolWaypoints: this.patrolWaypoints.map(wp => ({ x: wp.x, y: wp.y, z: wp.z })),
      currentWaypointIndex: this.currentWaypointIndex,
      patrolActive: this.patrolActive
    };
  }

  getWorldPosition() {
    // Return the world position of the first visible mesh, or fallback to group position
    let meshCenter = null;
    this.mesh.traverse(child => {
      if (!meshCenter && child instanceof THREE.Mesh) {
        meshCenter = new THREE.Vector3();
        child.getWorldPosition(meshCenter);
      }
    });
    return meshCenter || this.mesh.position;
  }

  loadModel() {
    const loader = new FBXLoader();
    loader.load(
      new URL(`./assets/fbx/${this.modelFile}`, import.meta.url).href,
      (object) => {
        // Replace Cockpit materials with glassy blue appearance for ship2.fbx (Flea type)
        if (this.modelFile === 'ship2.fbx') {
          replaceCockpitMaterials(object);
        }
        
        object.traverse(child => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            // Fallback: ensure all meshes have a visible material
            if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x003333 });
            }
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.visible = true;
          }
        });
        // Center the model at its bounding box center
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        object.position.sub(center); // move geometry so origin is at center
        // Scale using shipType config (or fallback to bounding box)
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        let scale = this.modelScale;
        if (!scale || scale === 1.0) {
          const targetSize = 2.5;
          scale = targetSize / maxDim;
          this.size = targetSize / 2;
        } else {
          object.scale.setScalar(scale);
          this.size = maxDim * scale / 2;
        }
        object.scale.setScalar(scale);
        this.mesh.position.copy(this.position);
        this.mesh.add(object);
        // ...removed wireframe debug box...
        this.loaded = true;
        // Debug: log bounding box size after scaling
        setTimeout(() => {
          const worldBox = new THREE.Box3().setFromObject(this.mesh);
          const worldSize = new THREE.Vector3();
          worldBox.getSize(worldSize);
          if (DEBUG) console.log('[NPCShip] Final bounding box size:', worldSize, 'at', this.mesh.position);
          // Log camera info if available
          if (this.scene && this.scene.userData && this.scene.userData.camera) {
            const cam = this.scene.userData.camera;
            if (DEBUG) console.log('[NPCShip] Camera position:', cam.position, 'direction:', cam.getWorldDirection(new THREE.Vector3()));
          }
        }, 100);
      },
      undefined,
      (error) => {
        if (DEBUG) console.error('NPCShip: Failed to load FBX model', error);
      }
    );
  }

  update(_deltaTime) {
    if (!this.loaded || this.destroyed) return;

    let willMove = false;

    // Hostile behavior overrides patrol
    if (this.isHostile()) {
      const moved = this.updateHostileBehavior(_deltaTime);
      willMove = willMove || moved;
      // Update and simulate NPC-fired lasers
      this.updateNPCLasers(_deltaTime);
    } else if (this.patrolActive) {
      this.updatePatrol(_deltaTime);
      // When patrolling we have a movement target
      willMove = true;
    }

    if (willMove) {
      this.updateMovement(_deltaTime);
    }
  }

  // Set patrol waypoints
  setPatrolWaypoints(waypoints) {
    this.patrolWaypoints = waypoints.map(wp => new THREE.Vector3(wp.x, wp.y, wp.z));
    this.currentWaypointIndex = 0;
    this.patrolActive = waypoints.length > 0;

    if (this.patrolActive) {
      this.targetPosition.copy(this.patrolWaypoints[0]);
      this.updateTargetRotation();
    }
  }

  // Start/stop patrol
  startPatrol() {
    this.patrolActive = this.patrolWaypoints.length > 0;
    if (this.patrolActive) {
      this.currentWaypointIndex = 0;
      this.targetPosition.copy(this.patrolWaypoints[0]);
      this.updateTargetRotation();
    }
  }

  stopPatrol() {
    this.patrolActive = false;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
  }

  // Update patrol behavior
  updatePatrol(_deltaTime) {
    if (!this.patrolActive || this.patrolWaypoints.length === 0) return;

    const currentWaypoint = this.patrolWaypoints[this.currentWaypointIndex];
    const distanceToWaypoint = this.position.distanceTo(currentWaypoint);

    // Check if we've reached the current waypoint
    if (distanceToWaypoint < this.waypointReachedDistance) {
      // Move to next waypoint (loop back to start)
      this.currentWaypointIndex = (this.currentWaypointIndex + 1) % this.patrolWaypoints.length;
      this.targetPosition.copy(this.patrolWaypoints[this.currentWaypointIndex]);
      this.updateTargetRotation();
    }
  }

  // Provide game engine and player access so NPC can shoot and affect the player
  attachGameContext(gameEngine, getPlayerShipFn = null) {
    this._gameEngine = gameEngine;
    // For convenience, keep a direct reference to scene
    this.scene = gameEngine?.scene;
    if (typeof getPlayerShipFn === 'function') {
      this._getPlayerShip = getPlayerShipFn;
    } else {
      this._getPlayerShip = () => gameEngine?.spaceship;
    }
  }

  // Hostile AI: chase/strafe toward player and fire when in cone and range
  updateHostileBehavior(deltaTime) {
    const player = this._getPlayerShip ? this._getPlayerShip() : null;
    if (!player) return false;

    const playerPos = player.getPosition ? player.getPosition().clone() : null;
    if (!playerPos) return false;

    // Movement: orbit at preferred distance with a smooth lateral offset
    this._aiTime += deltaTime;
    const toPlayer = playerPos.clone().sub(this.position);
    const distance = toPlayer.length();
    const fromPlayerDir = this.position.clone().sub(playerPos).normalize();
    // Base point on a ring around the player
    const ringPoint = playerPos.clone().add(fromPlayerDir.clone().multiplyScalar(this.preferredDistance));
    // Smooth lateral orbit using world up for a stable tangent
    const worldUp = new THREE.Vector3(0, 1, 0);
    let lateral = new THREE.Vector3().crossVectors(worldUp, fromPlayerDir).normalize();
    if (lateral.lengthSq() < 1e-4) {
      // Degenerate when colinear with up: use arbitrary right
      lateral = new THREE.Vector3(1, 0, 0);
    }
    const orbitAmplitude = 60; // max lateral offset
    const orbitPhase = Math.sin(this._aiTime * 0.6);
    let moveTarget = ringPoint.add(lateral.multiplyScalar(orbitAmplitude * orbitPhase));

    // If far outside engagement, bias more toward the player to re-enter
    if (distance > this.engagementRange * 1.2) {
      moveTarget = playerPos.clone();
    }

  this.targetPosition.copy(moveTarget);
  // Face the player while maneuvering toward the move target
  this.updateTargetRotation(playerPos);

    // Firing logic
    this._fireTimer -= deltaTime;
    if (distance <= this.engagementRange) {
      // Check firing cone
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
      const dirToTarget = playerPos.clone().sub(this.position).normalize();
      const angle = forwardDir.angleTo(dirToTarget);
      if (angle <= this.fireConeRadians && this._fireTimer <= 0) {
        this.fireAt(player);
        this._fireTimer = this.fireCooldown * (0.8 + Math.random() * 0.4);
      }
    }

    return true; // we set a movement target
  }

  fireAt(player) {
    // Compute firing origin from world position, a bit in front of ship
    const worldPos = this.getWorldPosition ? this.getWorldPosition().clone() : this.position.clone();
    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).normalize();
    const muzzleOffset = Math.max(1.2, this.size * 0.8);
    const start = worldPos.clone().add(forward.clone().multiplyScalar(muzzleOffset));

    // Simple aim with minimal lead based on player velocity if present
    let targetPos = player.getPosition ? player.getPosition().clone() : this.targetPosition.clone();
    const playerVel = player.velocity ? player.velocity.clone() : new THREE.Vector3();
    // Lead estimate: time = distance / laserSpeed
  const laserSpeed = LASER_SPEED; // matches Laser default/reticle math
    const toTarget = targetPos.clone().sub(start);
    const travelTime = Math.min(3, Math.max(0, toTarget.length() / laserSpeed));
    targetPos.add(playerVel.multiplyScalar(travelTime));

  const dir = targetPos.clone().sub(start).normalize();

    const laser = new Laser(start, dir);
    this.npcLasers.push(laser);
    // Attach to scene so it renders
    if (this._gameEngine) {
      this._gameEngine.addEntity(laser);
    } else if (this.scene) {
      this.scene.add(laser.mesh);
    }
  }

  updateNPCLasers(deltaTime) {
    const player = this._getPlayerShip ? this._getPlayerShip() : null;
    const playerPos = player?.getPosition ? player.getPosition() : null;
    if (!player || !playerPos) return;

    for (let i = this.npcLasers.length - 1; i >= 0; i--) {
      const laser = this.npcLasers[i];
      const expired = laser.update(deltaTime);

      // Collision with player ship (simple sphere)
      const radius = 1.5; // player ship approximate radius
      const dist = laser.getPosition().distanceTo(playerPos);
      if (dist < radius) {
        // Apply hull damage
        const damage = 4; // small per-hit damage
        if (typeof player.hullStrength === 'number') {
          player.hullStrength = Math.max(0, player.hullStrength - damage);
          // Update ShipHealthUI if available
          try {
            this._gameEngine?.ui?.shipHealthUI?.update(player);
          } catch (_) {}
        }
        // Screen damage flash
        try { this._gameEngine?.flashDamage?.(150); } catch (_) {}
        // Hit effect sound
        this._gameEngine?.createSpatialLaserHit?.(playerPos.clone());
        // Remove laser immediately
        this._removeNPCLaserAt(i, laser);
        continue;
      }

      if (expired) {
        this._removeNPCLaserAt(i, laser);
      }
    }
  }

  _removeNPCLaserAt(index, laser) {
    if (this._gameEngine) {
      this._gameEngine.removeEntity(laser);
    } else if (laser.mesh && this.scene) {
      this.scene.remove(laser.mesh);
    }
    this.npcLasers.splice(index, 1);
  }

  // Update target rotation to face a specific world position (default: current targetPosition)
  updateTargetRotation(lookAtPosition = this.targetPosition) {
    const direction = new THREE.Vector3();
    direction.subVectors(lookAtPosition, this.position).normalize();

    // Calculate rotation to face the target
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    this.targetRotation.setFromQuaternion(targetQuaternion);
  }

  // Update movement physics (similar to player ship)
  updateMovement(deltaTime) {
  // Calculate direction to movement target
  const moveDir = new THREE.Vector3();
  moveDir.subVectors(this.targetPosition, this.position).normalize();

  // Calculate desired velocity (accelerate toward move target)
  const desiredVelocity = moveDir.clone().multiplyScalar(this.maxSpeed);

    // Calculate acceleration needed
    const velocityDifference = new THREE.Vector3();
    velocityDifference.subVectors(desiredVelocity, this.velocity);

    // Apply acceleration
  // Slow down when close to target to avoid overshoot
  const distToTarget = this.position.distanceTo(this.targetPosition);
  const slowFactor = distToTarget < 80 ? THREE.MathUtils.clamp(distToTarget / 80, 0.2, 1) : 1;
  const acceleration = velocityDifference.clone().multiplyScalar(this.acceleration * slowFactor * deltaTime);
    this.velocity.add(acceleration);

    // Limit velocity to max speed
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }

    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));

    // Update rotation to face targetRotation (set by patrol or hostile aim)
    const targetQuat = new THREE.Quaternion().setFromEuler(this.targetRotation);
    this.quaternion.slerp(targetQuat, Math.min(1, this.rotationSpeed * deltaTime));
    this.rotation.setFromQuaternion(this.quaternion);

    // Update mesh position and rotation
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
  }

  isAlive() {
    return !this.destroyed && this.health > 0;
  }

  takeDamage(amount) {
    if (!this.isAlive()) return false;
    this.health -= amount;
    if (this.health <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  getPosition() {
    return this.mesh.position;
  }

  getSize() {
    return this.size;
  }

  getHealth() {
    return this.health;
  }

  getMaxHealth() {
    return this.maxHealth;
  }

  setTargeted(v) {
    // Placeholder for consistency with asteroid interface; could toggle a highlight later
    this.mesh.userData.targeted = v;
  }

  destroy() {
    this.destroyed = true;
    if (this.mesh.parent) {
      this.mesh.parent.remove(this.mesh);
    }
  }

  // Reset NPC state after player destruction: clear hostility and active lasers
  resetAfterPlayerDestroyed() {
    // Revert to non-hostile behavior
    try { this.setNPCFlag('isHostile', false); } catch (_) {}
    this._fireTimer = 0;
    // Remove any NPC-fired lasers from the scene/engine
    if (Array.isArray(this.npcLasers) && this.npcLasers.length > 0) {
      for (let i = this.npcLasers.length - 1; i >= 0; i--) {
        const laser = this.npcLasers[i];
        try {
          if (this._gameEngine) {
            this._gameEngine.removeEntity(laser);
          } else if (this.scene && laser?.mesh) {
            this.scene.remove(laser.mesh);
          }
        } catch (_) {}
        this.npcLasers.splice(i, 1);
      }
    }
  }
}
