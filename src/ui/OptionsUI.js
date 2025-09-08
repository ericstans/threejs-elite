export class OptionsUI {
  constructor() {
    this.isVisible = false;
    this.game = null; // Will be set by the game instance
    this.onClose = null; // Callback for when options are closed

    this.createUI();
    this.setupEventListeners();
  }

  createUI() {
    // Main options modal
    this.optionsModal = document.createElement('div');
    this.optionsModal.style.position = 'fixed';
    this.optionsModal.style.top = '0';
    this.optionsModal.style.left = '0';
    this.optionsModal.style.width = '100%';
    this.optionsModal.style.height = '100%';
    this.optionsModal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.optionsModal.style.display = 'none';
    this.optionsModal.style.zIndex = '3000';
    this.optionsModal.style.pointerEvents = 'auto';
    this.optionsModal.style.fontFamily = 'monospace';
    this.optionsModal.style.color = '#ffffff';
    document.body.appendChild(this.optionsModal);

    // Options content container
    this.optionsContent = document.createElement('div');
    this.optionsContent.style.position = 'absolute';
    this.optionsContent.style.top = '50%';
    this.optionsContent.style.left = '50%';
    this.optionsContent.style.transform = 'translate(-50%, -50%)';
    this.optionsContent.style.width = '600px';
    this.optionsContent.style.maxHeight = '80%';
    this.optionsContent.style.overflowY = 'auto';
    this.optionsContent.style.background = 'rgba(0, 0, 0, 0.9)';
    this.optionsContent.style.border = '2px solid #00ff00';
    this.optionsContent.style.padding = '30px';
    this.optionsContent.style.borderRadius = '8px';
    this.optionsModal.appendChild(this.optionsContent);

    // Title
    this.title = document.createElement('h2');
    this.title.textContent = 'OPTIONS';
    this.title.style.margin = '0 0 30px 0';
    this.title.style.textAlign = 'center';
    this.title.style.color = '#00ff00';
    this.title.style.fontSize = '24px';
    this.title.style.textShadow = '0 0 10px #00ff00';
    this.optionsContent.appendChild(this.title);

    // Audio section
    this.createAudioSection();

    // Close button
    this.createCloseButton();
  }

  createAudioSection() {
    // Audio section title
    const audioTitle = document.createElement('h3');
    audioTitle.textContent = 'AUDIO';
    audioTitle.style.margin = '0 0 20px 0';
    audioTitle.style.color = '#00ff00';
    audioTitle.style.fontSize = '18px';
    this.optionsContent.appendChild(audioTitle);

    // Music volume control
    this.createVolumeControl('Music Volume', 'musicVolume', 0.5, (value) => {
      if (this.game && this.game.musicManager) {
        this.game.musicManager.setVolume(value);
      }
    });

    // Sound effects volume control
    this.createVolumeControl('Sound Effects Volume', 'soundVolume', 0.3, (value) => {
      if (this.game && this.game.soundManager) {
        this.game.soundManager.setVolume(value);
      }
    });
  }

  createVolumeControl(label, id, defaultValue, onChange) {
    const controlContainer = document.createElement('div');
    controlContainer.style.marginBottom = '25px';
    this.optionsContent.appendChild(controlContainer);

    // Label
    const labelElement = document.createElement('label');
    labelElement.textContent = label;
    labelElement.style.display = 'block';
    labelElement.style.marginBottom = '8px';
    labelElement.style.color = '#ffffff';
    labelElement.style.fontSize = '14px';
    controlContainer.appendChild(labelElement);

    // Slider container
    const sliderContainer = document.createElement('div');
    sliderContainer.style.display = 'flex';
    sliderContainer.style.alignItems = 'center';
    sliderContainer.style.gap = '15px';
    controlContainer.appendChild(sliderContainer);

    // Volume slider
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '1';
    slider.step = '0.01';
    slider.value = defaultValue;
    slider.style.flex = '1';
    slider.style.height = '6px';
    slider.style.background = '#333';
    slider.style.outline = 'none';
    slider.style.borderRadius = '3px';
    slider.style.webkitAppearance = 'none';
    slider.style.appearance = 'none';

    // Custom slider styling
    slider.style.background = `linear-gradient(to right, #00ff00 0%, #00ff00 ${defaultValue * 100}%, #333 ${defaultValue * 100}%, #333 100%)`;

    slider.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      valueDisplay.textContent = Math.round(value * 100) + '%';

      // Update slider background
      slider.style.background = `linear-gradient(to right, #00ff00 0%, #00ff00 ${value * 100}%, #333 ${value * 100}%, #333 100%)`;

      // Call the onChange callback
      onChange(value);
    });

    sliderContainer.appendChild(slider);

    // Value display
    const valueDisplay = document.createElement('span');
    valueDisplay.textContent = Math.round(defaultValue * 100) + '%';
    valueDisplay.style.color = '#00ff00';
    valueDisplay.style.fontSize = '14px';
    valueDisplay.style.minWidth = '40px';
    valueDisplay.style.textAlign = 'right';
    sliderContainer.appendChild(valueDisplay);

    // Store reference for later use
    this[id] = slider;
  }

  createCloseButton() {
    const buttonContainer = document.createElement('div');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.marginTop = '30px';
    this.optionsContent.appendChild(buttonContainer);

    this.closeButton = document.createElement('button');
    this.closeButton.textContent = 'CLOSE';
    this.closeButton.style.background = 'transparent';
    this.closeButton.style.border = '2px solid #00ff00';
    this.closeButton.style.color = '#00ff00';
    this.closeButton.style.padding = '10px 30px';
    this.closeButton.style.fontFamily = 'monospace';
    this.closeButton.style.fontSize = '14px';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.style.borderRadius = '4px';
    this.closeButton.style.transition = 'all 0.2s ease';

    // Hover effects
    this.closeButton.addEventListener('mouseenter', () => {
      this.closeButton.style.background = '#00ff00';
      this.closeButton.style.color = '#000000';
    });

    this.closeButton.addEventListener('mouseleave', () => {
      this.closeButton.style.background = 'transparent';
      this.closeButton.style.color = '#00ff00';
    });

    this.closeButton.addEventListener('click', () => {
      this.hide();
      if (this.onClose) {
        this.onClose();
      }
    });

    buttonContainer.appendChild(this.closeButton);
  }

  setupEventListeners() {
    // Handle escape key when options are visible
    this.escapeKeyHandler = (event) => {
      if (event.code === 'Escape' && this.isVisible) {
        this.hide();
        if (this.onClose) {
          this.onClose();
        }
      }
    };

    document.addEventListener('keydown', this.escapeKeyHandler);
  }

  setGame(game) {
    this.game = game;

    // Initialize sliders with current values
    if (this.game.musicManager) {
      this.musicVolume.value = this.game.musicManager.getVolume();
      this.updateSliderDisplay(this.musicVolume);
    }

    if (this.game.soundManager) {
      this.soundVolume.value = this.game.soundManager.getVolume();
      this.updateSliderDisplay(this.soundVolume);
    }
  }

  updateSliderDisplay(slider) {
    const value = parseFloat(slider.value);
    const valueDisplay = slider.parentElement.querySelector('span');
    valueDisplay.textContent = Math.round(value * 100) + '%';
    slider.style.background = `linear-gradient(to right, #00ff00 0%, #00ff00 ${value * 100}%, #333 ${value * 100}%, #333 100%)`;
  }

  show() {
    this.isVisible = true;
    this.optionsModal.style.display = 'block';

    // Update sliders with current values
    if (this.game && this.game.musicManager) {
      this.musicVolume.value = this.game.musicManager.getVolume();
      this.updateSliderDisplay(this.musicVolume);
    }

    if (this.game && this.game.soundManager) {
      this.soundVolume.value = this.game.soundManager.getVolume();
      this.updateSliderDisplay(this.soundVolume);
    }
  }

  hide() {
    this.isVisible = false;
    this.optionsModal.style.display = 'none';
  }

  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  destroy() {
    // Remove event listener
    if (this.escapeKeyHandler) {
      document.removeEventListener('keydown', this.escapeKeyHandler);
    }

    // Remove modal from DOM
    if (this.optionsModal && this.optionsModal.parentNode) {
      this.optionsModal.parentNode.removeChild(this.optionsModal);
    }
  }
}
