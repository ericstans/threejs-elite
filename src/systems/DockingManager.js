/**
 * DockingManager centralizes docking-related UI status updates and state transitions.
 * Responsibilities:
 *  - React to conversation flag changes relevant to docking (authorization, docking start)
 *  - Show/Hide docking status text
 *  - Update status messages (alignment lock, rotation lock, docking complete)
 *  - Fail-safe visibility of landing vector when authorized
 */
export class DockingManager {
  constructor({ ui, getSpaceship, getNavTarget, clearCombatTarget }) {
    this.ui = ui;
    this.getSpaceship = getSpaceship;
    this.getNavTarget = getNavTarget; // station or planet nav target
    this.clearCombatTarget = clearCombatTarget; // function to clear combat target & UI
  }

  processFlags(flags) {
    const ship = this.getSpaceship();
    if (!ship) return;
    if (flags.player) {
      for (const [flagName, value] of Object.entries(flags.player)) {
        ship.setFlag(flagName, value);
        if (flagName === 'isDocking' && value === true) {
          this.startDockingProcess();
        }
        if (flagName === 'dockingAuthorized' && value === true) {
          this.ui.showDockingStatus();
          this.ui.updateDockingStatus('AUTHORIZED -- PROCEED TO LANDING VECTOR');
          const nav = this.getNavTarget();
          if (nav && nav.setLandingVectorVisible) nav.setLandingVectorVisible(true);
        }
      }
    }
  }

  startDockingProcess() {
    const nav = this.getNavTarget();
    const ship = this.getSpaceship();
    if (!nav) return;
    // Clear combat target when docking (but keep nav target)
    this.clearCombatTarget?.();
    this.ui.showDockingStatus();
    ship.startDocking(nav);
    // console.log('Docking process started with', nav.getName());
  }

  update(_deltaTime) {
    const ship = this.getSpaceship();
    const nav = this.getNavTarget();
    if (!ship) return;
    // Alignment / rotation status
    if (ship.getFlag('landingVectorLocked') && ship.getFlag('landingAlignmentLocked') && this.ui.dockingStatus.textContent !== 'ALIGNMENT LOCK ACQUIRED') {
      ship.setFlag('firingEnabled', false); // disable firing when alignment lock achieved
      this.ui.updateDockingStatus('ALIGNMENT LOCK ACQUIRED');
    }
    if (ship.getFlag('rotationLockAcquired') && this.ui.dockingStatus.textContent !== 'ROTATION LOCK ACQUIRED') {
      this.ui.updateDockingStatus('ROTATION LOCK ACQUIRED');
    }
    if (ship.flags.stationDocked && this.ui.dockingStatus.textContent !== 'DOCKING COMPLETE') {
      this.ui.updateDockingStatus('DOCKING COMPLETE');
    }
    // Fail-safe vector visibility
    if (ship.getFlag('dockingAuthorized') && !ship.getFlag('landingAlignmentLocked') && nav && nav.setLandingVectorVisible) {
      nav.setLandingVectorVisible(true);
    }
    // Docking completion
    if (ship.flags.isDocked && ship.dockingProgress === 1) {
      this.ui.updateDockingStatus('DOCKING COMPLETE');
      this.ui.hideDockingStatus();
    }
  }
}
