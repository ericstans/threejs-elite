import { PlanetDockingSystem } from './docking/PlanetDockingSystem.js';
import { StationDockingSystem } from './docking/StationDockingSystem.js';

/**
 * ShipDockingSystem coordinates docking operations for both planets and space stations.
 * It delegates to specialized subsystems for each type of docking.
 */
export class ShipDockingSystem {
  constructor(ship) {
    this.ship = ship;

    // Delegate to specialized docking systems
    this.planetDocking = new PlanetDockingSystem(ship);
    this.stationDocking = new StationDockingSystem(ship);
  }

  /**
   * Updates docking speed when ship's max speed changes (e.g., equipment upgrades)
   */
  updateDockingSpeed() {
    this.planetDocking.updateDockingSpeed();
  }

  /**
   * Start docking sequence with a planet
   */
  startDocking(targetPlanet) {
    this.planetDocking.startDocking(targetPlanet);
  }

  /**
   * Update docking animation during planet landing
   */
  updateDocking(deltaTime) {
    this.planetDocking.updateDocking(deltaTime);
  }

  /**
   * Start takeoff sequence from a planet
   */
  startPlanetTakeoff(planet, scene) {
    this.planetDocking.startTakeoff(planet, scene);
  }

  /**
   * Start takeoff sequence from a space station
   */
  startStationTakeoff(station, scene) {
    this.stationDocking.startTakeoff(station, scene);
  }

  /**
   * Update takeoff animation
   * Returns true if takeoff is active and handled, false otherwise
   */
  updateTakeoff(deltaTime) {
    // Try planet takeoff first, then station takeoff
    if (this.planetDocking.updateTakeoff(deltaTime)) {
      return true;
    }
    if (this.stationDocking.updateTakeoff(deltaTime)) {
      return true;
    }
    return false;
  }

  /**
   * Update station landing vector lock and alignment
   * Returns true if landing vector is active and handled, false otherwise
   */
  updateLandingVector(deltaTime) {
    return this.stationDocking.updateLandingVector(deltaTime);
  }

  /**
   * Update docked state (planet or station)
   * Returns true if docked and handled, false otherwise
   */
  updateDockedState() {
    // Try station docking state first, then planet docking state
    if (this.stationDocking.updateDockedState()) {
      return true;
    }
    if (this.planetDocking.updateDockedState()) {
      return true;
    }
    return false;
  }

  /**
   * Handle final turnaround phase during station docking
   * Returns true if final turn is active and handled, false otherwise
   */
  updateFinalTurn(deltaTime) {
    return this.stationDocking.updateFinalTurn(deltaTime);
  }

  // Getters and setters for planet docking state
  get dockingTarget() {
    return this.planetDocking.dockingTarget;
  }

  set dockingTarget(value) {
    this.planetDocking.dockingTarget = value;
  }

  get dockingPosition() {
    return this.planetDocking.dockingPosition;
  }

  get takeoffActive() {
    return this.planetDocking.takeoffActive || this.stationDocking.takeoffActive;
  }

  get landingPhase() {
    return this.planetDocking.landingPhase;
  }

  // Getters and setters for station docking state
  get dockedStation() {
    return this.stationDocking.dockedStation;
  }

  set dockedStation(value) {
    this.stationDocking.dockedStation = value;
  }

  get landingVectorStation() {
    return this.stationDocking.landingVectorStation;
  }

  set landingVectorStation(value) {
    this.stationDocking.landingVectorStation = value;
  }

  get landingVectorAlongDistance() {
    return this.stationDocking.landingVectorAlongDistance;
  }

  set landingVectorAlongDistance(value) {
    this.stationDocking.landingVectorAlongDistance = value;
  }

  get insertionInProgress() {
    return this.stationDocking.insertionInProgress;
  }

  get rotationLockTweenInProgress() {
    return this.stationDocking.rotationLockTweenInProgress;
  }

  get finalTurnInProgress() {
    return this.stationDocking.finalTurnInProgress;
  }

  get dockingProgress() {
    return this.planetDocking.dockingProgress;
  }

  set dockingProgress(value) {
    this.planetDocking.dockingProgress = value;
  }

  get dockingSpeed() {
    return this.planetDocking.dockingSpeed;
  }

  get landingVectorHoldOffset() {
    return this.stationDocking.landingVectorHoldOffset;
  }

  set landingVectorHoldOffset(value) {
    this.stationDocking.landingVectorHoldOffset = value;
  }

  get landingVectorLocalOffset() {
    return this.stationDocking.landingVectorLocalOffset;
  }

  set landingVectorLocalOffset(value) {
    this.stationDocking.landingVectorLocalOffset = value;
  }

  /**
   * Complete the takeoff sequence
   */
  completeTakeoff() {
    this.ship.flags.isDocking = false;
    this.ship.flags.isDocked = false;
    this.ship.flags.firingEnabled = true;
    this.planetDocking.landingPhase = null;
    this.ship.resetSpeedHistory();
  }
}
