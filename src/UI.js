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
      <div>Y - Nav Target</div>
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

    // Auto-aim cone indicator (for testing)
    this.autoAimCone = document.createElement('div');
    this.autoAimCone.style.position = 'absolute';
    this.autoAimCone.style.top = '50%';
    this.autoAimCone.style.left = '50%';
    this.autoAimCone.style.transform = 'translate(-50%, -50%)';
    this.autoAimCone.style.width = '200px'; // Approximate size for 10 degrees
    this.autoAimCone.style.height = '200px';
    this.autoAimCone.style.border = '1px solid #ff0000';
    this.autoAimCone.style.borderRadius = '50%';
    this.autoAimCone.style.background = 'transparent';
    this.autoAimCone.style.pointerEvents = 'none';
    this.autoAimCone.style.opacity = '0.5';
    this.uiContainer.appendChild(this.autoAimCone);

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

    // Target commable indicator
    this.targetCommableIndicator = document.createElement('div');
    this.targetCommableIndicator.style.position = 'absolute';
    this.targetCommableIndicator.style.left = '-50px';
    this.targetCommableIndicator.style.top = '10px';
    this.targetCommableIndicator.style.fontSize = '16px';
    this.targetCommableIndicator.style.display = 'none';
    this.targetPanel.appendChild(this.targetCommableIndicator);

    // Nav target panel (initially hidden)
    this.navTargetPanel = document.createElement('div');
    this.navTargetPanel.style.position = 'absolute';
    this.navTargetPanel.style.bottom = '140px'; // Above the TARGET panel
    this.navTargetPanel.style.right = '20px';
    this.navTargetPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    this.navTargetPanel.style.padding = '10px';
    this.navTargetPanel.style.border = '1px solid #00ff00';
    this.navTargetPanel.style.fontSize = '12px';
    this.navTargetPanel.style.lineHeight = '1.4';
    this.navTargetPanel.style.display = 'none'; // Initially hidden
    this.uiContainer.appendChild(this.navTargetPanel);

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
    this.navCommableIndicator.style.left = '-50px';
    this.navCommableIndicator.style.top = '10px';
    this.navCommableIndicator.style.fontSize = '16px';
    this.navCommableIndicator.style.display = 'none';
    this.navTargetPanel.appendChild(this.navCommableIndicator);

    // Target indicator (red rectangle around targeted asteroid)
    this.targetIndicator = document.createElement('div');
    this.targetIndicator.style.position = 'absolute';
    this.targetIndicator.style.border = '2px solid #ff0000';
    this.targetIndicator.style.background = 'transparent';
    this.targetIndicator.style.pointerEvents = 'none';
    this.targetIndicator.style.display = 'none'; // Initially hidden
    this.targetIndicator.style.zIndex = '1000';
    this.uiContainer.appendChild(this.targetIndicator);

    // Nav target indicator (yellow square)
    this.navTargetIndicator = document.createElement('div');
    this.navTargetIndicator.style.position = 'absolute';
    this.navTargetIndicator.style.border = '2px solid #ffff00';
    this.navTargetIndicator.style.background = 'transparent';
    this.navTargetIndicator.style.pointerEvents = 'none';
    this.navTargetIndicator.style.display = 'none'; // Initially hidden
    this.navTargetIndicator.style.zIndex = '1000';
    this.uiContainer.appendChild(this.navTargetIndicator);

    // Communications modal (initially hidden)
    this.commsModal = document.createElement('div');
    this.commsModal.style.position = 'fixed';
    this.commsModal.style.top = '0';
    this.commsModal.style.left = '0';
    this.commsModal.style.width = '100%';
    this.commsModal.style.height = '100%';
    this.commsModal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.commsModal.style.display = 'none';
    this.commsModal.style.zIndex = '2000';
    this.commsModal.style.pointerEvents = 'auto';
    document.body.appendChild(this.commsModal);

    // Comms modal content
    this.commsContent = document.createElement('div');
    this.commsContent.style.position = 'absolute';
    this.commsContent.style.top = '50%';
    this.commsContent.style.left = '50%';
    this.commsContent.style.transform = 'translate(-50%, -50%)';
    this.commsContent.style.background = 'rgba(0, 0, 0, 0.9)';
    this.commsContent.style.border = '2px solid #00ff00';
    this.commsContent.style.padding = '20px';
    this.commsContent.style.minWidth = '400px';
    this.commsContent.style.maxWidth = '600px';
    this.commsContent.style.fontFamily = 'monospace';
    this.commsContent.style.color = '#00ff00';
    this.commsContent.style.fontSize = '14px';
    this.commsContent.style.lineHeight = '1.6';
    this.commsModal.appendChild(this.commsContent);

    // Comms modal title
    this.commsTitle = document.createElement('div');
    this.commsTitle.style.fontSize = '18px';
    this.commsTitle.style.fontWeight = 'bold';
    this.commsTitle.style.marginBottom = '15px';
    this.commsTitle.style.textAlign = 'center';
    this.commsTitle.style.borderBottom = '1px solid #00ff00';
    this.commsTitle.style.paddingBottom = '10px';
    this.commsContent.appendChild(this.commsTitle);

    // Comms modal message
    this.commsMessage = document.createElement('div');
    this.commsMessage.style.marginBottom = '20px';
    this.commsMessage.style.textAlign = 'center';
    this.commsMessage.style.fontStyle = 'italic';
    this.commsContent.appendChild(this.commsMessage);

    // Comms modal options
    this.commsOptions = document.createElement('div');
    this.commsOptions.style.marginBottom = '20px';
    this.commsContent.appendChild(this.commsOptions);

    // Comms modal close instruction
    this.commsClose = document.createElement('div');
    this.commsClose.style.textAlign = 'center';
    this.commsClose.style.fontSize = '12px';
    this.commsClose.style.color = '#666';
    this.commsClose.textContent = 'Press ESC to close';
    this.commsContent.appendChild(this.commsClose);
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

  showCommsModal(planetName, greeting, options = null) {
    this.commsTitle.textContent = `COMMUNICATIONS - ${planetName}`;
    this.commsMessage.textContent = greeting;
    
    // Clear previous options
    this.commsOptions.innerHTML = '';
    
    // Add communication options
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.style.marginBottom = '10px';
        optionElement.style.padding = '8px';
        optionElement.style.border = '1px solid #00ff00';
        optionElement.style.cursor = 'pointer';
        optionElement.style.transition = 'all 0.2s ease';
        optionElement.innerHTML = `<span style="color: #ffff00;">${index + 1}.</span> ${option.text}`;
        optionElement.dataset.optionId = option.id;
        optionElement.dataset.optionIndex = index + 1;
        
        // Add hover effects
        optionElement.addEventListener('mouseenter', () => {
          optionElement.style.background = 'rgba(0, 255, 0, 0.1)';
          optionElement.style.border = '1px solid #00ff00';
        });
        
        optionElement.addEventListener('mouseleave', () => {
          optionElement.style.background = 'transparent';
          optionElement.style.border = '1px solid #00ff00';
        });
        
        // Add click handler
        optionElement.addEventListener('click', () => {
          if (this.onCommsOptionClick) {
            this.onCommsOptionClick(parseInt(optionElement.dataset.optionIndex));
          }
        });
        
        this.commsOptions.appendChild(optionElement);
      });
    } else {
      // Default options if none provided
      const option1 = document.createElement('div');
      option1.style.marginBottom = '10px';
      option1.style.padding = '8px';
      option1.style.border = '1px solid #00ff00';
      option1.style.cursor = 'pointer';
      option1.style.transition = 'all 0.2s ease';
      option1.innerHTML = '<span style="color: #ffff00;">1.</span> Information about ' + planetName;
      option1.dataset.optionId = 'information';
      option1.dataset.optionIndex = '1';
      
      // Add hover effects
      option1.addEventListener('mouseenter', () => {
        option1.style.background = 'rgba(0, 255, 0, 0.1)';
        option1.style.border = '1px solid #00ff00';
      });
      
      option1.addEventListener('mouseleave', () => {
        option1.style.background = 'transparent';
        option1.style.border = '1px solid #00ff00';
      });
      
      // Add click handler
      option1.addEventListener('click', () => {
        if (this.onCommsOptionClick) {
          this.onCommsOptionClick(1);
        }
      });
      
      this.commsOptions.appendChild(option1);
      
      const option2 = document.createElement('div');
      option2.style.marginBottom = '10px';
      option2.style.padding = '8px';
      option2.style.border = '1px solid #00ff00';
      option2.style.cursor = 'pointer';
      option2.style.transition = 'all 0.2s ease';
      option2.innerHTML = '<span style="color: #ffff00;">2.</span> Request docking';
      option2.dataset.optionId = 'docking';
      option2.dataset.optionIndex = '2';
      
      // Add hover effects
      option2.addEventListener('mouseenter', () => {
        option2.style.background = 'rgba(0, 255, 0, 0.1)';
        option2.style.border = '1px solid #00ff00';
      });
      
      option2.addEventListener('mouseleave', () => {
        option2.style.background = 'transparent';
        option2.style.border = '1px solid #00ff00';
      });
      
      // Add click handler
      option2.addEventListener('click', () => {
        if (this.onCommsOptionClick) {
          this.onCommsOptionClick(2);
        }
      });
      
      this.commsOptions.appendChild(option2);
    }
    
    this.commsModal.style.display = 'block';
  }

  updateCommsModal(message, options) {
    this.commsMessage.textContent = message;
    
    // Clear previous options
    this.commsOptions.innerHTML = '';
    
    // Add new options
    if (options && options.length > 0) {
      options.forEach((option, index) => {
        const optionElement = document.createElement('div');
        optionElement.style.marginBottom = '10px';
        optionElement.style.padding = '8px';
        optionElement.style.border = '1px solid #00ff00';
        optionElement.style.cursor = 'pointer';
        optionElement.style.transition = 'all 0.2s ease';
        optionElement.innerHTML = `<span style="color: #ffff00;">${index + 1}.</span> ${option.text}`;
        optionElement.dataset.optionId = option.id;
        optionElement.dataset.optionIndex = index + 1;
        
        // Add hover effects
        optionElement.addEventListener('mouseenter', () => {
          optionElement.style.background = 'rgba(0, 255, 0, 0.1)';
          optionElement.style.border = '1px solid #00ff00';
        });
        
        optionElement.addEventListener('mouseleave', () => {
          optionElement.style.background = 'transparent';
          optionElement.style.border = '1px solid #00ff00';
        });
        
        // Add click handler
        optionElement.addEventListener('click', () => {
          if (this.onCommsOptionClick) {
            this.onCommsOptionClick(parseInt(optionElement.dataset.optionIndex));
          }
        });
        
        this.commsOptions.appendChild(optionElement);
      });
    }
  }

  hideCommsModal() {
    this.commsModal.style.display = 'none';
  }

  isCommsModalVisible() {
    return this.commsModal.style.display === 'block';
  }

  setOnCommsOptionClick(callback) {
    this.onCommsOptionClick = callback;
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }
}
