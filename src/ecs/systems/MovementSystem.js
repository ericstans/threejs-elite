// Movement + orientation integration for entities that have Position+Velocity and/or Orientation+AngularVelocity
import * as THREE from 'three';

export class MovementSystem {
  update(registry, dt) {
    const withLinear = registry.view('Position','Velocity');
    for (const id of withLinear) {
      const pos = registry.getComponent(id,'Position');
      const vel = registry.getComponent(id,'Velocity');
      pos.position.addScaledVector(vel.velocity, dt);
    }
    const withAngular = registry.view('Orientation','AngularVelocity');
    for (const id of withAngular) {
      const o = registry.getComponent(id,'Orientation');
      const av = registry.getComponent(id,'AngularVelocity');
      const axis = av.angularVelocity.clone();
      const speed = axis.length();
      if (speed > 1e-6) {
        axis.normalize();
        const dq = new THREE.Quaternion().setFromAxisAngle(axis, speed * dt);
        o.quaternion.multiply(dq);
        o.euler.setFromQuaternion(o.quaternion);
      }
    }
  }
}
