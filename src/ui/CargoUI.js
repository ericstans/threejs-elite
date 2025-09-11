export class CargoUI {
  constructor(container) {
    this.container = container;
    this.cargoGrid = [];
    this.createCargoGrid();
  }

  createCargoGrid() {
    // Main cargo panel container
    this.cargoPanel = document.createElement('div');
    this.cargoPanel.style.position = 'absolute';
    this.cargoPanel.style.bottom = '20px';
    this.cargoPanel.style.right = '20px';
    this.cargoPanel.style.width = '200px';
    this.cargoPanel.style.height = '120px';
    this.cargoPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    this.cargoPanel.style.border = '2px solid #00ff00';
    this.cargoPanel.style.borderRadius = '4px';
    this.cargoPanel.style.padding = '8px';
    this.cargoPanel.style.fontFamily = 'monospace';
    this.cargoPanel.style.fontSize = '12px';
    this.cargoPanel.style.color = '#00ff00';
    this.cargoPanel.style.boxShadow = '0 0 10px rgba(0,255,0,0.3)';
    this.cargoPanel.style.pointerEvents = 'auto';
    this.cargoPanel.style.zIndex = '5000';
    this.container.appendChild(this.cargoPanel);

    // Cargo title
    this.cargoTitle = document.createElement('div');
    this.cargoTitle.style.textAlign = 'center';
    this.cargoTitle.style.fontWeight = 'bold';
    this.cargoTitle.style.marginBottom = '6px';
    this.cargoTitle.style.fontSize = '11px';
    this.cargoTitle.textContent = 'CARGO BAY';
    this.cargoPanel.appendChild(this.cargoTitle);

    // Grid container
    this.gridContainer = document.createElement('div');
    this.gridContainer.style.display = 'grid';
    this.gridContainer.style.gridTemplateColumns = 'repeat(5, 1fr)';
    this.gridContainer.style.gridTemplateRows = 'repeat(3, 1fr)';
    this.gridContainer.style.gap = '2px';
    this.gridContainer.style.height = '90px';
    this.cargoPanel.appendChild(this.gridContainer);

    // Create 15 cargo slots (5x3 grid)
    for (let i = 0; i < 15; i++) {
      const slot = document.createElement('div');
      slot.style.border = '1px solid #00aa55';
      slot.style.borderRadius = '2px';
      slot.style.background = 'rgba(0, 170, 85, 0.1)';
      slot.style.display = 'flex';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
      slot.style.fontSize = '24px';
      slot.style.minHeight = '32px';
      slot.style.position = 'relative';
      slot.style.cursor = 'pointer';
      slot.style.transition = 'all 0.2s ease';

      // Add hover effects
      slot.addEventListener('mouseenter', () => {
        slot.style.background = 'rgba(0, 170, 85, 0.2)';
        slot.style.borderColor = '#00ff55';
      });

      slot.addEventListener('mouseleave', () => {
        slot.style.background = 'rgba(0, 170, 85, 0.1)';
        slot.style.borderColor = '#00aa55';
      });

      // Empty slot indicator
      slot.textContent = '·';
      slot.style.color = '#006644';

      this.cargoGrid.push(slot);
      this.gridContainer.appendChild(slot);
    }
  }

  // Method to add cargo to a slot
  addCargo(slotIndex, cargoIcon, cargoName = '') {
    if (slotIndex >= 0 && slotIndex < this.cargoGrid.length) {
      const slot = this.cargoGrid[slotIndex];
      slot.textContent = cargoIcon;
      slot.style.color = '#00ff00';
      slot.title = cargoName; // Tooltip

      // Add a small indicator for occupied slots
      slot.style.background = 'rgba(0, 255, 0, 0.1)';
      slot.style.borderColor = '#00ff00';
    }
  }

  // Method to add cargo with specific color
  addCargoWithColor(slotIndex, cargoIcon, cargoName = '', color = '#00ff00') {
    if (slotIndex >= 0 && slotIndex < this.cargoGrid.length) {
      const slot = this.cargoGrid[slotIndex];
      slot.textContent = cargoIcon;
      slot.style.color = color;
      slot.title = cargoName; // Tooltip

      // Add a small indicator for occupied slots with resource color
      const colorRgb = this.hexToRgb(color);
      slot.style.background = `rgba(${colorRgb.r}, ${colorRgb.g}, ${colorRgb.b}, 0.1)`;
      slot.style.borderColor = color;
    }
  }

  // Helper method to convert hex color to RGB
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 255, b: 0 };
  }

  // Method to remove cargo from a slot
  removeCargo(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.cargoGrid.length) {
      const slot = this.cargoGrid[slotIndex];
      slot.textContent = '·';
      slot.style.color = '#006644';
      slot.title = '';
      slot.style.background = 'rgba(0, 170, 85, 0.1)';
      slot.style.borderColor = '#00aa55';
    }
  }

  // Method to clear all cargo
  clearAllCargo() {
    for (let i = 0; i < this.cargoGrid.length; i++) {
      this.removeCargo(i);
    }
  }

  // Method to get the first empty slot
  getFirstEmptySlot() {
    for (let i = 0; i < this.cargoGrid.length; i++) {
      if (this.cargoGrid[i].textContent === '·') {
        return i;
      }
    }
    return -1; // No empty slots
  }

  // Method to check if a slot is empty
  isSlotEmpty(slotIndex) {
    return slotIndex >= 0 && slotIndex < this.cargoGrid.length &&
           this.cargoGrid[slotIndex].textContent === '·';
  }
}
