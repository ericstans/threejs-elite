export class GameOverOverlay {
  constructor() {
    this.isVisible = false;
    this.onQuit = null;
    this._build();
  }

  _build() {
    // Transparent full-screen overlay without additional background container
    this.overlay = document.createElement('div');
    this.overlay.style.position = 'fixed';
    this.overlay.style.top = '0';
    this.overlay.style.left = '0';
    this.overlay.style.width = '100%';
    this.overlay.style.height = '100%';
    this.overlay.style.background = 'transparent';
    this.overlay.style.display = 'none';
    this.overlay.style.zIndex = '10001';
    this.overlay.style.pointerEvents = 'auto';

    // Title text styled like TitleOverlay title
    this.titleText = document.createElement('div');
    this.titleText.style.position = 'absolute';
    this.titleText.style.top = '45%';
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
    this.titleText.textContent = 'GAME OVER';

    // Quit button
    this.quitButton = document.createElement('button');
    this.quitButton.textContent = 'Quit to Title';
    this.quitButton.style.position = 'absolute';
    this.quitButton.style.top = '58%';
    this.quitButton.style.left = '50%';
    this.quitButton.style.transform = 'translateX(-50%)';
    this.quitButton.style.fontFamily = 'monospace';
    this.quitButton.style.fontSize = '18px';
    this.quitButton.style.padding = '10px 16px';
    this.quitButton.style.background = 'rgba(0,0,0,0.35)';
    this.quitButton.style.border = '2px solid #00ff00';
    this.quitButton.style.color = '#00ff00';
    this.quitButton.style.cursor = 'pointer';
    this.quitButton.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)';
    this.quitButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (this.onQuit) this.onQuit();
    });

    this.overlay.appendChild(this.titleText);
    this.overlay.appendChild(this.quitButton);
    document.body.appendChild(this.overlay);
  }

  show() {
    this.isVisible = true;
    this.overlay.style.display = 'block';
  }

  hide() {
    this.isVisible = false;
    this.overlay.style.display = 'none';
  }

  setOnQuit(callback) {
    this.onQuit = callback;
  }
}
