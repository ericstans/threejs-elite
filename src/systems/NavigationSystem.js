import * as THREE from 'three';

/**
 * NavigationSystem handles:
 *  - Nav target proximity auto-slow (within crosshair & range)
 *  - Landing vector lock acquisition for stations (docking approach)
 */
export class NavigationSystem {
  constructor({ getSpaceship, getNavTarget, ui }) {
    this.getSpaceship = getSpaceship;
    this.getNavTarget = getNavTarget; // should return current nav target (planet or station)
    this.ui = ui;
  }

  update(deltaTime) {
    this.checkNavTargetProximity();
    this.checkLandingVectorLock();
  }

  checkNavTargetProximity() {
    const navTarget = this.getNavTarget();
    const ship = this.getSpaceship();
    if (!navTarget || !ship) return;
    const spaceshipPos = ship.getPosition();
    const targetPos = navTarget.getPosition();
    const distance = spaceshipPos.distanceTo(targetPos);
    if (distance <= 100) {
      const camera = ship.gameEngine ? ship.gameEngine.camera : null; // fallback if not passed
      // We actually need camera externally; assume navTarget has scene camera globally accessible
      // We'll rely on global THREE camera injection from game orchestrator via injected assignCamera()
      if (!this.camera) return; // camera not yet bound
      const screenPos = targetPos.clone();
      screenPos.project(this.camera);
      if (screenPos.z <= 1 && Math.abs(screenPos.x) < 0.1 && Math.abs(screenPos.y) < 0.1) {
        ship.setThrottle(0);
      }
    }
  }

  assignCamera(camera) { this.camera = camera; }

  checkLandingVectorLock() {
    const navTarget = this.getNavTarget();
    const ship = this.getSpaceship();
    if (!navTarget || !ship) return;
    if (!ship.getFlag('dockingAuthorized') || ship.getFlag('landingVectorLocked')) return;
    if (!navTarget.getLandingVectorStartWorld) return; // ensure station
    const station = navTarget;
    const start = station.getLandingVectorStartWorld();
    const dir = station.getLandingVectorDirectionWorld();
    const length = station.getLandingVectorLength();
    const shipPos = ship.getPosition();
    const toShip = shipPos.clone().sub(start);
    const proj = toShip.dot(dir);
    if (proj < 0 || proj > length) return;
    const closestPoint = start.clone().add(dir.clone().multiplyScalar(proj));
    const radialDist = shipPos.distanceTo(closestPoint);
    const LANDING_VECTOR_CAPTURE_FACTOR = 0.30;
    const tolerance = station.size * LANDING_VECTOR_CAPTURE_FACTOR;
    if (radialDist < tolerance) {
      ship.lockToStation(station);
      this.ui.updateDockingStatus('LANDING VECTOR ACQUIRED');
      // console.log('Landing vector lock achieved (NavigationSystem).');
    }
  }
}