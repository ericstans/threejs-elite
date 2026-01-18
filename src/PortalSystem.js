import * as THREE from 'three';

const DEBUG = false;

export class PortalSystem {
  constructor(scene, gameEngine, spaceship) {
    this.scene = scene;
    this.gameEngine = gameEngine;
    this.spaceship = spaceship;
    this.portal = null;
    this.particles = null;
    this.isActive = false;
    this.animationTime = 0;
    this.animationDuration = 4.0; // 4 seconds for portal opening
    this.travelDuration = 2.0; // 2 seconds for ship travel through portal
    this.portalSize = 0;
    this.maxPortalSize = 25;
    this.destinationPreview = null;
    this.onComplete = null;
    this.cachedSectorObjects = null;
    this.sectorDefinition = null;
    this.availableSectors = null;
    this.getSectorDefinition = null;

    // Stencil buffer materials for portal effect
    this.portalStencilMaterial = null;

    // Render target for portal view
    this.renderTarget = null;
    this.portalCamera = null;
    this.portalView = null;

    this.createStencilMaterials();
    this.setupRenderTarget();
  }

  // Set up sector data references
  setSectorData(availableSectors, getSectorDefinition) {
    this.availableSectors = availableSectors;
    this.getSectorDefinition = getSectorDefinition;
  }

  createPortal(destinationSectorId, onComplete) {
    this.onComplete = onComplete;
    this.destinationSectorId = destinationSectorId;
    this.isActive = true;
    this.animationTime = 0;
    this.portalSize = 0;
    this.shipStopping = true;
    this.shipStoppingTime = 0;
    this.shipStoppingDuration = 2.0; // 2 seconds to come to a stop

    // Pre-cache the destination sector geometry
    this.preCacheSectorGeometry(destinationSectorId);

    // Create portal geometry - a flat circular portal
    this.createPortalMesh();
    this.createPortalParticles();
    this.createDestinationPreview();

    // Position portal in front of ship
    this.positionPortalInFrontOfShip();

    // Hide portal during ship stopping phase
    this.portal.visible = false;
  }

  createPortalMesh() {
    // Create portal ring geometry
    const outerRadius = this.maxPortalSize;
    const innerRadius = this.maxPortalSize * 0.85;
    const segments = 32;

    // Create outer ring
    const outerGeometry = new THREE.RingGeometry(innerRadius, outerRadius, segments);
    const outerMaterial = new THREE.MeshBasicMaterial({
      color: 0x00aaff,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });
    const outerRing = new THREE.Mesh(outerGeometry, outerMaterial);

    // Create inner portal surface using render target texture
    const innerGeometry = new THREE.CircleGeometry(innerRadius, segments);
    const innerMaterial = new THREE.MeshBasicMaterial({
      // Use the render target as a texture
      map: this.renderTarget.texture,
      transparent: true,
      opacity: 1.0,
      side: THREE.DoubleSide,
      // Make sure this is rendered after the ring
      depthWrite: false
    });
    const innerPortal = new THREE.Mesh(innerGeometry, innerMaterial);

    // Store reference to inner portal for operations
    this.innerPortal = innerPortal;

    // Create portal group
    this.portal = new THREE.Group();
    this.portal.add(outerRing);
    this.portal.add(innerPortal);

    // Add swirling energy effect
    this.createSwirlingEnergy();

    this.scene.add(this.portal);

    if (DEBUG) console.log('🔍 PortalSystem: Portal mesh created with render target texture');
  }

