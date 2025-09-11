export class CommoditiesUI {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.commodities = [];
    this.sellGrid = [];
    this.sellGridSize = 20; // 4x5 grid
    this.cargoItems = []; // Items from cargo bay
    this.movedItems = []; // Track items moved from cargo to sell grid
    this.onCargoUpdate = null; // Callback to update cargo
    this.onCargoAdd = null; // Callback to add items back to cargo
    this.createCommoditiesModal();
  }

  createCommoditiesModal() {
    // Main modal container
    this.modal = document.createElement('div');
    this.modal.style.position = 'fixed';
    this.modal.style.top = '0';
    this.modal.style.left = '0';
    this.modal.style.width = '100%';
    this.modal.style.height = '100%';
    this.modal.style.background = 'rgba(0, 0, 0, 0.8)';
    this.modal.style.display = 'none';
    this.modal.style.zIndex = '4000';
    this.modal.style.pointerEvents = 'auto';
    this.container.appendChild(this.modal);

    // Modal content
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '50%';
    this.content.style.left = '50%';
    this.content.style.transform = 'translate(-50%, -50%)';
    this.content.style.width = '80%';
    this.content.style.maxWidth = '1000px';
    this.content.style.height = '80%';
    this.content.style.background = 'rgba(0, 20, 0, 0.95)';
    this.content.style.border = '2px solid #00ff00';
    this.content.style.borderRadius = '8px';
    this.content.style.padding = '20px';
    this.content.style.fontFamily = 'PeaberryMono, monospace';
    this.content.style.color = '#00ff00';
    this.content.style.overflow = 'hidden';
    this.modal.appendChild(this.content);

    // Header
    this.header = document.createElement('div');
    this.header.style.display = 'flex';
    this.header.style.justifyContent = 'space-between';
    this.header.style.alignItems = 'center';
    this.header.style.marginBottom = '20px';
    this.header.style.borderBottom = '1px solid #00ff00';
    this.header.style.paddingBottom = '10px';
    this.content.appendChild(this.header);

    this.title = document.createElement('h2');
    this.title.textContent = 'COMMODITIES MARKET';
    this.title.style.margin = '0';
    this.title.style.fontSize = '24px';
    this.title.style.fontWeight = 'bold';
    this.header.appendChild(this.title);

    this.closeButton = document.createElement('button');
    this.closeButton.textContent = '✕';
    this.closeButton.style.background = 'transparent';
    this.closeButton.style.border = '1px solid #00ff00';
    this.closeButton.style.color = '#00ff00';
    this.closeButton.style.padding = '5px 10px';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.style.fontFamily = 'PeaberryMono, monospace';
    this.closeButton.addEventListener('click', () => this.hide());
    this.header.appendChild(this.closeButton);

    // Main content area
    this.mainContent = document.createElement('div');
    this.mainContent.style.display = 'flex';
    this.mainContent.style.height = 'calc(100% - 80px)';
    this.mainContent.style.gap = '20px';
    this.content.appendChild(this.mainContent);

    // Left panel - Available commodities
    this.createAvailableCommoditiesPanel();
    
    // Right panel - Sell grid
    this.createSellGridPanel();

    // Bottom panel - Cash and totals
    this.createBottomPanel();
  }

  createAvailableCommoditiesPanel() {
    this.availablePanel = document.createElement('div');
    this.availablePanel.style.flex = '1';
    this.availablePanel.style.border = '1px solid #00ff00';
    this.availablePanel.style.borderRadius = '4px';
    this.availablePanel.style.padding = '15px';
    this.mainContent.appendChild(this.availablePanel);

    this.availableTitle = document.createElement('h3');
    this.availableTitle.textContent = 'AVAILABLE COMMODITIES';
    this.availableTitle.style.margin = '0 0 15px 0';
    this.availableTitle.style.fontSize = '18px';
    this.availablePanel.appendChild(this.availableTitle);

    this.commoditiesList = document.createElement('div');
    this.commoditiesList.style.maxHeight = '400px';
    this.commoditiesList.style.overflowY = 'auto';
    this.availablePanel.appendChild(this.commoditiesList);
  }

  createSellGridPanel() {
    this.sellPanel = document.createElement('div');
    this.sellPanel.style.flex = '1';
    this.sellPanel.style.border = '1px solid #00ff00';
    this.sellPanel.style.borderRadius = '4px';
    this.sellPanel.style.padding = '15px';
    this.mainContent.appendChild(this.sellPanel);

    this.sellTitle = document.createElement('h3');
    this.sellTitle.textContent = 'SELL ITEMS';
    this.sellTitle.style.margin = '0 0 15px 0';
    this.sellTitle.style.fontSize = '18px';
    this.sellPanel.appendChild(this.sellTitle);

    // Sell grid container
    this.sellGridContainer = document.createElement('div');
    this.sellGridContainer.style.display = 'grid';
    this.sellGridContainer.style.gridTemplateColumns = 'repeat(4, 1fr)';
    this.sellGridContainer.style.gridTemplateRows = 'repeat(5, 1fr)';
    this.sellGridContainer.style.gap = '4px';
    this.sellGridContainer.style.height = '300px';
    this.sellPanel.appendChild(this.sellGridContainer);

    // Create sell grid slots
    for (let i = 0; i < this.sellGridSize; i++) {
      const slot = document.createElement('div');
      slot.style.border = '1px solid #00aa55';
      slot.style.borderRadius = '2px';
      slot.style.background = 'rgba(0, 170, 85, 0.1)';
      slot.style.display = 'flex';
      slot.style.alignItems = 'center';
      slot.style.justifyContent = 'center';
      slot.style.fontSize = '20px';
      slot.style.minHeight = '50px';
      slot.style.position = 'relative';
      slot.style.cursor = 'pointer';
      slot.style.transition = 'all 0.2s ease';
      slot.dataset.slotIndex = i;

      // Add hover effects
      slot.addEventListener('mouseenter', () => {
        if (slot.textContent === '·') {
          slot.style.background = 'rgba(0, 170, 85, 0.2)';
          slot.style.borderColor = '#00ff55';
        }
      });

      slot.addEventListener('mouseleave', () => {
        if (slot.textContent === '·') {
          slot.style.background = 'rgba(0, 170, 85, 0.1)';
          slot.style.borderColor = '#00aa55';
        }
      });

      // Empty slot indicator
      slot.textContent = '·';
      slot.style.color = '#006644';

      this.sellGrid.push(slot);
      this.sellGridContainer.appendChild(slot);
    }
  }

  createBottomPanel() {
    this.bottomPanel = document.createElement('div');
    this.bottomPanel.style.position = 'absolute';
    this.bottomPanel.style.bottom = '20px';
    this.bottomPanel.style.left = '20px';
    this.bottomPanel.style.right = '20px';
    this.bottomPanel.style.display = 'flex';
    this.bottomPanel.style.justifyContent = 'space-between';
    this.bottomPanel.style.alignItems = 'center';
    this.bottomPanel.style.borderTop = '1px solid #00ff00';
    this.bottomPanel.style.paddingTop = '15px';
    this.content.appendChild(this.bottomPanel);

    // Cash display
    this.cashDisplay = document.createElement('div');
    this.cashDisplay.style.fontSize = '18px';
    this.cashDisplay.style.fontWeight = 'bold';
    this.cashDisplay.textContent = 'Cash: $0';
    this.bottomPanel.appendChild(this.cashDisplay);

    // Sell total
    this.sellTotal = document.createElement('div');
    this.sellTotal.style.fontSize = '18px';
    this.sellTotal.style.fontWeight = 'bold';
    this.sellTotal.style.color = '#ffff00';
    this.sellTotal.textContent = 'Sell Total: $0';
    this.bottomPanel.appendChild(this.sellTotal);

    // Sell button
    this.sellButton = document.createElement('button');
    this.sellButton.textContent = 'SELL ITEMS';
    this.sellButton.style.background = 'rgba(0, 255, 0, 0.2)';
    this.sellButton.style.border = '1px solid #00ff00';
    this.sellButton.style.color = '#00ff00';
    this.sellButton.style.padding = '10px 20px';
    this.sellButton.style.cursor = 'pointer';
    this.sellButton.style.fontFamily = 'PeaberryMono, monospace';
    this.sellButton.style.fontSize = '16px';
    this.sellButton.addEventListener('click', () => this.sellItems());
    this.bottomPanel.appendChild(this.sellButton);
  }

  show() {
    this.isVisible = true;
    this.modal.style.display = 'block';
    this.movedItems = []; // Clear moved items when showing
    this.updateCargoDisplay();
  }

  hide() {
    this.isVisible = false;
    this.modal.style.display = 'none';
    // Return moved items to cargo bay
    this.returnItemsToCargo();
  }

  updateCommodities(commodities) {
    this.commodities = commodities;
    this.updateCommoditiesList();
  }

  updateCommoditiesList() {
    this.commoditiesList.innerHTML = '';
    
    this.commodities.forEach(commodity => {
      const item = document.createElement('div');
      item.style.display = 'flex';
      item.style.justifyContent = 'space-between';
      item.style.alignItems = 'center';
      item.style.padding = '8px';
      item.style.border = '1px solid #00aa55';
      item.style.borderRadius = '4px';
      item.style.marginBottom = '5px';
      item.style.cursor = 'pointer';

      const name = document.createElement('span');
      name.textContent = commodity.name;
      name.style.fontWeight = 'bold';
      item.appendChild(name);

      const price = document.createElement('span');
      price.textContent = `$${commodity.buyPrice.toFixed(0)} / $${commodity.sellPrice.toFixed(0)}`;
      price.style.color = '#ffff00';
      item.appendChild(price);

      this.commoditiesList.appendChild(item);
    });
  }

  updateCash(cashAmount) {
    this.cashDisplay.textContent = `Cash: $${cashAmount.toLocaleString()}`;
  }

  updateSellTotal() {
    let total = 0;
    this.sellGrid.forEach(slot => {
      if (slot.dataset.commodity) {
        const commodity = this.commodities.find(c => c.name === slot.dataset.commodity);
        if (commodity) {
          total += commodity.sellPrice;
        }
      }
    });
    this.sellTotal.textContent = `Sell Total: $${total.toFixed(0)}`;
  }

  sellItems() {
    let totalValue = 0;
    const itemsToSell = [];

    // Calculate total value and collect items to sell
    this.sellGrid.forEach((slot, index) => {
      if (slot.dataset.commodity && slot.dataset.cargoIndex !== undefined) {
        const commodity = this.commodities.find(c => c.name === slot.dataset.commodity);
        if (commodity) {
          totalValue += commodity.sellPrice;
          itemsToSell.push({
            slotIndex: index,
            cargoIndex: parseInt(slot.dataset.cargoIndex),
            commodity: commodity,
            value: commodity.sellPrice
          });
        }
      }
    });

    if (itemsToSell.length === 0) {
      console.log('No items to sell');
      return;
    }

    // Call the cargo update callback to remove items and add cash
    if (this.onCargoUpdate) {
      this.onCargoUpdate(itemsToSell, totalValue);
    }

    // Clear the sell grid and moved items
    this.sellGrid.forEach(slot => {
      slot.textContent = '·';
      slot.style.color = '#006644';
      slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)'; // Reset to default background
      slot.style.borderColor = '#00aa55'; // Reset to default border
      delete slot.dataset.commodity;
      delete slot.dataset.cargoIndex;
    });
    this.movedItems = []; // Clear moved items after selling

    this.updateSellTotal();
    console.log(`Sold ${itemsToSell.length} items for $${totalValue.toFixed(0)}`);
  }

  // Cargo management methods
  updateCargoItems(cargoItems) {
    this.cargoItems = cargoItems;
    this.updateCargoDisplay();
  }

  updateCargoDisplay() {
    // This will be implemented to show cargo items that can be clicked
    // For now, just log the cargo items
    console.log('Cargo items:', this.cargoItems);
  }

  // Drag and drop methods
  enableDragAndDrop() {
    // Enable drag and drop from cargo bay to sell grid
    this.setupCargoDragSources();
    this.setupSellGridDropTargets();
  }

  setupCargoDragSources() {
    // This will be called when cargo items are available for dragging
    // For now, we'll set up the framework
    console.log('Cargo drag sources setup');
  }

  setupSellGridDropTargets() {
    // Set up sell grid slots as drop targets
    this.sellGrid.forEach((slot, index) => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        slot.style.backgroundColor = 'rgba(0, 255, 0, 0.2)';
      });

      slot.addEventListener('dragleave', (e) => {
        e.preventDefault();
        if (slot.textContent === '·') {
          slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)';
        }
      });

      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        const cargoData = e.dataTransfer.getData('text/plain');
        if (cargoData) {
          try {
            const cargoItem = JSON.parse(cargoData);
            this.addToSellGrid(index, cargoItem);
          } catch (error) {
            console.error('Error parsing cargo data:', error);
          }
        }
        slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)';
      });
    });
  }

  // Method to add item to sell grid
  addToSellGrid(slotIndex, cargoItem) {
    if (slotIndex >= 0 && slotIndex < this.sellGridSize) {
      const slot = this.sellGrid[slotIndex];
      slot.textContent = '●'; // Use circle icon like cargo bay
      slot.title = cargoItem.name; // Use item name as tooltip
      slot.style.setProperty('color', cargoItem.color || '#00ff00', 'important'); // Use item's actual color with !important
      slot.style.backgroundColor = cargoItem.color ? this.getColorRgba(cargoItem.color, 0.1) : 'rgba(0, 170, 85, 0.2)';
      slot.style.borderColor = cargoItem.color || '#00ff55'; // Use item's actual color for border
      slot.dataset.commodity = cargoItem.name;
      slot.dataset.cargoIndex = cargoItem.index;
      this.updateSellTotal();
    }
  }

  // Helper method to convert hex color to rgba
  getColorRgba(hexColor, alpha) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // Method to remove item from sell grid
  removeFromSellGrid(slotIndex) {
    if (slotIndex >= 0 && slotIndex < this.sellGridSize) {
      const slot = this.sellGrid[slotIndex];
      slot.textContent = '·';
      slot.style.color = '#006644';
      slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)'; // Reset to default background
      slot.style.borderColor = '#00aa55'; // Reset to default border
      delete slot.dataset.commodity;
      delete slot.dataset.cargoIndex;
      this.updateSellTotal();
    }
  }

  // Method to move item from cargo to sell grid
  moveItemToSellGrid(cargoItem) {
    // Find first empty slot in sell grid
    for (let i = 0; i < this.sellGridSize; i++) {
      if (this.sellGrid[i].textContent === '·') {
        this.addToSellGrid(i, cargoItem);
        this.movedItems.push(cargoItem);
        // Remove item from cargo bay
        this.removeFromCargoBay(cargoItem);
        return true;
      }
    }
    return false; // No empty slots
  }

  // Method to remove item from cargo bay
  removeFromCargoBay(cargoItem) {
    if (cargoItem.slot) {
      cargoItem.slot.textContent = '·';
      cargoItem.slot.style.color = '#006644';
      cargoItem.slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)';
      cargoItem.slot.style.borderColor = '#00aa55';
    }
  }

  // Method to return items to cargo bay
  returnItemsToCargo() {
    if (this.movedItems.length > 0) {
      console.log('Returning items to cargo bay:', this.movedItems);
      
      // Add items back to cargo system
      if (this.onCargoAdd) {
        this.movedItems.forEach(item => {
          this.onCargoAdd(item);
        });
      }
      
      // Restore items to cargo bay
      this.movedItems.forEach(item => {
        if (item.slot) {
          item.slot.textContent = '●'; // Use circle icon like cargo bay
          item.slot.title = item.name; // Use item name as tooltip
          item.slot.style.setProperty('color', item.color || '#00ff00', 'important');
          item.slot.style.backgroundColor = item.color ? this.getColorRgba(item.color, 0.1) : 'rgba(0, 170, 85, 0.2)';
          item.slot.style.borderColor = item.color || '#00ff55';
        }
      });
      // Clear the sell grid
      this.sellGrid.forEach(slot => {
        slot.textContent = '·';
        slot.title = ''; // Clear tooltip
        slot.style.color = '#006644';
        slot.style.backgroundColor = 'rgba(0, 170, 85, 0.1)'; // Reset to default background
        slot.style.borderColor = '#00aa55'; // Reset to default border
        delete slot.dataset.commodity;
        delete slot.dataset.cargoIndex;
      });
      this.updateSellTotal();
      this.movedItems = [];
    }
  }
}
