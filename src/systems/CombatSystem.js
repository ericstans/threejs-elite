import * as THREE from 'three';
import { Laser } from '../Laser.js';
import { Explosion } from '../Explosion.js';
import { Resource } from '../Resource.js';

/**
 * CombatSystem encapsulates laser firing, projectile & explosion lifecycles,
 * collision detection (asteroids + NPC ship), and hit feedback callbacks.
 *
 * Dependencies are passed in so main.js can stay slimmer:
 *  - gameEngine: for adding/removing entities & spatial sounds
 *  - soundManager: for playing non-spatial SFX (laser fire)
 *  - ui: (optional) for direct feedback like crosshair blink (kept optional via callback)
 *  - getSpaceship(): function returning active spaceship (for position/rotation)
 *  - getCurrentTarget(): function returning current target (auto-aim + damage refresh)
 *  - onRequestTargetInfoUpdate(): function invoked when target info should refresh (after damage)
 *  - getNPCShip(): returns NPC ship instance if present
 *  - getAsteroids(): returns array of asteroid entities
 *  - onHitFeedback(): optional callback executed on every successful laser hit
 */
export class CombatSystem {
  constructor({
    gameEngine,
    soundManager,
    ui, // kept only for optional direct blink; prefer onHitFeedback
    getSpaceship,
    getCurrentTarget,
    onRequestTargetInfoUpdate,
    getNPCShip,
    getAsteroids,
    onHitFeedback,
    onNPCShipDestroyed,
    environmentSystem // optional, used for marking destroyed asteroids for procedural diff
  }) {
    this.gameEngine = gameEngine;
    this.soundManager = soundManager;
    this.ui = ui;
    this.getSpaceship = getSpaceship;
    this.getCurrentTarget = getCurrentTarget;
    this.onRequestTargetInfoUpdate = onRequestTargetInfoUpdate;
    this.getNPCShip = getNPCShip;
    this.getAsteroids = getAsteroids;
    this.onHitFeedback = onHitFeedback;
    this.onNPCShipDestroyed = onNPCShipDestroyed;
    // Accept either direct instance or function returning instance
    this.environmentSystem = typeof environmentSystem === 'function' ? { markAsteroidDestroyed: (a)=>environmentSystem()?.markAsteroidDestroyed(a) } : environmentSystem;

    this.lasers = [];
    this.explosions = [];
  }

  shootLaser() {
    const ship = this.getSpaceship();
    if (!ship) return;

    // Get spaceship position and forward direction
    const spaceshipPos = ship.getPosition();
    const spaceshipRot = ship.getRotation();

    // Calculate forward direction from spaceship rotation
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(spaceshipRot);

    // Auto-aim towards current target within 10 degrees
    let laserDirection = forward;
    const currentTarget = this.getCurrentTarget?.();
    if (currentTarget && currentTarget.isAlive()) {
      const targetPos = currentTarget.getPosition();
      const targetDirection = targetPos.clone().sub(spaceshipPos).normalize();
      const angle = forward.angleTo(targetDirection);
      const maxAngle = Math.PI / 18; // 10 degrees
      if (angle <= maxAngle) {
        laserDirection = targetDirection;
      }
    }

    const laserStartPos = spaceshipPos.clone().add(forward.clone().multiplyScalar(2));

    const laser = new Laser(laserStartPos, laserDirection);
    this.lasers.push(laser);
    this.gameEngine.addEntity(laser);
    this.soundManager.playLaserSound();
  }

  update(deltaTime) {
    this.updateLasers(deltaTime);
    this.updateExplosions(deltaTime);
    this.checkCollisions();
  }

