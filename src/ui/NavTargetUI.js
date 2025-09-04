export class NavTargetUI {
  constructor(container) {
    this.container = container;
    this.createNavTargetPanel();
    this.createNavTargetIndicator();
  }

  createNavTargetPanel() {
    // Nav target panel (initially hidden)
    this.navTargetPanel = document.createElement('div');
    this.navTargetPanel.style.position = 'absolute';
    this.navTargetPanel.style.bottom = '19%';
    this.navTargetPanel.style.left = '18%';
    this.navTargetPanel.style.height = '17%';
    this.navTargetPanel.style.width = '13.5%';
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
      return;
    }

    // Convert 3D world position to 2D screen coordinates
    const vector = targetPosition.clone();
    vector.project(camera);

    // Check if target is in front of camera
    if (vector.z > 1) {
      this.navTargetIndicator.style.display = 'none';
      return;
    }

    // Convert normalized device coordinates to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Show nav target indicator (yellow square)
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
  }
}
