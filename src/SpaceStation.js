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
    // Landing vector animation state
    this.landingVectorGroup = this.createLandingVector();
    if (this.landingVectorGroup) this.mesh.add(this.landingVectorGroup);
    // Hidden until player receives docking authorization
    if (this.landingVectorGroup) this.landingVectorGroup.visible = false;
    this.landingVectorOffset = 0; // animation phase
    this.updatePosition();
  }

  getType() { return 'station'; }

  serializeState() {
    return {
      id: this.id,
      name: this.name,
      planetName: this.planet?.getName?.(),
      orbitRadius: this.orbitRadius,
      size: this.size,
      orbitSpeed: this.orbitSpeed,
      angle: this.angle
    };
  }

  createStationMesh() {
    const group = new THREE.Group();
    // Core cylinder side walls (open ended so we can add a custom top cap with a real slot hole)
    const coreRadius = this.size * 0.3;
    const sideGeom = new THREE.CylinderGeometry(coreRadius, coreRadius, this.size, 32, 1, true);
    const coreMat = new THREE.MeshLambertMaterial({ color: 0x888888, flatShading: true, side: THREE.DoubleSide });
    const sideMesh = new THREE.Mesh(sideGeom, coreMat);
    group.add(sideMesh);

    // Bottom cap (solid)
    const bottomGeom = new THREE.CircleGeometry(coreRadius, 32);
    const bottomMesh = new THREE.Mesh(bottomGeom, coreMat);
    bottomMesh.rotation.x = -Math.PI / 2; // Lay flat (facing up)
    bottomMesh.position.y = -this.size / 2;
    group.add(bottomMesh);

    // Top cap with rectangular slot hole: build a Shape with a hole path
    const topShape = new THREE.Shape();
    topShape.absarc(0, 0, coreRadius, 0, Math.PI * 2, false);
    // Slot dimensions constrained to stay fully inside circle
    const slotLength = coreRadius * 1.5; // shorter than diameter (<= 2 * coreRadius)
    const slotWidth = coreRadius * 0.5;
    const halfL = slotLength / 2;
    const halfW = slotWidth / 2;
    const slotPath = new THREE.Path();
    slotPath.moveTo(-halfL, -halfW);
    slotPath.lineTo( halfL, -halfW);
    slotPath.lineTo( halfL,  halfW);
    slotPath.lineTo(-halfL,  halfW);
    slotPath.lineTo(-halfL, -halfW);
    topShape.holes.push(slotPath);
    const topGeom = new THREE.ShapeGeometry(topShape, 32);
    const topMesh = new THREE.Mesh(topGeom, coreMat);
    topMesh.rotation.x = -Math.PI / 2; // Orient horizontally
    topMesh.position.y = this.size / 2; // Place at top
    group.add(topMesh);

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

  createLandingVector() {
  // Creates a bold red dotted line extending upward from the coin slot toward space.
    // The dots animate moving TOWARD the slot to guide approach.
    const group = new THREE.Group();
    const dotColor = 0xff2020;
    const dir = new THREE.Vector3(0, 1, 0); // Upward direction along cylinder axis
    this.landingVectorDirection = dir.clone().normalize();
    const slotTopY = this.size / 2; // slot center Y
    const start = new THREE.Vector3(0, slotTopY + 0.01, 0); // slight lift above surface
    const length = this.size * 2.2; // how far the guidance extends
    this.landingVectorLength = length;
    const dots = 8; // fewer dots -> much larger spacing
    this.landingVectorDotSpacing = length / dots;
    this.landingVectorSpeed = length * 0.05; // much slower travel speed

    const dotRadius = this.size * 0.04; // bold size relative to station
    const geom = new THREE.SphereGeometry(dotRadius, 10, 10);
    const mat = new THREE.MeshBasicMaterial({ color: dotColor });

    this.landingVectorDots = [];
    for (let i = 0; i < dots; i++) {
      const m = new THREE.Mesh(geom, mat);
      group.add(m);
      this.landingVectorDots.push(m);
    }
    // Initial placement
    this.positionLandingVectorDots(start);
    return group;
  }

  positionLandingVectorDots(start) {
    if (!this.landingVectorDots) return;
    const dir = this.landingVectorDirection;
    const length = this.landingVectorLength;
    const spacing = this.landingVectorDotSpacing;
    // We animate by shifting a phase along the outward direction, then invert for inward travel look.
    for (let i = 0; i < this.landingVectorDots.length; i++) {
      // param along outward direction
      const raw = (i * spacing + this.landingVectorOffset) % length;
      // Inward travel toward slot: invert distance so dots move inward visually
      const dist = length - raw;
      const pos = start.clone().add(dir.clone().multiplyScalar(dist));
      this.landingVectorDots[i].position.copy(pos);
    }
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
    // Animate landing vector dotted movement
    if (this.landingVectorDots && this.landingVectorGroup && this.landingVectorGroup.visible) {
      this.landingVectorOffset = (this.landingVectorOffset + this.landingVectorSpeed * deltaTime) % this.landingVectorLength;
      const start = new THREE.Vector3(0, this.size / 2 + 0.01, 0);
      this.positionLandingVectorDots(start);
    }
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

  // Landing vector helpers
  getLandingVectorStartWorld() {
    // Start point (slot) in local space then transformed to world
    const local = new THREE.Vector3(0, this.size / 2 + 0.01, 0);
    return this.mesh.localToWorld(local.clone());
  }
  getLandingVectorDirectionWorld() {
    const dirLocal = this.landingVectorDirection.clone();
    const dirWorld = dirLocal.applyQuaternion(this.mesh.quaternion).normalize();
    return dirWorld;
  }
  getLandingVectorLength() { return this.landingVectorLength; }

  setLandingVectorVisible(v) {
    if (this.landingVectorGroup) this.landingVectorGroup.visible = v;
  }
}
