import * as THREE from 'three';

export class Spaceship {
  constructor() {
    this.mesh = this.createSpaceshipMesh();
    // Third-person model holder (FBX)
    this.thirdPersonGroup = new THREE.Group();
    this.thirdPersonLoaded = false;
    this.thirdPersonMode = false;
    this.thirdPersonVisualOffset = null; // local-space offset to align model with logical ship position
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
      firingEnabled: true,
      isDocking: false,
      isDocked: false,
      isInCombat: false,           // true when player is in combat with NPC ship
      dockingAuthorized: false, // station granted docking
      landingVectorLocked: false, // player aligned with landing vector
      landingAlignmentLocked: false, // fully centered on landing vector axis
      rotationLockAcquired: false, // finished rotating to horizontal slot-facing orientation
      hasVisitedAridusPrime: false,
      hasVisitedOceanus: false,
      dockContext: null,           // 'planet' | 'station'
      docketPlanetId: null,        // planet id when docked to planet (spelling per request)
      dockedStationId: null       // station id when docked to station
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
    // Station auto insertion after rotation
    this.postRotationTimer = 0; // time since rotation lock
    this.autoInsertionDelay = 2.0; // seconds after rotation lock before moving into slot
    this.insertionInProgress = false;
    this.insertionSpeed = 2.0; // units per second toward station center
    this.insertionTargetLocal = new THREE.Vector3(0, 0, 0); // station center
    this.insertionTargetAlong = null; // negative along-distance to reach station center
    // Station final turnaround (face coin slot) after insertion
    this.finalTurnInProgress = false;
    this.finalTurnTimer = 0;
    this.finalTurnDuration = 4.0; // seconds to rotate 180 deg
    this.finalTurnStartQuat = new THREE.Quaternion();
    this.finalTurnTargetQuat = new THREE.Quaternion();
    // Station docking pinning
    this.dockedStation = null;
    this.dockedLocalOffset = null;
    this.dockedRelativeQuat = null;
    // Planet takeoff sequence
    this.takeoffActive = false;
    this.takeoffTimer = 0;
    this.takeoffDuration = 5.0; // seconds
    this.takeoffStartPos = new THREE.Vector3();
    this.takeoffTargetPos = new THREE.Vector3();
    this.takeoffPlanet = null;
    this.takeoffLocalStart = new THREE.Vector3();
    this.takeoffLocalTarget = new THREE.Vector3();
    this.takeoffSceneParent = null; // parent to reattach to when detaching from planet
    this.takeoffBaseQuat = new THREE.Quaternion();

    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
    if (this.thirdPersonMode) {
      this.thirdPersonGroup.position.copy(this.position);
      this.thirdPersonGroup.rotation.copy(this.rotation);
    }
    this.thirdPersonGroup.position.copy(this.position);
    this.thirdPersonGroup.rotation.copy(this.rotation);
  }

  enableThirdPerson(modelRoot) {
    // Attach loaded model root into thirdPersonGroup
    if (modelRoot && !this.thirdPersonLoaded) {
      this.thirdPersonGroup.add(modelRoot);
      this.thirdPersonLoaded = true;
    }
    this.thirdPersonMode = true;
  }

  disableThirdPerson() {
    this.thirdPersonMode = false;
  }

  toggleThirdPerson() {
    this.thirdPersonMode = !this.thirdPersonMode;
  }

  syncThirdPerson() {
    if (this.thirdPersonMode) {
      // Base position is logical ship position (cockpit viewpoint)
      const basePos = this.position.clone();
      if (this.thirdPersonVisualOffset) {
        // Rotate offset by ship orientation so it stays attached properly
        const rotated = this.thirdPersonVisualOffset.clone().applyQuaternion(this.quaternion);
        basePos.add(rotated);
      }
      this.thirdPersonGroup.position.copy(basePos);
      this.thirdPersonGroup.quaternion.copy(this.quaternion);
    }
  }

