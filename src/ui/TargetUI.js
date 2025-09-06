import * as THREE from 'three';

export class TargetUI {
  createOffscreenArrow() {
    // Red arrow for offscreen target
    this.offscreenArrow = document.createElement('div');
    this.offscreenArrow.style.position = 'fixed';
    this.offscreenArrow.style.width = '0';
    this.offscreenArrow.style.height = '0';
    this.offscreenArrow.style.borderLeft = '18px solid transparent';
    this.offscreenArrow.style.borderRight = '18px solid transparent';
    this.offscreenArrow.style.borderBottom = '32px solid #ff2222';
    this.offscreenArrow.style.zIndex = '2000';
    this.offscreenArrow.style.display = 'none';
    this.offscreenArrow.style.pointerEvents = 'none';
    this.container.appendChild(this.offscreenArrow);
  }
  constructor(container) {
    this.container = container;
  this._lowResScale = 0.7; // match nav target low-res factor
    this.createTargetPanel();
    this.createTargetIndicator();
    this.createOffscreenArrow();
  }

  createTargetPanel() {
    // Target panel (initially hidden)
    this.targetPanel = document.createElement('div');
    this.targetPanel.style.position = 'absolute';
    this.targetPanel.style.height = '20%';
    this.targetPanel.style.width = '10%';
    //this.targetPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    this.targetPanel.style.padding = '15px';
    //this.targetPanel.style.border = '1px solid #00ff00';
    this.targetPanel.style.fontSize = '16px';
    this.targetPanel.style.lineHeight = '1.4';
    this.targetPanel.style.display = 'none'; // Initially hidden
    
    this.container.appendChild(this.targetPanel);

    this.targetTitle = document.createElement('div');
    this.targetTitle.textContent = 'TARGET';
    this.targetTitle.style.marginBottom = '5px';
    this.targetTitle.style.fontWeight = 'bold';
    this.targetPanel.appendChild(this.targetTitle);

    this.targetId = document.createElement('div');
    this.targetPanel.appendChild(this.targetId);

    this.targetMass = document.createElement('div');
    this.targetPanel.appendChild(this.targetMass);

    this.targetDistance = document.createElement('div');
    this.targetPanel.appendChild(this.targetDistance);

    this.targetHealth = document.createElement('div');
    this.targetPanel.appendChild(this.targetHealth);

    // Target commable indicator
    this.targetCommableIndicator = document.createElement('div');
    this.targetCommableIndicator.style.position = 'absolute';
    this.targetCommableIndicator.style.left = '80%';
    this.targetCommableIndicator.style.top = '10px';
    this.targetCommableIndicator.style.fontSize = '16px';
    this.targetCommableIndicator.style.display = 'none';
    this.targetPanel.appendChild(this.targetCommableIndicator);

    // Preview underlay
    this.previewWrapper = document.createElement('div');
    this.previewWrapper.style.position = 'absolute';
    this.previewWrapper.style.left = '50%';
    this.previewWrapper.style.top = '50%';
    this.previewWrapper.style.transform = 'translate(-50%, -50%)';
    this.previewWrapper.style.width = '100%';
    this.previewWrapper.style.height = '100%';
    this.previewWrapper.style.pointerEvents = 'none';
    this.previewWrapper.style.zIndex = '0';
    this.targetPanel.appendChild(this.previewWrapper);
    // Elevate text above underlay
    for (const child of this.targetPanel.children) {
      if (child !== this.previewWrapper) {
        child.style.position = child.style.position || 'relative';
        child.style.zIndex = '1';
      }
    }
    this._initPreviewScene();
  }

  createTargetIndicator() {
    // Target indicator (red rectangle around targeted asteroid)
    this.targetIndicator = document.createElement('div');
    this.targetIndicator.style.position = 'absolute';
    this.targetIndicator.style.border = '2px solid #ff0000';
    this.targetIndicator.style.background = 'transparent';
    this.targetIndicator.style.pointerEvents = 'none';
    this.targetIndicator.style.display = 'none'; // Initially hidden
    this.targetIndicator.style.zIndex = '1000';
    this.container.appendChild(this.targetIndicator);
  }

  updateTargetInfo(targetInfo, targetPosition, camera) {
    this.targetPanel.style.display = 'block';
    this.targetId.textContent = `ID: ${targetInfo.id}`;
    this.targetMass.textContent = `Mass: ${targetInfo.mass.toFixed(1)}`;
    this.targetDistance.textContent = `Distance: ${targetInfo.distance.toFixed(1)}`;
    this.targetHealth.textContent = `Health: ${targetInfo.health}/${targetInfo.maxHealth}`;
    
    // Show/hide commable indicator
    if (targetInfo.isCommable) {
      this.targetCommableIndicator.style.display = 'block';
      this.targetCommableIndicator.textContent = '📡V';
    } else {
      this.targetCommableIndicator.style.display = 'none';
    }
    
    // Update target indicator position
  this.updateTargetIndicator(targetPosition, camera);
  if (targetInfo.__ref) this._updatePreview(targetInfo.__ref);
  }

