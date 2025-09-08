import * as THREE from 'three';
// Import FBXLoader from three/examples/jsm
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

const DEBUG = false;

export class NPCShip {
  constructor(position = new THREE.Vector3(0, 0, 0), name = 'Derelict Cruiser', conversation = null) {
    this.mesh = new THREE.Group();
    this.position = position.clone();
    this.name = name;
    this.conversation = conversation;
    this.loaded = false;
    this.health = 10;
    this.maxHealth = 10;
    this.destroyed = false;
    this.size = 1.25; // Default, will be set after model loads (radius of 2.5 unit diameter)
    
    // NPC flags for behavior tracking
    this.npcFlags = {
      isHostile: false
    };
    
    // Movement properties (similar to player ship)
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    
    // Movement parameters
    this.maxSpeed = 8; // Slightly slower than player
    this.acceleration = 1.5; // Slightly slower acceleration
    this.rotationSpeed = 0.8; // Slightly slower rotation
    
    // Patrol system
    this.patrolWaypoints = [];
    this.currentWaypointIndex = 0;
    this.waypointReachedDistance = 50; // Distance to consider waypoint reached
    this.patrolActive = false;
    this.targetPosition = new THREE.Vector3();
    this.targetRotation = new THREE.Euler();
    
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
      if (!meshCenter && child.isMesh) {
        meshCenter = new THREE.Vector3();
        child.getWorldPosition(meshCenter);
      }
    });
    return meshCenter || this.mesh.position;
  }

  loadModel() {
    const loader = new FBXLoader();
    loader.load(
      new URL('./assets/fbx/ship2.fbx', import.meta.url).href,
      (object) => {
        object.traverse(child => {
          if (child.isMesh) {
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
        // Scale so largest dimension matches player ship size (~2-3 units)
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 2.5; // Match player ship size
        const scale = targetSize / maxDim;
        object.scale.setScalar(scale);
        this.size = targetSize / 2; // Use radius for collision
        // Place at intended world position
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

  update(deltaTime) {
    if (!this.loaded || this.destroyed || !this.patrolActive) {
      return;
    }
    
    this.updatePatrol(deltaTime);
    this.updateMovement(deltaTime);
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
  updatePatrol(deltaTime) {
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
  
  // Update target rotation to face the target position
  updateTargetRotation() {
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, this.position).normalize();
    
    // Calculate rotation to face the target
    const targetQuaternion = new THREE.Quaternion();
    targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), direction);
    this.targetRotation.setFromQuaternion(targetQuaternion);
  }
  
  // Update movement physics (similar to player ship)
  updateMovement(deltaTime) {
    // Calculate direction to target
    const direction = new THREE.Vector3();
    direction.subVectors(this.targetPosition, this.position).normalize();
    
    // Calculate desired velocity
    const desiredVelocity = direction.clone().multiplyScalar(this.maxSpeed);
    
    // Calculate acceleration needed
    const velocityDifference = new THREE.Vector3();
    velocityDifference.subVectors(desiredVelocity, this.velocity);
    
    // Apply acceleration
    const acceleration = velocityDifference.clone().multiplyScalar(this.acceleration * deltaTime);
    this.velocity.add(acceleration);
    
    // Limit velocity to max speed
    if (this.velocity.length() > this.maxSpeed) {
      this.velocity.normalize().multiplyScalar(this.maxSpeed);
    }
    
    // Update position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Update rotation to face movement direction
    if (this.velocity.length() > 0.1) {
      const movementDirection = this.velocity.clone().normalize();
      const targetQuaternion = new THREE.Quaternion();
      targetQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), movementDirection);
      
      // Smoothly rotate towards target rotation
      this.quaternion.slerp(targetQuaternion, this.rotationSpeed * deltaTime);
      this.rotation.setFromQuaternion(this.quaternion);
    }
    
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
}
