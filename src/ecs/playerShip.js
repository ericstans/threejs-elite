import * as THREE from 'three';
import { Position, Velocity, Orientation, AngularVelocity } from './components.js';

// Additional ad-hoc components (kept local to avoid broad churn yet)
export function ShipControl({ maxSpeed=10, acceleration=2, rotationSpeed=1, maxThrottle=1 }={}) {
  return { maxSpeed, acceleration, rotationSpeed, maxThrottle, throttle:0 };
}
export function Flags() { return { flags: { firingEnabled:true, isDocking:false, isDocked:false } }; }
export function DockingState() {
  return {
    dockingTarget:null,
    dockingProgress:0,
    dockingSpeed:10,
    dockingPosition:new THREE.Vector3(),
    dockingRotation:new THREE.Quaternion()
  };
}

// Factory to create an ECS player ship entity + a facade API mirroring prior Spaceship surface used by other systems.
export function createPlayerShip(registry, scene) {
  const id = registry.createEntity();
  registry.addComponent(id,'Position', Position(0,0,0));
  registry.addComponent(id,'Velocity', Velocity(0,0,0));
  registry.addComponent(id,'Orientation', Orientation());
  registry.addComponent(id,'AngularVelocity', AngularVelocity(0,0,0));
  registry.addComponent(id,'ShipControl', ShipControl({}));
  registry.addComponent(id,'Flags', Flags());
  registry.addComponent(id,'DockingState', DockingState());

  // Minimal mesh (reuse old cockpit shape style)
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.ConeGeometry(0.3,2,8), new THREE.MeshLambertMaterial({ color:0x666666, flatShading:true }));
  body.rotation.x = Math.PI/2; group.add(body);
  const wingGeom = new THREE.BoxGeometry(1.5,0.1,0.3);
  const matWing = new THREE.MeshLambertMaterial({ color:0x444444, flatShading:true });
  const leftWing = new THREE.Mesh(wingGeom, matWing); leftWing.position.set(-0.5,0,0); group.add(leftWing);
  const rightWing = new THREE.Mesh(wingGeom, matWing); rightWing.position.set(0.5,0,0); group.add(rightWing);
  if (scene) scene.add(group);
  registry.addComponent(id,'Renderable', { mesh: group });

  // Facade API (subset)
  const api = {
    id,
    get position() { return registry.getComponent(id,'Position').position; },
    get velocity() { return registry.getComponent(id,'Velocity').velocity; },
    get angularVelocity() { return registry.getComponent(id,'AngularVelocity').angularVelocity; },
    get quaternion() { return registry.getComponent(id,'Orientation').quaternion; },
    get flags() { return registry.getComponent(id,'Flags').flags; },
    // Cockpit mesh (legacy first-person placeholder)
    mesh: group,
    // Third-person support (mirrors legacy API enough for main.js)
    thirdPersonGroup: new THREE.Group(),
    thirdPersonLoaded: false,
    thirdPersonMode: false,
    thirdPersonVisualOffset: null,
    thirdPersonModelSize: null,
  // Docking / station landing vector state (ported from legacy class)
  landingVectorStation: null,
  landingVectorLocalOffset: null,
  landingVectorAlongDistance: 0,
  landingVectorAlignRate: 20,
  rotationAlignDelay: 4.0,
  rotationAlignTimer: 0,
  rotationTargetQuaternion: null,
  rotationSlerpSpeed: 2.0,
  postRotationTimer: 0,
  autoInsertionDelay: 2.0,
  insertionInProgress: false,
  insertionSpeed: 2.0,
  insertionTargetLocal: new THREE.Vector3(0,0,0),
  insertionTargetAlong: null,
  finalTurnInProgress: false,
  finalTurnTimer: 0,
  finalTurnDuration: 4.0,
  finalTurnStartQuat: new THREE.Quaternion(),
  finalTurnTargetQuat: new THREE.Quaternion(),
  dockedStation: null,
  dockedLocalOffset: null,
  dockedRelativeQuat: null,
  // Planet takeoff placeholders
  takeoffActive: false,
  takeoffTimer: 0,
  takeoffDuration: 5.0,
  takeoffStartPos: new THREE.Vector3(),
  takeoffTargetPos: new THREE.Vector3(),
  takeoffPlanet: null,
  takeoffLocalStart: new THREE.Vector3(),
  takeoffLocalTarget: new THREE.Vector3(),
  takeoffSceneParent: null,
  takeoffBaseQuat: new THREE.Quaternion(),
    pitch(amount) { this.angularVelocity.x += amount * registry.getComponent(id,'ShipControl').rotationSpeed; },
    yaw(amount) { this.angularVelocity.y += amount * registry.getComponent(id,'ShipControl').rotationSpeed; },
    roll(amount) { this.angularVelocity.z += amount * registry.getComponent(id,'ShipControl').rotationSpeed; },
    setThrottle(v) { const sc = registry.getComponent(id,'ShipControl'); sc.throttle = Math.max(0, Math.min(sc.maxThrottle, v)); },
    getThrottle() { return registry.getComponent(id,'ShipControl').throttle; },
  get maxSpeed() { return registry.getComponent(id,'ShipControl').maxSpeed; },
  get acceleration() { return registry.getComponent(id,'ShipControl').acceleration; },
  get rotationSpeed() { return registry.getComponent(id,'ShipControl').rotationSpeed; },
    getSpeed() { return this.velocity.length(); },
    getSpeedPerMinute() { return this.getSpeed()*60; },
    getSpeedPercentage() { const sc = registry.getComponent(id,'ShipControl'); return Math.min(this.getSpeed()/sc.maxSpeed,1); },
    getPosition() { return this.position.clone(); },
    getRotation() { return new THREE.Euler().setFromQuaternion(this.quaternion); },
    setFlag(name,val){ this.flags[name]=val; },
    getFlag(name){ return !!this.flags[name]; },
    hasFlag(name){ return Object.prototype.hasOwnProperty.call(this.flags,name) && !!this.flags[name]; },
    getAllFlags(){ return { ...this.flags }; },
    enableThirdPerson(modelRoot) {
      if (modelRoot && !this.thirdPersonLoaded) {
        this.thirdPersonGroup.add(modelRoot);
        this.thirdPersonLoaded = true;
      }
      this.thirdPersonMode = true;
    },
    disableThirdPerson() { this.thirdPersonMode = false; },
    toggleThirdPerson() { this.thirdPersonMode = !this.thirdPersonMode; },
    syncThirdPerson() {
      if (!this.thirdPersonMode) return;
      const basePos = this.position.clone();
      if (this.thirdPersonVisualOffset) {
        const rotated = this.thirdPersonVisualOffset.clone().applyQuaternion(this.quaternion);
        basePos.add(rotated);
      }
      this.thirdPersonGroup.position.copy(basePos);
      this.thirdPersonGroup.quaternion.copy(this.quaternion);
    },
    startDocking(targetPlanet){
      const dock = registry.getComponent(id,'DockingState');
      const scFlags = this.flags;
      scFlags.isDocking = true; scFlags.firingEnabled = false;
      dock.dockingTarget = targetPlanet;
      dock.dockingProgress = 0;
      // simple planet docking copy from legacy version (random equator point)
      const planetPos = targetPlanet.getPosition();
      const planetRadius = targetPlanet.radius || targetPlanet.getRadius?.() || 50;
      const angle = Math.random()*Math.PI*2;
      const landingPoint = new THREE.Vector3(Math.cos(angle)*planetRadius, 0, Math.sin(angle)*planetRadius);
      dock.dockingPosition.copy(landingPoint);
      const directionToPlanet = landingPoint.clone().normalize().negate();
      dock.dockingRotation.setFromUnitVectors(new THREE.Vector3(0,-1,0), directionToPlanet);
  },
    lockToStation(station) {
      // Minimal port of legacy lockToStation
      this.flags.landingVectorLocked = true;
      this.velocity.set(0,0,0);
      this.angularVelocity.set(0,0,0);
      this.landingVectorStation = station;
      const worldPosAtLock = this.position.clone();
      this.landingVectorLocalOffset = station.mesh.worldToLocal(worldPosAtLock.clone());
      const start = station.getLandingVectorStartWorld();
      const dir = station.getLandingVectorDirectionWorld();
      this.landingVectorAlongDistance = worldPosAtLock.clone().sub(start).dot(dir);
      const desiredForward = dir.clone().negate();
      const currentForward = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion);
      const q = new THREE.Quaternion().setFromUnitVectors(currentForward.normalize(), desiredForward.normalize());
      this.quaternion.premultiply(q);
    },
  // Legacy no-op update (ECS systems handle movement)
    update(){
      // Planet docking progression (simplified from legacy updateDocking)
      const dock = registry.getComponent(id,'DockingState');
      if (this.flags.isDocking && dock.dockingTarget && !this.flags.isDocked) {
        // If ship still moving noticeably wait (use velocity magnitude)
        if (this.velocity.length() <= 0.1) {
          const planetPos = dock.dockingTarget.getPosition();
          const targetWorldPosition = planetPos.clone().add(dock.dockingPosition);
            const distanceToTarget = this.position.distanceTo(targetWorldPosition);
            const moveDistance = dock.dockingSpeed * (1/60); // assume ~frame; refine later if dt passed in
            if (distanceToTarget > moveDistance) {
              const direction = targetWorldPosition.clone().sub(this.position).normalize();
              this.position.add(direction.multiplyScalar(moveDistance));
              // orient near planet
              const distanceToPlanet = this.position.distanceTo(planetPos);
              const planetRadius = dock.dockingTarget.radius || 50;
              if (distanceToPlanet < planetRadius * 2) {
                const directionToPlanet = planetPos.clone().sub(this.position).normalize();
                const targetRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,-1,0), directionToPlanet);
                this.quaternion.slerp(targetRotation, 0.1);
              }
            } else {
              // Complete docking
              this.position.copy(targetWorldPosition);
              this.quaternion.copy(dock.dockingRotation);
              this.flags.isDocking = false;
              this.flags.isDocked = true;
              dock.dockingProgress = 1;
            }
        }
      }
      // Station landing vector alignment (very trimmed version)
      if (this.flags.landingVectorLocked && !this.flags.isDocked && this.landingVectorStation) {
        const station = this.landingVectorStation;
        const dir = station.getLandingVectorDirectionWorld();
        const start = station.getLandingVectorStartWorld();
        const length = station.getLandingVectorLength();
        const along = Math.min(Math.max(this.landingVectorAlongDistance, 0), length);
        const axisPoint = start.clone().add(dir.clone().multiplyScalar(along));
        // radial convergence
        const radial = this.position.clone().sub(axisPoint);
        const shrink = Math.exp(-this.landingVectorAlignRate * (1/60));
        this.position.copy(axisPoint.clone().add(radial.multiplyScalar(shrink)));
        // orientation toward slot
        const slotForward = dir.clone().negate();
        const currentForward = new THREE.Vector3(0,0,-1).applyQuaternion(this.quaternion).normalize();
        const alignQ = new THREE.Quaternion().setFromUnitVectors(currentForward, slotForward);
        this.quaternion.premultiply(alignQ);
        // Simple completion condition: close enough radially
        if (this.position.distanceTo(axisPoint) < station.size * 0.01) {
          this.flags.landingAlignmentLocked = true;
          // finalize docking quickly
          this.flags.isDocked = true;
          this.dockedStation = station;
          this.flags.stationDocked = true;
          this.flags.landingVectorLocked = false;
          this.flags.rotationLockAcquired = true;
          
          // Parent ship to station for proper takeoff animation
          const worldPos = this.mesh.getWorldPosition(new THREE.Vector3());
          const worldQuat = this.mesh.getWorldQuaternion(new THREE.Quaternion());
          const parent = this.mesh.parent;
          console.log('ECS Station docking - before parenting. Parent:', parent?.name || 'none');
          if (parent) parent.remove(this.mesh);
          station.mesh.add(this.mesh);
          this.mesh.position.copy(station.mesh.worldToLocal(worldPos));
          this.mesh.quaternion.copy(station.mesh.quaternion.clone().invert().multiply(worldQuat));
          console.log('ECS Station docking - after parenting. New parent:', this.mesh.parent?.name || 'none');
          console.log('Ship local position after ECS parenting:', this.mesh.position);
        }
      }
      this.syncThirdPerson?.();
    }
  };

  return { id, api };
}