  updateTargetIndicator(targetPosition, camera) {
    if (!targetPosition || !camera) {
      this.targetIndicator.style.display = 'none';
      this.offscreenArrow.style.display = 'none';
      return;
    }

    // Convert 3D world position to 2D screen coordinates
    const vector = targetPosition.clone();
    vector.project(camera);

    const behind = vector.z > 1; // target is behind camera
    const offscreen = behind || vector.x < -1 || vector.x > 1 || vector.y < -1 || vector.y > 1;

    if (offscreen) {
      this.targetIndicator.style.display = 'none';
      // Use a stable direction; if behind, flip so arrow indicates turn direction instead of collapsing to center
      let dx = vector.x;
      let dy = vector.y;
      if (behind) { dx = -dx; dy = -dy; }
      // Avoid near-zero collapse (exactly behind / forward)
      const eps = 1e-4;
      if (Math.hypot(dx, dy) < eps) {
        // Choose upward by default
        dx = 0; dy = 1;
      }
      // Scale to edge while preserving aspect
      const scale = 0.92 / Math.max(Math.abs(dx), Math.abs(dy));
      dx *= scale;
      dy *= scale;
      const screenX = (dx * 0.5 + 0.5) * window.innerWidth;
      const screenY = (dy * -0.5 + 0.5) * window.innerHeight;
      this.offscreenArrow.style.display = 'block';
      this.offscreenArrow.style.left = `${screenX - 18}px`;
      this.offscreenArrow.style.top = `${screenY - 32}px`;
      // Snap to cardinal direction
      let rotation = 0;
      if (Math.abs(dy) >= Math.abs(dx)) {
        rotation = dy < 0 ? Math.PI : 0; // Top => point down (target above), Bottom => up
      } else {
        rotation = dx < 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      this.offscreenArrow.style.transform = `rotate(${rotation}rad)`;
      return;
    }

    // On screen: show indicator, hide arrow
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    this.targetIndicator.style.display = 'block';
    this.targetIndicator.style.left = `${x - 25}px`;
    this.targetIndicator.style.top = `${y - 25}px`;
    this.targetIndicator.style.width = '50px';
    this.targetIndicator.style.height = '50px';
    this.offscreenArrow.style.display = 'none';
  }

  clearTargetInfo() {
    this.targetPanel.style.display = 'none';
    this.targetIndicator.style.display = 'none';
    this.targetCommableIndicator.style.display = 'none';
    this._clearPreview();
  }

  _initPreviewScene() {
    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    this.previewCamera.position.set(0, 0, 5);
    this.previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.previewRenderer.setSize(200, 200);
    this.previewRenderer.domElement.style.width = '100%';
    this.previewRenderer.domElement.style.height = '100%';
    this.previewRenderer.domElement.style.opacity = '0.22';
  this.previewRenderer.domElement.style.imageRendering = 'pixelated';
  this.previewRenderer.domElement.style.imageRendering = 'crisp-edges';
    this.previewWrapper.appendChild(this.previewRenderer.domElement);
    const amb = new THREE.AmbientLight(0xffffff, 0.5);
    this.previewScene.add(amb);
    // Add dither overlay (option 4)
    this._ditherEnabled = true;
    this._addDitherOverlay();
  }

  _addDitherOverlay() {
    if (this._ditherLayer) return;
    const layer = document.createElement('div');
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '1';
    // Build 4x4 noise/dither pattern (slightly red-tinted for combat panel)
    const cvs = document.createElement('canvas');
    cvs.width = 4; cvs.height = 4;
    const ctx = cvs.getContext('2d');
    const a = [
      0, 128, 32, 160,
      192, 64, 224, 96,
      48, 176, 16, 144,
      240, 112, 208, 80
    ];
    const img = ctx.createImageData(4,4);
    for (let i=0;i<a.length;i++) {
      const v = a[i];
      const g = 0x14; // #141414 base color
      img.data[i*4+0] = g;
      img.data[i*4+1] = g;
      img.data[i*4+2] = g;
      img.data[i*4+3] = 20 + (v/14); // retain ordered alpha modulation
    }
    ctx.putImageData(img,0,0);
    const url = cvs.toDataURL();
    layer.style.backgroundImage = `url(${url})`;
    layer.style.backgroundRepeat = 'repeat';
    layer.style.mixBlendMode = 'screen';
    layer.style.opacity = '0.5';
    this.previewWrapper.appendChild(layer);
    this._ditherLayer = layer;
    this._syncDitherVisibility();
  }

  _syncDitherVisibility() {
    if (!this._ditherLayer) return;
    this._ditherLayer.style.display = this._ditherEnabled ? 'block' : 'none';
  }

  setDitherEnabled(flag) {
    this._ditherEnabled = !!flag;
    this._syncDitherVisibility();
  }

  _clearPreview() {
    if (this._previewObject) {
      this._previewObject.traverse?.(o => {
        if (o.geometry) o.geometry.dispose?.();
        if (o.material) {
          if (Array.isArray(o.material)) o.material.forEach(m => m.dispose?.());
          else o.material.dispose?.();
        }
      });
      this.previewScene.remove(this._previewObject);
      this._previewObject = null;
    }
  }

  _buildPreviewObject(target) {
    const type = target.getType ? target.getType() : 'unknown';
    // If supplied with original mesh hierarchy (e.g., FBX) build aggregated edges
    if (target.previewSource) {
      const group = new THREE.Group();
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffdddd, transparent: true, opacity: 0.38 });
      target.previewSource.traverse(child => {
        if (child.isMesh && child.geometry) {
          try {
            const geo = child.geometry; // don't mutate
            const edges = new THREE.EdgesGeometry(geo, 25);
            const lines = new THREE.LineSegments(edges, edgeMat);
            // Capture world transform relative to root
            lines.position.copy(child.getWorldPosition(new THREE.Vector3()));
            lines.quaternion.copy(child.getWorldQuaternion(new THREE.Quaternion()));
            lines.scale.copy(child.getWorldScale(new THREE.Vector3()));
            group.add(lines);
          } catch(_) {}
        }
      });
      // Recenter & uniformly scale to desired preview size
      if (group.children.length) {
        const box = new THREE.Box3().setFromObject(group);
        if (!box.isEmpty()) {
          const center = new THREE.Vector3();
            const size = new THREE.Vector3();
          box.getCenter(center);
          box.getSize(size);
          const longest = Math.max(size.x, size.y, size.z) || 1;
          const TARGET_PREVIEW_SIZE = 1.4; // smaller overall footprint
          const scaleFactor = TARGET_PREVIEW_SIZE / longest;
          group.children.forEach(c => c.position.sub(center));
          group.scale.setScalar(scaleFactor);
        }
        return group;
      }
      // fallback to generic if traversal failed
    }
    if (type === 'asteroid') {
      // Use low-detail icosahedron edges to mimic rocky silhouette
      const geom = new THREE.IcosahedronGeometry(1, 0);
      // Slight random vertex jitter for variation
      const pos = geom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        pos.setX(i, pos.getX(i) * (0.9 + Math.random() * 0.2));
        pos.setY(i, pos.getY(i) * (0.9 + Math.random() * 0.2));
        pos.setZ(i, pos.getZ(i) * (0.9 + Math.random() * 0.2));
      }
      pos.needsUpdate = true;
      const edges = new THREE.EdgesGeometry(geom, 10);
      const mat = new THREE.LineBasicMaterial({ color: 0xffaaaa, transparent: true, opacity: 0.45 });
      return new THREE.LineSegments(edges, mat);
    }
    if (type === 'npcship' || target.getName?.() === 'Derelict Cruiser') {
      // Simple elongated hull outline
      const geom = new THREE.BoxGeometry(1.8, 0.5, 0.6);
      const edges = new THREE.EdgesGeometry(geom, 10);
      const mat = new THREE.LineBasicMaterial({ color: 0xffcccc, transparent: true, opacity: 0.5 });
      return new THREE.LineSegments(edges, mat);
    }
    // Fallback generic outline
    const g = new THREE.IcosahedronGeometry(1, 1);
    const e = new THREE.EdgesGeometry(g, 10);
    const m = new THREE.LineBasicMaterial({ color: 0xffbbbb, transparent: true, opacity: 0.4 });
    return new THREE.LineSegments(e, m);
  }

  _updatePreview(target) {
    if (!this.previewScene) return;
    const tid = target.getId ? target.getId() : null;
    if (this._previewTargetId !== tid) {
      this._previewTargetId = tid;
      this._clearPreview();
      this._previewObject = this._buildPreviewObject(target);
      this.previewScene.add(this._previewObject);
    }
    if (this._previewObject) {
      this._previewObject.rotation.y += 0.01; // slowed (was 0.02)
      this._previewObject.rotation.x = 0.35;
    }
    if (this.previewRenderer && this.previewCamera) {
      const w = this.targetPanel.clientWidth;
      const h = this.targetPanel.clientHeight;
      const size = Math.min(w, h);
  const scale = (typeof this._lowResScale === 'number') ? this._lowResScale : 0.4;
  this.previewRenderer.setSize(size * scale, size * scale, false);
      this.previewCamera.aspect = 1;
      this.previewCamera.updateProjectionMatrix();
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }
}
