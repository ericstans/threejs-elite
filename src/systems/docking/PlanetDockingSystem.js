import * as THREE from 'three';

const DEBUG = false;

/**
 * PlanetDockingSystem handles all landing and takeoff logic for planets.
 */
export class PlanetDockingSystem {
  constructor(ship) {
    this.ship = ship;

    // Docking system
    this.dockingTarget = null;
    this.dockingProgress = 0;
    this.dockingSpeed = ship.maxSpeed * 0.9; // 90% of max speed
    this.dockingPosition = new THREE.Vector3();
    this.dockingRotation = new THREE.Quaternion();

    // Enhanced landing animation state
    this.landingPhase = null; // 'approach', 'descent'
    this.landingStartTime = 0;
    this.landingDuration = 3.0; // Total landing duration in seconds
    this.descentStartTime = 0;
    this.descentDuration = 2.0; // Descent phase duration
    this.landingStartPosition = new THREE.Vector3();
    this.landingTargetPosition = new THREE.Vector3();
    this.landingStartRotation = new THREE.Quaternion();
    this.landingTargetRotation = new THREE.Quaternion();
    this.landingStartLocalPosition = new THREE.Vector3();
    this.landingStartLocalRotation = new THREE.Quaternion();
    this.isParentedToPlanet = false;

    // Takeoff state
    this.takeoffActive = false;
    this.takeoffTimer = 0;
    this.takeoffDuration = 5.0; // seconds
    this.takeoffStartPos = new THREE.Vector3();
    this.takeoffTargetPos = new THREE.Vector3();
    this.takeoffPlanet = null;
    this.takeoffLocalStart = new THREE.Vector3();
    this.takeoffLocalTarget = new THREE.Vector3();
    this.takeoffSceneParent = null;
    this.takeoffBaseQuat = new THREE.Quaternion();
  }

  /**
   * Updates docking speed when ship's max speed changes
   */
  updateDockingSpeed() {
    this.dockingSpeed = this.ship.maxSpeed * 0.9;
  }

  /**
   * Start docking sequence with a planet
   */
  startDocking(targetPlanet) {
    this.ship.flags.isDocking = true;
    this.ship.flags.firingEnabled = false;
    this.dockingTarget = targetPlanet;
    this.dockingProgress = 0;

    // Initialize enhanced landing animation
    this.landingPhase = 'approach';
    this.landingStartTime = Date.now() / 1000;
    this.isParentedToPlanet = false;

    // Reset speed history for smooth docking display
    this.ship.resetSpeedHistory();

    // Store current position and rotation as starting points
    this.landingStartPosition.copy(this.ship.position);
    this.landingStartRotation.copy(this.ship.quaternion);

    // Calculate landing position on planet surface (center of a face)
    const planetPos = targetPlanet.getPosition();
    const planetRadius = targetPlanet.radius;

    // Choose a point on the planet surface (not necessarily equator)
    // Use a more natural landing spot
    const theta = Math.random() * Math.PI * 2; // Azimuth
    const phi = (Math.random() - 0.5) * Math.PI; // Elevation (not just equator)
    const landingPoint = new THREE.Vector3(
      Math.cos(phi) * Math.cos(theta) * planetRadius,
      Math.sin(phi) * planetRadius,
      Math.cos(phi) * Math.sin(theta) * planetRadius
    );

    // Store the landing point relative to planet center
    this.dockingPosition.copy(landingPoint);
    this.landingTargetPosition.copy(planetPos.clone().add(landingPoint));

    // Calculate rotation so ship's bottom faces planet surface
    // The ship's -Y axis should point toward the planet center
    const directionToPlanet = landingPoint.clone().normalize().negate();
    this.dockingRotation.setFromUnitVectors(new THREE.Vector3(0, -1, 0), directionToPlanet);
    this.landingTargetRotation.copy(this.dockingRotation);
  }

