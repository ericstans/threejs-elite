import * as THREE from 'three';

const DEBUG = false;

/**
 * StationDockingSystem handles all docking and takeoff logic for space stations.
 */
export class StationDockingSystem {
  constructor(ship) {
    this.ship = ship;

    // Landing vector lock state (for space station docking)
    this.landingVectorStation = null;
    this.landingVectorHoldOffset = 0;
    this.landingVectorLocalOffset = null;
    this.landingVectorAlongDistance = 0;
    this.landingVectorAlignRate = 20;
    this.rotationAlignDelay = 4.0;
    this.rotationAlignTimer = 0;
    this.rotationTargetQuaternion = null;
    this.rotationSlerpSpeed = 2.0;

    // Smooth rotation lock tween (between ALIGNMENT and ROTATION lock)
    this.rotationLockTweenInProgress = false;
    this.rotationLockTweenDuration = 3.0;
    this.rotationLockTweenTimer = 0;
    this.rotationLockStartQuat = new THREE.Quaternion();
    this.rotationLockTargetQuat = new THREE.Quaternion();

    // Station insertion (moving into station after rotation lock)
    this.insertionInProgress = false;
    this.insertionSpeed = 10.0;
    this.insertionTargetAlong = null;
    this.postRotationTimer = 0;
    this.autoInsertionDelay = 1.0;

    // Final turnaround phase (180° yaw before docking completion)
    this.finalTurnInProgress = false;
    this.finalTurnTimer = 0;
    this.finalTurnDuration = 2.0;
    this.finalTurnStartQuat = new THREE.Quaternion();
    this.finalTurnTargetQuat = new THREE.Quaternion();

    // Docked station state
    this.dockedStation = null;
    this.dockedLocalOffset = new THREE.Vector3();
    this.dockedRelativeQuat = new THREE.Quaternion();

    // Takeoff state
    this.takeoffActive = false;
    this.takeoffTimer = 0;
    this.takeoffDuration = 5.0; // seconds
    this.takeoffStartPos = new THREE.Vector3();
    this.takeoffTargetPos = new THREE.Vector3();
    this.takeoffStation = null;
    this.takeoffSceneParent = null;
    this.takeoffBaseQuat = new THREE.Quaternion();
  }

  /**
   * Start takeoff sequence from a space station
   */
  startTakeoff(station, scene) {
    if (!this.ship.flags.isDocked || !this.ship.flags.stationDocked) return;

    if (DEBUG) console.log('Station takeoff starting...');
    if (DEBUG) console.log('Ship world position:', this.ship.position);

    // Reset speed history for takeoff
    this.ship.resetSpeedHistory();

    // Store parent for later reattachment if needed
    this.takeoffSceneParent = station.mesh.parent || scene;

    // Get current world position (ship is in world space, not parented to station)
    const currentWorldPos = this.ship.position.clone();

    // Calculate takeoff path in world space: move straight forward through the mail slot
    // For takeoff, we want to move AWAY from the station (positive landing vector direction)
    // For docking, we move TOWARD the station (negative landing vector direction)
    const landingDir = station.getLandingVectorDirectionWorld();
    const stationForward = landingDir.clone(); // Don't negate for takeoff

    // Start position: current world docked position
    this.takeoffStartPos.copy(currentWorldPos);

    // Target position: straight forward through the mail slot, clear of the station
    const forwardDistance = station.size * 0.8; // Move forward through the slot and clear
    const targetWorldPos = currentWorldPos.clone()
      .add(stationForward.clone().multiplyScalar(forwardDistance));

    this.takeoffTargetPos.copy(targetWorldPos);

    if (DEBUG) console.log('Takeoff world start:', this.takeoffStartPos);
    if (DEBUG) console.log('Takeoff world target:', this.takeoffTargetPos);

    // Store current orientation as base (keep straight, no pitch)
    this.ship.quaternion.copy(this.ship.mesh.getWorldQuaternion(new THREE.Quaternion()));
    this.takeoffBaseQuat.copy(this.ship.quaternion);

    // Initialize takeoff sequence
    this.takeoffTimer = 0;
    this.takeoffActive = true;
    this.takeoffStation = station;
    this.ship.velocity.set(0, 0, 0);
    this.ship.angularVelocity.set(0, 0, 0);
    this.ship.setThrottle(0);

    if (DEBUG) console.log('Takeoff initialized. Active:', this.takeoffActive);

    // Ship remains in world space during takeoff (like docking system)
  }

