import * as THREE from 'three';

export class Spaceship {
  constructor() {
    this.mesh = this.createSpaceshipMesh();
    this.position = new THREE.Vector3(0, 0, 0);
    this.velocity = new THREE.Vector3(0, 0, 0);
    this.rotation = new THREE.Euler(0, 0, 0);
    this.quaternion = new THREE.Quaternion();
    this.angularVelocity = new THREE.Vector3(0, 0, 0);
    
    // Movement properties
    this.maxSpeed = 50;
    this.acceleration = 20;
    this.rotationSpeed = 6; // Increased by 200% (2 -> 6)
    this.throttle = 0;
    this.maxThrottle = 1;
    
    // Update mesh position
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
  }

  createSpaceshipMesh() {
    // Create a simple spaceship geometry (cockpit view)
    const group = new THREE.Group();
    
    // Main body
    const bodyGeometry = new THREE.ConeGeometry(0.3, 2, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x666666,
      flatShading: true 
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.x = Math.PI / 2;
    group.add(body);
    
    // Wings
    const wingGeometry = new THREE.BoxGeometry(1.5, 0.1, 0.3);
    const wingMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x444444,
      flatShading: true 
    });
    const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
    leftWing.position.set(-0.5, 0, 0);
    group.add(leftWing);
    
    const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
    rightWing.position.set(0.5, 0, 0);
    group.add(rightWing);
    
    // Cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.4, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x222222,
      flatShading: true,
      transparent: true,
      opacity: 0.7
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.set(0, 0.2, 0.5);
    group.add(cockpit);
    
    return group;
  }

  update(deltaTime) {
    // Apply throttle to forward movement
    const forwardForce = this.throttle * this.acceleration * deltaTime;
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.quaternion);
    this.velocity.add(forward.multiplyScalar(forwardForce));
    
    // Apply velocity to position
    this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
    
    // Apply angular velocity to quaternion (local space rotation)
    const angularQuaternion = new THREE.Quaternion();
    angularQuaternion.setFromAxisAngle(this.angularVelocity.clone().normalize(), this.angularVelocity.length() * deltaTime);
    this.quaternion.multiply(angularQuaternion);
    
    // Update Euler rotation for mesh display
    this.rotation.setFromQuaternion(this.quaternion);
    
    // Apply drag
    this.velocity.multiplyScalar(0.98);
    this.angularVelocity.multiplyScalar(0.9);
    
    // Update mesh
    this.mesh.position.copy(this.position);
    this.mesh.rotation.copy(this.rotation);
  }

  // Control methods
  pitch(amount) {
    // Apply pitch around local X-axis
    const pitchForce = amount * this.rotationSpeed;
    this.angularVelocity.x += pitchForce;
  }

  yaw(amount) {
    // Apply yaw around local Y-axis
    const yawForce = amount * this.rotationSpeed;
    this.angularVelocity.y += yawForce;
  }

  roll(amount) {
    // Apply roll around local Z-axis
    const rollForce = amount * this.rotationSpeed;
    this.angularVelocity.z += rollForce;
  }

  setThrottle(throttle) {
    this.throttle = Math.max(0, Math.min(this.maxThrottle, throttle));
  }

  getThrottle() {
    return this.throttle;
  }

  getPosition() {
    return this.position.clone();
  }

  getRotation() {
    return this.rotation.clone();
  }
}
