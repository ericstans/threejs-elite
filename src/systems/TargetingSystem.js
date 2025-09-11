import * as THREE from 'three';

/**
 * TargetingSystem handles:
 *  - Selecting nearest combat target (asteroids + NPC ship stub) to crosshair
 *  - Selecting nearest nav target (planets + station)
 *  - Updating target & nav target info panels
 *  - Determining homing / auto-aim eligibility (returns homingActive flag)
 *
 * It owns no world objects; it queries via supplied getter callbacks.
 */
export class TargetingSystem {
  constructor({
    camera,
    ui,
    soundManager,
    getSpaceship,
    getAsteroids,
    getNPCShips,
    getPlanets,
    getStations,
    getResources
  }) {
    this.camera = camera;
    this.ui = ui;
    this.soundManager = soundManager;
    this.getSpaceship = getSpaceship;
    this.getAsteroids = getAsteroids;
    this.getNPCShips = getNPCShips;
    this.getPlanets = getPlanets;
    this.getStations = getStations;
    this.getResources = getResources;

    this.currentTarget = null;      // combat target (asteroid / npc ship)
    this.currentNavTarget = null;   // nav target (planet / station)

    // Target cycling state
    this.combatTargetCycle = [];    // ordered list of combat targets by distance from crosshair
    this.navTargetCycle = [];       // ordered list of nav targets by distance from crosshair
    this.combatCycleIndex = -1;     // current index in combat cycle (-1 = no cycling)
    this.navCycleIndex = -1;        // current index in nav cycle (-1 = no cycling)
    this.lastTargetTime = 0;        // timestamp of last targeting action
    this.cycleTimeout = 3000;       // 3 seconds timeout to reset cycles
  }

  // --- Combat Targeting ---
  targetNearestCombat() {
    // Clear current target
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
      this.currentTarget = null;
    }
    const ship = this.getSpaceship();
    if (!ship) return;
    const camera = this.camera;
    const crosshairCenter = new THREE.Vector2(0, 0);

