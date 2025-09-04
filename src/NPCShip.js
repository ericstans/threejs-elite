import * as THREE from 'three';
// Import FBXLoader from three/examples/jsm
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export class NPCShip {
  constructor(position = new THREE.Vector3(0, 0, 0)) {
    this.mesh = new THREE.Group();
    this.position = position.clone();
    this.loaded = false;
  this.loadModel();
  }

  loadModel() {
  const loader = new FBXLoader();
  loader.load(
    new URL('./assets/fbx/ship2.fbx', import.meta.url).href,
    (object) => {
      object.traverse(child => {
        if (child.isMesh) {
          child.castShadow = false;
          child.receiveShadow = false;
          // Fallback: ensure all meshes have a visible material
          if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
            child.material = new THREE.MeshStandardMaterial({ color: 0x00ffcc, emissive: 0x003333 });
          }
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.visible = true;
        }
      });
      // Center the model at its bounding box center
      const box = new THREE.Box3().setFromObject(object);
      const center = new THREE.Vector3();
      box.getCenter(center);
      object.position.sub(center); // move geometry so origin is at center
      // Scale so largest dimension is ~40 units (planet diameter)
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const targetSize = 40;
      const scale = targetSize / maxDim;
      object.scale.setScalar(scale);
      // Place at intended world position
      this.mesh.position.copy(this.position);
      this.mesh.add(object);
            // ...removed wireframe debug box...
      this.loaded = true;
      // Debug: log bounding box size after scaling
      setTimeout(() => {
        const worldBox = new THREE.Box3().setFromObject(this.mesh);
        const worldSize = new THREE.Vector3();
        worldBox.getSize(worldSize);
        console.log('[NPCShip] Final bounding box size:', worldSize, 'at', this.mesh.position);
        // Log camera info if available
        if (this.scene && this.scene.userData && this.scene.userData.camera) {
          const cam = this.scene.userData.camera;
          console.log('[NPCShip] Camera position:', cam.position, 'direction:', cam.getWorldDirection(new THREE.Vector3()));
        }
      }, 100);
    },
    undefined,
    (error) => {
      console.error('NPCShip: Failed to load FBX model', error);
    }
  );
  }

  update(/* deltaTime */) {
    // No behavior yet
  }
}
