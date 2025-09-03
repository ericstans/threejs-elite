import * as THREE from 'three';

export class Spaceship {
  constructor() {
    this.mesh = this.createSpaceshipMesh();
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    
    // Movement properties
    this.maxSpeed = 10;
    this.acceleration = 2;
    this.rotationSpeed = 1;
    this.throttle = 0;
    this.maxThrottle = 1;
    
    // Docking system
    this.dockingTarget = null;
    this.dockingProgress = 0; // 0 = not docking, 1 = fully docked
    this.dockingSpeed = 10; // units per second during docking
    this.dockingPosition = new THREE.Vector3();
    this.dockingRotation = new THREE.Quaternion();
    
    // Player flags
    this.flags = {
      isDocking: false,
      isDocked: false,
      hasVisitedAridusPrime: false,
      hasVisitedOceanus: false,
      // Add more flags as needed
    };
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
  }

  createSpaceshipMesh() {
    // Create a simple spaceship geometry (cockpit view)
    const group = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.ConeGeometry(0.3, 2, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x666666,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3);
    const wingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x444444,
      flatShading: true 
    });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0);
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0);
    group.add(rightWing);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x222222,
      flatShading: true,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.2, 0.5);
    group.add(cockpit);
    
    return group;
  }

  update(deltaTime) {
    // Handle docking
    this.updateDocking(deltaTime);
    
    // If docked, update position to follow planet rotation
    if (this.flags.isDocked && this.dockingTarget) {
      // Update the ship's world position to follow the planet's rotation
      const planetPos = this.dockingTarget.getPosition();
      const rotatedLandingPoint = this.dockingPosition.clone().applyQuaternion(this.dockingTarget.mesh.quaternion);
      this.position.copy(planetPos).add(rotatedLandingPoint);
      
      // Update the ship's rotation to follow the planet's rotation
      const planetRotation = this.dockingTarget.mesh.quaternion.clone();
      this.quaternion.copy(planetRotation).multiply(this.dockingRotation);
      this.rotation.setFromQuaternion(this.quaternion);
      
      // Update mesh position and rotation
      this.mesh.position.copy(this.dockingPosition);
      this.mesh.quaternion.copy(this.dockingRotation);
      this.mesh.rotation.setFromQuaternion(this.dockingRotation);
      
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
      return;
    }
    
    // Apply throttle as target speed (0-1 throttle = 0-maxSpeed target)
    const targetSpeed = this.throttle * this.maxSpeed;
    const currentSpeed = this.getSpeed();
    const speedDifference = targetSpeed - currentSpeed;
    
    // Apply acceleration/deceleration based on speed difference
    if (Math.abs(speedDifference) > 0.1) {
      const accelerationDirection = Math.sign(speedDifference);
      const forwardForce = accelerationDirection * this.acceleration * deltaTime;
      const forward = new THREE.Vector3(0, 0, -1);
      forward.applyQuaternion(this.quaternion);
      this.velocity.add(forward.multiplyScalar(forwardForce));
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

  getSpeedPerMinute() {
    return this.velocity.length() * 60; // Convert from units/second to units/minute
  }

  getSpeedPercentage() {
    return Math.min(this.getSpeed() / this.maxSpeed, 1.0);
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
    return this.flags.hasOwnProperty(flagName) && this.flags[flagName];
  }

  getAllFlags() {
    return { ...this.flags };
  }

  // Docking methods
  startDocking(targetPlanet) {
    this.dockingTarget = targetPlanet;
    this.dockingProgress = 0;
    
    // Calculate landing position on planet surface (near equator)
    const planetPos = targetPlanet.getPosition();
    const planetRadius = targetPlanet.radius;
    
    // Choose a random point on the equator
    const angle = Math.random() * Math.PI * 2;
    const landingPoint = new THREE.Vector3(
      Math.cos(angle) * planetRadius,
      0, // Equator level
      Math.sin(angle) * planetRadius
    );
    
    // Store the landing point relative to planet center
    this.dockingPosition.copy(landingPoint);
    
    // Calculate rotation so ship's bottom faces planet surface
    // The ship's -Y axis should point toward the planet center
    const directionToPlanet = landingPoint.clone().normalize().negate();
    this.dockingRotation.setFromUnitVectors(new THREE.Vector3(0, -1, 0), directionToPlanet);
  }

  updateDocking(deltaTime) {
    if (!this.flags.isDocking || !this.dockingTarget) {
      return;
    }

    // If ship is still moving, wait for it to stop
    if (this.velocity.length() > 0.1) {
      return;
    }

    // Start automated docking movement
    const planetPos = this.dockingTarget.getPosition();
    const targetWorldPosition = planetPos.clone().add(this.dockingPosition);
    const distanceToTarget = this.position.distanceTo(targetWorldPosition);
    const moveDistance = this.dockingSpeed * deltaTime;
    
    if (distanceToTarget > moveDistance) {
      // Move towards docking position
      const direction = targetWorldPosition.clone().sub(this.position).normalize();
      this.position.add(direction.multiplyScalar(moveDistance));
      
      // Only adjust rotation when close to the planet (within 2x planet radius)
      const distanceToPlanet = this.position.distanceTo(planetPos);
      const planetRadius = this.dockingTarget.radius;
      
      if (distanceToPlanet < planetRadius * 2) {
        // Rotate so ship's bottom faces the planet center
        const directionToPlanet = planetPos.clone().sub(this.position).normalize();
        const targetRotation = new THREE.Quaternion();
        targetRotation.setFromUnitVectors(new THREE.Vector3(0, -1, 0), directionToPlanet);
        
        // Smoothly interpolate rotation
        this.quaternion.slerp(targetRotation, 2 * deltaTime);
        this.rotation.setFromQuaternion(this.quaternion);
      }
    } else {
      // Reached docking position - complete docking
      this.position.copy(targetWorldPosition);
      this.quaternion.copy(this.dockingRotation);
      this.rotation.setFromQuaternion(this.quaternion);
      
      // Attach to planet mesh and set correct relative position
      this.dockingTarget.mesh.add(this.mesh);
      this.mesh.position.copy(this.dockingPosition); // Position relative to planet
      this.mesh.quaternion.copy(this.dockingRotation);
      this.mesh.rotation.setFromQuaternion(this.dockingRotation);
      
      // Update flags
      this.flags.isDocking = false;
      this.flags.isDocked = true;
      this.dockingProgress = 1;
      
      console.log('Docking completed!');
    }
  }

  getRotation() {
    return this.rotation.clone();
  }
}
