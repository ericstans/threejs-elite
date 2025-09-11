export class ThrottleUI {
  constructor(container) {
    this.container = container;
    this.isFirstPerson = true; // Track current view mode
    this.createThrottleDisplay();
  }

  createThrottleDisplay() {
    // Throttle display
    this.throttleContainer = document.createElement('div');
    this.container.appendChild(this.throttleContainer);

    this.throttleLabel = document.createElement('div');
    this.throttleLabel.textContent = 'THROTTLE';
    this.throttleContainer.appendChild(this.throttleLabel);

    this.throttleBar = document.createElement('div');
    this.throttleContainer.appendChild(this.throttleBar);

    this.throttleFill = document.createElement('div');
    this.throttleBar.appendChild(this.throttleFill);

    // Speed indicator (actual speed vs throttle)
    this.speedFill = document.createElement('div');
    this.throttleBar.appendChild(this.speedFill);

    // Speed display (moved above throttle container)
    this.speedDisplay = document.createElement('div');
    this.speedDisplay.textContent = '0.0/min';
    this.container.appendChild(this.speedDisplay);

    // Throttle legend
    this.throttleLegend = document.createElement('div');
    this.throttleContainer.appendChild(this.throttleLegend);

    // Apply initial positioning and styling (after all elements are created)
    this.updatePositioning();
  }

  updateThrottle(targetSpeed, currentSpeed, maxSpeed) {
    // Compute percentages for bar heights
    const targetPct = maxSpeed > 0 ? Math.round((targetSpeed / maxSpeed) * 100) : 0;
    const actualPct = maxSpeed > 0 ? Math.round((currentSpeed / maxSpeed) * 100) : 0;
    // Update throttle bar (green) - shows target speed
    this.throttleFill.style.height = `${targetPct}%`;
    // Update speed bar (yellow, behind throttle) - shows actual speed
    this.speedFill.style.height = `${actualPct}%`;
    // Update speed display above throttle container (units/min)
    this.speedDisplay.textContent = `${(currentSpeed * 60).toFixed(1)}upm`;
  }

  // Positioning methods for different view modes
  setFirstPersonPositioning() {
    // First-person positioning - show throttle bar without container background and label
    if (this.throttleContainer) {
      this.throttleContainer.style.display = 'block';
      // Position is now handled by UI.js through cockpit wrapper, so we only set size and styling
      this.throttleContainer.style.width = '2.25%';
      this.throttleContainer.style.height = '12%';
      this.throttleBar.style.width = '100%';
      this.throttleBar.style.height = '100%';
      // Remove container background and padding for first-person
      this.throttleContainer.style.background = 'transparent';
      this.throttleContainer.style.padding = '0';
      this.throttleContainer.style.border = 'none';
      this.throttleBar.style.border = 'none';
      this.throttleBar.style.backgroundColor = 'none';
    }
    if (this.throttleLabel) {
      this.throttleLabel.style.display = 'none'; // Hide the "THROTTLE" label
    }
    if (this.speedDisplay) {
      this.speedDisplay.style.display = 'block';
      this.speedDisplay.style.border = 'none';
      this.speedDisplay.style.background = 'none';
      this.speedDisplay.style.fontSize = '12px';
      // Position is now handled by UI.js through cockpit wrapper
    }
  }

  setThirdPersonPositioning() {
    // Third-person positioning - show both throttle container and speed display
    if (this.throttleContainer) {
      this.throttleContainer.style.display = 'block';
      // Position is now handled by UI.js through cockpit wrapper, so we only set size and styling
      this.throttleContainer.style.width = 'auto'; // Reset width to auto
      this.throttleContainer.style.height = 'auto'; // Reset height to auto
      // Restore container background and styling for third-person
      this.throttleContainer.style.background = 'rgba(0, 0, 0, 0.7)';
      this.throttleContainer.style.padding = '10px';
      this.throttleContainer.style.border = '1px solid #00ff00';
    }
    if (this.throttleBar) {
      // Restore throttle bar styling for third-person
      this.throttleBar.style.width = '20px';
      this.throttleBar.style.height = '200px';
      this.throttleBar.style.border = '1px solid #00ff00';
      this.throttleBar.style.backgroundColor = '#333';
    }
    if (this.throttleLabel) {
      this.throttleLabel.style.display = 'block'; // Show the "THROTTLE" label
    }
    if (this.speedDisplay) {
      this.speedDisplay.style.display = 'block';
      // Restore speed display styling for third-person
      this.speedDisplay.style.border = '1px solid #ffff00';
      this.speedDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      // Position is now handled by UI.js through cockpit wrapper
    }
  }

  // Update positioning and styling based on current view mode
  updatePositioning() {
    // Apply base styling to all elements
    this.applyBaseStyling();
    
    // Apply view-specific positioning
    if (this.isFirstPerson) {
      this.setFirstPersonPositioning();
    } else {
      this.setThirdPersonPositioning();
    }
  }

  // Apply base styling that doesn't change between view modes
  applyBaseStyling() {
    // Throttle container base styling
    if (this.throttleContainer) {
      this.throttleContainer.style.position = 'absolute';
      this.throttleContainer.style.background = 'rgba(0, 0, 0, 0.7)';
      this.throttleContainer.style.padding = '10px';
      this.throttleContainer.style.border = '1px solid #00ff00';
    }

    // Throttle label styling
    if (this.throttleLabel) {
      this.throttleLabel.style.marginBottom = '5px';
    }

    // Throttle bar styling
    if (this.throttleBar) {
      this.throttleBar.style.width = '20px';
      this.throttleBar.style.height = '200px';
      this.throttleBar.style.background = '#333';
      this.throttleBar.style.border = '1px solid #00ff00';
      this.throttleBar.style.position = 'relative';
    }

    // Throttle fill styling
    if (this.throttleFill) {
      this.throttleFill.style.position = 'absolute';
      this.throttleFill.style.bottom = '0';
      this.throttleFill.style.left = '0';
      this.throttleFill.style.width = '100%';
      this.throttleFill.style.background = '#00ff00';
      this.throttleFill.style.height = '0%';
    }

    // Speed fill styling
    if (this.speedFill) {
      this.speedFill.style.position = 'absolute';
      this.speedFill.style.bottom = '0';
      this.speedFill.style.left = '0';
      this.speedFill.style.width = '100%';
      this.speedFill.style.background = '#ffff00';
      this.speedFill.style.height = '0%';
      this.speedFill.style.opacity = '0.7';
    }

    // Speed display base styling
    if (this.speedDisplay) {
      this.speedDisplay.style.position = 'absolute';
      //this.speedDisplay.style.background = 'rgba(0, 0, 0, 0.7)';
      this.speedDisplay.style.padding = '5px 10px';
      this.speedDisplay.style.border = '1px solid #ffff00';
      this.speedDisplay.style.fontFamily = 'monospace';
      this.speedDisplay.style.color = '#ffff00';
      this.speedDisplay.style.fontSize = '14px';
      this.speedDisplay.style.textAlign = 'center';
    }

    // Throttle legend styling
    if (this.throttleLegend) {
      this.throttleLegend.style.marginTop = '5px';
      this.throttleLegend.style.fontSize = '10px';
      this.throttleLegend.style.textAlign = 'center';
    }
  }

  // Method to change view mode and update positioning
  setViewMode(isFirstPerson) {
    this.isFirstPerson = isFirstPerson;
    this.updatePositioning();
  }
}