    const targetables = [...(this.getAsteroids?.() || [])];
    // Add resources to combat targeting
    if (this.getResources) {
      targetables.push(...(this.getResources() || []));
    }
    const npcShips = this.getNPCShips?.() || [];
    for (let i = 0; i < npcShips.length; i++) {
      const npc = npcShips[i];
      if (npc && npc.loaded && npc.mesh) {
        let meshCenter = null;
        npc.mesh.traverse(child => {
          if (!meshCenter && child.isMesh) {
            meshCenter = new THREE.Vector3();
            child.getWorldPosition(meshCenter);
          }
        });
        if (meshCenter) {
          targetables.push({
            getPosition: () => {
              // Recalculate position each time to track moving NPC ship
              let currentMeshCenter = null;
              npc.mesh.traverse(child => {
                if (!currentMeshCenter && child.isMesh) {
                  currentMeshCenter = new THREE.Vector3();
                  child.getWorldPosition(currentMeshCenter);
                }
              });
              return currentMeshCenter || meshCenter; // fallback to original if calculation fails
            },
            isAlive: () => npc.isAlive(),
            setTargeted: (v) => { npc.mesh.userData.targeted = v; },
            getId: () => `npcship-${i}`,
            getName: () => npc.getName(),
            getMass: () => npc.getMass(),
            getHealth: () => npc.getHealth(),
            getMaxHealth: () => npc.getMaxHealth(),
            isCommable: () => npc.isCommable(),
            getType: () => 'npcship',
            previewSource: npc.mesh // supply full mesh hierarchy for preview underlay
          });
        }
      }
    }
    let closest = null;
    let closestScreenDistance = Infinity;
    for (const obj of targetables) {
      if (!obj.isAlive()) continue;
      const pos = obj.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      //if (screenPos.z > 1) continue;
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closest = obj;
      }
    }
    if (closest) {
      this.currentTarget = closest;
      this.currentTarget.setTargeted(true);
      this.soundManager.playTargetSelectedSound();
    }
  }

  updateTargetInfo() {
    const ship = this.getSpaceship();
    if (this.currentTarget && this.currentTarget.isAlive()) {
      const spaceshipPos = ship.getPosition();
      const targetPos = this.currentTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      this.ui.updateTargetInfo({
        id: this.currentTarget.getId(),
        mass: this.currentTarget.getMass(),
        distance,
        health: this.currentTarget.getHealth(),
        maxHealth: this.currentTarget.getMaxHealth(),
        isCommable: this.currentTarget.isCommable,
        __ref: this.currentTarget
      }, targetPos, this.camera);
    } else {
      if (this.currentTarget) {
        this.currentTarget.setTargeted(false);
        this.currentTarget = null;
      }
      this.ui.clearTargetInfo();
    }
  }

  // Returns whether homing (auto-aim) is active for current target
  computeHomingState() {
    if (!(this.currentTarget && this.currentTarget.isAlive())) return false;
    const ship = this.getSpaceship();
    const spaceshipPos = ship.getPosition();
    const targetPos = this.currentTarget.getPosition();
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(ship.getRotation());
    const toTarget = targetPos.clone().sub(spaceshipPos).normalize();
    const angle = forward.angleTo(toTarget);
    const maxAngle = Math.PI / 18;

    // Check if target is within angle AND within laser range (300 units)
    const distance = spaceshipPos.distanceTo(targetPos);
    const laserRange = 300;

    return angle <= maxAngle && distance <= laserRange;
  }

  // --- Nav Targeting ---
  targetNearestNav({ blockIfDockingFlags } = { blockIfDockingFlags: true }) {
    console.log('TargetingSystem: targetNearestNav called');
    const ship = this.getSpaceship();
    if (!ship) {
      console.log('TargetingSystem: No ship found');
      return;
    }
    if (blockIfDockingFlags && (ship.flags.isDocked || ship.flags.isDocking || ship.flags.landingVectorLocked)) {
      console.log('TargetingSystem: Blocked by docking flags');
      return;
    }

    if (this.currentNavTarget) {
      this.currentNavTarget.setNavTargeted(false);
      this.currentNavTarget = null;
    }

    const camera = this.camera;
    const crosshairCenter = new THREE.Vector2(0, 0);
    const navTargets = [...(this.getPlanets?.() || [])];
    // Add moons (if any) from planets
    if (this.getPlanets) {
      for (const pl of this.getPlanets() || []) {
        if (pl.moon) navTargets.push(pl.moon);
      }
    }
    // Add all stations
    const stations = this.getStations?.() || [];
    console.log('TargetingSystem: Found stations:', stations.length, stations.map(s => s.getName?.() || 'unnamed'));
    navTargets.push(...stations);

    let closest = null;
    let closestScreenDistance = Infinity;
    for (const target of navTargets) {
      const pos = target.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      //if (screenPos.z > 1) continue;
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      if (screenDistance < closestScreenDistance) {
        closestScreenDistance = screenDistance;
        closest = target;
      }
    }
    if (closest) {
      this.currentNavTarget = closest;
      this.currentNavTarget.setNavTargeted(true);
      this.soundManager.playTargetSelectedSound();
    }
  }

  updateNavTargetInfo() {
    if (this.currentNavTarget) {
      const ship = this.getSpaceship();
      const spaceshipPos = ship.getPosition();
      const targetPos = this.currentNavTarget.getPosition();
      const rawDistance = spaceshipPos.distanceTo(targetPos);

      // Calculate surface distance for planets (distance - radius) and stations (distance - size)
      let distance = rawDistance;
      if (this.currentNavTarget.getType && this.currentNavTarget.getType() === 'planet') {
        // For planets, subtract radius to get distance to surface
        distance = Math.max(0, rawDistance - (this.currentNavTarget.radius || 0));
      } else if (this.currentNavTarget.getType && this.currentNavTarget.getType() === 'station') {
        // For stations, subtract size to get distance to surface
        distance = Math.max(0, rawDistance - (this.currentNavTarget.size || 0));
      }

      // Check if player is docked with the nav target
      const isDockedWithTarget = ship.flags.isDocked &&
        ((ship.flags.dockContext === 'planet' && ship.flags.docketPlanetId === this.currentNavTarget.getId()) ||
         (ship.flags.dockContext === 'station' && ship.flags.dockedStationId === this.currentNavTarget.getId()));

      this.ui.updateNavTargetInfo({
        id: this.currentNavTarget.getId(),
        name: this.currentNavTarget.getName(),
        mass: this.currentNavTarget.getMass(),
        distance,
        isCommable: this.currentNavTarget.isCommable,
        isDockedWithTarget,
        services: this.currentNavTarget.getServices ? this.currentNavTarget.getServices() : null,
        __ref: this.currentNavTarget
      }, targetPos, this.camera);
    } else {
      this.ui.clearNavTargetInfo();
    }
  }

  // --- Target Cycling ---
  cycleCombatTarget() {
    const now = Date.now();

    // Reset cycle if too much time has passed
    if (now - this.lastTargetTime > this.cycleTimeout) {
      this.combatTargetCycle = [];
      this.combatCycleIndex = -1;
    }

    // Build cycle list if empty
    if (this.combatTargetCycle.length === 0) {
      this.buildCombatTargetCycle();
    }

    if (this.combatTargetCycle.length === 0) return;

    // Clear current target
    if (this.currentTarget) {
      this.currentTarget.setTargeted(false);
    }

    // Move to next target in cycle
    this.combatCycleIndex = (this.combatCycleIndex + 1) % this.combatTargetCycle.length;
    this.currentTarget = this.combatTargetCycle[this.combatCycleIndex];
    this.currentTarget.setTargeted(true);
    this.lastTargetTime = now;
    this.soundManager.playTargetSelectedSound();
  }

  cycleNavTarget() {
    console.log('TargetingSystem: cycleNavTarget called');
    const now = Date.now();

    // Reset cycle if too much time has passed
    if (now - this.lastTargetTime > this.cycleTimeout) {
      this.navTargetCycle = [];
      this.navCycleIndex = -1;
    }

    // Build cycle list if empty
    if (this.navTargetCycle.length === 0) {
      this.buildNavTargetCycle();
    }

    if (this.navTargetCycle.length === 0) return;

    // Clear current nav target
    if (this.currentNavTarget) {
      this.currentNavTarget.setNavTargeted(false);
    }

    // Move to next target in cycle
    this.navCycleIndex = (this.navCycleIndex + 1) % this.navTargetCycle.length;
    this.currentNavTarget = this.navTargetCycle[this.navCycleIndex];
    this.currentNavTarget.setNavTargeted(true);
    this.lastTargetTime = now;
    this.soundManager.playTargetSelectedSound();
  }

  buildCombatTargetCycle() {
    const ship = this.getSpaceship();
    if (!ship) return;

    const camera = this.camera;
    const crosshairCenter = new THREE.Vector2(0, 0);

    const targetables = [...(this.getAsteroids?.() || [])];
    // Add resources to combat targeting
    if (this.getResources) {
      targetables.push(...(this.getResources() || []));
    }
    const npcShips = this.getNPCShips?.() || [];
    for (let i = 0; i < npcShips.length; i++) {
      const npc = npcShips[i];
      if (npc && npc.loaded && npc.mesh) {
        let meshCenter = null;
        npc.mesh.traverse(child => {
          if (!meshCenter && child.isMesh) {
            meshCenter = new THREE.Vector3();
            child.getWorldPosition(meshCenter);
          }
        });
        if (meshCenter) {
          targetables.push({
            getPosition: () => {
              // Recalculate position each time to track moving NPC ship
              let currentMeshCenter = null;
              npc.mesh.traverse(child => {
                if (!currentMeshCenter && child.isMesh) {
                  currentMeshCenter = new THREE.Vector3();
                  child.getWorldPosition(currentMeshCenter);
                }
              });
              return currentMeshCenter || meshCenter; // fallback to original if calculation fails
            },
            isAlive: () => npc.isAlive(),
            setTargeted: (v) => { npc.mesh.userData.targeted = v; },
            getId: () => `npcship-${i}`,
            getName: () => npc.getName(),
            getMass: () => npc.getMass(),
            getHealth: () => npc.getHealth(),
            getMaxHealth: () => npc.getMaxHealth(),
            isCommable: () => npc.isCommable(),
            getType: () => 'npcship',
            previewSource: npc.mesh
          });
        }
      }
    }

    // Sort by distance from crosshair
    const targetsWithDistance = [];
    for (const obj of targetables) {
      if (!obj.isAlive()) continue;
      const pos = obj.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      //if (screenPos.z > 1) continue;
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      targetsWithDistance.push({ target: obj, distance: screenDistance });
    }

    targetsWithDistance.sort((a, b) => a.distance - b.distance);
    this.combatTargetCycle = targetsWithDistance.map(item => item.target);
    this.combatCycleIndex = -1; // Will be incremented to 0 on first cycle
  }

  buildNavTargetCycle() {
    const ship = this.getSpaceship();
    if (!ship) return;

    const camera = this.camera;
    const crosshairCenter = new THREE.Vector2(0, 0);

    const navTargets = [...(this.getPlanets?.() || [])];
    // Add moons (if any) from planets
    if (this.getPlanets) {
      for (const pl of this.getPlanets() || []) {
        if (pl.moon) navTargets.push(pl.moon);
      }
    }
    // Add all stations
    const stations = this.getStations?.() || [];
    console.log('TargetingSystem: buildNavTargetCycle found stations:', stations.length, stations.map(s => s.getName?.() || 'unnamed'));
    navTargets.push(...stations);

    // Sort by distance from crosshair
    const targetsWithDistance = [];
    for (const target of navTargets) {
      const pos = target.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      //if (screenPos.z > 1) continue;
      const screenDistance = crosshairCenter.distanceTo(new THREE.Vector2(screenPos.x, screenPos.y));
      targetsWithDistance.push({ target, distance: screenDistance });
    }

    targetsWithDistance.sort((a, b) => a.distance - b.distance);
    this.navTargetCycle = targetsWithDistance.map(item => item.target);
    this.navCycleIndex = -1; // Will be incremented to 0 on first cycle
  }

  // Calculate lead target position for moving targets
  calculateLeadTarget() {
    if (!(this.currentTarget && this.currentTarget.isAlive())) return null;

    const ship = this.getSpaceship();
    const spaceshipPos = ship.getPosition();
    const targetPos = this.currentTarget.getPosition();

    // Get target velocity if available (for NPC ships)
    let targetVelocity = new THREE.Vector3(0, 0, 0);
    if (this.currentTarget.velocity) {
      targetVelocity = this.currentTarget.velocity.clone();
    } else if (this.currentTarget.getVelocity) {
      targetVelocity = this.currentTarget.getVelocity();
    }

    // Get player ship velocity
    let playerVelocity = new THREE.Vector3(0, 0, 0);
    if (ship && ship.velocity) {
      playerVelocity = ship.velocity.clone();
    } else if (ship && ship.getVelocity) {
      playerVelocity = ship.getVelocity();
    }

    // If neither target nor player is moving significantly, return current position
    if (targetVelocity.length() < 0.1 && playerVelocity.length() < 0.1) {
      return targetPos.clone();
    }

    // Calculate relative velocity (target velocity - player velocity)
    const relativeVelocity = targetVelocity.clone().sub(playerVelocity);

    // If relative velocity is very small, return current position
    if (relativeVelocity.length() < 0.1) {
      return targetPos.clone();
    }

    // Solve for intersection time using quadratic formula
    // We need to find when: |targetPos + targetVel*t - (spaceshipPos + playerVel*t)| = laserSpeed * t
    // This simplifies to solving: |relativePos + relativeVel*t| = laserSpeed * t
    const relativePos = targetPos.clone().sub(spaceshipPos);
    const laserSpeed = 100; // From Laser.js constructor

    // Quadratic equation: a*t^2 + b*t + c = 0
    // where: a = |relativeVel|^2 - laserSpeed^2
    //        b = 2 * relativePos.dot(relativeVel)
    //        c = |relativePos|^2
    const a = relativeVelocity.lengthSq() - laserSpeed * laserSpeed;
    const b = 2 * relativePos.dot(relativeVelocity);
    const c = relativePos.lengthSq();

    let travelTime = 0;

    if (Math.abs(a) < 0.001) {
      // Linear case: b*t + c = 0
      if (Math.abs(b) > 0.001) {
        travelTime = -c / b;
      } else {
        travelTime = relativePos.length() / laserSpeed;
      }
    } else {
      // Quadratic case
      const discriminant = b * b - 4 * a * c;
      if (discriminant >= 0) {
        const sqrtDiscriminant = Math.sqrt(discriminant);
        const t1 = (-b + sqrtDiscriminant) / (2 * a);
        const t2 = (-b - sqrtDiscriminant) / (2 * a);

        // Choose the positive time closest to zero
        if (t1 > 0 && t2 > 0) {
          travelTime = Math.min(t1, t2);
        } else if (t1 > 0) {
          travelTime = t1;
        } else if (t2 > 0) {
          travelTime = t2;
        } else {
          // Fallback to simple calculation
          travelTime = relativePos.length() / laserSpeed;
        }
      } else {
        // No real solution, fallback to simple calculation
        travelTime = relativePos.length() / laserSpeed;
      }
    }

    // Ensure travel time is positive and reasonable
    if (travelTime <= 0 || travelTime > 10) { // Max 10 seconds
      travelTime = relativePos.length() / laserSpeed;
    }

    // Predict where target will be when laser arrives
    const leadPosition = targetPos.clone().add(
      targetVelocity.clone().multiplyScalar(travelTime)
    );

    // Safety check: ensure the lead position is valid
    if (leadPosition && leadPosition.isVector3 && !isNaN(leadPosition.x) && !isNaN(leadPosition.y) && !isNaN(leadPosition.z)) {
      return leadPosition;
    }

    // Fallback to current target position if lead calculation failed
    return targetPos.clone();
  }

  // Convenience for Game orchestrator
  getCurrentCombatTarget() { return this.currentTarget; }
  getCurrentNavTarget() { return this.currentNavTarget; }
}
