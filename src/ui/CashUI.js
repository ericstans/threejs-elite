export class CashUI {
  constructor(container) {
    this.container = container;
    this.createCashDisplay();
  }

  createCashDisplay() {
    // Main cash panel container
    this.cashPanel = document.createElement('div');
    this.cashPanel.style.position = 'absolute';
    this.cashPanel.style.bottom = '0px';
    this.cashPanel.style.right = '246px'; // Positioned right against the cargo box (200px + 20px margin)
    this.cashPanel.style.width = 'auto';
    this.cashPanel.style.height = '60px';
    this.cashPanel.style.background = 'transparent';
    this.cashPanel.style.border = 'none';
    this.cashPanel.style.padding = '0';
    this.cashPanel.style.fontFamily = 'PeaberryMono, monospace';
    this.cashPanel.style.fontSize = '14px';
    this.cashPanel.style.color = '#00ff00';
    this.cashPanel.style.pointerEvents = 'none';
    this.cashPanel.style.display = 'flex';
    this.cashPanel.style.flexDirection = 'column';
    this.cashPanel.style.justifyContent = 'center';
    this.cashPanel.style.alignItems = 'flex-end';
    this.container.appendChild(this.cashPanel);

    // Cash amount display
    this.cashAmount = document.createElement('div');
    this.cashAmount.style.textAlign = 'right';
    this.cashAmount.style.fontSize = '14px';
    this.cashAmount.style.fontWeight = 'bold';
    this.cashAmount.style.fontFamily = 'PeaberryMono, monospace';
    this.cashAmount.textContent = '$0';
    this.cashPanel.appendChild(this.cashAmount);
  }

  // Method to update cash display
  updateCash(amount) {
    if (this.cashAmount) {
      this.cashAmount.textContent = `$${amount.toLocaleString()}`;
    }
  }

  // Method to get current cash display value
  getCashDisplay() {
    return this.cashAmount ? this.cashAmount.textContent : '$0';
  }
}
