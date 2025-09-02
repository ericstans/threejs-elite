export class UI {
  constructor() {
    this.createUI();
  }

  createUI() {
    // Create UI container
    this.uiContainer = document.createElement('div');
    this.uiContainer.style.position = 'fixed';
    this.uiContainer.style.top = '0';
    this.uiContainer.style.left = '0';
    this.uiContainer.style.width = '100%';
    this.uiContainer.style.height = '100%';
    this.uiContainer.style.pointerEvents = 'none';
    this.uiContainer.style.fontFamily = 'monospace';
    this.uiContainer.style.color = '#00ff00';
    this.uiContainer.style.fontSize = '14px';
    document.body.appendChild(this.uiContainer);

    // Throttle display
    this.throttleContainer = document.createElement('div');
    this.throttleContainer.style.position = 'absolute';
    this.throttleContainer.style.bottom = '20px';
    this.throttleContainer.style.left = '20px';
    this.throttleContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    this.throttleContainer.style.padding = '10px';
    this.throttleContainer.style.border = '1px solid #00ff00';
    this.uiContainer.appendChild(this.throttleContainer);

    this.throttleLabel = document.createElement('div');
    this.throttleLabel.textContent = 'THROTTLE';
    this.throttleLabel.style.marginBottom = '5px';
    this.throttleContainer.appendChild(this.throttleLabel);

    this.throttleBar = document.createElement('div');
    this.throttleBar.style.width = '20px';
    this.throttleBar.style.height = '200px';
    this.throttleBar.style.background = '#333';
    this.throttleBar.style.border = '1px solid #00ff00';
    this.throttleBar.style.position = 'relative';
    this.throttleContainer.appendChild(this.throttleBar);

    this.throttleFill = document.createElement('div');
    this.throttleFill.style.position = 'absolute';
    this.throttleFill.style.bottom = '0';
    this.throttleFill.style.left = '0';
    this.throttleFill.style.width = '100%';
    this.throttleFill.style.background = '#00ff00';
    this.throttleFill.style.height = '0%';
    this.throttleBar.appendChild(this.throttleFill);

    this.throttleValue = document.createElement('div');
    this.throttleValue.style.marginTop = '5px';
    this.throttleValue.style.textAlign = 'center';
    this.throttleContainer.appendChild(this.throttleValue);

    // Controls help
    this.controlsHelp = document.createElement('div');
    this.controlsHelp.style.position = 'absolute';
    this.controlsHelp.style.top = '20px';
    this.controlsHelp.style.right = '20px';
    this.controlsHelp.style.background = 'rgba(0, 0, 0, 0.7)';
    this.controlsHelp.style.padding = '10px';
    this.controlsHelp.style.border = '1px solid #00ff00';
    this.controlsHelp.style.fontSize = '12px';
    this.controlsHelp.style.lineHeight = '1.4';
    this.uiContainer.appendChild(this.controlsHelp);

    this.controlsHelp.innerHTML = `
      <div style="margin-bottom: 5px; font-weight: bold;">CONTROLS</div>
      <div>WASD - Pitch/Yaw</div>
      <div>Q/E - Roll</div>
      <div>C/X - Throttle</div>
      <div>SPACE - Shoot</div>
      <div>T - Target</div>
    `;

    // Crosshair
    this.crosshair = document.createElement('div');
    this.crosshair.style.position = 'absolute';
    this.crosshair.style.top = '50%';
    this.crosshair.style.left = '50%';
    this.crosshair.style.transform = 'translate(-50%, -50%)';
    this.crosshair.style.width = '20px';
    this.crosshair.style.height = '20px';
    this.crosshair.style.border = '2px solid #00ff00';
    this.crosshair.style.borderRadius = '50%';
    this.crosshair.style.background = 'transparent';
    this.uiContainer.appendChild(this.crosshair);

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
    this.uiContainer.appendChild(this.targetPanel);

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

    // Target indicator (red rectangle around targeted asteroid)
    this.targetIndicator = document.createElement('div');
    this.targetIndicator.style.position = 'absolute';
    this.targetIndicator.style.border = '2px solid #ff0000';
    this.targetIndicator.style.background = 'transparent';
    this.targetIndicator.style.pointerEvents = 'none';
    this.targetIndicator.style.display = 'none'; // Initially hidden
    this.targetIndicator.style.zIndex = '1000';
    this.uiContainer.appendChild(this.targetIndicator);
  }

  updateThrottle(throttle) {
    const percentage = Math.round(throttle * 100);
    this.throttleFill.style.height = `${percentage}%`;
    this.throttleValue.textContent = `${percentage}%`;
  }

  updateTargetInfo(targetInfo, targetPosition, camera) {
    this.targetPanel.style.display = 'block';
    this.targetId.textContent = `ID: ${targetInfo.id}`;
    this.targetMass.textContent = `Mass: ${targetInfo.mass.toFixed(1)}`;
    this.targetDistance.textContent = `Distance: ${targetInfo.distance.toFixed(1)}`;
    this.targetHealth.textContent = `Health: ${targetInfo.health}/${targetInfo.maxHealth}`;
    
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
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }
}
