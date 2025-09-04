import { ThrottleUI } from './ui/ThrottleUI.js';
import { DebugFlagsUI } from './ui/DebugFlagsUI.js';
import { ControlsUI } from './ui/ControlsUI.js';
import { TargetUI } from './ui/TargetUI.js';
import { NavTargetUI } from './ui/NavTargetUI.js';
import cockpitImageSrc from './assets/png/cockpit.png';

export class UI {
  constructor() {
    this.createUI();
  }

  createCockpitOverlay() {
    // --- SVG Cockpit Overlay ---
  this.cockpitOverlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  //this.cockpitOverlay.setAttribute('width', '100%');
  //this.cockpitOverlay.setAttribute('height', '100%');
  this.cockpitOverlay.style.maxWidth = '120%';
  this.cockpitOverlay.style.maxHeight = '1335px'
  this.cockpitOverlay.style.position = 'fixed';
  this.cockpitOverlay.style.top = '0';
  this.cockpitOverlay.style.left = '0';
  this.cockpitOverlay.style.width = '80vw';
  this.cockpitOverlay.style.height = '100vh';
  this.cockpitOverlay.style.pointerEvents = 'none';
  this.cockpitOverlay.style.zIndex = '900'; // Below UI container (zIndex 1200+)
  document.body.appendChild(this.cockpitOverlay);

  // Draw Apache-style canopy: metallic frame and clear canopy
  // Main hull (bottom, metallic)
  const hull = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  hull.setAttribute('d', `M 0,1000 Q 960,800 1920,1000 L 1920,1080 L 0,1080 Z`);
  hull.setAttribute('fill', 'url(#hullMetal)');
  hull.setAttribute('opacity', '0.92');
  this.cockpitOverlay.appendChild(hull);

  // Canopy (center, clear)
  const canopy = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  canopy.setAttribute('d', `M 600,1080 Q 960,400 1320,1080 Z`);
  canopy.setAttribute('fill', 'rgba(200,200,255,0.13)');
  canopy.setAttribute('stroke', '#b0b0b0');
  canopy.setAttribute('stroke-width', '4');
  this.cockpitOverlay.appendChild(canopy);

  // Left metallic frame
  const leftFrame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  leftFrame.setAttribute('d', `M 0,1000 Q 960,800 600,1080 L 0,1080 Z`);
  leftFrame.setAttribute('fill', 'url(#hullMetal)');
  leftFrame.setAttribute('opacity', '0.97');
  this.cockpitOverlay.appendChild(leftFrame);

  // Right metallic frame
  const rightFrame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  rightFrame.setAttribute('d', `M 1320,1080 Q 1920,800 1920,1000 L 1920,1080 Z`);
  rightFrame.setAttribute('fill', 'url(#hullMetal)');
  rightFrame.setAttribute('opacity', '0.97');
  this.cockpitOverlay.appendChild(rightFrame);

  // Add metallic gradient
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
  grad.setAttribute('id', 'hullMetal');
  grad.setAttribute('x1', '0%');
  grad.setAttribute('y1', '0%');
  grad.setAttribute('x2', '0%');
  grad.setAttribute('y2', '100%');
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#888');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#222');
  grad.appendChild(stop1);
  grad.appendChild(stop2);
  defs.appendChild(grad);
  this.cockpitOverlay.appendChild(defs);

  // --- HUD panel areas (bottom left/right) ---
  const panelW = 260, panelH = 120;
  const leftPanel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  leftPanel.setAttribute('x', 120);
  leftPanel.setAttribute('y', 900);
  leftPanel.setAttribute('width', panelW);
  leftPanel.setAttribute('height', panelH);
  leftPanel.setAttribute('rx', 18);
  leftPanel.setAttribute('fill', 'rgba(60,60,60,0.85)');
  leftPanel.setAttribute('stroke', '#b0b0b0');
  leftPanel.setAttribute('stroke-width', '3');
  this.cockpitOverlay.appendChild(leftPanel);

  const rightPanel = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rightPanel.setAttribute('x', 1920-120-panelW);
  rightPanel.setAttribute('y', 900);
  rightPanel.setAttribute('width', panelW);
  rightPanel.setAttribute('height', panelH);
  rightPanel.setAttribute('rx', 18);
  rightPanel.setAttribute('fill', 'rgba(60,60,60,0.85)');
  rightPanel.setAttribute('stroke', '#b0b0b0');
  rightPanel.setAttribute('stroke-width', '3');
  this.cockpitOverlay.appendChild(rightPanel);
  }

