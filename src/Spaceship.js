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
  dockingAuthorized: false, // station granted docking
  landingVectorLocked: false, // player aligned with landing vector
  landingAlignmentLocked: false, // fully centered on landing vector axis
  rotationLockAcquired: false, // finished rotating to horizontal slot-facing orientation
      hasVisitedAridusPrime: false,
      hasVisitedOceanus: false,
      // Add more flags as needed
    };

  // Landing vector lock state
  this.landingVectorStation = null; // reference to station
  this.landingVectorHoldOffset = 0; // legacy (not used for position now)
  this.landingVectorLocalOffset = null; // local-space offset from station root when lock engaged
  this.landingVectorAlongDistance = 0; // stored projection along vector at lock time
  this.landingVectorAlignRate = 20; // radial converge rate (per second)
  // Post-alignment rotation (pure roll) parameters
  this.rotationAlignDelay = 4.0; // seconds after alignment lock before roll begins
  this.rotationAlignTimer = 0; // time since alignment lock
  this.rotationTargetQuaternion = null; // final desired orientation (computed once)
  this.rotationSlerpSpeed = 2.0; // slerp factor per second
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
  }

  lockToStation(station) {
    // Freeze relative motion: attach ship to station but keep slight offset on vector start
    this.dockingTarget = station;
    this.flags.landingVectorLocked = true;
    this.velocity.set(0,0,0);
    this.angularVelocity.set(0,0,0);
  this.landingVectorStation = station;
  // Capture current relative local offset so we preserve exact position at lock moment (no teleport)
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
    const currentForward = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion);
    const q = new THREE.Quaternion().setFromUnitVectors(currentForward.normalize(), desiredForward.normalize());
    this.quaternion.premultiply(q);
    this.rotation.setFromQuaternion(this.quaternion);
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

    // Follow station landing vector if locked (but not yet docked)
    if (this.flags.landingVectorLocked && !this.flags.isDocked && this.landingVectorStation) {
      const station = this.landingVectorStation;
      const dir = station.getLandingVectorDirectionWorld();
      const start = station.getLandingVectorStartWorld();
      const length = station.getLandingVectorLength();
      // Desired axis point (clamp along distance within vector length)
      const along = Math.min(Math.max(this.landingVectorAlongDistance, 0), length);
      const axisPoint = start.clone().add(dir.clone().multiplyScalar(along));
      // Current radial offset
      const radial = this.position.clone().sub(axisPoint);
      const radialDist = radial.length();
      if (!this.flags.landingAlignmentLocked) {
        if (radialDist > 1e-4) {
          const shrink = Math.exp(-this.landingVectorAlignRate * deltaTime);
          const newRadial = radial.multiplyScalar(shrink);
          this.position.copy(axisPoint.clone().add(newRadial));
        } else {
          this.position.copy(axisPoint);
        }
        // Check lock threshold (use station size fraction)
        if (this.position.distanceTo(axisPoint) < station.size * 0.01) {
          this.position.copy(axisPoint);
          this.flags.landingAlignmentLocked = true;
          this.rotationAlignTimer = 0; // start delay timer
        }
      } else {
        // Maintain exact axis position once locked
        this.position.copy(axisPoint);
      }
      // Orientation handling: compute target orientation once (forward toward slot, right horizontal)
      const slotForward = dir.clone().negate();
      if (this.flags.landingAlignmentLocked) {
        this.rotationAlignTimer += deltaTime;
      }
      if (this.flags.landingAlignmentLocked && !this.flags.rotationLockAcquired && this.rotationAlignTimer >= this.rotationAlignDelay) {
        // Step 1: align forward to slot.
        const currentForward = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion).normalize();
        const alignQ2 = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward.clone());
        this.quaternion.premultiply(alignQ2);

        // Step 2: compute minimal roll so station's horizontal reference appears level.
        // Use station local X axis as horizontal reference.
        const stationRightWorld = new THREE.Vector3(1,0,0).applyQuaternion(this.landingVectorStation.mesh.quaternion).normalize();
        const fwd = slotForward.clone().normalize();
        // Project both currentRight and desiredRight onto plane perpendicular to forward
        const currentRight = new THREE.Vector3(1,0,0).applyQuaternion(this.quaternion);
        currentRight.sub(fwd.clone().multiplyScalar(currentRight.dot(fwd))).normalize();
        let desiredRight = stationRightWorld.clone();
        desiredRight.sub(fwd.clone().multiplyScalar(desiredRight.dot(fwd)));
        if (desiredRight.lengthSq() < 1e-8) {
          // Fallback: use station local Z
            desiredRight = new THREE.Vector3(0,0,1).applyQuaternion(this.landingVectorStation.mesh.quaternion);
            desiredRight.sub(fwd.clone().multiplyScalar(desiredRight.dot(fwd)));
        }
        if (desiredRight.lengthSq() > 1e-8) {
          desiredRight.normalize();
          // Angle between current and desired rights
          let angle = Math.acos(Math.min(1, Math.max(-1, currentRight.dot(desiredRight))));
          if (angle > 1e-4) {
            // Determine rotation direction using cross product sign along forward
            const cross = new THREE.Vector3().crossVectors(currentRight, desiredRight);
            const sign = Math.sign(cross.dot(fwd));
            angle *= sign;
            const rollQ = new THREE.Quaternion().setFromAxisAngle(fwd, angle);
            this.quaternion.premultiply(rollQ);
          }
        }
        this.flags.rotationLockAcquired = true; // rotation phase complete
      } else if (!this.flags.rotationLockAcquired) {
        // Before roll phase: keep forward pointed at slot only (remove lateral drift)
        const currentForward = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion).normalize();
        const alignQ = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward.clone());
        this.quaternion.premultiply(alignQ);
      }
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      return; // Skip normal movement while locked
    }
    
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