  lockToStation(station) {
    // Freeze relative motion: attach ship to station but keep slight offset on vector start
    this.dockingTarget = station;
    this.flags.landingVectorLocked = true;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
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
    // Debug: Check if ship gets detached unexpectedly
    if (this.flags.isDocked && this.flags.stationDocked && this.mesh.parent === null) {
      if (DEBUG) console.log('WARNING: Ship detached from station unexpectedly!');
      if (DEBUG) console.trace();
    }

    // Handle docking
    this.updateDocking(deltaTime);

    // Final station turnaround phase (runs before other movement once initiated)
    if (this.finalTurnInProgress) {
      // Freeze linear/angular motion
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);
      // Keep centered on station
      const station = this.landingVectorStation || this.dockedStation;
      if (station) {
        const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
        this.position.copy(centerWorld);
      }
      // Ensure target quaternion exists (safety)
      if (this.finalTurnTargetQuat.lengthSq() === 0) {
        // Initialize target: 180° yaw around ship's local Y axis
        this.finalTurnStartQuat.copy(this.quaternion);
        const halfTurnLocal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
        this.finalTurnTargetQuat.copy(this.finalTurnStartQuat.clone().multiply(halfTurnLocal));
      }
      this.finalTurnTimer += deltaTime;
      const tTurn = Math.min(1, this.finalTurnTimer / this.finalTurnDuration);
      const ease = tTurn * tTurn * (3 - 2 * tTurn);
      const qInterp = this.finalTurnStartQuat.clone();
      qInterp.slerp(this.finalTurnTargetQuat, ease);
      this.quaternion.copy(qInterp);
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.rotation.copy(this.rotation);
      this.syncThirdPerson();
      if (tTurn >= 1) {
        // Complete docking now if not already
        if (!this.flags.isDocked) {
          const station = this.landingVectorStation || this.dockedStation;
          if (station) {
            this.flags.isDocked = true;
            this.flags.stationDocked = true;
            this.dockedStation = station;
            this.dockedLocalOffset = new THREE.Vector3(0, 0, 0);
            const stationQuatInv = station.mesh.quaternion.clone().invert();
            this.dockedRelativeQuat = stationQuatInv.multiply(this.quaternion.clone());

            // Parent ship to station for proper takeoff animation
            const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
            const worldQuat = this.mesh.getWorldQuaternion(new THREE.Quaternion());
            const parent = this.mesh.parent;
            if (DEBUG) console.log('Spaceship Station docking - before parenting. Parent:', parent?.name || 'none');
            if (DEBUG) console.log('Station object:', station);
            if (DEBUG) console.log('Station mesh:', station.mesh);
            if (DEBUG) console.log('Station mesh type:', typeof station.mesh);
            if (DEBUG) console.log('Station mesh add method:', typeof station.mesh?.add);
            if (parent) parent.remove(this.mesh);
            if (DEBUG) console.log('About to call station.mesh.add(this.mesh)');
            station.mesh.add(this.mesh);
            if (DEBUG) console.log('After calling station.mesh.add(this.mesh)');
            this.mesh.position.copy(station.mesh.worldToLocal(worldPos));
            this.mesh.quaternion.copy(station.mesh.quaternion.clone().invert().multiply(worldQuat));
            if (DEBUG) console.log('Spaceship Station docking - after parenting. New parent:', this.mesh.parent?.name || 'none');
            if (DEBUG) console.log('Ship local position after Spaceship parenting:', this.mesh.position);

            // Ensure station docking context flags
            this.flags.dockContext = 'station';
            this.flags.docketPlanetId = null;
            this.flags.dockedStationId = station.id || (station.getId && station.getId()) || null;
          }
          this.flags.dockingAuthorized = false;
          this.flags.landingVectorLocked = false;
          this.flags.landingAlignmentLocked = false;
          this.flags.rotationLockAcquired = false;
          this.dockingProgress = 1;
        }
        this.finalTurnInProgress = false;
      }
      return; // Skip rest while turning
    }

