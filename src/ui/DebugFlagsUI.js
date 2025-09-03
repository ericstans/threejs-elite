export class DebugFlagsUI {
  constructor() {
    this.isDevMode = this.detectDevMode();
    if (this.isDevMode) {
      this.createFlagsDisplay();
    }
  }

  detectDevMode() {
    // Check if we're running in development mode
    return window.location.hostname === 'localhost' || 
           window.location.hostname === '127.0.0.1' ||
           window.location.protocol === 'file:' ||
           window.location.search.includes('dev=true');
  }

  createFlagsDisplay() {
    // Flags display container
    this.flagsDisplay = document.createElement('div');
    this.flagsDisplay.style.position = 'fixed';
    this.flagsDisplay.style.bottom = '10px';
    this.flagsDisplay.style.left = '50%';
    this.flagsDisplay.style.transform = 'translateX(-50%)';
    this.flagsDisplay.style.background = 'rgba(0, 0, 0, 0.8)';
    this.flagsDisplay.style.border = '1px solid #ff0000';
    this.flagsDisplay.style.padding = '10px';
    this.flagsDisplay.style.fontFamily = 'monospace';
    this.flagsDisplay.style.fontSize = '12px';
    this.flagsDisplay.style.color = '#ffffff';
    this.flagsDisplay.style.maxWidth = '300px';
    this.flagsDisplay.style.zIndex = '3000';
    this.flagsDisplay.style.pointerEvents = 'none';
    document.body.appendChild(this.flagsDisplay);

    // Title
    this.flagsTitle = document.createElement('div');
    this.flagsTitle.textContent = 'DEBUG FLAGS';
    this.flagsTitle.style.color = '#ff0000';
    this.flagsTitle.style.fontWeight = 'bold';
    this.flagsTitle.style.marginBottom = '5px';
    this.flagsTitle.style.borderBottom = '1px solid #ff0000';
    this.flagsTitle.style.paddingBottom = '2px';
    this.flagsDisplay.appendChild(this.flagsTitle);

    // Player flags section
    this.playerFlagsTitle = document.createElement('div');
    this.playerFlagsTitle.textContent = 'Player Flags:';
    this.playerFlagsTitle.style.color = '#00ff00';
    this.playerFlagsTitle.style.marginTop = '5px';
    this.playerFlagsTitle.style.fontWeight = 'bold';
    this.flagsDisplay.appendChild(this.playerFlagsTitle);

    this.playerFlagsContent = document.createElement('div');
    this.playerFlagsContent.style.marginLeft = '10px';
    this.playerFlagsContent.style.marginBottom = '5px';
    this.flagsDisplay.appendChild(this.playerFlagsContent);

    // Global flags section
    this.globalFlagsTitle = document.createElement('div');
    this.globalFlagsTitle.textContent = 'Global Flags:';
    this.globalFlagsTitle.style.color = '#ffff00';
    this.globalFlagsTitle.style.marginTop = '5px';
    this.globalFlagsTitle.style.fontWeight = 'bold';
    this.flagsDisplay.appendChild(this.globalFlagsTitle);

    this.globalFlagsContent = document.createElement('div');
    this.globalFlagsContent.style.marginLeft = '10px';
    this.flagsDisplay.appendChild(this.globalFlagsContent);
  }

  updateFlagsDisplay(playerFlags, globalFlags) {
    if (!this.isDevMode || !this.flagsDisplay) {
      return;
    }

    // Update player flags
    this.playerFlagsContent.innerHTML = '';
    for (const [flagName, value] of Object.entries(playerFlags)) {
      const flagElement = document.createElement('div');
      flagElement.textContent = `${flagName}: ${value}`;
      flagElement.style.color = value ? '#00ff00' : '#666666';
      this.playerFlagsContent.appendChild(flagElement);
    }

    // Update global flags
    this.globalFlagsContent.innerHTML = '';
    for (const [flagName, value] of Object.entries(globalFlags)) {
      const flagElement = document.createElement('div');
      flagElement.textContent = `${flagName}: ${value}`;
      flagElement.style.color = value ? '#ffff00' : '#666666';
      this.globalFlagsContent.appendChild(flagElement);
    }
  }
}
