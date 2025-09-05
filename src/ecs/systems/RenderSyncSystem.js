// Sync ECS transform to three.js mesh (non-authoritative: mesh follows components)
export class RenderSyncSystem {
  update(registry, dt) { // dt unused now
    const view = registry.view('Position','Renderable');
    for (const id of view) {
      const pos = registry.getComponent(id,'Position');
      const rend = registry.getComponent(id,'Renderable');
      if (rend.mesh) rend.mesh.position.copy(pos.position);
    }
    const rotView = registry.view('Orientation','Renderable');
    for (const id of rotView) {
      const o = registry.getComponent(id,'Orientation');
      const rend = registry.getComponent(id,'Renderable');
      if (rend.mesh) rend.mesh.quaternion.copy(o.quaternion);
    }
  }
}
