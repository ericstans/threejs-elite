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
    this.createTargetPanel();
    this.createTargetIndicator();
    this.createOffscreenArrow();
  }

  createTargetPanel() {
    // Target panel (initially hidden)
    this.targetPanel = document.createElement('div');
    this.targetPanel.style.position = 'absolute';
    this.targetPanel.style.bottom = '19%';
    this.targetPanel.style.right = '19%';
    this.targetPanel.style.height = '17%';
    this.targetPanel.style.width = '12.5%';
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
  }
}
