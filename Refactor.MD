# Refactor Strategy (Captured)

Date: 2025-09-04

## Goals
- Shrink `Game` class to orchestration only.
- Isolate responsibilities (camera, targeting, combat, navigation/docking, environment setup, comms, audio interplay).
- Make each subsystem testable and replaceable.
- Reduce cross-cutting UI side-effects scattered in logic.

## Current Responsibility Buckets in `main.js`
1. World / environment creation (stardust, asteroid field, station orbit).
2. Third‑person model + camera calibration + orbit input.
3. Target acquisition (asteroids, planets), target info updates, homing cone coloring.
4. Navigation target proximity slowdown + landing vector lock checks.
5. Docking status to UI (alignment, rotation, completion).
6. Weapon firing: shootLaser, laser pool/list, collision checks, explosions, hit FX, crosshair blink.
7. Engine audio gating (dock/undock).
8. Comms open/close + dialog option routing.
9. General per-frame orchestration (update loop).

## Proposed Module / System Layout (`src/systems/`)
- `EnvironmentSystem.js` (asteroid field + stardust + station orbit tick)
- `CameraController.js` (third-person offsets, orbit angles, auto-follow)
- `ThirdPersonController.js` (optional; could merge with CameraController)
- `TargetingSystem.js` (find nearest asteroid/planet, updateTargetInfo, updateNavTargetInfo, homing cone state)
- `NavigationSystem.js` (nav target proximity auto-slow, landing vector lock checks)
- `DockingManager.js` (UI docking status transitions; possibly merge with NavigationSystem)
- `CombatSystem.js` (shootLaser, laser array, collisions, explosions, crosshair blink callback)
- `AudioStateSystem.js` (engine rumble dock/undock gating)
- `CommsSystem.js` (open/close comms, dialog option handling)
- (Optional) `EffectsSystem.js` (explosions + spatial hits if expanded later)

Existing kept: `Spaceship`, `Controls`, `SoundManager`, `MusicManager`, `ConversationSystem`, `UI`, `GameEngine`.

## Responsibility Reassignments
| Current Logic | New Owner |
|---------------|-----------|
| createAsteroidField / stardust | EnvironmentSystem |
| Station orbit update | EnvironmentSystem |
| Third-person toggle + orbit math | CameraController |
| Calibrate camera + model sizing | CameraController |
| targetNearestAsteroid / targetNearestPlanet | TargetingSystem |
| updateTargetInfo / updateNavTargetInfo | TargetingSystem |
| Homing cone color change | TargetingSystem |
| checkNavTargetProximity | NavigationSystem |
| checkLandingVectorLock | NavigationSystem (or DockingManager) |
| Docking status UI text updates | DockingManager |
| shootLaser / updateLasers / checkCollisions / explosions / blink | CombatSystem |
| Engine rumble dock/undock gating | AudioStateSystem |
| Comms open/close & options | CommsSystem |

## Data & Dependency Flow
Pass only what each system needs (avoid handing full `Game`).

Examples:
```
new CombatSystem({ scene, soundManager, ui, gameEngine, spaceship });
new TargetingSystem({ camera, ui, soundManager, spaceship, entities });
new CameraController({ camera, spaceship });
new AudioStateSystem({ soundManager, spaceship });
```

Prefer returning state objects:
```
const { homingActive } = targeting.update(dt);
ui.setHomingConeState(homingActive);
```

## Incremental Refactor Plan (Low Risk Order)
1. Extract `CombatSystem` (laser + collisions mostly self-contained).
2. Extract `CameraController` (orbit + follow math & event handlers).
3. Extract `TargetingSystem` (selection + info update + homing state).
4. Extract `AudioStateSystem` (engine rumble gating block).
5. Extract `NavigationSystem` (nav proximity + landing vector).
6. Extract `DockingManager` (UI status updates) – or merge into Navigation.
7. Extract `EnvironmentSystem` (creation + per-frame rotation/orbit).
8. (Optional) `CommsSystem` once ready.

Commit style:
```
chore(combat): extract laser & collision logic to CombatSystem
chore(camera): move third-person / orbit logic to CameraController
```

## Refactored `Game.update` Sketch
```
update(dt) {
  controls.update(dt);
  spaceship.update(dt);
  environment.update(dt);
  const navState = navigation.update(dt);
  const targetingState = targeting.update(dt);
  combat.update(dt);
  audioState.update(dt);
  camera.update(dt);
  docking.update(dt); // if separate
  ui.sync({
    targetingState,
    dockingFlags: spaceship.flags,
    throttle: spaceship.getThrottle(),
    speed: spaceship.getSpeed()
  });
}
```

## Crosshair Blink Handling
`CombatSystem` emits `onHit` callback -> `Game` calls `ui.blinkCrosshairRed()`.

## Event Handling vs Polling
Start with polling; later introduce event emitter for `targetChanged`, `navTargetChanged`, `dockingStateChanged`, `laserHit`.

## Naming & Consistency Guidelines
- Use verbs for methods (`update`, `beginTakeoff`, `configure`).
- Keep side-effects near boundaries (UI + Audio only).
- No system mutates another system directly; use spaceship or callbacks.

## Risk & Mitigation
| Risk | Mitigation |
|------|------------|
| Hidden `this` dependencies break | Pass explicit deps via constructors |
| UI regressions | Wrap UI changes in dedicated UI methods |
| Circular dependencies | Keep unidirectional flow; no system imports another system’s internals |
| Drift between docking flags and manager | Spaceship remains single source of truth |

## Suggested First Extraction
`CombatSystem` (shootLaser + lasers list + explosions + checkCollisions + crosshair blink trigger).

---

(End of captured plan. Update this file if strategy changes.)