  /**
   * Update docking animation during planet landing
   */
  updateDocking(deltaTime) {
    if (!this.ship.flags.isDocking || !this.dockingTarget) {
      return;
    }

    const currentTime = Date.now() / 1000;
    const planetPos = this.dockingTarget.getPosition();
    const planetRadius = this.dockingTarget.radius;

    // Phase 1: Approach - move toward planet at 90% max speed
    if (this.landingPhase === 'approach') {
      const targetWorldPosition = planetPos.clone().add(this.dockingPosition);
      const distanceToTarget = this.ship.position.distanceTo(targetWorldPosition);
      const moveDistance = this.dockingSpeed * deltaTime;

      if (distanceToTarget > moveDistance) {
        // Move towards docking position at 90% max speed
        const direction = targetWorldPosition.clone().sub(this.ship.position).normalize();
        this.ship.position.add(direction.multiplyScalar(moveDistance));

        // Only adjust rotation when close to the planet (within 2x planet radius)
        const distanceToPlanet = this.ship.position.distanceTo(planetPos);
        const planetRadius = this.dockingTarget.radius;

        if (distanceToPlanet < planetRadius * 2) {
          // Rotate so ship's bottom faces the planet center
          const directionToPlanet = planetPos.clone().sub(this.ship.position).normalize();
          const targetRotation = new THREE.Quaternion();
          targetRotation.setFromUnitVectors(new THREE.Vector3(0, -1, 0), directionToPlanet);

          // Smoothly interpolate rotation
          this.ship.quaternion.slerp(targetRotation, 2 * deltaTime);
          this.ship.rotation.setFromQuaternion(this.ship.quaternion);
        }
      } else {
        // Reached close enough to planet - start descent phase
        this.landingPhase = 'descent';
        this.descentStartTime = currentTime;

        // Parent ship to planet mesh at the start of descent
        if (!this.isParentedToPlanet) {
          // Store the current world position (rotation not needed here)
          const worldPos = this.ship.mesh.getWorldPosition(new THREE.Vector3());

          // Calculate where the ship should be relative to the planet
          // Position it at a safe distance from the planet surface
          const directionFromPlanet = worldPos.clone().sub(planetPos).normalize();
          const distanceFromSurface = worldPos.distanceTo(planetPos) - this.dockingTarget.radius;
          const safeDistance = Math.max(distanceFromSurface, this.dockingTarget.radius * 0.5);
          const localPos = directionFromPlanet.clone().multiplyScalar(this.dockingTarget.radius + safeDistance);

          // Calculate the rotation that maintains the ship's current orientation
          // relative to the planet's surface at the landing point
          const directionToPlanet = this.dockingPosition.clone().normalize().negate();
          const targetRotation = new THREE.Quaternion();
          targetRotation.setFromUnitVectors(new THREE.Vector3(0, -1, 0), directionToPlanet);

          // Remove from current parent and add to planet
          if (this.ship.mesh.parent) {
            this.ship.mesh.parent.remove(this.ship.mesh);
          }
          this.dockingTarget.mesh.add(this.ship.mesh);

          // Set the local position and rotation
          this.ship.mesh.position.copy(localPos);
          this.ship.mesh.quaternion.copy(targetRotation);
          this.ship.mesh.rotation.setFromQuaternion(targetRotation);

          // Update the logical position and rotation
          this.ship.position.copy(this.dockingTarget.mesh.localToWorld(localPos));
          this.ship.quaternion.copy(this.dockingTarget.mesh.getWorldQuaternion(new THREE.Quaternion()).multiply(targetRotation));
          this.ship.rotation.setFromQuaternion(this.ship.quaternion);

          // Store the starting local position for interpolation
          this.landingStartLocalPosition = localPos.clone();
          this.landingStartLocalRotation = targetRotation.clone();

          this.isParentedToPlanet = true;
          if (DEBUG) console.log('Ship parented to planet for landing animation');
        }
      }
      return;
    }

    // Phase 2: Descent - smooth descent to planet surface
    if (this.landingPhase === 'descent') {
      const descentElapsed = currentTime - this.descentStartTime;
      const descentProgress = Math.min(descentElapsed / this.descentDuration, 1.0);

      // Use smooth easing for descent
      const easeProgress = 1 - Math.pow(1 - descentProgress, 3); // easeOutCubic

      // Work entirely in local space since ship is parented to planet
      const startLocalPos = this.landingStartLocalPosition;
      const targetLocalPos = this.dockingPosition.clone();

      // Interpolate position in local space
      const currentLocalPos = startLocalPos.clone().lerp(targetLocalPos, easeProgress);
      this.ship.mesh.position.copy(currentLocalPos);

      // Interpolate rotation in local space
      const currentRotation = this.landingStartLocalRotation.clone().slerp(this.landingTargetRotation, easeProgress);
      this.ship.mesh.quaternion.copy(currentRotation);
      this.ship.mesh.rotation.setFromQuaternion(currentRotation);

      // Check for collision with planet surface (prevent penetration)
      const distanceFromCenter = currentLocalPos.length();
      let forceComplete = false;
      if (distanceFromCenter < planetRadius) {
        // Ship is inside planet - push it back to surface
        console.log('Ship inside planet - end landing');
        forceComplete = true;
      }

      // Check if descent is complete
      if (forceComplete || descentProgress >= 1.0) {
        this.ship.flags.isDocking = false;
        this.ship.flags.isDocked = true;
        this.dockingProgress = 1;

        if (DEBUG) console.log('Landing completed!');
      }
    }
  }

