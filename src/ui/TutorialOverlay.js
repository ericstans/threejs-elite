export class TutorialOverlay {
  constructor() {
    this.isVisible = false;
    this.currentStep = 0;
    this.onComplete = null;
    this.onSkip = null;
    this.onPause = null;
    this.onResume = null;
    this.spotlightCutout = null;
    this.tutorialSteps = [
      {
        id: 'welcome',
        title: 'Welcome to The Mournful Void!',
        message: 'Congratulations on the purchase of your Flea MkII! Would you like an overview of your ship\'s features?',
        position: 'center',
        showOptions: true,
        options: [
          { text: 'Continue Tutorial', action: 'continue' },
          { text: 'Skip Tutorial', action: 'skip' }
        ]
      },
      {
        id: 'radar',
        title: 'Radar System',
        message: 'This is your radar. Red dots are targets such as ships and asteroids. Yellow dots are nav-targets such as planets and space stations.',
        position: 'radar',
        showNext: true,
        revealElement: 'radar'
      },
      {
        id: 'radar2',
        title: 'Radar System',
        message: 'You can also use C to communicate with your nav-target, or V to communicate with your target. But not everyone will want to talk, and some planets are empty!',
        position: 'radar',
        showNext: true,
        revealElement: 'radar'
      },
      {
        id: 'throttle',
        title: 'Throttle Control',
        message: 'This is your throttle control. Use X to accelerate and Z to decelerate.',
        position: 'throttle',
        showNext: true,
        revealElement: 'throttle'
      },
      {
        id: 'targeting',
        title: 'Targeting System',
        message: 'This is your targeting system. Press T for targeting and Y for nav-targeting.',
        position: 'targeting',
        showNext: true,
        revealElement: 'targeting'
      },
      {
        id: 'cargo',
        title: 'Cargo Display',
        message: 'This is the cargo bay. It\'s empty right now!.',
        position: 'cargo',
        showNext: true,
        revealElement: 'cargo'
      },
      {
        id: 'controls',
        title: 'Control Instructions',
        message: 'This area shows the controls.',
        position: 'center',
        showEnd: true,
        revealElement: 'controls'
      }
    ];

    this.createTutorialOverlay();
  }

  createTutorialOverlay() {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.background = 'rgba(0, 0, 0, 0.7)';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '10001';
    this.overlay.style.pointerEvents = 'auto';

    // Create cowboy man character
    this.cowboy = document.createElement('div');
    this.cowboy.style.position = 'absolute';
    this.cowboy.style.fontSize = '64px';
    this.cowboy.style.userSelect = 'none';
    this.cowboy.style.cursor = 'default';
    this.cowboy.style.zIndex = '10003';
    this.cowboy.textContent = '🤠';

    // Create speech bubble
    this.speechBubble = document.createElement('div');
    this.speechBubble.style.position = 'absolute';
    this.speechBubble.style.background = '#ffffcc';
    this.speechBubble.style.border = '2px solid #000000';
    this.speechBubble.style.borderRadius = '15px';
    this.speechBubble.style.padding = '15px 20px';
    this.speechBubble.style.maxWidth = '320px';
    this.speechBubble.style.fontFamily = 'monospace';
    this.speechBubble.style.fontSize = '15px';
    this.speechBubble.style.color = '#000000';
    this.speechBubble.style.boxShadow = '3px 3px 6px rgba(0,0,0,0.3)';
    this.speechBubble.style.userSelect = 'none';
    this.speechBubble.style.cursor = 'default';
    this.speechBubble.style.zIndex = '10001';

    // Create speech bubble tail (pointer)
    this.speechTail = document.createElement('div');
    this.speechTail.style.position = 'absolute';
    this.speechTail.style.width = '0';
    this.speechTail.style.height = '0';
    this.speechTail.style.borderLeft = '18px solid transparent';
    this.speechTail.style.borderRight = '0px';
    this.speechTail.style.borderTop = '28px solid #ffffcc';
    this.speechTail.style.zIndex = '10002';
    this.speechTail.style.rotate = '-30deg';

    // Create content area
    this.content = document.createElement('div');
    this.speechBubble.appendChild(this.content);

    this.overlay.appendChild(this.cowboy);
    this.overlay.appendChild(this.speechBubble);
    this.overlay.appendChild(this.speechTail);

    // Create spotlight cutout container
    this.createSpotlightCutoutContainer();

    document.body.appendChild(this.overlay);
  }

  createSpotlightCutoutContainer() {
    // Create a container for spotlight cutouts that will be part of the main overlay
    this.spotlightCutout = document.createElement('div');
    this.spotlightCutout.style.position = 'absolute';
    this.spotlightCutout.style.top = '0';
    this.spotlightCutout.style.left = '0';
    this.spotlightCutout.style.width = '100%';
    this.spotlightCutout.style.height = '100%';
    this.spotlightCutout.style.pointerEvents = 'none';
    this.spotlightCutout.style.zIndex = '1'; // Above the background but below cowboy/dialog
    this.overlay.appendChild(this.spotlightCutout);
  }

  show() {
    this.isVisible = true;
    this.currentStep = 0;
    this.overlay.style.display = 'block';
    this.updateTutorialStep();

    // Pause the game
    if (this.onPause) {
      this.onPause();
    }
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';

    // Resume the game
    if (this.onResume) {
      this.onResume();
    }
  }

  updateTutorialStep() {
    const step = this.tutorialSteps[this.currentStep];
    if (!step) return;

    // Update content
    this.content.innerHTML = '';

    // Add title
    const title = document.createElement('div');
    title.style.fontWeight = 'bold';
    title.style.marginBottom = '10px';
    title.style.fontSize = '16px';
    title.textContent = step.title;
    this.content.appendChild(title);

    // Add message
    const message = document.createElement('div');
    message.style.marginBottom = '15px';
    message.style.lineHeight = '1.4';
    message.textContent = step.message;
    this.content.appendChild(message);

    // Add options or buttons
    if (step.showOptions) {
      step.options.forEach(option => {
        const button = document.createElement('button');
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.margin = '5px 0';
        button.style.padding = '8px 12px';
        button.style.border = '1px solid #000000';
        button.style.borderRadius = '5px';
        button.style.background = '#ffffff';
        button.style.cursor = 'pointer';
        button.style.fontFamily = 'monospace';
        button.style.fontSize = '12px';
        button.textContent = option.text;
        button.onclick = () => this.handleOption(option.action);
        this.content.appendChild(button);
      });
    } else if (step.showNext) {
      const nextButton = document.createElement('button');
      nextButton.style.display = 'block';
      nextButton.style.margin = '10px auto 0';
      nextButton.style.padding = '8px 16px';
      nextButton.style.border = '1px solid #000000';
      nextButton.style.borderRadius = '5px';
      nextButton.style.background = '#e0e0e0';
      nextButton.style.cursor = 'pointer';
      nextButton.style.fontFamily = 'monospace';
      nextButton.style.fontSize = '12px';
      nextButton.textContent = 'NEXT →';
      nextButton.onclick = () => this.nextStep();
      this.content.appendChild(nextButton);
    } else if (step.showEnd) {
      const endButton = document.createElement('button');
      endButton.style.display = 'block';
      endButton.style.margin = '10px auto 0';
      endButton.style.padding = '8px 16px';
      endButton.style.border = '1px solid #000000';
      endButton.style.borderRadius = '5px';
      endButton.style.background = '#90ee90';
      endButton.style.cursor = 'pointer';
      endButton.style.fontFamily = 'monospace';
      endButton.style.fontSize = '12px';
      endButton.textContent = 'END →';
      endButton.onclick = () => this.completeTutorial();
      this.content.appendChild(endButton);
    }

    // Position Clippy and speech bubble
    this.positionElements(step.position);

    // Handle spotlight for revealed elements
    this.updateSpotlight(step.revealElement);
  }

  positionElements(_position) {
    // Position speech bubble as before
    let bubbleLeft = '60%';
    let bubbleTop = '60%';
    if (window.innerWidth < 700) {
      bubbleLeft = '50%';
      bubbleTop = '70%';
    }
    this.speechBubble.style.left = bubbleLeft;
    this.speechBubble.style.top = bubbleTop;
    this.speechBubble.style.transform = 'translate(-50%, -50%)';

    // After rendering, measure bubble size and position cowboy/pointer accordingly
    setTimeout(() => {
      const bubbleRect = this.speechBubble.getBoundingClientRect();
      // Cowboy man: below and to the right of bubble
      const cowboyX = bubbleRect.right + 32;
      const cowboyY = bubbleRect.bottom + 8;
      this.cowboy.style.left = cowboyX + 'px';
      this.cowboy.style.top = cowboyY + 'px';
      this.cowboy.style.transform = 'none';

      // Pointer: start at bottom-right of bubble, point to cowboy
      const tailWidth = 32;
      const tailHeight = Math.max(48, cowboyY - bubbleRect.bottom);
      this.speechTail.style.left = (bubbleRect.right - tailWidth / 2) + 'px';
      this.speechTail.style.top = (bubbleRect.bottom - 8) + 'px';
      this.speechTail.style.transform = 'none';
      this.speechTail.style.borderLeft = tailWidth + 'px solid transparent';
      this.speechTail.style.borderRight = '0';
      this.speechTail.style.borderTop = tailHeight + 'px solid #ffffcc';
      this.speechTail.style.zIndex = '10001';
    }, 0);
  }

  updateSpotlight(revealElement) {
    if (!this.spotlightCutout) return;

    if (!revealElement) {
      // No element to reveal, clear cutouts and use normal background
      this.clearSpotlightCutout();
      return;
    }

    // Create cutout for the specified element
    this.createSpotlightCutout(revealElement);
  }

  createSpotlightCutout(elementId) {
    // Clear any existing cutouts
    this.spotlightCutout.innerHTML = '';

    // Find the target element
    const targetElement = this.findUIElement(elementId);
    if (!targetElement) {
      if (typeof DEBUG !== 'undefined' && DEBUG) {
        console.warn(`Tutorial spotlight: Could not find element with id '${elementId}'`);
      }
      return;
    }

    // Special handling for targeting panel - temporarily show it if hidden
    if (elementId === 'targeting' && targetElement.style.display === 'none') {
      targetElement.style.display = 'block';
      // Store reference to restore later
      this._temporarilyShownElement = { element: targetElement, wasHidden: true };
    }

    // Get element position and size
    const rect = targetElement.getBoundingClientRect();
    const padding = 20; // Extra padding around the element

    // Create cutout using CSS clip-path
    const cutoutLeft = Math.max(0, rect.left - padding);
    const cutoutTop = Math.max(0, rect.top - padding);
    const cutoutRight = Math.min(window.innerWidth, rect.right + padding);
    const cutoutBottom = Math.min(window.innerHeight, rect.bottom + padding);

    const cutoutWidth = cutoutRight - cutoutLeft;
    const cutoutHeight = cutoutBottom - cutoutTop;

    // Create the spotlight effect using CSS clip-path on the main overlay
    this.applySpotlightClipPath(cutoutLeft, cutoutTop, cutoutWidth, cutoutHeight);
  }

  findUIElement(elementId) {
    // Use stored UI instance or try to get from global scope
    const uiInstance = this.uiInstance || window.game?.ui || window.ui;
    if (!uiInstance) {
      if (typeof DEBUG !== 'undefined' && DEBUG) {
        console.warn('Tutorial spotlight: Could not find UI instance');
      }
      return null;
    }

    // Map element IDs to UI instance properties
    const elementMap = {
      'radar': uiInstance.radarWrapper,
      'throttle': uiInstance.throttleUI?.throttleContainer,
      'targeting': uiInstance.targetUI?.targetPanel,
      'cargo': uiInstance.cargoUI?.cargoPanel,
      'controls': uiInstance.controlsUI?.controlsHelp
    };

    const element = elementMap[elementId];
    if (element) {
      if (typeof DEBUG !== 'undefined' && DEBUG) {
        console.log(`Tutorial spotlight: Found element '${elementId}':`, element);
      }
      return element;
    }

    if (typeof DEBUG !== 'undefined' && DEBUG) {
      console.warn(`Tutorial spotlight: Could not find element '${elementId}' in UI instance`);
      console.log('Available UI elements:', Object.keys(uiInstance).filter(key => key.includes('UI') || key.includes('Wrapper')));
    }
    return null;
  }

  applySpotlightClipPath(cutoutLeft, cutoutTop, cutoutWidth, cutoutHeight) {
    // Create a clip-path that cuts out a rectangular hole in the main overlay
    const clipPath = `polygon(
      0% 0%,
      0% 100%,
      ${cutoutLeft}px 100%,
      ${cutoutLeft}px ${cutoutTop}px,
      ${cutoutLeft + cutoutWidth}px ${cutoutTop}px,
      ${cutoutLeft + cutoutWidth}px ${cutoutTop + cutoutHeight}px,
      ${cutoutLeft}px ${cutoutTop + cutoutHeight}px,
      ${cutoutLeft}px 100%,
      100% 100%,
      100% 0%
    )`;

    // Apply the clip-path to the main overlay
    this.overlay.style.clipPath = clipPath;
  }

  clearSpotlightCutout() {
    // Remove clip-path to show normal full overlay
    this.overlay.style.clipPath = 'none';
    this.spotlightCutout.innerHTML = '';

    // Restore temporarily shown element if any
    if (this._temporarilyShownElement) {
      this._temporarilyShownElement.element.style.display = 'none';
      this._temporarilyShownElement = null;
    }
  }

  handleOption(action) {
    if (action === 'continue') {
      this.nextStep();
    } else if (action === 'skip') {
      this.skipTutorial();
    }
  }

  nextStep() {
    this.currentStep++;
    if (this.currentStep < this.tutorialSteps.length) {
      this.updateTutorialStep();
    } else {
      this.completeTutorial();
    }
  }

  completeTutorial() {
    this.hide();
    if (this.onComplete) {
      this.onComplete();
    }
  }

  skipTutorial() {
    this.hide();
    if (this.onSkip) {
      this.onSkip();
    }
  }

  setOnComplete(callback) {
    this.onComplete = callback;
  }

  setOnSkip(callback) {
    this.onSkip = callback;
  }

  setOnPause(callback) {
    this.onPause = callback;
  }

  setOnResume(callback) {
    this.onResume = callback;
  }

  setUIInstance(uiInstance) {
    this.uiInstance = uiInstance;
  }

  // Method for testing spotlight functionality
  testSpotlight(elementId) {
    this.updateSpotlight(elementId);
  }

  // Method to clear spotlight for testing
  clearSpotlight() {
    this.clearSpotlightCutout();
  }

  // Method to test targeting specifically
  testTargetingSpotlight() {
    if (typeof DEBUG !== 'undefined' && DEBUG) {
      console.log('Testing targeting spotlight...');
    }
    this.updateSpotlight('targeting');
  }

  // Method to test controls specifically
  testControlsSpotlight() {
    if (typeof DEBUG !== 'undefined' && DEBUG) {
      console.log('Testing controls spotlight...');
    }
    this.updateSpotlight('controls');
  }
}
