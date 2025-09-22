export class TitleOverlay {
  constructor() {
    this.isVisible = false;
    this.onDismiss = null;
    this.onStartAudio = null;

    this.createTitleOverlay();
  }

  createTitleOverlay() {
    // Create overlay container
    this.overlay = document.createElement('div');
    this.overlay.className = 'title-overlay';
    this.overlay.style.display = 'none';
    this.overlay.style.pointerEvents = 'auto';

    // Create title text
    this.titleText = document.createElement('div');
    this.titleText.className = 'title-content';

    // Set random title
    const titles = [
      ['THE', 'MOURNFUL', 'VOID']
      //['DARTING', 'TOWARD', 'OBLIVION'],
      //['SHAPES', 'IN THE', 'BLACK']
    ];

    const randomTitle = titles[Math.floor(Math.random() * titles.length)];
    this.titleText.innerHTML = randomTitle.map(line => `<div class="title-text">${line}</div>`).join('');

    // Create "press any key to start" text
    this.startText = document.createElement('div');
    this.startText.className = 'title-credits';
    this.startText.textContent = 'Press any key to start';

    this.overlay.appendChild(this.titleText);
    this.overlay.appendChild(this.startText);
    document.body.appendChild(this.overlay);

    // Add separate click and key handlers
    this.clickHandler = (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Start audio context but don't dismiss title
      if (this.onStartAudio) {
        this.onStartAudio();
      }
    };

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
    document.addEventListener('click', this.clickHandler);
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
    document.removeEventListener('keydown', this.keyHandler);
    document.removeEventListener('click', this.clickHandler);

    if (this.onDismiss) {
      this.onDismiss();
    }
  }

  setOnDismiss(callback) {
    this.onDismiss = callback;
  }

  setOnStartAudio(callback) {
    this.onStartAudio = callback;
  }
}