    // Smooth takeoff (planet or station) - runs before any other movement once active
    if (this.takeoffActive) {
      this.takeoffTimer += deltaTime;
      const t = Math.min(1, this.takeoffTimer / this.takeoffDuration);
      const ease = 1 - Math.pow(1 - t, 3); // easeOutCubic

      // Suppress any residual angular velocity during guided ascent
      this.angularVelocity.set(0, 0, 0);

      // Check if this is a planet takeoff (has local coordinates)
      const isPlanetTakeoff = this.takeoffPlanet && this.takeoffPlanet.getType && this.takeoffPlanet.getType() === 'planet';
      const isStationTakeoff = this.takeoffPlanet && !isPlanetTakeoff; // Station takeoff

      if (isPlanetTakeoff && this.mesh.parent === this.takeoffPlanet.mesh) {
        // Planet takeoff: use local coordinates
        const localPos = this.takeoffLocalStart.clone().lerp(this.takeoffLocalTarget, ease);
        // Planet takeoff: add small lift arc
        const arcLift = Math.sin(ease * Math.PI) * 0.05 * this.takeoffLocalStart.length();
        const radialDir = localPos.clone().normalize();
        const lifted = localPos.clone().add(radialDir.multiplyScalar(arcLift));
        this.mesh.position.copy(lifted);
        // Orientation: slight pitch up
        const pitchAngle = THREE.MathUtils.degToRad(10) * ease;
        const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchAngle);
        this.mesh.quaternion.copy(this.takeoffBaseQuat.clone().multiply(pitchQ));

        // Update world position/quaternion caches
        this.position.copy(this.mesh.getWorldPosition(new THREE.Vector3()));
        this.quaternion.copy(this.mesh.getWorldQuaternion(new THREE.Quaternion()));
      } else if (isStationTakeoff) {
        // Station takeoff: move forward relative to station's current position
        const station = this.takeoffPlanet;

        // Get current station position and rotation (accounting for orbital movement)
        const currentStationPos = station.mesh.getWorldPosition(new THREE.Vector3());
        const currentStationQuat = station.mesh.getWorldQuaternion(new THREE.Quaternion());

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

        this.position.copy(worldPos);
        this.quaternion.copy(this.takeoffBaseQuat);
        this.mesh.position.copy(worldPos);
        this.mesh.quaternion.copy(this.quaternion);
      } else {
        // Post-detachment: use world-space interpolation (fallback case)
        this.position.copy(this.takeoffStartPos).lerp(this.takeoffTargetPos, ease);
        this.quaternion.copy(this.takeoffBaseQuat);
        this.mesh.position.copy(this.position);
        this.mesh.quaternion.copy(this.quaternion);
      }
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.rotation.copy(this.rotation);
      this.syncThirdPerson();
      if (t >= 1) {
        // Detach if still parented (only for planet takeoff - station takeoff is already in world space)
        if (isPlanetTakeoff && this.mesh.parent === this.takeoffPlanet.mesh) {
          const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
          const worldQuat = this.mesh.getWorldQuaternion(new THREE.Quaternion());
          const parent = this.takeoffPlanet.mesh.parent || this.takeoffSceneParent;
          this.takeoffPlanet.mesh.remove(this.mesh);
          if (parent) parent.add(this.mesh);
          this.mesh.position.copy(worldPos);
          this.mesh.quaternion.copy(worldQuat);
          this.position.copy(worldPos);
          this.quaternion.copy(worldQuat);
        }

        // Set initial velocity and throttle
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).normalize();
        this.velocity.copy(forward.multiplyScalar(this.maxSpeed * 0.3));
        this.setThrottle(0.6);

        // Complete takeoff
        this.takeoffActive = false;
        this.takeoffPlanet = null;

