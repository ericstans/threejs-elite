export class TargetUI {
  constructor(container) {
    this.container = container;
    this.createTargetPanel();
    this.createTargetIndicator();
  }

  createTargetPanel() {
    // Target panel (initially hidden)
    this.targetPanel = document.createElement('div');
    this.targetPanel.style.position = 'absolute';
    this.targetPanel.style.bottom = '20px';
    this.targetPanel.style.right = '20px';
    this.targetPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    this.targetPanel.style.padding = '10px';
    this.targetPanel.style.border = '1px solid #00ff00';
    this.targetPanel.style.fontSize = '12px';
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
    this.targetCommableIndicator.style.left = '-50px';
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
      return;
    }

    // Convert 3D world position to 2D screen coordinates
    const vector = targetPosition.clone();
    vector.project(camera);

    // Check if target is in front of camera
    if (vector.z > 1) {
      this.targetIndicator.style.display = 'none';
      return;
    }

    // Convert normalized device coordinates to screen coordinates
    const x = (vector.x * 0.5 + 0.5) * window.innerWidth;
    const y = (vector.y * -0.5 + 0.5) * window.innerHeight;

    // Show target indicator
    this.targetIndicator.style.display = 'block';
    this.targetIndicator.style.left = `${x - 25}px`;
    this.targetIndicator.style.top = `${y - 25}px`;
    this.targetIndicator.style.width = '50px';
    this.targetIndicator.style.height = '50px';
  }

  clearTargetInfo() {
    this.targetPanel.style.display = 'none';
    this.targetIndicator.style.display = 'none';
    this.targetCommableIndicator.style.display = 'none';
  }
}
