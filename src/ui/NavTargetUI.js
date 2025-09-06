import * as THREE from 'three';

export class NavTargetUI {
  constructor(container) {
    this.container = container;
  // Low-res preview scale (internal resolution factor). 1 = full res. <1 = pixelated look.
  this._lowResScale = 0.4; // try 40% internal resolution
    this.createNavTargetPanel();
    this.createNavTargetIndicator();
  this.createOffscreenArrow();
  }

  createNavTargetPanel() {
    // Nav target panel (initially hidden)
    this.navTargetPanel = document.createElement('div');
    this.navTargetPanel.style.position = 'absolute';
    this.navTargetPanel.style.height = '20%';
    this.navTargetPanel.style.width = '10%';
    //this.navTargetPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    this.navTargetPanel.style.padding = '15px';
    //this.navTargetPanel.style.border = '1px solid #00ff00';
    this.navTargetPanel.style.fontSize = '16px';
    this.navTargetPanel.style.lineHeight = '1.4';
    this.navTargetPanel.style.display = 'none'; // Initially hidden
    this.container.appendChild(this.navTargetPanel);

    this.navTargetTitle = document.createElement('div');
    this.navTargetTitle.textContent = 'NAV TARGET';
    this.navTargetTitle.style.marginBottom = '5px';
    this.navTargetTitle.style.fontWeight = 'bold';
    this.navTargetPanel.appendChild(this.navTargetTitle);

    this.navTargetId = document.createElement('div');
    this.navTargetPanel.appendChild(this.navTargetId);

    this.navTargetName = document.createElement('div');
    this.navTargetPanel.appendChild(this.navTargetName);

    this.navTargetMass = document.createElement('div');
    this.navTargetPanel.appendChild(this.navTargetMass);

    this.navTargetDistance = document.createElement('div');
    this.navTargetPanel.appendChild(this.navTargetDistance);

    // Nav target commable indicator
    this.navCommableIndicator = document.createElement('div');
    this.navCommableIndicator.style.position = 'absolute';
    this.navCommableIndicator.style.left = '80%';
    this.navCommableIndicator.style.top = '10px';
    this.navCommableIndicator.style.fontSize = '16px';
    this.navCommableIndicator.style.display = 'none';
    this.navTargetPanel.appendChild(this.navCommableIndicator);

    // Preview container (behind text)
    this.previewWrapper = document.createElement('div');
    this.previewWrapper.style.position = 'absolute';
    this.previewWrapper.style.left = '50%';
    this.previewWrapper.style.top = '50%';
    this.previewWrapper.style.transform = 'translate(-50%, -50%)';
    this.previewWrapper.style.width = '100%';
    this.previewWrapper.style.height = '100%';
    this.previewWrapper.style.pointerEvents = 'none';
    this.previewWrapper.style.zIndex = '0';
    this.navTargetPanel.appendChild(this.previewWrapper);

    // Elevate text above
    for (const child of this.navTargetPanel.children) {
      if (child !== this.previewWrapper) child.style.position = child.style.position || 'relative';
      if (child !== this.previewWrapper) child.style.zIndex = '1';
    }

    this._initPreviewScene();
  }

  createNavTargetIndicator() {
    // Nav target indicator (yellow square)
    this.navTargetIndicator = document.createElement('div');
    this.navTargetIndicator.style.position = 'absolute';
    this.navTargetIndicator.style.border = '2px solid #ffff00';
    this.navTargetIndicator.style.background = 'transparent';
    this.navTargetIndicator.style.pointerEvents = 'none';
    this.navTargetIndicator.style.display = 'none'; // Initially hidden
    this.navTargetIndicator.style.zIndex = '1000';
    this.container.appendChild(this.navTargetIndicator);
  }

  createOffscreenArrow() {
    // Yellow arrow for offscreen nav target
    this.offscreenArrow = document.createElement('div');
    this.offscreenArrow.style.position = 'fixed';
    this.offscreenArrow.style.width = '0';
    this.offscreenArrow.style.height = '0';
    this.offscreenArrow.style.borderLeft = '18px solid transparent';
    this.offscreenArrow.style.borderRight = '18px solid transparent';
    this.offscreenArrow.style.borderBottom = '32px solid #ffff33';
    this.offscreenArrow.style.zIndex = '2000';
    this.offscreenArrow.style.display = 'none';
    this.offscreenArrow.style.pointerEvents = 'none';
    this.container.appendChild(this.offscreenArrow);
  }

