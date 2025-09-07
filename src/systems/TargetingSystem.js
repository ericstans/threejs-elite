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
    getNPCShip,
    getPlanets,
    getStation,
    getResources
  }) {
    this.camera = camera;
    this.ui = ui;
    this.soundManager = soundManager;
    this.getSpaceship = getSpaceship;
    this.getAsteroids = getAsteroids;
    this.getNPCShip = getNPCShip;
    this.getPlanets = getPlanets;
    this.getStation = getStation;
    this.getResources = getResources;

    this.currentTarget = null;      // combat target (asteroid / npc ship)
    this.currentNavTarget = null;   // nav target (planet / station)
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
    const npc = this.getNPCShip?.();
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
          getPosition: () => meshCenter,
          isAlive: () => npc.isAlive(),
          setTargeted: (v) => { npc.mesh.userData.targeted = v; },
          getId: () => 'npcship',
          getName: () => 'Derelict Cruiser',
          getMass: () => 1000,
          getHealth: () => npc.getHealth(),
          getMaxHealth: () => npc.getMaxHealth(),
          isCommable: true,
          getType: () => 'npcship',
          previewSource: npc.mesh // supply full mesh hierarchy for preview underlay
        });
      }
    }
    let closest = null;
    let closestScreenDistance = Infinity;
    for (const obj of targetables) {
      if (!obj.isAlive()) continue;
      const pos = obj.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      if (screenPos.z > 1) continue;
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
    return angle <= maxAngle;
  }

  // --- Nav Targeting ---
  targetNearestNav({ blockIfDockingFlags } = { blockIfDockingFlags: true }) {
    const ship = this.getSpaceship();
    if (!ship) return;
    if (blockIfDockingFlags && (ship.flags.isDocked || ship.flags.isDocking || ship.flags.landingVectorLocked)) return;

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
    const station = this.getStation?.();
    if (station) navTargets.push(station);

    let closest = null;
    let closestScreenDistance = Infinity;
    for (const target of navTargets) {
      const pos = target.getPosition();
      const screenPos = pos.clone();
      screenPos.project(camera);
      if (screenPos.z > 1) continue;
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
      const distance = spaceshipPos.distanceTo(targetPos);
      this.ui.updateNavTargetInfo({
        id: this.currentNavTarget.getId(),
        name: this.currentNavTarget.getName(),
        mass: this.currentNavTarget.getMass(),
        distance,
        isCommable: this.currentNavTarget.isCommable,
        __ref: this.currentNavTarget
      }, targetPos, this.camera);
    } else {
      this.ui.clearNavTargetInfo();
    }
  }

  // Convenience for Game orchestrator
  getCurrentCombatTarget() { return this.currentTarget; }
  getCurrentNavTarget() { return this.currentNavTarget; }
}
