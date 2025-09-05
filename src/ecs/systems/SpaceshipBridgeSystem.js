// Temporary bridge: mirror legacy Spaceship instance into ECS components so new systems can read them.
// Once Spaceship is fully componentized, this can be removed.
export class SpaceshipBridgeSystem {
  constructor(spaceship, entityId) {
    this.spaceship = spaceship;
    this.entityId = entityId;
  }
  update(registry, dt) {
    if (!this.spaceship) return;
    const pos = registry.getComponent(this.entityId,'Position');
    if (pos) pos.position.copy(this.spaceship.position);
    const o = registry.getComponent(this.entityId,'Orientation');
    if (o) o.quaternion.copy(this.spaceship.quaternion);
    const vel = registry.getComponent(this.entityId,'Velocity');
    if (vel) vel.velocity.copy(this.spaceship.velocity);
    const av = registry.getComponent(this.entityId,'AngularVelocity');
    if (av) av.angularVelocity.copy(this.spaceship.angularVelocity);
  }
}
