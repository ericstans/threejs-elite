export class RefuelRepairUI {
  constructor(container) {
    this.container = container;
    this.isVisible = false;
    this.hull = 100;
    this.maxHull = 100;
    this.cash = 0;
    // Callbacks supplied by host (UI.js)
    this.onRepairToFull = null;
    this.onRefuel = null;
    this.onClose = null;
    this._buildModal();
  }

  _buildModal() {
    // Overlay
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

    // Content
    this.content = document.createElement('div');
    this.content.style.position = 'absolute';
    this.content.style.top = '50%';
    this.content.style.left = '50%';
    this.content.style.transform = 'translate(-50%, -50%)';
    this.content.style.width = '520px';
    this.content.style.maxWidth = '90%';
    this.content.style.background = 'rgba(0, 20, 0, 0.95)';
    this.content.style.border = '2px solid #00ff00';
    this.content.style.borderRadius = '8px';
    this.content.style.padding = '20px';
    this.content.style.fontFamily = 'PeaberryMono, monospace';
    this.content.style.color = '#00ff00';
    this.modal.appendChild(this.content);

    // Header
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.marginBottom = '16px';
    header.style.borderBottom = '1px solid #00ff00';
    header.style.paddingBottom = '8px';
    this.content.appendChild(header);

    const title = document.createElement('h2');
    title.textContent = 'REFUEL & REPAIR';
    title.style.margin = '0';
    title.style.fontSize = '22px';
    title.style.fontWeight = 'bold';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.background = 'transparent';
    closeBtn.style.border = '1px solid #00ff00';
    closeBtn.style.color = '#00ff00';
    closeBtn.style.padding = '4px 10px';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontFamily = 'PeaberryMono, monospace';
    closeBtn.addEventListener('click', () => this.hide());
    header.appendChild(closeBtn);

    // Body
    this.body = document.createElement('div');
    this.body.style.display = 'flex';
    this.body.style.flexDirection = 'column';
    this.body.style.gap = '12px';
    this.content.appendChild(this.body);

    // Hull row
    this.hullRow = document.createElement('div');
    this.hullRow.style.display = 'flex';
    this.hullRow.style.justifyContent = 'space-between';
    this.hullRow.style.alignItems = 'center';
    this.body.appendChild(this.hullRow);

    this.hullLabel = document.createElement('div');
    this.hullLabel.textContent = 'Hull';
    this.hullLabel.style.fontWeight = 'bold';
    this.hullRow.appendChild(this.hullLabel);

    this.hullValue = document.createElement('div');
    this.hullValue.textContent = '100 / 100';
    this.hullRow.appendChild(this.hullValue);

    // Progress bar
    this.progressOuter = document.createElement('div');
    this.progressOuter.style.width = '100%';
    this.progressOuter.style.height = '10px';
    this.progressOuter.style.border = '1px solid #00aa55';
    this.progressOuter.style.background = 'rgba(0, 170, 85, 0.1)';
    this.progressOuter.style.borderRadius = '3px';
    this.content.appendChild(this.progressOuter);

    this.progressInner = document.createElement('div');
    this.progressInner.style.height = '100%';
    this.progressInner.style.width = '100%';
    this.progressInner.style.background = 'linear-gradient(90deg, #00ff88, #00aa55)';
    this.progressInner.style.borderRadius = '2px';
    this.progressOuter.appendChild(this.progressInner);

    // Cost/Cash row
    const costRow = document.createElement('div');
    costRow.style.display = 'flex';
    costRow.style.justifyContent = 'space-between';
    costRow.style.alignItems = 'center';
    this.content.appendChild(costRow);

    this.costText = document.createElement('div');
    this.costText.textContent = 'Cost to full: $0';
    costRow.appendChild(this.costText);

    this.cashText = document.createElement('div');
    this.cashText.textContent = 'Cash: $0';
    this.cashText.style.fontWeight = 'bold';
    costRow.appendChild(this.cashText);

    // Buttons row
    const buttons = document.createElement('div');
    buttons.style.display = 'flex';
    buttons.style.gap = '10px';
    buttons.style.marginTop = '8px';
    this.content.appendChild(buttons);

    this.repairBtn = document.createElement('button');
    this.repairBtn.textContent = 'Repair to 100 ($0)';
    this.repairBtn.style.background = 'rgba(0, 255, 0, 0.2)';
    this.repairBtn.style.border = '1px solid #00ff00';
    this.repairBtn.style.color = '#00ff00';
    this.repairBtn.style.padding = '10px 16px';
    this.repairBtn.style.cursor = 'pointer';
    this.repairBtn.style.fontFamily = 'PeaberryMono, monospace';
    this.repairBtn.style.fontSize = '16px';
    this.repairBtn.addEventListener('click', () => {
      if (this.repairBtn.disabled) return;
      if (typeof this.onRepairToFull === 'function') {
        this.onRepairToFull();
      }
    });
    buttons.appendChild(this.repairBtn);

    this.refuelBtn = document.createElement('button');
    this.refuelBtn.textContent = 'Refuel';
    this.refuelBtn.style.background = 'rgba(0, 255, 0, 0.1)';
    this.refuelBtn.style.border = '1px solid #00ff00';
    this.refuelBtn.style.color = '#00ff00';
    this.refuelBtn.style.padding = '10px 16px';
    this.refuelBtn.style.cursor = 'pointer';
    this.refuelBtn.style.fontFamily = 'PeaberryMono, monospace';
    this.refuelBtn.style.fontSize = '16px';
    this.refuelBtn.addEventListener('click', () => {
      if (typeof this.onRefuel === 'function') {
        this.onRefuel();
      }
    });
    buttons.appendChild(this.refuelBtn);

    // Status text
    this.status = document.createElement('div');
    this.status.style.marginTop = '6px';
    this.status.style.fontSize = '13px';
    this.status.style.color = '#aaaaaa';
    this.status.textContent = '';
    this.content.appendChild(this.status);

    // Footer hint
    const hint = document.createElement('div');
    hint.style.marginTop = '10px';
    hint.style.fontSize = '12px';
    hint.style.color = '#666';
    hint.textContent = 'Press ESC to close';
    this.content.appendChild(hint);

    // ESC handler
    this._escHandler = (e) => {
      if (!this.isVisible) return;
      if (e.key === 'Escape') {
        this.hide();
      }
    };
    document.addEventListener('keydown', this._escHandler);
  }

  _updateUI() {
    const clampedHull = Math.max(0, Math.min(this.hull, this.maxHull));
    const missing = Math.max(0, this.maxHull - clampedHull);
    const cost = missing; // $1 per hull point
    this.hullValue.textContent = `${clampedHull} / ${this.maxHull}`;
    const pct = this.maxHull > 0 ? (clampedHull / this.maxHull) * 100 : 0;
    this.progressInner.style.width = `${pct}%`;
    this.costText.textContent = `Cost to full: $${cost.toLocaleString()}`;
    this.cashText.textContent = `Cash: $${this.cash.toLocaleString()}`;
  this.repairBtn.textContent = `Repair to ${this.maxHull} ($${cost.toLocaleString()})`;
    const canRepair = missing > 0 && this.cash >= cost;
    this.repairBtn.disabled = !canRepair;
    this.repairBtn.style.opacity = canRepair ? '1' : '0.5';
    this.repairBtn.style.cursor = canRepair ? 'pointer' : 'not-allowed';
  }

  setStatus(text) {
    this.status.textContent = text || '';
  }

  show(hull, maxHull = 100, cash = 0) {
    this.hull = typeof hull === 'number' ? Math.floor(hull) : 100;
    this.maxHull = typeof maxHull === 'number' ? Math.floor(maxHull) : 100;
    this.cash = typeof cash === 'number' ? Math.floor(cash) : 0;
    this._updateUI();
    this.modal.style.display = 'block';
    this.isVisible = true;
  }

  update(hull, maxHull = this.maxHull, cash = this.cash) {
    this.hull = typeof hull === 'number' ? Math.floor(hull) : this.hull;
    this.maxHull = typeof maxHull === 'number' ? Math.floor(maxHull) : this.maxHull;
    this.cash = typeof cash === 'number' ? Math.floor(cash) : this.cash;
    this._updateUI();
  }

  hide() {
    this.isVisible = false;
    this.modal.style.display = 'none';
    if (typeof this.onClose === 'function') {
      this.onClose();
    }
  }

  destroy() {
    document.removeEventListener('keydown', this._escHandler);
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
  }
}
