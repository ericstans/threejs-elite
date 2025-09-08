import * as THREE from 'three';

export class Explosion {
  constructor(position, size = 1, duration = 0.5) {
    this.position = position;
    this.size = size;
    this.duration = duration;
    this.age = 0;
    this.maxAge = duration;

    this.mesh = this.createExplosionMesh();
    this.mesh.position.copy(this.position);
  }

  createExplosionMesh() {
    // Create explosion geometry - a sphere that will expand
    const geometry = new THREE.SphereGeometry(this.size, 8, 6);

    // Create explosion material with emissive glow
    const material = new THREE.MeshLambertMaterial({
      color: 0xff6600, // Orange explosion
      emissive: 0xff3300, // Bright orange glow
      flatShading: true,
      transparent: true,
      opacity: 0.8
    });

    const explosion = new THREE.Mesh(geometry, material);
    return explosion;
  }

  update(deltaTime) {
    this.age += deltaTime;

    // Calculate expansion and fade
    const progress = this.age / this.maxAge;
    const scale = 1 + progress * 3; // Expand to 4x original size
    const opacity = 1 - progress; // Fade out

    // Update mesh
    this.mesh.scale.setScalar(scale);
    this.mesh.material.opacity = opacity * 0.8;

    // Check if explosion should be destroyed
    return this.age >= this.maxAge;
  }

  getPosition() {
    return this.position.clone();
  }

  getAge() {
    return this.age;
  }

  getMaxAge() {
    return this.maxAge;
  }
}
