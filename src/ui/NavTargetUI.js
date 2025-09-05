export class NavTargetUI {
  constructor(container) {
    this.container = container;
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
    this.navTargetPanel.style.background = 'rgba(0, 0, 0, 0.7)';
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
  }
}