// System to apply throttle acceleration + drag similar to old Spaceship behavior
export class ShipMovementSystem {
  update(registry, dt) {
    const ids = registry.view('ShipControl','Velocity','Orientation');
    for (const id of ids) {
      const sc = registry.getComponent(id,'ShipControl');
      const vel = registry.getComponent(id,'Velocity').velocity;
      const ori = registry.getComponent(id,'Orientation').quaternion;
      const targetSpeed = sc.throttle * sc.maxSpeed;
      const currentSpeed = vel.length();
      const diff = targetSpeed - currentSpeed;
      if (Math.abs(diff) > 0.1) {
        const dir = Math.sign(diff);
        const forward = new THREE.Vector3(0,0,-1).applyQuaternion(ori).normalize();
        vel.addScaledVector(forward, dir * sc.acceleration * dt);
      }
      vel.multiplyScalar(0.999); // drag
    }
  }
}

// System to integrate linear & angular velocity (supersedes part of original MovementSystem for ships)
export class VelocityIntegrationSystem {
  update(registry, dt) {
    const linear = registry.view('Position','Velocity');
    for (const id of linear) {
      const pos = registry.getComponent(id,'Position').position;
      const vel = registry.getComponent(id,'Velocity').velocity;
      pos.addScaledVector(vel, dt);
    }
    const angular = registry.view('Orientation','AngularVelocity');
    for (const id of angular) {
      const ang = registry.getComponent(id,'AngularVelocity').angularVelocity;
      const q = registry.getComponent(id,'Orientation').quaternion;
      const speed = ang.length();
      if (speed > 1e-6) {
        const axis = ang.clone().normalize();
        const dq = new THREE.Quaternion().setFromAxisAngle(axis, speed*dt);
        q.multiply(dq);
        ang.multiplyScalar(0.99); // angular drag
      }
    }
  }
}
