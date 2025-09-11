export class TutorialOverlay {
  constructor() {
    this.isVisible = false;
    this.currentStep = 0;
    this.onComplete = null;
    this.onSkip = null;
    this.onPause = null;
    this.onResume = null;
    
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
        message: 'This is your radar. You can observe the position of planets, spaceships, and other objects in your vicinity. The radar shows their relative positions and helps you navigate through space.',
        position: 'radar',
        showNext: true
      },
      {
        id: 'throttle',
        title: 'Throttle Control',
        message: 'This is your throttle control. Use it to adjust your ship\'s speed. The higher the throttle, the faster you\'ll move, but you\'ll also consume more fuel.',
        position: 'throttle',
        showNext: true
      },
      {
        id: 'targeting',
        title: 'Targeting System',
        message: 'This is your targeting system. You can select targets for combat (V key) or navigation (C key). The selected target will be highlighted and you can communicate with them.',
        position: 'targeting',
        showNext: true
      },
      {
        id: 'cargo',
        title: 'Cargo Display',
        message: 'This shows your current cargo and resources. Keep an eye on your fuel levels and cargo space as you explore the galaxy.',
        position: 'cargo',
        showNext: true
      },
      {
        id: 'controls',
        title: 'Control Instructions',
        message: 'Use WASD to move, mouse to look around, and the various keys shown on screen for different actions. Press H for help anytime!',
        position: 'center',
        showEnd: true
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
  this.speechBubble.style.zIndex = '1';

  // Create speech bubble tail (pointer)
  this.speechTail = document.createElement('div');
  this.speechTail.style.position = 'absolute';
  this.speechTail.style.width = '0';
  this.speechTail.style.height = '0';
  this.speechTail.style.borderLeft = '18px solid transparent';
  this.speechTail.style.borderRight = '18px solid transparent';
  this.speechTail.style.borderTop = '28px solid #ffffcc';
  this.speechTail.style.zIndex = '0';
    
    // Create content area
    this.content = document.createElement('div');
    this.speechBubble.appendChild(this.content);
    
  this.overlay.appendChild(this.cowboy);
    this.overlay.appendChild(this.speechBubble);
    this.overlay.appendChild(this.speechTail);
    document.body.appendChild(this.overlay);
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
  }

  positionElements(position) {
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
      this.speechTail.style.left = (bubbleRect.right - tailWidth/2) + 'px';
      this.speechTail.style.top = (bubbleRect.bottom - 8) + 'px';
      this.speechTail.style.transform = 'none';
      this.speechTail.style.borderLeft = tailWidth + 'px solid transparent';
      this.speechTail.style.borderRight = tailWidth + 'px solid transparent';
      this.speechTail.style.borderTop = tailHeight + 'px solid #ffffcc';
      this.speechTail.style.zIndex = '2';
    }, 0);
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
}