  /**
   * Update takeoff animation
   * Returns true if takeoff is active and handled, false otherwise
   */
  updateTakeoff(deltaTime) {
    if (!this.takeoffActive) return false;

    this.takeoffTimer += deltaTime;
    const t = Math.min(1, this.takeoffTimer / this.takeoffDuration);
    const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

    // Suppress any residual angular velocity during guided ascent
    this.ship.angularVelocity.set(0, 0, 0);

    // Station takeoff: move forward relative to station's current position
    const station = this.takeoffStation;

    // Get current station position and rotation (accounting for orbital movement)
    const currentStationPos = station.mesh.getWorldPosition(new THREE.Vector3());

    // Calculate current forward direction from station's current rotation
    // For takeoff, we want to move AWAY from the station (positive landing vector direction)
    // For docking, we move TOWARD the station (negative landing vector direction)
    const landingDir = station.getLandingVectorDirectionWorld();
    const currentStationForward = landingDir.clone(); // Don't negate for takeoff

    // Move forward from station's current position by the eased distance
    const forwardDistance = station.size * 0.8 * ease; // Distance increases with ease
    const worldPos = currentStationPos.clone()
      .add(currentStationForward.clone().multiplyScalar(forwardDistance));

    if (ease < 0.1) { // Log only first few frames
      if (DEBUG) console.log('Station takeoff update - ease:', ease, 'forwardDistance:', forwardDistance);
      if (DEBUG) console.log('Station current pos:', currentStationPos);
      if (DEBUG) console.log('Ship world pos:', worldPos);
    }

    this.ship.position.copy(worldPos);
    this.ship.quaternion.copy(this.takeoffBaseQuat);
    this.ship.mesh.position.copy(worldPos);
    this.ship.mesh.quaternion.copy(this.ship.quaternion);
    this.ship.rotation.setFromQuaternion(this.ship.quaternion);
    this.ship.mesh.rotation.copy(this.ship.rotation);
    this.ship.syncThirdPerson();

    if (t >= 1) {
      // Set initial velocity and throttle
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.quaternion).normalize();
      this.ship.velocity.copy(forward.multiplyScalar(this.ship.maxSpeed * 0.3));
      this.ship.setThrottle(0.6);

      // Complete takeoff
      this.takeoffActive = false;
      this.takeoffStation = null;

      // Clear docking flags
      this.ship.flags.isDocked = false;
      this.ship.flags.firingEnabled = true;
      this.ship.flags.dockContext = null;
      this.ship.flags.dockedStationId = null;
      this.ship.flags.stationDocked = false;
      this.dockedStation = null;
    }

