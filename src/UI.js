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
    this.throttleBar.style.width = '200px';
    this.throttleBar.style.height = '20px';
    this.throttleBar.style.background = '#333';
    this.throttleBar.style.border = '1px solid #00ff00';
    this.throttleBar.style.position = 'relative';
    this.throttleContainer.appendChild(this.throttleBar);

    this.throttleFill = document.createElement('div');
    this.throttleFill.style.position = 'absolute';
    this.throttleFill.style.top = '0';
    this.throttleFill.style.left = '0';
    this.throttleFill.style.height = '100%';
    this.throttleFill.style.background = '#00ff00';
    this.throttleFill.style.width = '0%';
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
  }

  updateThrottle(throttle) {
    const percentage = Math.round(throttle * 100);
    this.throttleFill.style.width = `${percentage}%`;
    this.throttleValue.textContent = `${percentage}%`;
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }
}
