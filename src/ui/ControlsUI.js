export class ControlsUI {
  constructor(container) {
    this.container = container;
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
      <div>C/X - Throttle</div>
      <div>SPACE - Shoot</div>
      <div>T - Target</div>
      <div>Y - Nav Target</div>
    `;
  }
}