  /**
   * Start takeoff sequence from a planet
   */
  startTakeoff(planet, scene) {
    if (!this.ship.flags.isDocked || this.ship.flags.stationDocked) return;

    // Reset landing animation state
    this.landingPhase = 'approach';
    this.isParentedToPlanet = false;

    // Reset speed history for takeoff
    this.ship.resetSpeedHistory();

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
    this.ship.position.copy(startWorld);
    this.ship.quaternion.copy(this.ship.mesh.getWorldQuaternion(new THREE.Quaternion()));
    this.takeoffBaseQuat.copy(this.ship.quaternion); // store stable starting orientation
    this.takeoffTimer = 0;
    this.takeoffActive = true;
    this.takeoffPlanet = planet;
    this.ship.velocity.set(0, 0, 0);
    this.ship.angularVelocity.set(0, 0, 0);
    this.ship.setThrottle(0);
    // Remain docked during ascent so existing planet-follow transform is stable; we'll clear at completion
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

    if (this.ship.mesh.parent === this.takeoffPlanet.mesh) {
      // Planet takeoff: use local coordinates
      const localPos = this.takeoffLocalStart.clone().lerp(this.takeoffLocalTarget, ease);
      // Planet takeoff: add small lift arc
      const arcLift = Math.sin(ease * Math.PI) * 0.05 * this.takeoffLocalStart.length();
      const radialDir = localPos.clone().normalize();
      const lifted = localPos.clone().add(radialDir.multiplyScalar(arcLift));
      this.ship.mesh.position.copy(lifted);
      // Orientation: slight pitch up
      const pitchAngle = THREE.MathUtils.degToRad(10) * ease;
      const pitchQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitchAngle);
      this.ship.mesh.quaternion.copy(this.takeoffBaseQuat.clone().multiply(pitchQ));

      // Update world position/quaternion caches
      this.ship.position.copy(this.ship.mesh.getWorldPosition(new THREE.Vector3()));
      this.ship.quaternion.copy(this.ship.mesh.getWorldQuaternion(new THREE.Quaternion()));
    } else {
      // Post-detachment: use world-space interpolation (fallback case)
      this.ship.position.copy(this.takeoffStartPos).lerp(this.takeoffTargetPos, ease);
      this.ship.quaternion.copy(this.takeoffBaseQuat);
      this.ship.mesh.position.copy(this.ship.position);
      this.ship.mesh.quaternion.copy(this.ship.quaternion);
    }
    this.ship.rotation.setFromQuaternion(this.ship.quaternion);
    this.ship.mesh.rotation.copy(this.ship.rotation);
    this.ship.syncThirdPerson();

    if (t >= 1) {
      // Detach if still parented
      if (this.ship.mesh.parent === this.takeoffPlanet.mesh) {
        const worldPos = this.ship.mesh.getWorldPosition(new THREE.Vector3());
        const worldQuat = this.ship.mesh.getWorldQuaternion(new THREE.Quaternion());
        if (DEBUG) console.log('Planet detachment worldQuat:', worldQuat.x, worldQuat.y, worldQuat.z, worldQuat.w);
        const parent = this.takeoffPlanet.mesh.parent || this.takeoffSceneParent;
        this.takeoffPlanet.mesh.remove(this.ship.mesh);
        if (parent) parent.add(this.ship.mesh);
        this.ship.mesh.position.copy(worldPos);
        this.ship.mesh.quaternion.copy(worldQuat);
        this.ship.position.copy(worldPos);
        this.ship.quaternion.copy(worldQuat);
      }

      // Set initial velocity and throttle
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.ship.quaternion).normalize();
      this.ship.velocity.copy(forward.multiplyScalar(this.ship.maxSpeed * 0.3));
      this.ship.setThrottle(0.6);

      // Complete takeoff
      this.takeoffActive = false;
      this.takeoffPlanet = null;

      // Clear docking flags
      this.ship.flags.isDocked = false;
      this.dockingProgress = 0;
      this.ship.flags.firingEnabled = true;
      this.ship.flags.dockContext = null;
      this.ship.flags.docketPlanetId = null;
    }

    return true;
  }

  /**
   * Update docked state
   * Returns true if docked and handled, false otherwise
   */
  updateDockedState() {
    // If docked to a planet, update position to follow planet rotation and zero velocity
    if (this.ship.flags.isDocked && this.dockingTarget && !this.takeoffActive) {
      // Update the ship's world position to follow the planet's rotation
      const planetPos = this.dockingTarget.getPosition();
      const rotatedLandingPoint = this.dockingPosition.clone().applyQuaternion(this.dockingTarget.mesh.quaternion);
      this.ship.position.copy(planetPos).add(rotatedLandingPoint);

      // Update the ship's rotation to follow the planet's rotation
      const planetRotation = this.dockingTarget.mesh.quaternion.clone();
      this.ship.quaternion.copy(planetRotation).multiply(this.dockingRotation);
      this.ship.rotation.setFromQuaternion(this.ship.quaternion);

      // Update mesh position and rotation
      this.ship.mesh.position.copy(this.ship.position);
      this.ship.mesh.quaternion.copy(this.ship.quaternion);
      this.ship.mesh.rotation.copy(this.ship.rotation);

      // Make sure third-person representation stays in sync
      this.ship.syncThirdPerson();

      // Zero velocity and angular velocity so engine sound logic works
      this.ship.velocity.set(0, 0, 0);
      this.ship.angularVelocity.set(0, 0, 0);

      return true;
    }

    return false;
  }
}