        // Clear docking flags
        this.flags.isDocked = false;
        this.dockingProgress = 0;
        this.flags.firingEnabled = true;
        this.flags.dockContext = null;
        this.flags.docketPlanetId = null;
        this.flags.dockedStationId = null;
        this.flags.stationDocked = false;
        this.dockedStation = null;
        this.dockingTarget = null;
      }
      return;
    }

    // Follow station landing vector if locked (but not yet docked)
    if (this.flags.landingVectorLocked && !this.flags.isDocked && this.landingVectorStation) {
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
          // Hide landing vector guidance now that precise axis alignment achieved
          if (station.setLandingVectorVisible) {
            station.setLandingVectorVisible(false);
          }
        }
      } else {
        // Maintain axis position always; insertion adjusts along-distance directly.
        this.position.copy(axisPoint);
      }
      // Orientation handling: compute target orientation once (forward toward slot, right horizontal)
      const slotForward = dir.clone().negate();
      if (this.flags.landingAlignmentLocked) {
        this.rotationAlignTimer += deltaTime;
      }
      if (this.flags.rotationLockAcquired) {
        // Manage post-rotation insertion timer / movement
        this.postRotationTimer += deltaTime;
        if (!this.insertionInProgress && this.postRotationTimer >= this.autoInsertionDelay) {
          this.insertionInProgress = true;
          if (this.insertionTargetAlong === null) {
            // Station center lies below slot start by roughly size/2 (plus small slot offset ~0.01)
            const station = this.landingVectorStation;
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
            const station = this.landingVectorStation;
            const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
            this.position.copy(centerWorld);
            this.insertionInProgress = false;
            this.finalTurnInProgress = true;
            this.finalTurnTimer = 0;
            this.finalTurnStartQuat.copy(this.quaternion);
            // Compute target orientation: 180° yaw around ship's local Y (turn around)
            const halfTurnLocal = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0), Math.PI);
            this.finalTurnTargetQuat.copy(this.finalTurnStartQuat.clone().multiply(halfTurnLocal));
          }
        }
      }
      // Handle final turnaround rotation before declaring docked
      if (this.finalTurnInProgress) {
        // Maintain centered position
        const station = this.landingVectorStation;
        if (station) {
          const centerWorld = station.mesh.localToWorld(new THREE.Vector3(0, 0, 0));
          this.position.copy(centerWorld);
        }
        this.finalTurnTimer += deltaTime;
        const tTurn = Math.min(1, this.finalTurnTimer / this.finalTurnDuration);
        const ease = tTurn * tTurn * (3 - 2 * tTurn); // smoothstep easing
        this.quaternion.copy(this.finalTurnStartQuat.clone().slerp(this.finalTurnTargetQuat, ease));
        if (tTurn >= 1) {
          // Now finalize docking
          const station = this.landingVectorStation;
          this.flags.isDocked = true;
          this.flags.stationDocked = true;
          this.dockedStation = station;
          this.dockedLocalOffset = new THREE.Vector3(0, 0, 0);
          const stationQuatInv = station.mesh.quaternion.clone().invert();
          this.dockedRelativeQuat = stationQuatInv.multiply(this.quaternion.clone());

          // Parent ship to station for proper takeoff animation
          const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
          const worldQuat = this.mesh.getWorldQuaternion(new THREE.Quaternion());
          const parent = this.mesh.parent;
          if (DEBUG) console.log('Station docking - before parenting. Parent:', parent?.name || 'none');
          if (parent) parent.remove(this.mesh);
          station.mesh.add(this.mesh);
          this.mesh.position.copy(station.mesh.worldToLocal(worldPos));
          this.mesh.quaternion.copy(station.mesh.quaternion.clone().invert().multiply(worldQuat));
          if (DEBUG) console.log('Station docking - after parenting. New parent:', this.mesh.parent?.name || 'none');
          if (DEBUG) console.log('Ship local position after parenting:', this.mesh.position);

          this.flags.dockingAuthorized = false;
          this.flags.landingVectorLocked = false;
          this.flags.landingAlignmentLocked = false;
          this.flags.rotationLockAcquired = false;
          this.dockingProgress = 1;
          this.finalTurnInProgress = false;
        }
      }
      if (this.flags.landingAlignmentLocked && !this.flags.rotationLockAcquired && this.rotationAlignTimer >= this.rotationAlignDelay) {
        // Step 1: align forward to slot.
        const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).normalize();
        const alignQ2 = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward.clone());
        this.quaternion.premultiply(alignQ2);

        // Step 2: compute minimal roll so station's horizontal reference appears level.
        // Use station local X axis as horizontal reference.
        const stationRightWorld = new THREE.Vector3(1, 0, 0).applyQuaternion(this.landingVectorStation.mesh.quaternion).normalize();
        const fwd = slotForward.clone().normalize();
        // Project both currentRight and desiredRight onto plane perpendicular to forward
        const currentRight = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
        currentRight.sub(fwd.clone().multiplyScalar(currentRight.dot(fwd))).normalize();
        let desiredRight = stationRightWorld.clone();
        desiredRight.sub(fwd.clone().multiplyScalar(desiredRight.dot(fwd)));
        if (desiredRight.lengthSq() < 1e-8) {
          // Fallback: use station local Z
          desiredRight = new THREE.Vector3(0, 0, 1).applyQuaternion(this.landingVectorStation.mesh.quaternion);
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
        this.flags.rotationLockAcquired = true; // rotation phase complete; insertion timer begins
      } else if (!this.flags.rotationLockAcquired) {
        // Before roll phase: keep forward pointed at slot only (remove lateral drift)
        const currentForward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion).normalize();
        const alignQ = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward.clone());
        this.quaternion.premultiply(alignQ);
      }
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      this.syncThirdPerson();
      return; // Skip normal movement while locked
    }

    // If docked inside station, keep position (parented) and exit
    if (this.flags.isDocked && this.flags.stationDocked && this.dockedStation && !this.takeoffActive) {
      // Recompute world transform from station each frame
      const worldPos = this.dockedStation.mesh.localToWorld(this.dockedLocalOffset.clone());
      this.position.copy(worldPos);
      this.quaternion.copy(this.dockedStation.mesh.quaternion);
      if (this.dockedRelativeQuat) this.quaternion.multiply(this.dockedRelativeQuat);
      this.rotation.setFromQuaternion(this.quaternion);
      this.mesh.position.copy(this.position);
      this.mesh.quaternion.copy(this.quaternion);
      this.mesh.rotation.copy(this.rotation);
      this.syncThirdPerson();
      return;
    }

    // If docked to a planet, update position to follow planet rotation and zero velocity
    if (this.flags.isDocked && this.dockingTarget && !this.takeoffActive) {
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

      // Zero velocity and angular velocity so engine sound logic works
      this.velocity.set(0, 0, 0);
      this.angularVelocity.set(0, 0, 0);

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
    this.flags.isDocking = true;
    this.flags.firingEnabled = false;
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

      if (DEBUG) console.log('Docking completed!');
    }
  }

  getRotation() {
    return this.rotation.clone();
  }

  startPlanetTakeoff(planet, scene) {
    if (!this.flags.isDocked || this.flags.stationDocked) return;
    // Keep parented initially; store parent for later reattachment if needed
    this.takeoffSceneParent = planet.mesh.parent || scene;
    const local = this.dockingPosition.clone(); // starting local position relative to planet center
    const radialDir = local.clone().normalize();
    const altitude = planet.radius * 0.6;
    const targetLocal = radialDir.clone().multiplyScalar(planet.radius + altitude);
    this.takeoffLocalStart.copy(local);
    this.takeoffLocalTarget.copy(targetLocal);
    // Store world start/target for post-detach continuation (if any)
    const planetPos = planet.getPosition();
    const startWorld = planetPos.clone().add(local);
    const targetWorld = planetPos.clone().add(targetLocal);
    this.takeoffStartPos.copy(startWorld);
    this.takeoffTargetPos.copy(targetWorld);
    this.position.copy(startWorld);
    this.quaternion.copy(this.mesh.getWorldQuaternion(new THREE.Quaternion()));
    this.takeoffBaseQuat.copy(this.quaternion); // store stable starting orientation
    this.takeoffTimer = 0;
    this.takeoffActive = true;
    this.takeoffPlanet = planet;
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.setThrottle(0);
    // Remain docked during ascent so existing planet-follow transform is stable; we'll clear at completion
  }

  startStationTakeoff(station, scene) {
    if (!this.flags.isDocked || !this.flags.stationDocked) return;

    if (DEBUG) console.log('Station takeoff starting...');
    if (DEBUG) console.log('Ship world position:', this.position);

    // Store parent for later reattachment if needed
    this.takeoffSceneParent = station.mesh.parent || scene;

    // Get current world position (ship is in world space, not parented to station)
    const currentWorldPos = this.position.clone();

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
    this.quaternion.copy(this.mesh.getWorldQuaternion(new THREE.Quaternion()));
    this.takeoffBaseQuat.copy(this.quaternion);

    // Initialize takeoff sequence
    this.takeoffTimer = 0;
    this.takeoffActive = true;
    this.takeoffPlanet = station; // Reuse planet field for station
    this.velocity.set(0, 0, 0);
    this.angularVelocity.set(0, 0, 0);
    this.setThrottle(0);

    if (DEBUG) console.log('Takeoff initialized. Active:', this.takeoffActive);

    // Ship remains in world space during takeoff (like docking system)
  }

  // When launching/takeoff completes
  completeTakeoff() {
    this.flags.isDocking = false;
    this.flags.isDocked = false;
    this.flags.firingEnabled = true;
  }
}
