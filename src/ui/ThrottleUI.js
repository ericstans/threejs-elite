export class ThrottleUI {
  constructor(container) {
    this.container = container;
    this.createThrottleDisplay();
  }

  createThrottleDisplay() {
    // Throttle display
    this.throttleContainer = document.createElement('div');
    this.throttleContainer.style.position = 'absolute';
    this.throttleContainer.style.bottom = '20px';
    this.throttleContainer.style.left = '20px';
    this.throttleContainer.style.background = 'rgba(0, 0, 0, 0.7)';
    this.throttleContainer.style.padding = '10px';
    this.throttleContainer.style.border = '1px solid #00ff00';
    this.container.appendChild(this.throttleContainer);

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

    // Speed indicator (actual speed vs throttle)
    this.speedFill = document.createElement('div');
    this.speedFill.style.position = 'absolute';
    this.speedFill.style.bottom = '0';
    this.speedFill.style.left = '0';
    this.speedFill.style.width = '100%';
    this.speedFill.style.background = '#ffff00';
    this.speedFill.style.height = '0%';
    this.speedFill.style.opacity = '0.7';
    this.throttleBar.appendChild(this.speedFill);

    // Speed display (moved above throttle container)
    this.speedDisplay = document.createElement('div');
    this.speedDisplay.style.position = 'absolute';
    this.speedDisplay.style.bottom = '240px'; // Above the throttle container
    this.speedDisplay.style.left = '20px';
    this.speedDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
    this.speedDisplay.style.padding = '5px 10px';
    this.speedDisplay.style.border = '1px solid #ffff00';
    this.speedDisplay.style.fontFamily = 'monospace';
    this.speedDisplay.style.color = '#ffff00';
    this.speedDisplay.style.fontSize = '14px';
    this.speedDisplay.style.textAlign = 'center';
    this.speedDisplay.textContent = '0.0/min';
    this.container.appendChild(this.speedDisplay);

    // Throttle legend
    this.throttleLegend = document.createElement('div');
    this.throttleLegend.style.marginTop = '5px';
    this.throttleLegend.style.fontSize = '10px';
    this.throttleLegend.style.textAlign = 'center';
    this.throttleLegend.innerHTML = '<span style="color: #00ff00;">■</span> Target <span style="color: #ffff00;">■</span> Actual';
    this.throttleContainer.appendChild(this.throttleLegend);
  }

  updateThrottle(throttle, speedPerMinute) {
    // Throttle now represents target speed percentage (0-100% of max speed)
    const targetSpeedPercentage = Math.round(throttle * 100);
    const actualSpeedPercentage = Math.round((speedPerMinute / 3000) * 100); // 3000 = maxSpeed * 60
    
    // Update throttle bar (green) - shows target speed
    this.throttleFill.style.height = `${targetSpeedPercentage}%`;
    
    // Update speed bar (yellow, behind throttle) - shows actual speed
    this.speedFill.style.height = `${actualSpeedPercentage}%`;
    
    // Update speed display above throttle container
    this.speedDisplay.textContent = `${speedPerMinute.toFixed(1)}/min`;
  }
}
