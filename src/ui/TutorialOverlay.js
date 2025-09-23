const DEBUG = false;

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
        position: 'center',
        showNext: true,
        revealElement: 'radar'
      },
      {
        id: 'radar2',
        title: 'Radar System',
        message: 'You can also use C to communicate with your nav-target, or V to communicate with your target. But not everyone will want to talk, and some planets are empty!',
        position: 'center',
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
        id: 'navtarget',
        title: 'Nav Target Panel',
        message: 'This is your nav target panel. It shows information about your current navigation target, such as planets and space stations. Use Y to select nav targets.',
        position: 'navtarget',
        showNext: true,
        revealElement: 'navtarget'
      },
      {
        id: 'cargo',
        title: 'Cargo Display',
        message: 'This is the cargo bay. ' + (this.startWithCargo() ? 'Oh, you already have cargo? That\'s strange...' : 'It\'s empty right now!'),
        position: 'cargo',
        showNext: true,
        revealElement: 'cargo'
      },
      {
        id: 'controls',
        title: 'Control Instructions',
        message: 'This area shows the controls.',
        position: 'controls',
        showEnd: true,
        revealElement: 'controls'
      }
    ];

    this.createTutorialOverlay();
  }

  createTutorialOverlay() {
    // Create main overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'tutorial-overlay';

    // Create cowboy man character
    this.cowboy = document.createElement('div');
    this.cowboy.className = 'tutorial-cowboy';
    this.cowboy.textContent = '🤠';

    // Create speech bubble
    this.speechBubble = document.createElement('div');
    this.speechBubble.className = 'tutorial-speech-bubble';

    // Create speech bubble tail (pointer)
    this.speechTail = document.createElement('div');
    this.speechTail.className = 'tutorial-speech-tail';

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
    this.spotlightCutout.className = 'tutorial-spotlight-cutout';
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
    title.className = 'tutorial-title';
    title.textContent = step.title;
    this.content.appendChild(title);

    // Add message
    const message = document.createElement('div');
    message.className = 'tutorial-message';
    message.textContent = step.message;
    this.content.appendChild(message);

    // Add options or buttons
    if (step.showOptions) {
      step.options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'tutorial-button';
        button.textContent = option.text;
        button.onclick = () => this.handleOption(option.action);
        this.content.appendChild(button);
      });
    } else if (step.showNext) {
      const nextButton = document.createElement('button');
      nextButton.className = 'tutorial-next-button';
      nextButton.textContent = 'NEXT →';
      nextButton.onclick = () => this.nextStep();
      this.content.appendChild(nextButton);
    } else if (step.showEnd) {
      const endButton = document.createElement('button');
      endButton.className = 'tutorial-end-button';
      endButton.textContent = 'END →';
      endButton.onclick = () => this.completeTutorial();
      this.content.appendChild(endButton);
    }

    // Position Clippy and speech bubble
    this.positionElements(step.position);

    // Handle spotlight for revealed elements
    this.updateSpotlight(step.revealElement);
  }

  positionElements(position) {
    // Position speech bubble based on the position parameter
    let bubbleLeft, bubbleTop;
    
    switch (position) {
      case 'radar':
        // Position near radar (top-right area)
        bubbleLeft = '75%';
        bubbleTop = '25%';
        break;
      case 'throttle':
        // Position near throttle (bottom-left area)
        bubbleLeft = '60%';
        bubbleTop = '60%';
        break;
      case 'targeting':
        // Position near targeting (top-left area)
        bubbleLeft = '75%';
        bubbleTop = '52%';
        break;
      case 'navtarget':
        // Position near nav target panel (center-left area)
        bubbleLeft = '35%';
        bubbleTop = '40%';
        break;
      case 'cargo':
        // Position near cargo (bottom-right area)
        bubbleLeft = '80%';
        bubbleTop = '70%';
        break;
      case 'controls':
        bubbleLeft = '80%';
        bubbleTop = '15%';
        break;
      case 'center':
      default:
        // Default center position
        bubbleLeft = '60%';
        bubbleTop = '60%';
        break;
    }
    
    // Adjust for small screens
    if (window.innerWidth < 700) {
      bubbleLeft = '50%';
      bubbleTop = '70%';
    }
    
    this.speechBubble.style.left = bubbleLeft;
    this.speechBubble.style.top = bubbleTop;
    this.speechBubble.style.transform = 'translate(-50%, -50%)';

    // After rendering, position cowboy and pointer consistently
    setTimeout(() => {
      const bubbleRect = this.speechBubble.getBoundingClientRect();
      
      // Cowboy always appears to the right and below the speech bubble
      const cowboyX = bubbleRect.right + 28;
      const cowboyY = bubbleRect.bottom + 8;
      this.cowboy.style.left = cowboyX + 'px';
      this.cowboy.style.top = cowboyY + 'px';
      this.cowboy.style.transform = 'none';

      // Pointer always points from bottom-right of bubble to cowboy
      const tailWidth = 32;
      const tailHeight = Math.max(48, cowboyY - bubbleRect.bottom);
      this.speechTail.style.left = (bubbleRect.right - tailWidth / 2)-4 + 'px';
      this.speechTail.style.top = (bubbleRect.bottom - 13) + 'px';
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
      if (DEBUG) {
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

    // Special handling for nav target panel - temporarily show it if hidden
    if (elementId === 'navtarget' && targetElement.style.display === 'none') {
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
      if (DEBUG) {
        console.warn('Tutorial spotlight: Could not find UI instance');
      }
      return null;
    }

    // Map element IDs to UI instance properties
    const elementMap = {
      'radar': uiInstance.radarWrapper,
      'throttle': uiInstance.throttleUI?.throttleContainer,
      'targeting': uiInstance.targetUI?.targetPanel,
      'navtarget': uiInstance.navTargetUI?.navTargetPanel,
      'cargo': uiInstance.cargoUI?.cargoPanel,
      'controls': uiInstance.controlsUI?.controlsHelp
    };

    const element = elementMap[elementId];
    if (element) {
      if (DEBUG) {
        console.log(`Tutorial spotlight: Found element '${elementId}':`, element);
      }
      return element;
    }

    if (DEBUG) {
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
    if (DEBUG) {
      console.log('Testing targeting spotlight...');
    }
    this.updateSpotlight('targeting');
  }

  // Method to test controls specifically
  testControlsSpotlight() {
    if (DEBUG) {
      console.log('Testing controls spotlight...');
    }
    this.updateSpotlight('controls');
  }

  startWithCargo(){
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('startWithCargo') === '1';
  }
}
