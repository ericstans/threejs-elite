export class TitleOverlay {
  constructor() {
    this.isVisible = false;
    this.onDismiss = null;
    
    this.createTitleOverlay();
  }

  createTitleOverlay() {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.background = 'transparent';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '10000';
    this.overlay.style.pointerEvents = 'auto';
    
    // Create title text
    this.titleText = document.createElement('div');
    this.titleText.style.position = 'absolute';
    this.titleText.style.top = '50%';
    this.titleText.style.left = '50%';
    this.titleText.style.transform = 'translate(-50%, -50%)';
    this.titleText.style.color = '#ffffff';
    this.titleText.style.fontFamily = 'monospace';
    this.titleText.style.fontSize = '70px';
    this.titleText.style.fontWeight = 'bold';
    this.titleText.style.textAlign = 'center';
    this.titleText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
    this.titleText.style.userSelect = 'none';
    this.titleText.style.cursor = 'default';
    
    // Set random title
    const titles = [
      ['THE', 'MOURNFUL', 'VOID'],
      ['DARK', 'FRONTIER', 'AWAITS'],
      ['VOID', 'WALKER', 'RISES'],
      ['STAR', 'DREAMS', 'FADE'],
      ['DARTING', 'TOWARD', 'OBLIVION']
    ];
    
    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    this.titleText.innerHTML = randomTitle.map(line => `<div>${line}</div>`).join('');
    
    // Create "press any key to start" text
    this.startText = document.createElement('div');
    this.startText.style.position = 'absolute';
    this.startText.style.bottom = '20%';
    this.startText.style.left = '50%';
    this.startText.style.transform = 'translateX(-50%)';
    this.startText.style.color = '#cccccc';
    this.startText.style.fontFamily = 'monospace';
    this.startText.style.fontSize = '18px';
    this.startText.style.textAlign = 'center';
    this.startText.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    this.startText.style.userSelect = 'none';
    this.startText.style.cursor = 'default';
    this.startText.style.opacity = '0.8';
    this.startText.textContent = 'Press any key to start';
    
    this.overlay.appendChild(this.titleText);
    this.overlay.appendChild(this.startText);
    document.body.appendChild(this.overlay);
    
    // Add click/key handler
    this.keyHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      this.hide();
    };
  }

  show() {
    this.isVisible = true;
    this.overlay.style.display = 'block';
    document.addEventListener('keydown', this.keyHandler);
    document.addEventListener('click', this.keyHandler);
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
    document.removeEventListener('keydown', this.keyHandler);
    document.removeEventListener('click', this.keyHandler);
    
    if (this.onDismiss) {
      this.onDismiss();
    }
  }

  setOnDismiss(callback) {
    this.onDismiss = callback;
  }
}