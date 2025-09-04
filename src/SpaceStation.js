import * as THREE from 'three';

export class SpaceStation {
  constructor(planet, options = {}) {
    // planet: Planet instance to orbit
    this.planet = planet;
    this.name = options.name || `${planet.getName()} Station`;
    this.orbitRadius = options.orbitRadius || planet.radius * 3; // distance from planet center
    this.size = options.size || planet.radius * 0.4; // must be < 0.5 planet diameter; using 0.4 * radius ~ 0.8 diameter fraction
    this.orbitSpeed = options.orbitSpeed || 0.05; // radians per second
    this.angle = Math.random() * Math.PI * 2;

    this.id = Math.random().toString(36).substr(2, 9);
    this.mass = this.size * this.size * this.size * 500; // arbitrary large mass vs player
    this.isNavTargeted = false;
    this.isCommable = true;

    this.mesh = this.createStationMesh();
    this.updatePosition();
  }

  createStationMesh() {
    const group = new THREE.Group();
    const coreGeom = new THREE.CylinderGeometry(this.size * 0.3, this.size * 0.3, this.size, 12);
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x888888, flatShading: true });
    const core = new THREE.Mesh(coreGeom, coreMat);
    group.add(core);

    // Add some radial arms
    const armGeom = new THREE.BoxGeometry(this.size * 0.6, this.size * 0.05, this.size * 0.05);
    const armMat = new THREE.MeshLambertMaterial({ color: 0x555555, flatShading: true });
    for (let i = 0; i < 4; i++) {
      const arm = new THREE.Mesh(armGeom, armMat);
      arm.rotation.y = (Math.PI / 2) * i;
      group.add(arm);
    }

    // Add a docking ring
    const ringGeom = new THREE.TorusGeometry(this.size * 0.45, this.size * 0.05, 8, 16);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x222244, flatShading: true });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);

    return group;
  }

  updatePosition() {
    const planetPos = this.planet.getPosition();
    const x = planetPos.x + Math.cos(this.angle) * this.orbitRadius;
    const z = planetPos.z + Math.sin(this.angle) * this.orbitRadius;
    const y = planetPos.y + this.orbitRadius * 0.1; // slight inclination
    this.position = new THREE.Vector3(x, y, z);
    this.mesh.position.copy(this.position);
  }

  update(deltaTime) {
    this.angle += this.orbitSpeed * deltaTime;
    this.updatePosition();
  }

  // Nav target interface compatibility
  getId() { return this.id; }
  getName() { return this.name; }
  getMass() { return this.mass; }
  setNavTargeted(v) { this.isNavTargeted = v; }
  isNavTarget() { return this.isNavTargeted; }
  getPosition() { return this.position.clone(); }
  isCommable() { return this.isCommable; }
  getGreeting() { return `This is ${this.name}. State your business.`; }
}
