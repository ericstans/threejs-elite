import { SHIP_EQUIPMENT } from '../data/ShipEquipmentData.js';

export class OutfittingUI {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.currentCash = 0;
    this.equippedWeapon = null;
    this.equippedHull = null;
    this.equippedThrusters = null;
    this.onPurchase = null; // Callback (equipmentType, equipmentName, cost)
    this.onSell = null; // Callback (equipmentType, equipmentName, price)
    this.onClose = null;
    this.createOutfittingModal();
  }

  createOutfittingModal() {
    // Main modal container
    this.modal = document.createElement('div');
    this.modal.className = 'outfitting-modal';
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

    // ESC handler
    this._escHandler = (e) => {
      if (!this.isVisible) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        else if (e.stopPropagation) e.stopPropagation();
        this.hide();
      }
    };
    document.addEventListener('keydown', this._escHandler);

    // Modal content
    this.content = document.createElement('div');
    this.content.className = 'outfitting-content';
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
    this.header.className = 'outfitting-header';
    this.header.style.display = 'flex';
    this.header.style.justifyContent = 'space-between';
    this.header.style.alignItems = 'center';
    this.header.style.marginBottom = '20px';
    this.header.style.borderBottom = '1px solid #00ff00';
    this.header.style.paddingBottom = '10px';
    this.content.appendChild(this.header);

    this.title = document.createElement('h2');
    this.title.textContent = 'OUTFITTING';
    this.title.style.margin = '0';
    this.title.style.fontSize = '24px';
    this.title.style.fontWeight = 'bold';
    this.header.appendChild(this.title);

    this.closeButton = document.createElement('button');
    this.closeButton.className = 'outfitting-close-button';
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
    this.mainContent.className = 'outfitting-main-content';
    this.mainContent.style.display = 'flex';
    this.mainContent.style.height = 'calc(100% - 100px)';
    this.mainContent.style.gap = '20px';
    this.content.appendChild(this.mainContent);

    // Left panel - Available equipment
    this.createAvailableEquipmentPanel();

    // Right panel - Equipped items
    this.createEquippedPanel();

    // Bottom panel - Cash display
    this.createBottomPanel();
  }

  createAvailableEquipmentPanel() {
    this.availablePanel = document.createElement('div');
    this.availablePanel.className = 'outfitting-available-panel';
    this.availablePanel.style.flex = '1';
    this.availablePanel.style.borderRadius = '4px';
    this.availablePanel.style.padding = '15px';
    this.availablePanel.style.overflowY = 'auto';
    this.mainContent.appendChild(this.availablePanel);

    this.availableTitle = document.createElement('h3');
    this.availableTitle.textContent = 'AVAILABLE EQUIPMENT';
    this.availableTitle.style.margin = '0 0 15px 0';
    this.availableTitle.style.fontSize = '18px';
    this.availablePanel.appendChild(this.availableTitle);

    this.equipmentList = document.createElement('div');
    this.equipmentList.className = 'outfitting-equipment-list';
    this.equipmentList.style.display = 'flex';
    this.equipmentList.style.flexDirection = 'column';
    this.equipmentList.style.gap = '10px';
    this.availablePanel.appendChild(this.equipmentList);
  }

  createEquippedPanel() {
    this.equippedPanel = document.createElement('div');
    this.equippedPanel.className = 'outfitting-equipped-panel';
    this.equippedPanel.style.flex = '1';
    this.equippedPanel.style.borderRadius = '4px';
    this.equippedPanel.style.padding = '15px';
    this.equippedPanel.style.overflowY = 'auto';
    this.mainContent.appendChild(this.equippedPanel);

    this.equippedTitle = document.createElement('h3');
    this.equippedTitle.textContent = 'EQUIPPED';
    this.equippedTitle.style.margin = '0 0 15px 0';
    this.equippedTitle.style.fontSize = '18px';
    this.equippedPanel.appendChild(this.equippedTitle);

    this.equippedList = document.createElement('div');
    this.equippedList.className = 'outfitting-equipped-list';
    this.equippedList.style.display = 'flex';
    this.equippedList.style.flexDirection = 'column';
    this.equippedList.style.gap = '10px';
    this.equippedPanel.appendChild(this.equippedList);
  }

  createBottomPanel() {
    this.bottomPanel = document.createElement('div');
    this.bottomPanel.className = 'outfitting-bottom-panel';
    this.bottomPanel.style.position = 'absolute';
    this.bottomPanel.style.bottom = '20px';
    this.bottomPanel.style.left = '20px';
    this.bottomPanel.style.right = '20px';
    this.bottomPanel.style.display = 'flex';
    this.bottomPanel.style.justifyContent = 'space-between';
    this.bottomPanel.style.alignItems = 'center';
    this.bottomPanel.style.paddingTop = '15px';
    this.bottomPanel.style.borderTop = '1px solid #00ff00';
    this.content.appendChild(this.bottomPanel);

    // Cash display
    this.cashDisplay = document.createElement('div');
    this.cashDisplay.className = 'outfitting-cash-display';
    this.cashDisplay.style.fontSize = '18px';
    this.cashDisplay.style.fontWeight = 'bold';
    this.cashDisplay.textContent = 'Cash: ¤0';
    this.bottomPanel.appendChild(this.cashDisplay);
  }

  renderEquipmentList() {
    this.equipmentList.innerHTML = '';

    // Render each equipment category
    this.renderEquipmentCategory('WEAPONS', SHIP_EQUIPMENT.WEAPONS);
    this.renderEquipmentCategory('HULLS', SHIP_EQUIPMENT.HULLS);
    this.renderEquipmentCategory('THRUSTERS', SHIP_EQUIPMENT.THRUSTERS);
  }

  renderEquipmentCategory(categoryName, categoryData) {
    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.className = 'outfitting-category-header';
    categoryHeader.style.fontSize = '16px';
    categoryHeader.style.fontWeight = 'bold';
    categoryHeader.style.marginTop = '10px';
    categoryHeader.style.marginBottom = '5px';
    categoryHeader.style.color = '#00ff00';
    categoryHeader.style.borderBottom = '1px solid #00ff00';
    categoryHeader.style.paddingBottom = '5px';
    categoryHeader.textContent = categoryName;
    this.equipmentList.appendChild(categoryHeader);

    // Equipment items
    for (const [equipmentName, equipmentData] of Object.entries(categoryData)) {
      const isEquipped = this.isEquipped(categoryName, equipmentName);

      const itemDiv = document.createElement('div');
      itemDiv.className = 'outfitting-equipment-item';
      itemDiv.style.padding = '10px';
      itemDiv.style.border = '1px solid #00ff00';
      itemDiv.style.borderRadius = '4px';
      itemDiv.style.background = isEquipped ? 'rgba(0, 255, 0, 0.2)' : 'rgba(0, 255, 0, 0.05)';
      itemDiv.style.cursor = isEquipped ? 'default' : 'pointer';
      itemDiv.style.transition = 'background 0.2s';

      // Item header (name and cost)
      const itemHeader = document.createElement('div');
      itemHeader.className = 'outfitting-item-header';
      itemHeader.style.display = 'flex';
      itemHeader.style.justifyContent = 'space-between';
      itemHeader.style.marginBottom = '5px';
      itemDiv.appendChild(itemHeader);

      const itemName = document.createElement('div');
      itemName.className = 'outfitting-item-name';
      itemName.style.fontWeight = 'bold';
      itemName.style.fontSize = '16px';
      itemName.textContent = equipmentName + (isEquipped ? ' [EQUIPPED]' : '');
      itemHeader.appendChild(itemName);

      const itemCost = document.createElement('div');
      itemCost.className = 'outfitting-item-cost';
      itemCost.style.fontSize = '16px';
      itemCost.style.color = '#ffff00';
      itemCost.textContent = `¤${equipmentData.cost}`;
      itemHeader.appendChild(itemCost);

      // Item description
      const itemDesc = document.createElement('div');
      itemDesc.className = 'outfitting-item-description';
      itemDesc.style.fontSize = '14px';
      itemDesc.style.color = '#aaa';
      itemDesc.style.marginBottom = '5px';
      itemDesc.textContent = equipmentData.description;
      itemDiv.appendChild(itemDesc);

      // Item stats
      const itemStats = document.createElement('div');
      itemStats.className = 'outfitting-item-stats';
      itemStats.style.fontSize = '13px';
      itemStats.style.color = '#888';
      itemStats.textContent = this.formatStats(equipmentData);
      itemDiv.appendChild(itemStats);

      // Hover and click handlers
      if (!isEquipped) {
        itemDiv.addEventListener('mouseenter', () => {
          itemDiv.style.background = 'rgba(0, 255, 0, 0.15)';
        });
        itemDiv.addEventListener('mouseleave', () => {
          itemDiv.style.background = 'rgba(0, 255, 0, 0.05)';
        });
        itemDiv.addEventListener('click', () => {
          this.handlePurchase(categoryName, equipmentName, equipmentData.cost);
        });
      }

      this.equipmentList.appendChild(itemDiv);
    }
  }

  renderEquippedItems() {
    this.equippedList.innerHTML = '';

    // Show equipped weapon
    if (this.equippedWeapon) {
      this.renderEquippedItem('WEAPON', this.equippedWeapon, SHIP_EQUIPMENT.WEAPONS[this.equippedWeapon]);
    }

    // Show equipped hull
    if (this.equippedHull) {
      this.renderEquippedItem('HULL', this.equippedHull, SHIP_EQUIPMENT.HULLS[this.equippedHull]);
    }

    // Show equipped thrusters
    if (this.equippedThrusters) {
      this.renderEquippedItem('THRUSTERS', this.equippedThrusters, SHIP_EQUIPMENT.THRUSTERS[this.equippedThrusters]);
    }
  }

  renderEquippedItem(categoryName, equipmentName, equipmentData) {
    const tradeInValue = Math.floor(equipmentData.cost * 0.33);

    const itemDiv = document.createElement('div');
    itemDiv.className = 'outfitting-equipped-item';
    itemDiv.style.padding = '10px';
    itemDiv.style.border = '1px solid #00ff00';
    itemDiv.style.borderRadius = '4px';
    itemDiv.style.background = 'rgba(0, 255, 0, 0.1)';

    // Item header
    const itemHeader = document.createElement('div');
    itemHeader.className = 'outfitting-equipped-item-header';
    itemHeader.style.display = 'flex';
    itemHeader.style.justifyContent = 'space-between';
    itemHeader.style.marginBottom = '5px';
    itemDiv.appendChild(itemHeader);

    const itemInfo = document.createElement('div');
    itemInfo.className = 'outfitting-equipped-item-info';

    const categoryLabel = document.createElement('div');
    categoryLabel.className = 'outfitting-equipped-category';
    categoryLabel.style.fontSize = '12px';
    categoryLabel.style.color = '#888';
    categoryLabel.textContent = categoryName;
    itemInfo.appendChild(categoryLabel);

    const itemName = document.createElement('div');
    itemName.className = 'outfitting-equipped-name';
    itemName.style.fontWeight = 'bold';
    itemName.style.fontSize = '16px';
    itemName.textContent = equipmentName;
    itemInfo.appendChild(itemName);

    itemHeader.appendChild(itemInfo);

    // Trade-in value display
    const tradeInLabel = document.createElement('div');
    tradeInLabel.className = 'outfitting-tradein-label';
    tradeInLabel.textContent = `Trade-in: ¤${tradeInValue}`;
    tradeInLabel.style.fontSize = '14px';
    tradeInLabel.style.color = '#ffff00';
    tradeInLabel.style.alignSelf = 'center';
    itemHeader.appendChild(tradeInLabel);

    // Item description
    const itemDesc = document.createElement('div');
    itemDesc.className = 'outfitting-equipped-description';
    itemDesc.style.fontSize = '14px';
    itemDesc.style.color = '#aaa';
    itemDesc.style.marginBottom = '5px';
    itemDesc.textContent = equipmentData.description;
    itemDiv.appendChild(itemDesc);

    // Item stats
    const itemStats = document.createElement('div');
    itemStats.className = 'outfitting-equipped-stats';
    itemStats.style.fontSize = '13px';
    itemStats.style.color = '#888';
    itemStats.textContent = this.formatStats(equipmentData);
    itemDiv.appendChild(itemStats);

    this.equippedList.appendChild(itemDiv);
  }

  formatStats(equipmentData) {
    const stats = [];
    if (equipmentData.damage !== undefined) stats.push(`Damage: ${equipmentData.damage}`);
    if (equipmentData.velocity !== undefined) stats.push(`Velocity: ${equipmentData.velocity}`);
    if (equipmentData.cooldown !== undefined) stats.push(`Cooldown: ${equipmentData.cooldown}s`);
    if (equipmentData.range !== undefined) stats.push(`Range: ${equipmentData.range}`);
    if (equipmentData.armor !== undefined) stats.push(`Armor: ${equipmentData.armor}`);
    if (equipmentData.speed !== undefined) stats.push(`Speed: ${equipmentData.speed}x`);
    if (equipmentData.maneuverability !== undefined) stats.push(`Maneuverability: ${equipmentData.maneuverability}x`);
    if (equipmentData.thrust !== undefined) stats.push(`Thrust: ${equipmentData.thrust}x`);
    return stats.join(' | ');
  }

  isEquipped(categoryName, equipmentName) {
    if (categoryName === 'WEAPONS') return this.equippedWeapon === equipmentName;
    if (categoryName === 'HULLS') return this.equippedHull === equipmentName;
    if (categoryName === 'THRUSTERS') return this.equippedThrusters === equipmentName;
    return false;
  }

  handlePurchase(categoryName, equipmentName, cost) {
    // Calculate trade-in credit for currently equipped item
    let tradeInCredit = 0;
    let oldEquipmentData = null;

    if (categoryName === 'WEAPONS' && this.equippedWeapon) {
      oldEquipmentData = SHIP_EQUIPMENT.WEAPONS[this.equippedWeapon];
    } else if (categoryName === 'HULLS' && this.equippedHull) {
      oldEquipmentData = SHIP_EQUIPMENT.HULLS[this.equippedHull];
    } else if (categoryName === 'THRUSTERS' && this.equippedThrusters) {
      oldEquipmentData = SHIP_EQUIPMENT.THRUSTERS[this.equippedThrusters];
    }

    if (oldEquipmentData) {
      tradeInCredit = Math.floor(oldEquipmentData.cost * 0.33);
    }

    const finalCost = cost - tradeInCredit;

    if (this.currentCash < finalCost) {
      console.log('Not enough cash');
      return;
    }

    if (this.onPurchase) {
      this.onPurchase(categoryName, equipmentName, finalCost, tradeInCredit);
    }
  }

  handleSell(categoryName, equipmentName, sellPrice) {
    if (this.onSell) {
      this.onSell(categoryName, equipmentName, sellPrice);
    }
  }

  show(equippedWeapon, equippedHull, equippedThrusters, cash) {
    this.isVisible = true;
    this.modal.style.display = 'block';
    this.currentCash = cash;
    this.equippedWeapon = equippedWeapon;
    this.equippedHull = equippedHull;
    this.equippedThrusters = equippedThrusters;
    this.updateDisplay();
  }

  hide() {
    this.isVisible = false;
    this.modal.style.display = 'none';
    if (this.onClose) {
      this.onClose();
    }
  }

  updateDisplay() {
    this.cashDisplay.textContent = `Cash: ¤${this.currentCash}`;
    this.renderEquipmentList();
    this.renderEquippedItems();
  }

  updateCash(cash) {
    this.currentCash = cash;
    this.cashDisplay.textContent = `Cash: ¤${this.currentCash}`;
  }

  destroy() {
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}
