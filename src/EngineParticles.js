import * as THREE from 'three';

const SHOW_ENGINE_PARTICLE_DEBUG_UI = false;

export class EngineParticles {
  constructor(scene, spaceship) {
    this.scene = scene;
    this.spaceship = spaceship;
    this.particles = [];
    this.isActive = false;
    this.disableCameraRecenter = false; // Camera re-centering control
    
    // Hardcoded engine positions (relative to ship center)
    // Adjust these values to position the engines correctly
    this.enginePositions = [
      { x: -0.4, y: -29.2, z: 6.0 }, // Left engine
      { x: 0.4, y: -29.2, z: 6.0 }   // Right engine
    ];
    
    if(SHOW_ENGINE_PARTICLE_DEBUG_UI) {
        // Debug UI for real-time adjustment
        this.createDebugUI();
    }
    
    // Engine particle system setup
    this.setupParticleSystem();
  }

  setupParticleSystem() {
    // Create particle geometry
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    
    // Positions
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: 0x00aaff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
      depthTest: true,
      alphaTest: 0.1
    });
    
    // Create points system
    this.particleSystem = new THREE.Points(geometry, material);
    
    // Ensure particles are always visible by setting a large bounding sphere
    this.particleSystem.geometry.computeBoundingSphere();
    this.particleSystem.geometry.boundingSphere.radius = 1000; // Large radius to prevent culling
    
    // Disable frustum culling to ensure particles are always rendered
    this.particleSystem.frustumCulled = false;
    
    // Don't add to scene yet - will be added as child of ship
    
    // Initialize particles
    this.resetParticles();
  }

  createDebugUI() {
    // Create debug panel
    this.debugPanel = document.createElement('div');
    this.debugPanel.style.position = 'fixed';
    this.debugPanel.style.top = '10px';
    this.debugPanel.style.right = '10px';
    this.debugPanel.style.width = '300px';
    this.debugPanel.style.background = 'rgba(0, 0, 0, 0.8)';
    this.debugPanel.style.color = '#00ff00';
    this.debugPanel.style.padding = '15px';
    this.debugPanel.style.border = '1px solid #00ff00';
    this.debugPanel.style.fontFamily = 'monospace';
    this.debugPanel.style.fontSize = '12px';
    this.debugPanel.style.zIndex = '10000';
    this.debugPanel.style.display = 'block'; // Visible by default
    
    // Title
    const title = document.createElement('div');
    title.textContent = 'Engine Particles Debug';
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.color = '#00ff00';
    this.debugPanel.appendChild(title);
    
    // Left Engine Controls
    const leftEngineDiv = document.createElement('div');
    leftEngineDiv.style.marginBottom = '15px';
    leftEngineDiv.innerHTML = '<div style="color: #00aaff; margin-bottom: 5px;">Left Engine:</div>';
    this.debugPanel.appendChild(leftEngineDiv);
    
    // Left Engine X
    const leftXDiv = this.createSliderControl('Left X:', -5, 5, this.enginePositions[0].x, (value) => {
      this.enginePositions[0].x = value;
      this.resetParticles();
    });
    leftEngineDiv.appendChild(leftXDiv);
    
    // Left Engine Y
    const leftYDiv = this.createSliderControl('Left Y:', -50, 50, this.enginePositions[0].y, (value) => {
      this.enginePositions[0].y = value;
      this.resetParticles();
    });
    leftEngineDiv.appendChild(leftYDiv);
    
    // Left Engine Z
    const leftZDiv = this.createSliderControl('Left Z:', -10, 10, this.enginePositions[0].z, (value) => {
      this.enginePositions[0].z = value;
      this.resetParticles();
    });
    leftEngineDiv.appendChild(leftZDiv);
    
    // Right Engine Controls
    const rightEngineDiv = document.createElement('div');
    rightEngineDiv.style.marginBottom = '15px';
    rightEngineDiv.innerHTML = '<div style="color: #00aaff; margin-bottom: 5px;">Right Engine:</div>';
    this.debugPanel.appendChild(rightEngineDiv);
    
    // Right Engine X
    const rightXDiv = this.createSliderControl('Right X:', -5, 5, this.enginePositions[1].x, (value) => {
      this.enginePositions[1].x = value;
      this.resetParticles();
    });
    rightEngineDiv.appendChild(rightXDiv);
    
    // Right Engine Y
    const rightYDiv = this.createSliderControl('Right Y:', -50, 50, this.enginePositions[1].y, (value) => {
      this.enginePositions[1].y = value;
      this.resetParticles();
    });
    rightEngineDiv.appendChild(rightYDiv);
    
    // Right Engine Z
    const rightZDiv = this.createSliderControl('Right Z:', -10, 10, this.enginePositions[1].z, (value) => {
      this.enginePositions[1].z = value;
      this.resetParticles();
    });
    rightEngineDiv.appendChild(rightZDiv);
    
    // Camera re-centering control
    const cameraDiv = document.createElement('div');
    cameraDiv.style.marginBottom = '15px';
    cameraDiv.innerHTML = '<div style="color: #00aaff; margin-bottom: 5px;">Camera:</div>';
    this.debugPanel.appendChild(cameraDiv);
    
    // Camera re-centering checkbox
    const cameraCheckboxDiv = document.createElement('div');
    cameraCheckboxDiv.style.marginBottom = '5px';
    cameraCheckboxDiv.style.display = 'flex';
    cameraCheckboxDiv.style.alignItems = 'center';
    
    const cameraCheckbox = document.createElement('input');
    cameraCheckbox.type = 'checkbox';
    cameraCheckbox.id = 'disableCameraRecenter';
    cameraCheckbox.checked = false; // Default to enabled re-centering
    cameraCheckbox.style.marginRight = '8px';
    cameraCheckbox.onchange = (e) => {
      this.disableCameraRecenter = e.target.checked;
      console.log('Camera re-centering disabled:', this.disableCameraRecenter);
    };
    cameraCheckboxDiv.appendChild(cameraCheckbox);
    
    const cameraLabel = document.createElement('label');
    cameraLabel.htmlFor = 'disableCameraRecenter';
    cameraLabel.textContent = 'Disable camera re-centering';
    cameraLabel.style.fontSize = '11px';
    cameraLabel.style.cursor = 'pointer';
    cameraCheckboxDiv.appendChild(cameraLabel);
    
    cameraDiv.appendChild(cameraCheckboxDiv);
    
    // Add to document
    document.body.appendChild(this.debugPanel);
  }

  createSliderControl(label, min, max, initialValue, onChange) {
    const div = document.createElement('div');
    div.style.marginBottom = '5px';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    
    const labelEl = document.createElement('span');
    labelEl.textContent = label;
    labelEl.style.width = '60px';
    labelEl.style.fontSize = '11px';
    div.appendChild(labelEl);
    
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = min;
    slider.max = max;
    slider.step = 0.1;
    slider.value = initialValue;
    slider.style.flex = '1';
    slider.style.margin = '0 5px';
    slider.oninput = (e) => {
      const value = parseFloat(e.target.value);
      valueEl.textContent = value.toFixed(1);
      onChange(value);
    };
    div.appendChild(slider);
    
    const valueEl = document.createElement('span');
    valueEl.textContent = initialValue.toFixed(1);
    valueEl.style.width = '40px';
    valueEl.style.fontSize = '11px';
    valueEl.style.textAlign = 'right';
    div.appendChild(valueEl);
    
    return div;
  }

  resetParticles() {
    const positions = this.particleSystem.geometry.attributes.position.array;
    const velocities = this.particleSystem.geometry.attributes.velocity.array;
    const lifetimes = this.particleSystem.geometry.attributes.lifetime.array;
    const sizes = this.particleSystem.geometry.attributes.size.array;
    
    for (let i = 0; i < positions.length; i += 3) {
      // Random position near engines (in local space)
      const engineIndex = Math.floor(Math.random() * this.enginePositions.length);
      const enginePos = this.enginePositions[engineIndex];
      
      // Add some randomness around the engine position
      positions[i] = enginePos.x + (Math.random() - 0.5) * 0.5;
      positions[i + 1] = enginePos.y + (Math.random() - 0.5) * 0.5;
      positions[i + 2] = enginePos.z + (Math.random() - 0.5) * 0.5;
      
      // Random velocity (backward and slightly outward)
      velocities[i] = (Math.random() - 0.5) * 0.1; // X spread
      velocities[i + 1] = (Math.random() - 0.5) * 0.1; // Y spread
      velocities[i + 2] = Math.random() * 0.3 + 0.1; // Z forward (backward from ship's perspective)
      
      // Random lifetime
      lifetimes[i / 3] = Math.random() * 2 + 1; // 1-3 seconds
      
      // Random size
      sizes[i / 3] = Math.random() * 0.2 + 0.05; // 0.05-0.25
    }
    
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.velocity.needsUpdate = true;
    this.particleSystem.geometry.attributes.lifetime.needsUpdate = true;
    this.particleSystem.geometry.attributes.size.needsUpdate = true;
  }

  update(deltaTime, throttle) {
    if (!this.isActive || !this.spaceship.mesh) return;
    
    const positions = this.particleSystem.geometry.attributes.position.array;
    const velocities = this.particleSystem.geometry.attributes.velocity.array;
    const lifetimes = this.particleSystem.geometry.attributes.lifetime.array;
    const sizes = this.particleSystem.geometry.attributes.size.array;
    
    // Update particles
    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3;
      
      // Update lifetime
      lifetimes[particleIndex] -= deltaTime;
      
      if (lifetimes[particleIndex] <= 0) {
        // Reset particle at random engine position (local space)
        const engineIndex = Math.floor(Math.random() * this.enginePositions.length);
        const enginePos = this.enginePositions[engineIndex];
        
        positions[i] = enginePos.x + (Math.random() - 0.5) * 0.5;
        positions[i + 1] = enginePos.y + (Math.random() - 0.5) * 0.5;
        positions[i + 2] = enginePos.z + (Math.random() - 0.5) * 0.5;
        
        // Reset velocity based on throttle
        const throttleMultiplier = 0.5 + throttle * 1.5; // 0.5x to 2x speed
        velocities[i] = (Math.random() - 0.5) * 0.1;
        velocities[i + 1] = (Math.random() - 0.5) * 0.1;
        velocities[i + 2] = (Math.random() * 0.3 + 0.1) * throttleMultiplier; // Forward (backward from ship's perspective)
        
        // Reset lifetime
        lifetimes[particleIndex] = Math.random() * 2 + 1;
        
        // Reset size based on throttle
        sizes[particleIndex] = (Math.random() * 0.2 + 0.05) * (0.5 + throttle * 0.5);
      } else {
        // Update position
        positions[i] += velocities[i] * deltaTime;
        positions[i + 1] += velocities[i + 1] * deltaTime;
        positions[i + 2] += velocities[i + 2] * deltaTime;
      }
    }
    
    // Update material properties based on throttle
    this.particleSystem.material.opacity = 0.3 + throttle * 0.5;
    this.particleSystem.material.size = 0.05 + throttle * 0.15;
    
    // Mark attributes as needing update
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.lifetime.needsUpdate = true;
    this.particleSystem.geometry.attributes.size.needsUpdate = true;
  }

  setActive(active) {
    this.isActive = active;
    this.particleSystem.visible = active;
    
    if (active) {
      // Attach particle system to ship's third person group
      if (this.spaceship.thirdPersonGroup && !this.particleSystem.parent) {
        this.spaceship.thirdPersonGroup.add(this.particleSystem);
      }
      this.resetParticles();
    } else {
      // Detach particle system from ship
      if (this.particleSystem.parent) {
        this.particleSystem.parent.remove(this.particleSystem);
      }
    }
  }

  isCameraRecenterDisabled() {
    return this.disableCameraRecenter;
  }

  destroy() {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      this.particleSystem.material.dispose();
    }
    
    // Clean up debug UI
    if (this.debugPanel && this.debugPanel.parentNode) {
      this.debugPanel.parentNode.removeChild(this.debugPanel);
    }
  }
}