  createSwirlingEnergy() {
    // Create multiple rings for swirling effect
    const ringCount = 5;
    for (let i = 0; i < ringCount; i++) {
      const radius = this.maxPortalSize * (0.3 + (i / ringCount) * 0.7);
      const geometry = new THREE.RingGeometry(radius * 0.9, radius, 16);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color().setHSL(0.6 + i * 0.1, 1.0, 0.5),
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
      });
      const ring = new THREE.Mesh(geometry, material);
      ring.userData.originalRadius = radius;
      ring.userData.rotationSpeed = (i + 1) * 0.5;
      this.portal.add(ring);
    }
  }

  createPortalParticles() {
    // Create particle system for swirling portal effects
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const lifetimes = new Float32Array(particleCount);
    const sizes = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    // Initialize particles in a circular pattern around the portal
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = this.maxPortalSize * (0.5 + Math.random() * 0.5);

      positions[i3] = Math.cos(angle) * radius;
      positions[i3 + 1] = Math.sin(angle) * radius;
      positions[i3 + 2] = (Math.random() - 0.5) * 2; // Slight Z variation

      // Tangential velocity for swirling effect
      velocities[i3] = -Math.sin(angle) * 0.5;
      velocities[i3 + 1] = Math.cos(angle) * 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;

      lifetimes[i] = Math.random() * 3 + 2; // 2-5 seconds
      sizes[i] = Math.random() * 0.3 + 0.1;

      // Color variation
      const hue = 0.5 + Math.random() * 0.3; // Blue to cyan range
      const color = new THREE.Color().setHSL(hue, 1.0, 0.7);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.2,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      vertexColors: true,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.portal.add(this.particles);
  }

  preCacheSectorGeometry(sectorId) {
    if (DEBUG) console.log('🔍 PortalSystem: Pre-caching sector geometry for', sectorId);

    // Get sector definition
    this.sectorDefinition = this.getSectorDefinition ? this.getSectorDefinition(sectorId) : null;
    const sectorMeta = this.availableSectors ? this.availableSectors.find(s => s.id === sectorId) : null;

    if (DEBUG) console.log('🔍 PortalSystem: Sector definition:', this.sectorDefinition);
    if (DEBUG) console.log('🔍 PortalSystem: Sector meta:', sectorMeta);
    if (DEBUG) console.log('🔍 PortalSystem: Available sectors:', this.availableSectors);

    this.cachedSectorObjects = new THREE.Group();

    if (this.sectorDefinition) {
      if (DEBUG) console.log('🔍 PortalSystem: Creating planets from definition');
      // Create planets from definition
      this.createPlanetsFromDefinition();
      // Create stations from definition
      this.createStationsFromDefinition();
    } else if (sectorMeta) {
      if (DEBUG) console.log('🔍 PortalSystem: Creating procedural preview');
      // For procedural sectors, create a basic preview
      this.createProceduralPreview();
    } else {
      if (DEBUG) console.log('🔍 PortalSystem: No sector definition or meta found, creating fallback');
      this.createProceduralPreview();
    }

    if (DEBUG) console.log('🔍 PortalSystem: Cached objects children count:', this.cachedSectorObjects.children.length);
    if (DEBUG) console.log('🔍 PortalSystem: Cached objects:', this.cachedSectorObjects);

    // Position the cached objects relative to the portal
    this.cachedSectorObjects.position.z = -this.maxPortalSize * 0.5;
  }

  createPlanetsFromDefinition() {
    if (!this.sectorDefinition.planets) {
      if (DEBUG) console.log('🔍 PortalSystem: No planets in sector definition');
      return;
    }

    if (DEBUG) console.log('🔍 PortalSystem: Creating', this.sectorDefinition.planets.length, 'planets from definition');

    for (const planetDef of this.sectorDefinition.planets) {
      if (DEBUG) console.log('🔍 PortalSystem: Creating planet:', planetDef.name, 'at', planetDef.position, 'radius:', planetDef.radius);

      const geometry = new THREE.SphereGeometry(planetDef.radius * 0.5, 8, 6); // Scale down for preview
      const material = new THREE.MeshLambertMaterial({
        color: planetDef.color,
        flatShading: true,
        // Add emissive to make colors more vibrant in the portal
        emissive: new THREE.Color(planetDef.color).multiplyScalar(0.1)
      });

      if (DEBUG) console.log('🔍 PortalSystem: Planet color for', planetDef.name, ':', planetDef.color, 'hex:', planetDef.color.toString(16));

      const planet = new THREE.Mesh(geometry, material);

      // Position relative to ship spawn point, with 50% zoom out
      const spawnPoint = this.getSectorSpawnPoint();
      const relativePos = new THREE.Vector3(
        (planetDef.position.x - spawnPoint.x) * 0.2, // 50% zoom out (0.1 * 2)
        (planetDef.position.y - spawnPoint.y) * 0.2,
        (planetDef.position.z - spawnPoint.z) * 0.2 - 5 // Move closer to portal
      );

      planet.position.copy(relativePos);
      if (DEBUG) console.log('🔍 PortalSystem: Planet positioned at:', planet.position, 'spawn point:', spawnPoint);

      this.cachedSectorObjects.add(planet);
    }
  }

  createStationsFromDefinition() {
    if (!this.sectorDefinition.stations) return;

    for (const stationDef of this.sectorDefinition.stations) {
      // Find the planet this station orbits
      const planet = this.sectorDefinition.planets.find(p => p.name === stationDef.planetName);
      if (!planet) continue;

      const geometry = new THREE.BoxGeometry(stationDef.size * 0.25, stationDef.size * 0.25, stationDef.size * 0.25);
      const material = new THREE.MeshLambertMaterial({
        color: 0x888888,
        flatShading: true
      });

      const station = new THREE.Mesh(geometry, material);

      // Position relative to planet, using spawn point and 50% zoom out
      const spawnPoint = this.getSectorSpawnPoint();
      const planetPos = new THREE.Vector3(
        (planet.position.x - spawnPoint.x) * 0.2,
        (planet.position.y - spawnPoint.y) * 0.2,
        (planet.position.z - spawnPoint.z) * 0.2 - 5
      );

      // Add orbit offset
      const orbitAngle = Math.random() * Math.PI * 2;
      station.position.set(
        planetPos.x + Math.cos(orbitAngle) * stationDef.orbitRadius * 0.2,
        planetPos.y,
        planetPos.z + Math.sin(orbitAngle) * stationDef.orbitRadius * 0.2
      );

      this.cachedSectorObjects.add(station);
    }
  }

  createProceduralPreview() {
    // Create a few random planets for procedural sectors
    const planetCount = 2 + Math.floor(Math.random() * 3);

    for (let i = 0; i < planetCount; i++) {
      const radius = 0.5 + Math.random() * 1.0;
      const geometry = new THREE.SphereGeometry(radius, 8, 6);
      const material = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5),
        flatShading: true
      });

      const planet = new THREE.Mesh(geometry, material);

      // Position randomly within sector bounds
      const angle = (i / planetCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 2 + Math.random() * 3;
      planet.position.set(
        Math.cos(angle) * distance,
        Math.sin(angle) * distance,
        -3 - Math.random() * 2
      );

      this.cachedSectorObjects.add(planet);
    }
  }

  getSectorSpawnPoint() {
    // Use the actual spawn point where the ship will appear after warping
    const sectorMeta = this.availableSectors ? this.availableSectors.find(s => s.id === this.destinationSectorId) : null;
    if (sectorMeta && sectorMeta.center) {
      // This matches the spawn logic in performSectorSwitch
      return new THREE.Vector3(
        sectorMeta.center.x,
        sectorMeta.center.y,
        sectorMeta.center.z + 150 // offset slightly in front
      );
    }

    if (this.sectorDefinition && this.sectorDefinition.planets && this.sectorDefinition.planets.length > 0) {
      // Use first planet as reference point with offset
      return new THREE.Vector3(
        this.sectorDefinition.planets[0].position.x,
        this.sectorDefinition.planets[0].position.y,
        this.sectorDefinition.planets[0].position.z + 150
      );
    }

    return new THREE.Vector3(0, 0, -650); // Default spawn point
  }

  createDestinationPreview() {
    if (DEBUG) console.log('🔍 PortalSystem: Creating destination preview for portal view');

    // Create objects for the portal view scene
    if (!this.portalView) {
      if (DEBUG) console.log('🔍 PortalSystem: Cannot create destination preview - portalView not initialized');
      return;
    }

    // Create a starfield background for the portal
    const starfieldGeometry = new THREE.SphereGeometry(100, 16, 16);
    const starfieldMaterial = new THREE.MeshBasicMaterial({
      color: 0x000011,
      side: THREE.BackSide
    });
    const starfield = new THREE.Mesh(starfieldGeometry, starfieldMaterial);
    this.portalView.add(starfield);

    // Add the cached sector objects to the portal view scene
    if (this.cachedSectorObjects) {
      if (DEBUG) console.log('🔍 PortalSystem: Adding cached sector objects to portal view, count:', this.cachedSectorObjects.children.length);

      // Create a clone of the cached sector objects for the portal view
      this.destinationPreview = this.cachedSectorObjects.clone();

      // Position the destination preview
      this.destinationPreview.position.z = -20;

      // Add to the portal view scene
      this.portalView.add(this.destinationPreview);
    } else {
      if (DEBUG) console.log('🔍 PortalSystem: No cached sector objects to add');

      // Create a fallback preview
      this.destinationPreview = new THREE.Group();
      this.portalView.add(this.destinationPreview);
    }

    // Add some preview stars for depth
    this.createPreviewStars();

    if (DEBUG) console.log('🔍 PortalSystem: Destination preview created for portal view with',
      this.destinationPreview ? this.destinationPreview.children.length : 0, 'children');
  }

  applyFOVCulling() {
    if (!this.cachedSectorObjects || !this.portal) return;

    const portalNormal = new THREE.Vector3(0, 0, 1); // Portal faces forward
    const fovAngle = Math.PI / 2; // 90 degree FOV cone (more permissive)
    const maxDistance = this.maxPortalSize * 10; // Much larger distance to consider

    if (DEBUG) console.log('🔍 PortalSystem: Applying FOV culling, maxDistance:', maxDistance, 'fovAngle:', fovAngle * 180 / Math.PI);

    this.cachedSectorObjects.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const objectPosition = child.position.clone();
        const direction = objectPosition.clone().normalize();

        // Check if object is within FOV cone
        const dotProduct = direction.dot(portalNormal);
        const angle = Math.acos(Math.max(-1, Math.min(1, dotProduct)));
        const distance = objectPosition.length();

        // Show object if it's within FOV and distance
        const isVisible = angle <= fovAngle && distance <= maxDistance;
        child.visible = isVisible;

        if (DEBUG) console.log('🔍 PortalSystem: Object', child.type, 'at distance', distance.toFixed(2), 'angle', (angle * 180 / Math.PI).toFixed(2), 'visible:', isVisible);
      }
    });
  }


  createPreviewStars() {
    // Create small star points for the preview
    const starCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const i3 = i * 3;
      // Random positions within a sphere
      const radius = 20 + Math.random() * 40;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi) - 20; // Offset back
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.5,
      sizeAttenuation: true
    });

    const stars = new THREE.Points(geometry, material);

    // Add stars to the portal view scene
    if (this.portalView) {
      this.portalView.add(stars);
    } else if (this.destinationPreview) {
      this.destinationPreview.add(stars);
    }

    if (DEBUG) console.log('🔍 PortalSystem: Preview stars created');
  }

  positionPortalInFrontOfShip() {
    if (!this.portal || !this.spaceship) return;

    // Position portal 50 units in front of ship
    const shipPosition = this.spaceship.getPosition();
    const shipDirection = new THREE.Vector3(0, 0, -1);

    // Apply ship rotation to direction
    shipDirection.applyQuaternion(this.spaceship.mesh.quaternion);

    const portalPosition = shipPosition.clone().add(shipDirection.multiplyScalar(50));
    this.portal.position.copy(portalPosition);

    // Orient portal to face the ship
    this.portal.lookAt(shipPosition);
  }

  update(deltaTime) {
    if (!this.isActive || !this.portal) return;

    // Phase 1: Ship stopping
    if (this.shipStopping) {
      this.shipStoppingTime += deltaTime;
      const stoppingProgress = Math.min(this.shipStoppingTime / this.shipStoppingDuration, 1.0);

      // Gradually reduce ship velocity to zero
      if (this.spaceship) {
        const currentVelocity = this.spaceship.velocity.clone();
        const targetVelocity = new THREE.Vector3(0, 0, 0);
        const newVelocity = currentVelocity.lerp(targetVelocity, stoppingProgress);
        this.spaceship.velocity.copy(newVelocity);

        // Also reduce throttle to zero
        const currentThrottle = this.spaceship.getThrottle();
        const newThrottle = currentThrottle * (1 - stoppingProgress);
        this.spaceship.setThrottle(newThrottle);

        if (DEBUG) console.log('🔍 PortalSystem: Ship stopping progress:', (stoppingProgress * 100).toFixed(1) + '%', 'velocity:', this.spaceship.velocity.length().toFixed(2), 'throttle:', this.spaceship.getThrottle().toFixed(2));
      }

      // When ship has stopped, start portal animation
      if (stoppingProgress >= 1.0) {
        this.shipStopping = false;
        this.animationTime = 0; // Reset animation time for portal opening
        this.portal.visible = true; // Make portal visible when animation starts
        if (DEBUG) console.log('🔍 PortalSystem: Ship stopped, starting portal animation');
      }

      return; // Don't animate portal until ship has stopped
    }

    // Phase 2: Portal animation
    this.animationTime += deltaTime;
    const progress = Math.min(this.animationTime / this.animationDuration, 1.0);

    // Animate portal opening
    this.portalSize = this.maxPortalSize * this.easeOutCubic(progress);
    this.portal.scale.setScalar(this.portalSize / this.maxPortalSize);

    // Ensure the portal always faces the camera
    if (this.gameEngine && this.gameEngine.camera) {
      // Update the portal's rotation to face the camera
      this.portal.lookAt(this.gameEngine.camera.position);

      // Update the portal camera position and rotation based on the main camera
      if (this.portalCamera) {
        // Position the portal camera behind the portal facing inward
        const portalPosition = this.portal.position.clone();
        const cameraPosition = this.gameEngine.camera.position.clone();

        // Get the direction from the camera to the portal
        const portalToCameraDir = cameraPosition.clone().sub(portalPosition).normalize();

        // Position the portal camera slightly behind the portal in the opposite direction
        const portalCameraPosition = portalPosition.clone().sub(portalToCameraDir.multiplyScalar(5));
        this.portalCamera.position.copy(portalCameraPosition);

        // Make the portal camera look at the destination preview
        if (this.destinationPreview) {
          const lookAtPoint = this.destinationPreview.position.clone();
          this.portalCamera.lookAt(lookAtPoint);
        } else {
          // Just look straight ahead if no destination preview
          const lookAtPoint = portalPosition.clone().add(new THREE.Vector3(0, 0, -10));
          this.portalCamera.lookAt(lookAtPoint);
        }
      }
    }

    // Render the portal view to the render target
    if (this.gameEngine && this.gameEngine.renderer && this.portalView && this.portalCamera && this.renderTarget) {
      // Update any animations in the portal view
      if (this.destinationPreview) {
        this.destinationPreview.rotation.y += deltaTime * 0.1; // Slow rotation effect
      }

      // Render the portal view to the render target
      const currentRenderTarget = this.gameEngine.renderer.getRenderTarget();
      this.gameEngine.renderer.setRenderTarget(this.renderTarget);
      this.gameEngine.renderer.render(this.portalView, this.portalCamera);
      this.gameEngine.renderer.setRenderTarget(currentRenderTarget);
    }

    // Animate swirling rings
    this.portal.children.forEach((child, index) => {
      if (child.userData.rotationSpeed) {
        child.rotation.z += child.userData.rotationSpeed * deltaTime;
        // Pulsing effect
        const pulse = 1 + Math.sin(this.animationTime * 2 + index) * 0.1;
        child.scale.setScalar(pulse);
      }
    });

    // Update particles
    this.updateParticles(deltaTime);

    // Check if portal is fully open and start ship travel
    if (progress >= 1.0 && this.animationTime < this.animationDuration + this.travelDuration) {
      this.animateShipTravel(deltaTime);
    }

    // Complete animation
    if (this.animationTime >= this.animationDuration + this.travelDuration) {
      this.completeAnimation();
    }
  }

  updateParticles(deltaTime) {
    if (!this.particles) return;

    const positions = this.particles.geometry.attributes.position.array;
    const velocities = this.particles.geometry.attributes.velocity.array;
    const lifetimes = this.particles.geometry.attributes.lifetime.array;
    const sizes = this.particles.geometry.attributes.size.array;

    for (let i = 0; i < positions.length; i += 3) {
      const particleIndex = i / 3;

      // Update lifetime
      lifetimes[particleIndex] -= deltaTime;

      if (lifetimes[particleIndex] <= 0) {
        // Reset particle
        const angle = Math.random() * Math.PI * 2;
        const radius = this.portalSize * (0.5 + Math.random() * 0.5);

        positions[i] = Math.cos(angle) * radius;
        positions[i + 1] = Math.sin(angle) * radius;
        positions[i + 2] = (Math.random() - 0.5) * 2;

        // Reset velocity
        velocities[i] = -Math.sin(angle) * 0.5;
        velocities[i + 1] = Math.cos(angle) * 0.5;
        velocities[i + 2] = (Math.random() - 0.5) * 0.2;

        lifetimes[particleIndex] = Math.random() * 3 + 2;
        sizes[particleIndex] = Math.random() * 0.3 + 0.1;
      } else {
        // Update position
        positions[i] += velocities[i] * deltaTime;
        positions[i + 1] += velocities[i + 1] * deltaTime;
        positions[i + 2] += velocities[i + 2] * deltaTime;
      }
    }

    this.particles.geometry.attributes.position.needsUpdate = true;
    this.particles.geometry.attributes.lifetime.needsUpdate = true;
    this.particles.geometry.attributes.size.needsUpdate = true;
  }

  animateShipTravel(deltaTime) {
    if (!this.spaceship) return;

    const shipPosition = this.spaceship.getPosition();
    const portalPosition = this.portal.position;

    // Calculate direction from ship to portal
    const direction = portalPosition.clone().sub(shipPosition).normalize();

    // Move ship towards portal
    const travelSpeed = 25; // units per second
    const movement = direction.multiplyScalar(travelSpeed * deltaTime);
    this.spaceship.position.add(movement);

    // Update camera position
    this.gameEngine.camera.position.copy(this.spaceship.position);
  }

  completeAnimation() {
    this.isActive = false;

    // Clean up portal
    if (this.portal) {
      this.scene.remove(this.portal);
      this.portal = null;
    }

    if (this.particles) {
      this.particles = null;
    }

    // Clean up cached sector objects
    this.cleanupCachedGeometry();

    // Call completion callback
    if (this.onComplete) {
      this.onComplete();
    }
  }

  cleanupCachedGeometry() {
    if (this.cachedSectorObjects) {
      // Dispose of geometries and materials
      this.cachedSectorObjects.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }

          // If we stored original materials, restore them before disposal
          if (child.userData.originalMaterial) {
            // Dispose of the cloned material
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
          else if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(material => material.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      this.cachedSectorObjects = null;
    }

    // Clean up portal view scene
    if (this.portalView) {
      // Clear the scene
      while (this.portalView.children.length > 0) {
        const child = this.portalView.children[0];
        this.portalView.remove(child);

        // Dispose resources
        if (child instanceof THREE.Mesh) {
          if (child.geometry) {
            child.geometry.dispose();
          }
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      }
    }

    // Clean up destination preview
    this.destinationPreview = null;

    // Dispose of stencil materials
    if (this.portalStencilMaterial) {
      this.portalStencilMaterial.dispose();
    }
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  destroy() {
    if (this.portal) {
      this.scene.remove(this.portal);
      this.portal = null;
    }

    // Clean up render target
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }

    // Clean up portal camera
    if (this.portalCamera) {
      this.portalCamera = null;
    }

    // Clean up portal view
    if (this.portalView) {
      while (this.portalView.children.length > 0) {
        this.portalView.remove(this.portalView.children[0]);
      }
      this.portalView = null;
    }

    this.isActive = false;

    if (DEBUG) console.log('🔍 PortalSystem: Resources destroyed');
  }

  // Create materials used for stencil buffer operations
  createStencilMaterials() {
    // Material that will write to the stencil buffer but not to the color or depth buffer
    this.portalStencilMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      colorWrite: false,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp
    });
  }

  // Set up render target for portal view
  setupRenderTarget() {
    // Create a render target for the portal view
    const width = 512;  // Power of 2 for better performance
    const height = 512;
    this.renderTarget = new THREE.WebGLRenderTarget(width, height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      stencilBuffer: false,  // Don't need stencil in the render target
      depthBuffer: true
    });

    // Create a camera for rendering the portal view
    this.portalCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);

    // Create a scene for the portal view
    this.portalView = new THREE.Scene();
    this.portalView.background = new THREE.Color(0x000011);  // Dark blue background

    // Add ambient light for the portal view
    const ambientLight = new THREE.AmbientLight(0x333333);
    this.portalView.add(ambientLight);

    // Add directional light for the portal view
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    this.portalView.add(directionalLight);

    if (DEBUG) console.log('🔍 PortalSystem: Render target set up for portal view');
  }

  // Set up stencil rendering state for portal contents
  setupStencilForPortalContents(renderer) {
    if (DEBUG) console.log('🔍 PortalSystem: Setting up stencil for portal contents');

    // Clear the stencil buffer first
    renderer.state.buffers.stencil.setClear(0);
    renderer.clearStencil();

    // Configure renderer to only render where stencil buffer is set
    renderer.state.buffers.stencil.setTest(true);
    renderer.state.buffers.stencil.setFunc(THREE.EqualStencilFunc, 1, 0xff);
    renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.KeepStencilOp);

    // Make sure all objects in the destination preview have the stencil test enabled
    if (this.destinationPreview) {
      if (DEBUG) console.log('🔍 PortalSystem: Setting stencil properties on destination preview objects');
      let meshCount = 0;

      this.destinationPreview.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          meshCount++;
          // Enable stencil test on all materials
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.stencilWrite = false;  // Don't write to stencil
              mat.stencilRef = 1;        // Match the value we wrote
              mat.stencilFunc = THREE.EqualStencilFunc;
              mat.stencilZPass = THREE.KeepStencilOp;
              mat.needsUpdate = true;    // Important to apply changes
            });
          } else {
            child.material.stencilWrite = false;
            child.material.stencilRef = 1;
            child.material.stencilFunc = THREE.EqualStencilFunc;
            child.material.stencilZPass = THREE.KeepStencilOp;
            child.material.needsUpdate = true;
          }
        }
      });

      if (DEBUG) console.log(`🔍 PortalSystem: Updated stencil properties on ${meshCount} meshes`);
    } else {
      if (DEBUG) console.log('🔍 PortalSystem: No destination preview to update');
    }
  }

  // Clear stencil state after rendering portal contents
  clearStencilState(renderer) {
    if (DEBUG) console.log('🔍 PortalSystem: Clearing stencil state');

    // Disable stencil test
    renderer.state.buffers.stencil.setTest(false);

    // Reset stencil settings on all destination preview materials
    if (this.destinationPreview) {
      if (DEBUG) console.log('🔍 PortalSystem: Resetting stencil properties on destination preview objects');
      let meshCount = 0;

      this.destinationPreview.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          meshCount++;
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => {
              mat.stencilWrite = false;
              mat.needsUpdate = true;
            });
          } else {
            child.material.stencilWrite = false;
            child.material.needsUpdate = true;
          }
        }
      });

      if (DEBUG) console.log(`🔍 PortalSystem: Reset stencil properties on ${meshCount} meshes`);
    }
  }

  // Render the portal to the stencil buffer
  renderPortalToStencil(renderer) {
    // Only if portal is active
    if (!this.isActive || !this.portal || !this.innerPortal) {
      if (DEBUG) console.log('🔍 PortalSystem: Cannot render to stencil - missing components', {
        isActive: this.isActive,
        hasPortal: !!this.portal,
        hasInnerPortal: !!this.innerPortal
      });
      return;
    }

    if (DEBUG) console.log('🔍 PortalSystem: Rendering portal to stencil buffer');

    // Clear the stencil buffer before writing to it
    renderer.state.buffers.stencil.setClear(0);
    renderer.clearStencil();

    // Save original material
    const originalMaterial = /** @type {THREE.Mesh} */(this.innerPortal).material;

    // Configure the stencil material to write to the stencil buffer
    this.portalStencilMaterial.stencilWrite = true;
    this.portalStencilMaterial.stencilRef = 1;
    this.portalStencilMaterial.stencilFunc = THREE.AlwaysStencilFunc;
    this.portalStencilMaterial.stencilZPass = THREE.ReplaceStencilOp;
    this.portalStencilMaterial.needsUpdate = true;

    // Use stencil material to write to stencil buffer
    /** @type {THREE.Mesh} */(this.innerPortal).material = this.portalStencilMaterial;

    // Enable stencil operations
    renderer.state.buffers.stencil.setTest(true);
    renderer.state.buffers.stencil.setMask(0xff);
    renderer.state.buffers.stencil.setFunc(THREE.AlwaysStencilFunc, 1, 0xff);
    renderer.state.buffers.stencil.setOp(THREE.KeepStencilOp, THREE.KeepStencilOp, THREE.ReplaceStencilOp);

    // Render portal to stencil buffer only
    renderer.render(this.portal, this.gameEngine.camera);

    // Restore original material
    /** @type {THREE.Mesh} */(this.innerPortal).material = originalMaterial;

    if (DEBUG) console.log('🔍 PortalSystem: Portal rendered to stencil buffer');
  }
}