  updateNavTargetInfo(navTargetInfo, targetPosition, camera) {
    this.navTargetPanel.style.display = 'block';
    this.navTargetId.textContent = `ID: ${navTargetInfo.id}`;
    this.navTargetName.textContent = `Name: ${navTargetInfo.name}`;
    this.navTargetMass.textContent = `Mass: ${navTargetInfo.mass.toFixed(0)}`;
    this.navTargetDistance.textContent = `Distance: ${navTargetInfo.distance.toFixed(1)}`;
    
    // Show/hide commable indicator
    if (navTargetInfo.isCommable) {
      this.navCommableIndicator.style.display = 'block';
      this.navCommableIndicator.textContent = '📡C';
    } else {
      this.navCommableIndicator.style.display = 'none';
    }
    
    // Update nav target indicator position
    this.updateNavTargetIndicator(targetPosition, camera);
    // Update preview wireframe (pass through extra original target reference if supplied)
    if (navTargetInfo.__ref) {
      this._updatePreview(navTargetInfo.__ref);
    }
  }

  updateNavTargetIndicator(targetPosition, camera) {
    if (!targetPosition || !camera) {
      this.navTargetIndicator.style.display = 'none';
  if (this.offscreenArrow) this.offscreenArrow.style.display = 'none';
      return;
    }

    // Convert 3D world position to 2D screen coordinates
    const vector = targetPosition.clone();
    vector.project(camera);

    const behind = vector.z > 1;
    const offscreen = behind || vector.x < -1 || vector.x > 1 || vector.y < -1 || vector.y > 1;
    if (offscreen) {
      this.navTargetIndicator.style.display = 'none';
      if (!this.offscreenArrow) return;
      let dx = vector.x;
      let dy = vector.y;
      if (behind) { dx = -dx; dy = -dy; }
      const eps = 1e-4;
      if (Math.hypot(dx, dy) < eps) { dx = 0; dy = 1; }
      const scale = 0.92 / Math.max(Math.abs(dx), Math.abs(dy));
      dx *= scale; dy *= scale;
      const screenX = (dx * 0.5 + 0.5) * window.innerWidth;
      const screenY = (dy * -0.5 + 0.5) * window.innerHeight;
      this.offscreenArrow.style.display = 'block';
      this.offscreenArrow.style.left = `${screenX - 18}px`;
      this.offscreenArrow.style.top = `${screenY - 32}px`;
      let rotation = 0;
      if (Math.abs(dy) >= Math.abs(dx)) {
        rotation = dy < 0 ? Math.PI : 0;
      } else {
        rotation = dx < 0 ? -Math.PI / 2 : Math.PI / 2;
      }
      this.offscreenArrow.style.transform = `rotate(${rotation}rad)`;
      return;
    }
    if (this.offscreenArrow) this.offscreenArrow.style.display = 'none';
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;
    this.navTargetIndicator.style.display = 'block';
    this.navTargetIndicator.style.left = `${x - 30}px`;
    this.navTargetIndicator.style.top = `${y - 30}px`;
    this.navTargetIndicator.style.width = '60px';
    this.navTargetIndicator.style.height = '60px';
  }

  clearNavTargetInfo() {
    this.navTargetPanel.style.display = 'none';
    this.navTargetIndicator.style.display = 'none';
    this.navCommableIndicator.style.display = 'none';
  if (this.offscreenArrow) this.offscreenArrow.style.display = 'none';
    this._clearPreview();
  }

  _initPreviewScene() {
    this.previewScene = new THREE.Scene();
    this.previewCamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    this.previewCamera.position.set(0, 0, 6);
    this.previewRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    this.previewRenderer.setSize(200, 200);
    this.previewRenderer.domElement.style.width = '100%';
    this.previewRenderer.domElement.style.height = '100%';
    this.previewRenderer.domElement.style.opacity = '0.18';
  // Force pixelated upscale for retro / low-res effect
  this.previewRenderer.domElement.style.imageRendering = 'pixelated';
  this.previewRenderer.domElement.style.imageRendering = 'crisp-edges';
    this.previewWrapper.appendChild(this.previewRenderer.domElement);
    // Light (subtle)
    const light = new THREE.AmbientLight(0xffffff, 0.6);
    this.previewScene.add(light);
    const dir = new THREE.DirectionalLight(0xffffff, 0.4);
    dir.position.set(3,4,5);
    this.previewScene.add(dir);
    // Add dither overlay (option 4) for retro sensor screen look
    this._ditherEnabled = true;
    this._addDitherOverlay();
  }