  createUI() {
  // Add bitmap cockpit graphic (bottom center) beneath UI
  this.cockpitBitmap = document.createElement('img');
  this.cockpitBitmap.src = cockpitImageSrc;
  this.cockpitBitmap.alt = 'Cockpit';
  this.cockpitBitmap.style.width = '120%';
  this.cockpitBitmap.style.position = 'fixed';
  this.cockpitBitmap.style.bottom = '0';
  this.cockpitBitmap.style.left = '50%';
  this.cockpitBitmap.style.transform = 'translateX(-50%)';
  this.cockpitBitmap.style.pointerEvents = 'none';
  this.cockpitBitmap.style.zIndex = '500'; // below UI elements
  // Scale: keep natural size; could be adjusted with max-width if needed
  // this.cockpitBitmap.style.maxWidth = '100%';
  document.body.appendChild(this.cockpitBitmap);

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
  // After panels exist, set up anchoring relative to cockpit bitmap
  this.setupCockpitAnchors();



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

    // Docking status display (initially hidden)
    this.dockingStatus = document.createElement('div');
    this.dockingStatus.style.position = 'absolute';
    this.dockingStatus.style.top = '75%';
    this.dockingStatus.style.left = '50%';
    this.dockingStatus.style.transform = 'translate(-50%, -50%)';
    this.dockingStatus.style.fontFamily = 'monospace';
    this.dockingStatus.style.fontSize = '24px';
    this.dockingStatus.style.color = '#ffff00';
    this.dockingStatus.style.textAlign = 'center';
    this.dockingStatus.style.background = 'rgba(0, 0, 0, 0.8)';
    this.dockingStatus.style.padding = '20px';
    this.dockingStatus.style.border = '2px solid #ffff00';
    this.dockingStatus.style.display = 'none';
    this.dockingStatus.style.zIndex = '1500';
    this.dockingStatus.textContent = 'DOCKING IN PROGRESS';
    this.uiContainer.appendChild(this.dockingStatus);

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
    this.crosshair.style.display = 'none';
    this.autoAimCone.style.display = 'none';
    this.dockingStatus.style.display = 'block';
  }

  updateDockingStatus(text) {
    this.dockingStatus.textContent = text;
  }

  hideDockingStatus() {
    this.crosshair.style.display = 'block';
    this.autoAimCone.style.display = 'block';
    this.dockingStatus.style.display = 'none';
  }

  destroy() {
    if (this.uiContainer && this.uiContainer.parentNode) {
      this.uiContainer.parentNode.removeChild(this.uiContainer);
    }
  }

  // --- Cockpit anchoring logic ---
  setupCockpitAnchors() {
    // Define anchor points as normalized (0..1) coordinates within the cockpit image
    // Adjust these values to fine‑tune placement over the PNG artwork.
    this.cockpitAnchors = {
      // Example guesses: right side stacked panels. Tweak to match artwork hotspots.
      navTargetPanel: { x: 0.30, y: 0.66 },    // Slightly above target panel
      targetPanel: { x: 0.70, y: 0.66 }       // Near lower right of canopy
    };

    // Recalculate on window resize and when image loads
    window.addEventListener('resize', () => this.updateCockpitAnchoredPanels());
    if (this.cockpitBitmap) {
      if (this.cockpitBitmap.complete) {
        this.updateCockpitAnchoredPanels();
      } else {
        this.cockpitBitmap.addEventListener('load', () => this.updateCockpitAnchoredPanels(), { once: true });
      }
    }
  }

  updateCockpitAnchoredPanels() {
    if (!this.cockpitBitmap) return;
    const rect = this.cockpitBitmap.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const place = (el, anchor) => {
      if (!el || !anchor) return;
      // Ensure element is visible for correct measurement (temporarily)
      const prevDisplay = el.style.display || '';
      if (prevDisplay === 'none') el.style.display = 'block';
      // Use fixed positioning so it's relative to viewport, not container scaling
      el.style.position = 'fixed';
      // Measure AFTER forcing block to get size
      const elRect = el.getBoundingClientRect();
      const left = rect.left + anchor.x * rect.width - elRect.width / 2;
      const top = rect.top + anchor.y * rect.height - elRect.height / 2;
      el.style.left = `${Math.round(left)}px`;
      el.style.top = `${Math.round(top)}px`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      // Restore original display if it was hidden
      if (prevDisplay === 'none') el.style.display = 'none';
    };

    place(this.targetUI && this.targetUI.targetPanel, this.cockpitAnchors.targetPanel);
    place(this.navTargetUI && this.navTargetUI.navTargetPanel, this.cockpitAnchors.navTargetPanel);
  }
}