    return true;
  }

  /**
   * Update station landing vector lock and alignment
   * Returns true if landing vector is active and handled, false otherwise
   */
  updateLandingVector(deltaTime) {
    if (!this.ship.flags.landingVectorLocked || this.ship.flags.isDocked || !this.landingVectorStation) {
      return false;
    }

    const station = this.landingVectorStation;
    const dir = station.getLandingVectorDirectionWorld();
    const start = station.getLandingVectorStartWorld();
    const length = station.getLandingVectorLength();

    // Desired axis point (clamp along distance within vector length)
    // Allow negative along-distance once insertion begins (to travel down into station)
    const lowerBound = (this.insertionInProgress && this.insertionTargetAlong !== null) ? this.insertionTargetAlong : 0;
    const along = Math.min(Math.max(this.landingVectorAlongDistance, lowerBound), length);
    const axisPoint = start.clone().add(dir.clone().multiplyScalar(along));

    // Current radial offset
    const radial = this.ship.position.clone().sub(axisPoint);
    const radialDist = radial.length();

    if (!this.ship.flags.landingAlignmentLocked) {
      if (radialDist > 1e-4) {
        const shrink = Math.exp(-this.landingVectorAlignRate * deltaTime);
        const newRadial = radial.multiplyScalar(shrink);
        this.ship.position.copy(axisPoint.clone().add(newRadial));
      } else {
        this.ship.position.copy(axisPoint);
      }

      // Check lock threshold (use station size fraction)
      if (this.ship.position.distanceTo(axisPoint) < station.size * 0.01) {
        this.ship.position.copy(axisPoint);
        this.ship.flags.landingAlignmentLocked = true;
        this.rotationAlignTimer = 0; // start delay timer

        // Hide landing vector guidance now that precise axis alignment achieved
        if (station.setLandingVectorVisible) {
          station.setLandingVectorVisible(false);
        }
      }
    } else {
      // Maintain axis position always; insertion adjusts along-distance directly.
      this.ship.position.copy(axisPoint);
    }

    // Orientation handling: compute target orientation once (forward toward slot, right horizontal)
    const slotForward = dir.clone().negate();

    if (this.ship.flags.landingAlignmentLocked) {
      this.rotationAlignTimer += deltaTime;
    }

    if (this.ship.flags.rotationLockAcquired) {
      // Manage post-rotation insertion timer / movement
      this.postRotationTimer += deltaTime;
      if (!this.insertionInProgress && this.postRotationTimer >= this.autoInsertionDelay) {
        this.insertionInProgress = true;
        if (this.insertionTargetAlong === null) {
          // Station center lies below slot start by roughly size/2 (plus small slot offset ~0.01)
          this.insertionTargetAlong = - (station.size * 0.5 + 0.01);
        }
      }

      if (this.insertionInProgress && this.insertionTargetAlong !== null) {
        // Move along-distance toward target (negative direction)
        const step = this.insertionSpeed * deltaTime;
        if (this.landingVectorAlongDistance > this.insertionTargetAlong) {
          this.landingVectorAlongDistance = Math.max(this.landingVectorAlongDistance - step, this.insertionTargetAlong);
        }

        // Completion check
        if (Math.abs(this.landingVectorAlongDistance - this.insertionTargetAlong) < 1e-3) {
          // Begin final turnaround phase (delay docking completion until done)
          const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
          this.ship.position.copy(centerWorld);
          this.insertionInProgress = false;
          this.finalTurnInProgress = true;
          this.finalTurnTimer = 0;
          this.finalTurnStartQuat.copy(this.ship.quaternion);
          // Compute target orientation: 180° yaw around ship's local Y (turn around)
          const halfTurnLocal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
          this.finalTurnTargetQuat.copy(this.finalTurnStartQuat.clone().multiply(halfTurnLocal));
        }
      }
    }

    // Handle final turnaround rotation before declaring docked
    if (this.finalTurnInProgress) {
      // Maintain centered position
      if (station) {
        const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
        this.ship.position.copy(centerWorld);
      }
      this.finalTurnTimer += deltaTime;
      const tTurn = Math.min(1, this.finalTurnTimer / this.finalTurnDuration);
      const ease = tTurn * tTurn * (3 - 2 * tTurn); // smoothstep easing
      this.ship.quaternion.copy(this.finalTurnStartQuat.clone().slerp(this.finalTurnTargetQuat, ease));

      if (tTurn >= 1) {
        // Now finalize docking
        this.ship.flags.isDocked = true;
        this.ship.flags.stationDocked = true;
        this.dockedStation = station;
        this.dockedLocalOffset = new THREE.Vector3(0, 0, 0);
        const stationQuatInv = station.mesh.quaternion.clone().invert();
        this.dockedRelativeQuat = stationQuatInv.multiply(this.ship.quaternion.clone());

        // Parent ship to station for proper takeoff animation
        const worldPos = this.ship.mesh.getWorldPosition(new THREE.Vector3());
        const worldQuat = this.ship.mesh.getWorldQuaternion(new THREE.Quaternion());
        const parent = this.ship.mesh.parent;
        if (DEBUG) console.log('Station docking - before parenting. Parent:', parent?.name || 'none');
        if (parent) parent.remove(this.ship.mesh);
        station.mesh.add(this.ship.mesh);
        this.ship.mesh.position.copy(station.mesh.worldToLocal(worldPos));
        this.ship.mesh.quaternion.copy(station.mesh.quaternion.clone().invert().multiply(worldQuat));
        if (DEBUG) console.log('Station docking - after parenting. New parent:', this.ship.mesh.parent?.name || 'none');
        if (DEBUG) console.log('Ship local position after parenting:', this.ship.mesh.position);

        this.ship.flags.dockingAuthorized = false;
        this.ship.flags.landingVectorLocked = false;
        this.ship.flags.landingAlignmentLocked = false;
        this.ship.flags.rotationLockAcquired = false;
        this.finalTurnInProgress = false;
      }
    }

    // Start rotation lock tween once alignment delay has elapsed
    if (this.ship.flags.landingAlignmentLocked && !this.ship.flags.rotationLockAcquired &&
        !this.rotationLockTweenInProgress && this.rotationAlignTimer >= this.rotationAlignDelay) {
      // Compute target orientation (forward align + minimal roll) without snapping
      const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.quaternion).normalize();
      const fwd = slotForward.clone().normalize();

      // Snap-free construction of target quaternion
      const alignQ2 = new THREE.Quaternion().setFromUnitVectors(currentForward, fwd);
      const tempQuat = this.ship.quaternion.clone().premultiply(alignQ2);

      // Desired right vector is station's right projected onto plane perpendicular to forward
      const stationRightWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(this.landingVectorStation.mesh.quaternion).normalize();
      const currentRight = new THREE.Vector3(1, 0, 0).applyQuaternion(tempQuat);
      currentRight.sub(fwd.clone().multiplyScalar(currentRight.dot(fwd))).normalize();
      let desiredRight = stationRightWorld.clone();
      desiredRight.sub(fwd.clone().multiplyScalar(desiredRight.dot(fwd)));
      if (desiredRight.lengthSq() < 1e-8) {
        desiredRight = new THREE.Vector3(0, 0, 1).applyQuaternion(this.landingVectorStation.mesh.quaternion);
        desiredRight.sub(fwd.clone().multiplyScalar(desiredRight.dot(fwd)));
      }

      let targetQuat = tempQuat.clone();
      if (desiredRight.lengthSq() > 1e-8) {
        desiredRight.normalize();
        let angle = Math.acos(Math.min(1, Math.max(-1, currentRight.dot(desiredRight))));
        if (angle > 1e-4) {
          const cross = new THREE.Vector3().crossVectors(currentRight, desiredRight);
          const sign = Math.sign(cross.dot(fwd));
          angle *= sign;
          const rollQ = new THREE.Quaternion().setFromAxisAngle(fwd, angle);
          targetQuat = tempQuat.clone().premultiply(rollQ);
        }
      }

      // Kick off tween
      this.rotationLockTweenInProgress = true;
      this.rotationLockTweenTimer = 0;
      this.rotationLockStartQuat.copy(this.ship.quaternion);
      this.rotationLockTargetQuat.copy(targetQuat);
    } else if (!this.ship.flags.rotationLockAcquired && this.rotationLockTweenInProgress) {
      // Progress the tween using smoothstep easing
      this.rotationLockTweenTimer += deltaTime;
      const tRot = Math.min(1, this.rotationLockTweenTimer / this.rotationLockTweenDuration);
      const ease = tRot * tRot * (3 - 2 * tRot);
      const q = this.rotationLockStartQuat.clone();
      q.slerp(this.rotationLockTargetQuat, ease);
      this.ship.quaternion.copy(q);

      if (tRot >= 1) {
        this.rotationLockTweenInProgress = false;
        this.ship.flags.rotationLockAcquired = true; // completed tween
      }
    } else if (!this.ship.flags.rotationLockAcquired && !this.rotationLockTweenInProgress) {
      // Before roll phase: keep forward pointed at slot only (remove lateral drift)
      const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.quaternion).normalize();
      const alignQ = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward.clone());
      this.ship.quaternion.premultiply(alignQ);
    }

    this.ship.rotation.setFromQuaternion(this.ship.quaternion);
    this.ship.mesh.position.copy(this.ship.position);
    this.ship.mesh.rotation.copy(this.ship.rotation);
    this.ship.syncThirdPerson();

    return true;
  }

  /**
   * Update docked state
   * Returns true if docked and handled, false otherwise
   */
  updateDockedState() {
    // If docked inside station, keep position (parented) and exit
    if (this.ship.flags.isDocked && this.ship.flags.stationDocked && this.dockedStation && !this.takeoffActive) {
      // Recompute world transform from station each frame
      const worldPos = this.dockedStation.mesh.localToWorld(this.dockedLocalOffset.clone());
      this.ship.position.copy(worldPos);
      this.ship.quaternion.copy(this.dockedStation.mesh.quaternion);
      if (this.dockedRelativeQuat) this.ship.quaternion.multiply(this.dockedRelativeQuat);
      this.ship.rotation.setFromQuaternion(this.ship.quaternion);
      this.ship.mesh.position.copy(this.ship.position);
      this.ship.mesh.quaternion.copy(this.ship.quaternion);
      this.ship.mesh.rotation.copy(this.ship.rotation);
      this.ship.syncThirdPerson();
      return true;
    }

    return false;
  }

  /**
   * Handle final turnaround phase during station docking
   * Returns true if final turn is active and handled, false otherwise
   */
  updateFinalTurn(deltaTime) {
    if (!this.finalTurnInProgress) return false;

    // Freeze linear/angular motion
    this.ship.velocity.set(0, 0, 0);
    this.ship.angularVelocity.set(0, 0, 0);

    // Keep centered on station
    const station = this.landingVectorStation || this.dockedStation;
    if (station) {
      const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
      this.ship.position.copy(centerWorld);
    }

    // Ensure target quaternion exists (safety)
    if (this.finalTurnTargetQuat.lengthSq() === 0) {
      // Initialize target: 180° yaw around ship's local Y axis
      this.finalTurnStartQuat.copy(this.ship.quaternion);
      const halfTurnLocal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
      this.finalTurnTargetQuat.copy(this.finalTurnStartQuat.clone().multiply(halfTurnLocal));
    }

    this.finalTurnTimer += deltaTime;
    const tTurn = Math.min(1, this.finalTurnTimer / this.finalTurnDuration);
    const ease = tTurn * tTurn * (3 - 2 * tTurn);
    const qInterp = this.finalTurnStartQuat.clone();
    qInterp.slerp(this.finalTurnTargetQuat, ease);
    this.ship.quaternion.copy(qInterp);
    this.ship.rotation.setFromQuaternion(this.ship.quaternion);
    this.ship.mesh.position.copy(this.ship.position);
    this.ship.mesh.quaternion.copy(this.ship.quaternion);
    this.ship.mesh.rotation.copy(this.ship.rotation);
    this.ship.syncThirdPerson();

    if (tTurn >= 1) {
      // Complete docking now if not already
      if (!this.ship.flags.isDocked) {
        const station = this.landingVectorStation || this.dockedStation;
        if (station) {
          this.ship.flags.isDocked = true;
          this.ship.flags.stationDocked = true;
          this.dockedStation = station;
          this.dockedLocalOffset = new THREE.Vector3(0, 0, 0);
          const stationQuatInv = station.mesh.quaternion.clone().invert();
          this.dockedRelativeQuat = stationQuatInv.multiply(this.ship.quaternion.clone());

          // Parent ship to station for proper takeoff animation
          const worldPos = this.ship.mesh.getWorldPosition(new THREE.Vector3());
          const worldQuat = this.ship.mesh.getWorldQuaternion(new THREE.Quaternion());
          const parent = this.ship.mesh.parent;
          if (DEBUG) console.log('Spaceship Station docking - before parenting. Parent:', parent?.name || 'none');
          if (parent) parent.remove(this.ship.mesh);
          station.mesh.add(this.ship.mesh);
          this.ship.mesh.position.copy(station.mesh.worldToLocal(worldPos));
          this.ship.mesh.quaternion.copy(station.mesh.quaternion.clone().invert().multiply(worldQuat));
          if (DEBUG) console.log('Spaceship Station docking - after parenting. New parent:', this.ship.mesh.parent?.name || 'none');
          if (DEBUG) console.log('Ship local position after Spaceship parenting:', this.ship.mesh.position);

          // Ensure station docking context flags
          this.ship.flags.dockContext = 'station';
          this.ship.flags.docketPlanetId = null;
          this.ship.flags.dockedStationId = station.id || (station.getId && station.getId()) || null;
        }
        this.ship.flags.dockingAuthorized = false;
        this.ship.flags.landingVectorLocked = false;
        this.ship.flags.landingAlignmentLocked = false;
        this.ship.flags.rotationLockAcquired = false;
      }
      this.finalTurnInProgress = false;
    }

    return true;
  }
}
