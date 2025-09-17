// ShipHealthUI.js
// Displays HULL and SHIELD status for the player's ship

export class ShipHealthUI {
  constructor(game, ship) {
    this.game = game;
    this.ship = ship;
    this.isFirstPerson = true; // default to cockpit mode
    this.container = document.createElement('div');
  this.container.className = 'ship-health-ui';
  this.container.style.position = 'absolute';
  this.container.style.left = '50%';
  this.container.style.bottom = '20px'; // below radar
  this.container.style.transform = 'translateX(-50%)';
  this.container.style.zIndex = '20';
  this.container.style.pointerEvents = 'none';
  this.container.style.minWidth = '150px';
  this.container.style.textAlign = 'left';
  this.container.style.fontFamily = 'PeaberryMono, monospace';
  this.container.style.setProperty('font-family', 'PeaberryMono, monospace', 'important');
  this.container.style.fontSize = '12px';
  this.container.style.color = '#00ff00';
  //this.container.style.background = 'rgba(0,32,0,0.85)';
  //this.container.style.border = '2px solid #00ff00';
  //this.container.style.borderRadius = '12px';
  //this.container.style.boxShadow = '0 0 12px #003300';
  this.container.style.padding = '15px';
  this.container.style.userSelect = 'none';

  // Two-column grid panel
  this.panel = document.createElement('div');
  this.panel.style.display = 'grid';
  this.panel.style.gridTemplateColumns = '1fr 1fr';
  this.panel.style.columnGap = '8px';
  this.panel.style.rowGap = '8px';

  // Left column: labels (right-justified)
  this.hullLabel = document.createElement('div');
  this.hullLabel.textContent = 'HULL';
  this.hullLabel.style.textAlign = 'right';
  this.hullLabel.style.fontWeight = 'bold';
  this.shieldLabel = document.createElement('div');
  this.shieldLabel.textContent = 'SHIELD';
  this.shieldLabel.style.textAlign = 'right';
  this.shieldLabel.style.fontWeight = 'bold';

  // Right column: values (left-justified)
  this.hullValue = document.createElement('div');
  this.hullValue.textContent = this.getHull();
  this.hullValue.style.textAlign = 'left';
  this.shieldValue = document.createElement('div');
  this.shieldValue.textContent = 'OFFLINE';
  this.shieldValue.style.textAlign = 'left';
  this.shieldValue.style.color = '#ff3333'; // red for OFFLINE

  // Add to grid
  this.panel.appendChild(this.hullLabel);
  this.panel.appendChild(this.hullValue);
  this.panel.appendChild(this.shieldLabel);
  this.panel.appendChild(this.shieldValue);

  this.container.appendChild(this.panel);
  }

  getHull() {
    // Always use live ship.hullStrength, initialize if missing
    if (this.ship && typeof this.ship.hullStrength !== 'number') {
      const max = (typeof this.ship?.maxHullStrength === 'number') ? this.ship.maxHullStrength : 100;
      this.ship.hullStrength = max;
    }
    return (typeof this.ship?.hullStrength === 'number') ? this.ship.hullStrength : 100;
  }

  update(ship) {
    this.ship = ship;
    this.hullValue.textContent = this.getHull();
    // Shields not implemented yet
  }

  attach(parent=document.body) {
    parent.appendChild(this.container);
  }

  detach() {
    if (this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Switch between first-person (cockpit overlay) and third-person (legacy) layouts.
  // For now, we keep identical styling in both modes; this method exists to mirror
  // the pattern used by other UI components and to allow future divergence.
  setViewMode(isFirstPerson) {
    this.isFirstPerson = !!isFirstPerson;
    // Intentionally no style changes yet; reserved for future variant styling.
  }
}