  updateLasers(deltaTime) {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      const shouldDestroy = laser.update(deltaTime);
      if (shouldDestroy) {
        this.gameEngine.removeEntity(laser);
        this.lasers.splice(i, 1);
      }
    }
  }

  updateExplosions(deltaTime) {
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const explosion = this.explosions[i];
      const shouldDestroy = explosion.update(deltaTime);
      if (shouldDestroy) {
        this.gameEngine.removeEntity(explosion);
        this.explosions.splice(i, 1);
      }
    }
  }

  checkCollisions() {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      let hit = false;
      // Asteroids
      const asteroids = this.getAsteroids?.() || [];
      for (let j = asteroids.length - 1; j >= 0; j--) {
        const asteroid = asteroids[j];
        if (!asteroid.isAlive()) continue;
        const distance = laser.getPosition().distanceTo(asteroid.getPosition());
        const collisionRadius = asteroid.getSize() + 0.1;
        if (distance < collisionRadius) {
          this.handleLaserAsteroidCollision(laser, asteroid, i, j, asteroids);
          hit = true;
          break;
        }
      }
      if (hit) continue;
      // NPC ship
      const npc = this.getNPCShip?.();
      if (npc && npc.loaded && npc.isAlive()) {
        const npcPos = npc.getWorldPosition();
        const npcRadius = npc.getSize() + 0.1;
        const distance = laser.getPosition().distanceTo(npcPos);
        if (distance < npcRadius) {
          this.handleLaserNPCShipCollision(laser, npc, i);
          continue;
        }
      }
    }
  }

  handleLaserAsteroidCollision(laser, asteroid, laserIndex, asteroidIndex, asteroidsArray) {
    this._hitFeedback();
    this.gameEngine.removeEntity(laser);
    this.lasers.splice(laserIndex, 1);
    const wasDestroyed = asteroid.takeDamage(1);
    if (wasDestroyed) {
      const explosion = new Explosion(asteroid.getPosition(), asteroid.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      this.gameEngine.createSpatialExplosion(asteroid.getPosition());

      // Spawn resources when asteroid is destroyed
      this.spawnResources(asteroid.getPosition());

      this.gameEngine.removeEntity(asteroid);
      asteroidsArray.splice(asteroidIndex, 1);
      this.environmentSystem?.markAsteroidDestroyed(asteroid);
    } else {
      const hitPosition = asteroid.getPosition().clone();
      hitPosition.x += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.y += (Math.random() - 0.5) * asteroid.getSize();
      hitPosition.z += (Math.random() - 0.5) * asteroid.getSize();
      const explosion = new Explosion(hitPosition, 0.3, 0.3);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      this.gameEngine.createSpatialLaserHit(hitPosition);
    }
  }

  handleLaserNPCShipCollision(laser, npcShip, laserIndex) {
    this._hitFeedback();
    this.gameEngine.removeEntity(laser);
    this.lasers.splice(laserIndex, 1);

    const laserStart = laser.getPosition();
    const laserDir = laser.direction.clone().normalize();
    const sphereCenter = npcShip.getWorldPosition();
    const sphereRadius = npcShip.getSize();

    const toCenter = sphereCenter.clone().sub(laserStart);
    const tProj = toCenter.dot(laserDir);
    let hitPosition = laserStart.clone().add(laserDir.clone().multiplyScalar(tProj));
    const distToCenter = hitPosition.distanceTo(sphereCenter);
    if (distToCenter > sphereRadius) {
      hitPosition = sphereCenter.clone().add(
        hitPosition.clone().sub(sphereCenter).normalize().multiplyScalar(sphereRadius)
      );
    }

    const wasDestroyed = npcShip.takeDamage(1);

    if (!wasDestroyed && this.getCurrentTarget?.() && this.getCurrentTarget().getId && this.getCurrentTarget().getId() === 'npcship') {
      this.onRequestTargetInfoUpdate?.();
    }

    if (wasDestroyed) {
      const explosion = new Explosion(hitPosition, npcShip.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      this.gameEngine.createSpatialExplosion(hitPosition);
      const current = this.getCurrentTarget?.();
      if (current && current.getId && current.getId() === 'npcship') {
        this.onNPCShipDestroyed?.();
      }
    } else {
      const explosion = new Explosion(hitPosition, 0.3, 0.3);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      this.gameEngine.createSpatialLaserHit(hitPosition);
    }
  }

  spawnResources(asteroidPosition) {
    // Spawn 0-4 resources in a small group
    const resourceCount = Math.floor(Math.random() * 5); // 0-4 resources

    for (let i = 0; i < resourceCount; i++) {
      // Create a small cluster around the asteroid position
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 4, // Random X offset within 4 units
        (Math.random() - 0.5) * 4, // Random Y offset within 4 units
        (Math.random() - 0.5) * 4  // Random Z offset within 4 units
      );

      const resourcePosition = asteroidPosition.clone().add(offset);
      const elementType = Resource.getRandomElementType();
      const resource = new Resource(resourcePosition, elementType);

      // Add resource to the game engine
      this.gameEngine.addEntity(resource);
    }
  }

  _hitFeedback() {
    if (this.onHitFeedback) {
      this.onHitFeedback();
    } else if (this.ui && this.ui.blinkCrosshairRed) {
      this.ui.blinkCrosshairRed();
    }
  }
}
