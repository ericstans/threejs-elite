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
 *  - getNPCShips(): returns array of NPC ship instances
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
    getNPCShips,
    getAsteroids,
    onHitFeedback,
    onNPCShipHit,
    onNPCShipDestroyed,
    environmentSystem // optional, used for marking destroyed asteroids for procedural diff
  }) {
    this.gameEngine = gameEngine;
    this.soundManager = soundManager;
    this.ui = ui;
    this.getSpaceship = getSpaceship;
    this.getCurrentTarget = getCurrentTarget;
    this.onRequestTargetInfoUpdate = onRequestTargetInfoUpdate;
    this.getNPCShips = getNPCShips;
    this.getAsteroids = getAsteroids;
    this.onHitFeedback = onHitFeedback;
    this.onNPCShipHit = onNPCShipHit;
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

    // Auto-aim towards current target within 10 degrees AND within range
    let laserDirection = forward.clone(); // Clone to avoid modifying the original
    const currentTarget = this.getCurrentTarget?.();

    if (currentTarget && currentTarget.isAlive()) {
      const targetPos = currentTarget.getPosition();
      const distance = spaceshipPos.distanceTo(targetPos);
      const laserRange = 300; // Match the range from TargetUI.js

      // Only apply auto-aim if target is within range
      if (distance <= laserRange) {
        const targetDirection = targetPos.clone().sub(spaceshipPos).normalize();
        const angle = forward.angleTo(targetDirection);
        const maxAngle = Math.PI / 18; // 10 degrees
        if (angle <= maxAngle) {
          // Use lead targeting for moving targets
          const leadPos = this.calculateLeadTarget(currentTarget, spaceshipPos);
          if (leadPos) {
            const leadDirection = leadPos.clone().sub(spaceshipPos).normalize();
            laserDirection = leadDirection;
          }
        }
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
      // NPC ships
      const npcShips = this.getNPCShips?.() || [];
      for (let j = 0; j < npcShips.length; j++) {
        const npc = npcShips[j];
        if (npc && npc.loaded && npc.isAlive()) {
          const npcPos = npc.getWorldPosition();
          const npcRadius = npc.getSize() + 0.1;
          const distance = laser.getPosition().distanceTo(npcPos);
          if (distance < npcRadius) {
            this.handleLaserNPCShipCollision(laser, npc, i);
            hit = true;
            break;
          }
        }
      }
      if (hit) continue;
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
    this.onNPCShipHit?.(); // Trigger soundtrack change to combat

    // Set the NPC ship as hostile when attacked
    if (npcShip.setNPCFlag) {
      npcShip.setNPCFlag('isHostile', true);
    }

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

    if (!wasDestroyed && this.getCurrentTarget?.() && this.getCurrentTarget().getId && this.getCurrentTarget().getId().startsWith('npcship')) {
      this.onRequestTargetInfoUpdate?.();
    }

    if (wasDestroyed) {
      const explosion = new Explosion(hitPosition, npcShip.getSize() * 2, 1.0);
      this.explosions.push(explosion);
      this.gameEngine.addEntity(explosion);
      this.gameEngine.createSpatialExplosion(hitPosition);
      const current = this.getCurrentTarget?.();
      if (current && current.getId && current.getId().startsWith('npcship')) {
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

  // Calculate lead target position for moving targets
  calculateLeadTarget(target, spaceshipPos) {
    if (!target || !target.getPosition) {
      return null;
    }

    const targetPos = target.getPosition();

    // Get target velocity if available (for NPC ships)
    let targetVelocity = new THREE.Vector3(0, 0, 0);
    if (target.velocity) {
      targetVelocity = target.velocity.clone();
    } else if (target.getVelocity) {
      targetVelocity = target.getVelocity();
    }

    // Get player ship velocity
    const ship = this.getSpaceship();
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

  _hitFeedback() {
    if (this.onHitFeedback) {
      this.onHitFeedback();
    } else if (this.ui && this.ui.blinkCrosshairRed) {
      this.ui.blinkCrosshairRed();
    }
  }
}
