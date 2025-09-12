import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { replaceCockpitMaterials } from '../util/shipMaterialUtils.js';

/**
 * ThirdPersonCamera handles all third-person camera functionality including:
 * - Model loading and initialization
 * - Camera orbit controls (mouse drag, scroll zoom)
 * - Camera positioning and calibration
 * - View mode switching
 */
export class ThirdPersonCamera {
  constructor(gameEngine, spaceship, ui, engineParticles) {
    this.gameEngine = gameEngine;
    this.spaceship = spaceship;
    this.ui = ui;
    this.engineParticles = engineParticles;

    // Third-person orbit parameters
    this.thirdPersonOrbitYaw = 0; // radians
    this.thirdPersonOrbitPitch = 0; // radians
    this.thirdPersonCameraDistance = 55; // matches default Z offset length (will recalc on toggle)
    this.thirdPersonOrbitActive = false; // becomes true after any drag
    this._orbitDragging = false;
    this._lastMouseX = 0;
    this._lastMouseY = 0;

    // Orbit idle auto-exit
    this.thirdPersonOrbitIdleSeconds = 0;
    this.thirdPersonOrbitIdleThreshold = 3; // seconds

    // Camera offset and positioning
    this.thirdPersonCameraOffset = new THREE.Vector3(0, 0, 55);
    this.lastFirstPersonCameraPos = new THREE.Vector3();
    this.thirdPersonInitialized = false;

    this._initOrbitEventHandlers();
  }

  _initOrbitEventHandlers() {
    // Prevent context menu so right-drag feels natural
    document.addEventListener('contextmenu', (e) => {
      if (this.spaceship.thirdPersonMode) e.preventDefault();
    });
    document.addEventListener('mousedown', (e) => {
      if (e.button === 2 && this.spaceship.thirdPersonMode) {
        this._orbitDragging = true;
        this._lastMouseX = e.clientX;
        this._lastMouseY = e.clientY;
        this.thirdPersonOrbitIdleSeconds = 0;
      }
    });
    document.addEventListener('mouseup', (e) => {
      if (e.button === 2) {
        this._orbitDragging = false;
      }
    });
    document.addEventListener('mouseleave', () => { this._orbitDragging = false; });
    document.addEventListener('mousemove', (e) => {
      if (!this._orbitDragging) return;
      const dx = e.clientX - this._lastMouseX;
      const dy = e.clientY - this._lastMouseY;
      this._lastMouseX = e.clientX;
      this._lastMouseY = e.clientY;
      const ROT_SPEED = 0.005; // radians per px
      this.thirdPersonOrbitYaw = (this.thirdPersonOrbitYaw + dx * ROT_SPEED) % (Math.PI * 2);
      // Clamp pitch to avoid flip
      this.thirdPersonOrbitPitch = Math.max(-1.2, Math.min(1.2, this.thirdPersonOrbitPitch + dy * ROT_SPEED));
      this.thirdPersonOrbitActive = true;
      this.thirdPersonOrbitIdleSeconds = 0;
    });
    // Scroll to zoom distance (optional)
    document.addEventListener('wheel', (e) => {
      if (!this.spaceship.thirdPersonMode) return;
      const delta = e.deltaY * 0.05;
      this.thirdPersonCameraDistance = Math.max(10, Math.min(200, this.thirdPersonCameraDistance + delta));
      if (this.thirdPersonOrbitActive) e.preventDefault();
      if (this.thirdPersonOrbitActive) this.thirdPersonOrbitIdleSeconds = 0;
    }, { passive: false });
  }

