export class ControlsUI {
  constructor(container) {
    this.container = container;
    this.isVisible = true;
    this.createControlsHelp();
  }

  createControlsHelp() {
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
    this.container.appendChild(this.controlsHelp);

    this.controlsHelp.innerHTML = `
      <div style="margin-bottom: 5px; font-weight: bold;">CONTROLS</div>
      <div>WASD - Pitch/Yaw</div>
      <div>Q/E - Roll</div>
      <div>Z/X - Throttle</div>
      <div>SPACE - Shoot</div>
      <div>T - Target</div>
      <div>Y - Nav Target</div>
    `;

    // Add F9 indicator in top right corner
    this.f9Indicator = document.createElement('div');
    this.f9Indicator.textContent = 'F9';
    this.f9Indicator.style.position = 'absolute';
    this.f9Indicator.style.top = '5px';
    this.f9Indicator.style.right = '5px';
    this.f9Indicator.style.color = '#666666';
    this.f9Indicator.style.fontSize = '10px';
    this.f9Indicator.style.fontWeight = 'bold';
    this.f9Indicator.style.opacity = '0.6';
    this.f9Indicator.style.pointerEvents = 'none';
    this.controlsHelp.appendChild(this.f9Indicator);
  }

  toggle() {
    this.isVisible = !this.isVisible;
    this.controlsHelp.style.display = this.isVisible ? 'block' : 'none';
  }

  show() {
    this.isVisible = true;
    this.controlsHelp.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    this.controlsHelp.style.display = 'none';
  }
}