  _addDitherOverlay() {
    // Avoid duplicates
    if (this._ditherLayer) return;
    const layer = document.createElement('div');
    layer.style.position = 'absolute';
    layer.style.left = '0';
    layer.style.top = '0';
    layer.style.width = '100%';
    layer.style.height = '100%';
    layer.style.pointerEvents = 'none';
    layer.style.zIndex = '1'; // still under text (panel children get zIndex 1 but positioned relative outside wrapper)
    // Generate a tiny 4x4 Bayer-like pattern to simulate ordered dithering
    const cvs = document.createElement('canvas');
    cvs.width = 4; cvs.height = 4;
    const ctx = cvs.getContext('2d');
    // Two intensity levels (slightly tinted) arranged in a simple ordered matrix
    const a = [
      0, 128, 32, 160,
      192, 64, 224, 96,
      48, 176, 16, 144,
      240, 112, 208, 80
    ];
    const img = ctx.createImageData(4,4);
    for (let i=0;i<a.length;i++) {
      const v = a[i];
      // Fixed cockpit screen base color #141414 (20,20,20) with only alpha variation
      const g = 0x14; // 20
      img.data[i*4+0] = g;
      img.data[i*4+1] = g;
      img.data[i*4+2] = g;
      img.data[i*4+3] = 18 + (v/16); // keep subtle ordered alpha variance
    }
    ctx.putImageData(img,0,0);
    const url = cvs.toDataURL();
    layer.style.backgroundImage = `url(${url})`;
    layer.style.backgroundRepeat = 'repeat';
    layer.style.mixBlendMode = 'screen'; // brighten lines slightly
    layer.style.opacity = '0.45';
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
      // Recursively dispose
      this._previewObject.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose?.());
          else obj.material.dispose?.();
        }
      });
      this.previewScene.remove(this._previewObject);
      this._previewObject = null;
    }
  }

  _buildPreviewObject(target) {
    const type = target.getType ? target.getType() : 'unknown';
    if (type === 'planet' || type === 'moon') {
      // Latitude/longitude grid (quads only impression, no triangle diagonals)
      const group = new THREE.Group();
      const mat = new THREE.LineBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 0.32 });
      const meridians = 12; // number of longitude lines
      const parallels = 8;  // number of horizontal latitude rings (excluding poles)
      const parallelSegments = 64; // smoothness of each ring
      const meridianSegments = 96; // smoothness of meridian curves

      // Build latitude rings (skip poles for cleaner look)
      for (let i = 1; i < parallels; i++) {
        const theta = Math.PI * i / parallels; // 0..PI
        const y = Math.cos(theta);
        const r = Math.sin(theta);
        const pts = [];
        for (let s = 0; s <= parallelSegments; s++) {
          const phi = 2 * Math.PI * s / parallelSegments;
          pts.push(r * Math.cos(phi), y, r * Math.sin(phi));
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        const ring = new THREE.LineLoop(geo, mat);
        group.add(ring);
      }

      // Build meridians
      for (let m = 0; m < meridians; m++) {
        const phi = 2 * Math.PI * m / meridians;
        const pts = [];
        for (let s = 0; s <= meridianSegments; s++) {
          const t = Math.PI * s / meridianSegments; // 0..PI
            const y = Math.cos(t);
            const r = Math.sin(t);
            const x = r * Math.cos(phi);
            const z = r * Math.sin(phi);
            pts.push(x, y, z);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
        const line = new THREE.Line(geo, mat);
        group.add(line);
      }
      return group;
    }
    // For station / others: outline edges only
    let baseGeom;
    if (type === 'station') {
      baseGeom = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 16, 1, true);
    } else {
      baseGeom = new THREE.IcosahedronGeometry(1, 1);
    }
    const edges = new THREE.EdgesGeometry(baseGeom, 5); // threshold angle deg-ish
    const mat = new THREE.LineBasicMaterial({ color: 0xffff99, transparent: true, opacity: 0.4 });
    const lines = new THREE.LineSegments(edges, mat);
    return lines;
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
      this._previewObject.rotation.y += 0.005; // slowed (was 0.01)
      this._previewObject.rotation.x = 0.3;
    }
    if (this.previewRenderer && this.previewCamera) {
      const w = this.navTargetPanel.clientWidth;
      const h = this.navTargetPanel.clientHeight;
      const size = Math.min(w, h);
  const scale = (typeof this._lowResScale === 'number') ? this._lowResScale : 0.4;
  this.previewRenderer.setSize(size * scale, size * scale, false);
      this.previewCamera.aspect = 1;
      this.previewCamera.updateProjectionMatrix();
      this.previewRenderer.render(this.previewScene, this.previewCamera);
    }
  }
}