  initThirdPerson() {
    this.thirdPersonInitialized = true;
    // Load FBX model (ship2.fbx) similar to NPCShip but reused for player
    const loader = new FBXLoader();
    loader.load(
      new URL('../assets/fbx/ship2.fbx', import.meta.url).href,
      (object) => {
        // Replace Cockpit materials with glassy blue appearance
        replaceCockpitMaterials(object);
        
        object.traverse(child => {
          if (child.isMesh) {
            child.castShadow = false;
            child.receiveShadow = false;
            if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
              child.material = new THREE.MeshStandardMaterial({ color: 0xccccff, emissive: 0x222244 });
            }
            child.material.transparent = false;
            child.material.opacity = 1.0;
            child.material.visible = true;
          }
        });
        // Center & scale similar to NPCShip
        const box = new THREE.Box3().setFromObject(object);
        const center = new THREE.Vector3();
        box.getCenter(center);
        object.position.sub(center);
        const size = new THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 5;
        const scale = targetSize / maxDim;
        object.scale.setScalar(scale);
        // Store scaled size for automatic camera calibration
        const scaledBox = new THREE.Box3().setFromObject(object);
        const scaledSize = new THREE.Vector3();
        scaledBox.getSize(scaledSize);
        this.spaceship.thirdPersonModelSize = scaledSize.clone();
        // Default: no manual visual offset; keep logical position at model center
        this.spaceship.thirdPersonVisualOffset = new THREE.Vector3(0, 0, 0);
        // Add group to scene and to spaceship
        this.spaceship.enableThirdPerson(object);

        // Pass the model to EngineParticles for material control
        if (this.engineParticles) {
          this.engineParticles.setSpaceshipModel(object);
        }
        this.gameEngine.scene.add(this.spaceship.thirdPersonGroup);

        // Automatically switch to third person when model finishes loading
        this.toggleThirdPerson();
      },
      undefined,
      (err) => {
        console.error('Failed to load player third-person model', err);
      }
    );
  }

  calibrateThirdPersonCamera() {
    // Derive camera offset dynamically from model size so we avoid hardcoded magic numbers
    const size = this.spaceship.thirdPersonModelSize || new THREE.Vector3(5, 5, 10);
    const largest = Math.max(size.x, size.y, size.z);
    // Distance: a few times largest dimension so full ship is visible
    const distance = largest * 3.0; // tweak factor as desired
    const height = size.y * 0.7; // slightly above center
    // Camera sits behind ship along +Z (ship forward is -Z)
    this.thirdPersonCameraOffset = new THREE.Vector3(0, height, distance);
    this.thirdPersonCameraDistance = this.thirdPersonCameraOffset.length();
    // Reset orbit state to follow mode initial
    this.thirdPersonOrbitYaw = 0; // looking forward
    this.thirdPersonOrbitPitch = Math.asin(height / this.thirdPersonCameraDistance);
    this.thirdPersonOrbitActive = false;
    // Auto raise model so it isn't visually low: shift model up by a fraction of its height.
    // This keeps logic origin (ship position) roughly at an anchor below geometric center.
    if (this.spaceship.thirdPersonVisualOffset) {
      const verticalOffsetRatio = 25; // raise by 95% of model height; adjust if still low
      this.spaceship.thirdPersonVisualOffset.y = size.y * verticalOffsetRatio;
    }
  }

  toggleThirdPerson() {
    const switchingToThird = !this.spaceship.thirdPersonMode;
    // Capture camera position (first-person viewpoint) before switching to third person
    if (switchingToThird) {
      if (!this.lastFirstPersonCameraPos) this.lastFirstPersonCameraPos = new THREE.Vector3();
      this.lastFirstPersonCameraPos.copy(this.gameEngine.camera.position);
    }
    this.spaceship.toggleThirdPerson();
    if (switchingToThird) {
      // Activating third person: ensure group in scene & hide cockpit mesh
      if (!this.spaceship.thirdPersonLoaded) {
        // model still loading or not yet loaded
      }
      if (!this.spaceship.thirdPersonGroup.parent) {
        this.gameEngine.scene.add(this.spaceship.thirdPersonGroup);
      }
      this.spaceship.mesh.visible = false;
      // Show engine particles in third person view
      if (this.engineParticles) {
        this.engineParticles.setActive(true);
      }
      // Calibrate camera offset automatically from model size (or fallback defaults)
      this.calibrateThirdPersonCamera();
      // Switch UI to third-person layout
      this.ui.applyThirdPersonLayout && this.ui.applyThirdPersonLayout();
      // Ensure 3D model visible & centered exactly where first-person camera was
      this.spaceship.thirdPersonGroup.visible = true;
      const spawnPos = (this.lastFirstPersonCameraPos) ? this.lastFirstPersonCameraPos : this.spaceship.getPosition();
      this.spaceship.thirdPersonGroup.position.copy(spawnPos);
      // Also keep internal ship logical position at that point to avoid jump
      this.spaceship.position.copy(spawnPos);
      const shipQuat = this.spaceship.quaternion.clone();
      this.spaceship.thirdPersonGroup.quaternion.copy(shipQuat);
      // Initialize orbit distance & angles from current offset vector
      this.thirdPersonCameraDistance = this.thirdPersonCameraOffset.length();
      this.thirdPersonOrbitYaw = 0; // forward
      // derive pitch from existing offset
      const off = this.thirdPersonCameraOffset;
      this.thirdPersonOrbitPitch = Math.asin(off.y / off.length());
      this.thirdPersonOrbitActive = false;
    } else {
      // Return to cockpit
      this.spaceship.mesh.visible = false; // still hidden because cockpit view uses camera at ship pos
      // Hide engine particles in first person view
      if (this.engineParticles) {
        this.engineParticles.setActive(false);
      }
      // camera will be reset each frame in update
      this.ui.applyFirstPersonLayout && this.ui.applyFirstPersonLayout();
      // Hide third-person visual representation
      this.spaceship.thirdPersonGroup.visible = false;
      this.thirdPersonOrbitActive = false;
    }
  }

  update(deltaTime) {
    // Handle orbit idle timeout
    if (this.spaceship.thirdPersonMode && this.thirdPersonOrbitActive) {
      this.thirdPersonOrbitIdleSeconds += deltaTime;
      if (this.thirdPersonOrbitIdleSeconds >= this.thirdPersonOrbitIdleThreshold) {
        // Check if camera re-centering is disabled via debug UI
        const cameraRecenterDisabled = this.engineParticles && this.engineParticles.isCameraRecenterDisabled();
        if (!cameraRecenterDisabled) {
          this.thirdPersonOrbitActive = false; // auto-exit back to follow
        }
      }
    }

    // Update camera position for third-person mode
    const spaceshipPos = this.spaceship.getPosition();
    const spaceshipRot = this.spaceship.getRotation();
    if (this.spaceship.thirdPersonMode && this.thirdPersonCameraOffset) {
      if (this.thirdPersonOrbitActive) {
        // Orbit mode: compute offset in world space using spherical angles independent of ship roll
        const r = this.thirdPersonCameraDistance;
        const cp = Math.cos(this.thirdPersonOrbitPitch);
        const sp = Math.sin(this.thirdPersonOrbitPitch);
        const cy = Math.cos(this.thirdPersonOrbitYaw);
        const sy = Math.sin(this.thirdPersonOrbitYaw);
        const offset = new THREE.Vector3(r * sy * cp, r * sp, r * cy * cp); // z forward
        const camPos = spaceshipPos.clone().add(offset);
        this.gameEngine.camera.position.copy(camPos);
        this.gameEngine.camera.lookAt(spaceshipPos);
      } else {
        // Follow mode: camera follows ship with fixed offset
        const shipQuat = this.spaceship.quaternion.clone();
        const offsetWorld = this.thirdPersonCameraOffset.clone().applyQuaternion(shipQuat);
        const camPos = spaceshipPos.clone().add(offsetWorld);
        this.gameEngine.camera.position.copy(camPos);
        this.gameEngine.camera.quaternion.copy(shipQuat);
      }
    }
  }

  // Getters for external access
  get isInitialized() {
    return this.thirdPersonInitialized;
  }

  get isOrbitActive() {
    return this.thirdPersonOrbitActive;
  }

  get orbitIdleSeconds() {
    return this.thirdPersonOrbitIdleSeconds;
  }
}
