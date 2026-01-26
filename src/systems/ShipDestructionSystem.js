import * as THREE from 'three';

/**
 * ShipDestructionSystem
 * Lightweight, fake-physics debris breakup for the player ship's third-person model.
 * - Clones mesh parts from the thirdPersonGroup into a DebrisGroup in world space
 * - Assigns outward velocities and random spin
 * - Applies simple drag and opacity fade, then cleans up
 */
export class ShipDestructionSystem {
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.group = null;
    this.debris = [];
    this._focus = new THREE.Vector3();
  }

  isActive() { return this.active; }

  start(spaceship, options = {}) {
    if (!spaceship || !spaceship.thirdPersonLoaded || !spaceship.thirdPersonGroup) return false;
    // Avoid double-start
    if (this.active) return true;
    this.active = true;
    this.debris = [];
    this.group = new THREE.Group();
    this.group.name = 'ShipDebrisGroup';
    this.scene.add(this.group);

    // Hide intact third-person model so debris replacement is visible
    try { spaceship.thirdPersonGroup.visible = false; } catch (_) { /* ignore errors */ }
    // Also hide cockpit mesh if visible to avoid orphaned geometry in view
    try { if (spaceship.mesh) spaceship.mesh.visible = false; } catch (_) { /* ignore errors */ }

    // Collect mesh parts from the third-person model
    const meshes = [];
    spaceship.thirdPersonGroup.traverse((obj) => {
      if (obj.isMesh) meshes.push(obj);
    });
    // Limit debris count for performance
    const MAX_DEBRIS = options.maxDebris || 24;
    const step = Math.max(1, Math.floor(meshes.length / Math.max(1, Math.min(meshes.length, MAX_DEBRIS))));

    const shipWorldPos = spaceship.thirdPersonGroup.getWorldPosition(new THREE.Vector3());

    for (let i = 0; i < meshes.length; i += step) {
      const src = meshes[i];
      // Compute world transform of the source mesh
      src.updateWorldMatrix(true, false);
      const wPos = new THREE.Vector3();
      const wQuat = new THREE.Quaternion();
      const wScale = new THREE.Vector3();
      src.matrixWorld.decompose(wPos, wQuat, wScale);

      // Clone geometry + material (clone material so we can fade independently)
      const geom = src.geometry;
      if (!geom) continue;
      const mat = Array.isArray(src.material)
        ? src.material.map(m => this._cloneFadableMaterial(m))
        : this._cloneFadableMaterial(src.material);
      const clone = new THREE.Mesh(geom, mat);
      clone.position.copy(wPos);
      clone.quaternion.copy(wQuat);
      clone.scale.copy(wScale);
      clone.castShadow = false;
      clone.receiveShadow = false;
      this.group.add(clone);

      // Determine initial outward velocity based on position relative to ship center, with jitter
      const dir = wPos.clone().sub(shipWorldPos).normalize();
      if (!isFinite(dir.x)) dir.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).normalize();
      dir.add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4)).normalize();
      const speed = 20 + Math.random() * 25; // units/sec
      const velocity = dir.multiplyScalar(speed);

      // Random angular velocity (radians/sec)
      const angVel = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6
      );

      const lifetime = 3.5 + Math.random() * 2.0;
      const fadeStart = lifetime * 0.5; // start fading halfway through
      const drag = 0.6 + Math.random() * 0.25; // per-second fraction removed

      this.debris.push({
        mesh: clone,
        velocity,
        angVel,
        age: 0,
        lifetime,
        fadeStart,
        drag
      });
    }

    // Initialize focus at ship center
    this._focus.copy(shipWorldPos);
    return true;
  }

  update(dt) {
    if (!this.active) return;
    // Accumulate centroid for focus
    let cx = 0, cy = 0, cz = 0, n = 0;
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const d = this.debris[i];
      d.age += dt;
      // Integrate motion with simple drag
      const dragFactor = Math.max(0, 1 - d.drag * dt);
      d.velocity.multiplyScalar(dragFactor);
      d.mesh.position.addScaledVector(d.velocity, dt);
      // Spin
      d.mesh.rotateX(d.angVel.x * dt);
      d.mesh.rotateY(d.angVel.y * dt);
      d.mesh.rotateZ(d.angVel.z * dt);
      // Fade
      const fadeT = d.age <= d.fadeStart ? 0 : (d.age - d.fadeStart) / Math.max(0.0001, (d.lifetime - d.fadeStart));
      const opacity = Math.max(0, 1 - fadeT);
      this._setOpacity(d.mesh, opacity);
      // Cleanup
      if (d.age >= d.lifetime) {
        if (d.mesh.parent) d.mesh.parent.remove(d.mesh);
        this.debris.splice(i, 1);
      } else {
        // Contribute to focus point
        cx += d.mesh.position.x; cy += d.mesh.position.y; cz += d.mesh.position.z; n++;
      }
    }
    if (n > 0) this._focus.set(cx / n, cy / n, cz / n);
    if (this.debris.length === 0) {
      this._cleanup();
    }
  }

  _cleanup() {
    if (this.group && this.group.parent) this.group.parent.remove(this.group);
    this.group = null;
    this.active = false;
  }

  getFocus() {
    return this._focus;
  }

  _cloneFadableMaterial(srcMat) {
    const m = srcMat ? srcMat.clone() : new THREE.MeshLambertMaterial({ color: 0x777777 });
    m.transparent = true;
    if (typeof m.opacity !== 'number') m.opacity = 1;
    // Disable depthWrite slightly late in fade to avoid popping; keep it simple for now
    return m;
  }

  _setOpacity(mesh, opacity) {
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(m => { m.opacity = opacity; m.needsUpdate = true; });
    } else if (mesh.material) {
      mesh.material.opacity = opacity;
      mesh.material.needsUpdate = true;
    }
  }
}
