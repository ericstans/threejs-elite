import { ThrottleUI } from './ui/ThrottleUI.js';
import { DebugFlagsUI } from './ui/DebugFlagsUI.js';
import { ControlsUI } from './ui/ControlsUI.js';
import { TargetUI } from './ui/TargetUI.js';
import { NavTargetUI } from './ui/NavTargetUI.js';
import cockpitImageSrc from './assets/png/cockpit.png';

export class UI {
  constructor() {
    this.createUI();
    this.firstPersonMode = true; // start in cockpit view
  }

  createUI() {
    // Add bitmap cockpit graphic (bottom center) beneath UI
    // --- Cockpit wrapper (holds cockpit image + anchored panels) ---
    this.cockpitWrapper = document.createElement('div');
    this.cockpitWrapper.style.position = 'fixed';
    this.cockpitWrapper.style.bottom = '0';
    this.cockpitWrapper.style.left = '50%';
    this.cockpitWrapper.style.transform = 'translateX(-50%)';
    this.cockpitWrapper.style.width = '100%'; // existing scaling behavior retained
    this.cockpitWrapper.style.height = 'auto';
    this.cockpitWrapper.style.pointerEvents = 'none';
    this.cockpitWrapper.style.zIndex = '500';
    document.body.appendChild(this.cockpitWrapper);

    this.cockpitBitmap = document.createElement('img');
    this.cockpitBitmap.src = cockpitImageSrc;
    this.cockpitBitmap.alt = 'Cockpit';
    this.cockpitBitmap.style.width = '100%';
    this.cockpitBitmap.style.height = 'auto';
    this.cockpitBitmap.style.display = 'block';
    this.cockpitBitmap.style.pointerEvents = 'none';
    this.cockpitWrapper.appendChild(this.cockpitBitmap);

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
    this.uiContainer.style.zIndex = '1000'; // ensure above cockpit graphic
    document.body.appendChild(this.uiContainer);

    // Initialize UI components
    this.throttleUI = new ThrottleUI(this.uiContainer);
    this.debugFlagsUI = new DebugFlagsUI();
    this.controlsUI = new ControlsUI(this.uiContainer);
    this.targetUI = new TargetUI(this.uiContainer);
    this.navTargetUI = new NavTargetUI(this.uiContainer);
    this.navTargetUI = new NavTargetUI(this.uiContainer);

    // Re-anchor target & nav target panels into cockpit wrapper for percentage placement.
    // Preserve existing DOM nodes while changing parent.
    if (this.targetUI && this.targetUI.targetPanel) {
      this.cockpitWrapper.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = '70.5%';  // corresponds to previous anchor.x 0.70
      p.top = '61%';   // previous anchor.y 0.66
      p.right = 'auto';
      p.bottom = 'auto';
      p.transform = 'translate(-50%, -50%)';
      // Re-apply text styling lost when moved out of uiContainer inheritance
      p.color = '#00ff00';
      p.fontFamily = 'monospace';
      p.fontSize = '12px';
    }
    if (this.navTargetUI && this.navTargetUI.navTargetPanel) {
      this.cockpitWrapper.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = '29.5%'; // previous anchor.x 0.30
      p2.top = '61%';
      p2.right = 'auto';
      p2.bottom = 'auto';
      p2.transform = 'translate(-50%, -50%)';
      p2.color = '#00ff00';
      p2.fontFamily = 'monospace';
      p2.fontSize = '12px';
    }



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

    // Docking status display moved into Nav Target panel (bottom area)
    this.dockingStatus = document.createElement('div');
    this.dockingStatus.style.position = 'absolute';
    this.dockingStatus.style.left = '50%';
    this.dockingStatus.style.bottom = '4px';
    this.dockingStatus.style.transform = 'translateX(-50%)';
    this.dockingStatus.style.fontFamily = 'monospace';
    this.dockingStatus.style.fontSize = '12px';
    this.dockingStatus.style.color = '#ffff00';
    this.dockingStatus.style.textAlign = 'center';
    this.dockingStatus.style.background = 'rgba(0, 0, 0, 0.4)';
    this.dockingStatus.style.padding = '4px 6px';
    this.dockingStatus.style.border = '1px solid #ffff00';
    this.dockingStatus.style.width = '90%';
    this.dockingStatus.style.borderRadius = '2px';
    this.dockingStatus.style.display = 'none';
    this.dockingStatus.style.whiteSpace = 'pre-line';
    this.dockingStatus.textContent = 'DOCKING IN PROGRESS';
    // Ensure nav target panel can anchor absolutely positioned children
    if (this.navTargetUI && this.navTargetUI.navTargetPanel) {
      // If panel is absolute we still can position child; but make it relative to ensure correct bottom reference
      this.navTargetUI.navTargetPanel.style.position = this.navTargetUI.navTargetPanel.style.position || 'relative';
      this.navTargetUI.navTargetPanel.appendChild(this.dockingStatus);
    } else {
      // Fallback: append to uiContainer (should rarely happen)
      this.uiContainer.appendChild(this.dockingStatus);
    }

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

  // Switch to third-person (legacy) layout: hide cockpit bitmap, move panels back to full-screen container, restore original styling.
  applyThirdPersonLayout() {
    if (!this.firstPersonMode) return; // already third-person
    this.firstPersonMode = false;
    // Hide cockpit image
    if (this.cockpitWrapper) this.cockpitWrapper.style.display = 'none';
    // Reparent target & nav panels back to uiContainer
    if (this.targetUI?.targetPanel) {
      this.uiContainer.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = '80%';
      p.top = '15%';
      p.transform = 'translate(-50%, -50%)';
      p.width = '10%';
      p.height = '20%';
      p.fontSize = '16px';
    }
    if (this.navTargetUI?.navTargetPanel) {
      this.uiContainer.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = '20%';
      p2.top = '15%';
      p2.transform = 'translate(-50%, -50%)';
      p2.width = '10%';
      p2.height = '20%';
      p2.fontSize = '16px';
    }
    // Docking status: revert to centered floating panel (legacy style)
    if (this.dockingStatus) {
      this.dockingStatus.style.position = 'absolute';
      this.dockingStatus.style.left = '50%';
      this.dockingStatus.style.bottom = '';
      this.dockingStatus.style.top = '75%';
      this.dockingStatus.style.width = 'auto';
      this.dockingStatus.style.padding = '20px';
      this.dockingStatus.style.border = '2px solid #ffff00';
      this.dockingStatus.style.fontSize = '24px';
      this.dockingStatus.style.background = 'rgba(0,0,0,0.8)';
      this.dockingStatus.style.transform = 'translate(-50%, -50%)';
      if (this.dockingStatus.parentElement !== this.uiContainer) {
        this.uiContainer.appendChild(this.dockingStatus);
      }
    }
  }

  // Switch back to first-person cockpit overlay layout
  applyFirstPersonLayout() {
    if (this.firstPersonMode) return; // already first-person
    this.firstPersonMode = true;
    if (this.cockpitWrapper) this.cockpitWrapper.style.display = 'block';
    // Reparent panels into cockpit wrapper with overlay positioning
    if (this.targetUI?.targetPanel) {
      this.cockpitWrapper.appendChild(this.targetUI.targetPanel);
      const p = this.targetUI.targetPanel.style;
      p.position = 'absolute';
      p.left = '70.5%';
      p.top = '61%';
      p.transform = 'translate(-50%, -50%)';
      p.width = '';
      p.height = '';
      p.fontSize = '12px';
    }
    if (this.navTargetUI?.navTargetPanel) {
      this.cockpitWrapper.appendChild(this.navTargetUI.navTargetPanel);
      const p2 = this.navTargetUI.navTargetPanel.style;
      p2.position = 'absolute';
      p2.left = '29.5%';
      p2.top = '61%';
      p2.transform = 'translate(-50%, -50%)';
      p2.width = '';
      p2.height = '';
      p2.fontSize = '12px';
    }
    // Docking status back inside nav target panel bottom
    if (this.dockingStatus && this.navTargetUI?.navTargetPanel) {
      this.navTargetUI.navTargetPanel.appendChild(this.dockingStatus);
      this.dockingStatus.style.position = 'absolute';
      this.dockingStatus.style.left = '50%';
      this.dockingStatus.style.top = '';
      this.dockingStatus.style.bottom = '4px';
      this.dockingStatus.style.transform = 'translateX(-50%)';
      this.dockingStatus.style.width = '90%';
      this.dockingStatus.style.padding = '4px 6px';
      this.dockingStatus.style.border = '1px solid #ffff00';
      this.dockingStatus.style.fontSize = '12px';
      this.dockingStatus.style.background = 'rgba(0,0,0,0.4)';
    }
  }

  updateThrottle(targetSpeed, currentSpeed, maxSpeed) {
    this.throttleUI.updateThrottle(targetSpeed, currentSpeed, maxSpeed);
  }

  updateTargetInfo(targetInfo, targetPosition, camera) {
    this.targetUI.updateTargetInfo(targetInfo, targetPosition, camera);
  }

  clearTargetInfo() {
    this.targetUI.clearTargetInfo();
  }

  updateNavTargetInfo(navTargetInfo, targetPosition, camera) {
    this.navTargetUI.updateNavTargetInfo(navTargetInfo, targetPosition, camera);
  }

  clearNavTargetInfo() {
    this.navTargetUI.clearNavTargetInfo();
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
        if (option.flags) {
          optionElement.dataset.flags = JSON.stringify(option.flags);
        }

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
        if (option.flags) {
          optionElement.dataset.flags = JSON.stringify(option.flags);
        }

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

  updateFlagsDisplay(playerFlags, globalFlags) {
    this.debugFlagsUI.updateFlagsDisplay(playerFlags, globalFlags);
  }

  // Docking UI methods
  showDockingStatus() {
    this.dockingStatus.style.display = 'block';
  }

  updateDockingStatus(text) {
    this.dockingStatus.textContent = text;
  }

  hideDockingStatus() {
    this.dockingStatus.style.display = 'none';
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }
}
