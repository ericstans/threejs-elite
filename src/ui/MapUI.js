import { generateSectorMap, getConnectedSectors } from '../util/mapGraphGenerator.js';

/**
 * MapUI handles the interactive sector map display
 */
export class MapUI {
  /**
   * Creates a new map UI component
   */
  constructor() {
    this.currentSectorId = null;
    this.sectorMap = null;
    this.onSectorSelect = null;
    
    // Create map elements
    this.mapModal = document.createElement('div');
    this.mapModal.className = 'map-modal';
    document.body.appendChild(this.mapModal);

    this.mapContent = document.createElement('div');
    this.mapContent.className = 'map-content';
    this.mapModal.appendChild(this.mapContent);

    this.mapTitle = document.createElement('h2');
    this.mapTitle.className = 'map-title';
    this.mapTitle.textContent = 'SECTOR MAP';
    this.mapContent.appendChild(this.mapTitle);
    
    // Add canvas for the sector graph
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.className = 'map-canvas';
    this.mapCanvas.width = 800;
    this.mapCanvas.height = 400;
    this.mapContent.appendChild(this.mapCanvas);
    
    // Create tooltip element for sectors
    this.sectorTooltip = document.createElement('div');
    this.sectorTooltip.className = 'sector-tooltip';
    document.body.appendChild(this.sectorTooltip);
    
    // Create legend for the map
    this.mapLegend = document.createElement('div');
    this.mapLegend.className = 'map-legend';
    this.mapLegend.innerHTML = `
      <div class="legend-item">
        <div class="legend-color" style="background: #ffff00;"></div>
        <div>Current Sector</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #00ff00;"></div>
        <div>Connected Sector (Available for Jump)</div>
      </div>
      <div class="legend-item">
        <div class="legend-color" style="background: #444444;"></div>
        <div>Disconnected Sector (Cannot Jump)</div>
      </div>
    `;
    this.mapContent.appendChild(this.mapLegend);

    // Create sector list for warping
    this.mapList = document.createElement('div');
    this.mapList.className = 'map-sector-list';
    this.mapContent.appendChild(this.mapList);
    
    // Store bound event handlers for proper removal
    this._boundMapMouseMove = this._handleMapMouseMove.bind(this);
    this._boundMapMouseOut = () => { this.sectorTooltip.style.display = 'none'; };
    this._boundMapClick = this._handleMapClick.bind(this);
  }

  /**
   * Shows the map modal with all sectors
   * @param {Array} sectors - List of available sectors
   * @param {string} currentSectorId - ID of the current sector
   */
  show(sectors, currentSectorId) {
    // Clear previous content
    this.mapList.innerHTML = '';
    
    // Set current sector ID
    this.currentSectorId = currentSectorId;
    
    // Generate sector map if not already done or if sector count changed
    if (!this.sectorMap || this.sectorMap.nodes.length !== sectors.length) {
      this.sectorMap = generateSectorMap(sectors, {
        mapWidth: this.mapCanvas.width,
        mapHeight: this.mapCanvas.height,
        connectionRadius: 250,    // Increased connection radius to allow more connections after spreading
        seed: 12345,              // Fixed seed for consistent generation
        padding: 60,              // Increased padding for better appearance
        minConnections: 2,
        maxConnections: 5,
        fuelCostBase: 10,
        fuelCostVariance: 5,
        repulsionIterations: 80,  // More iterations for better node distribution
        repulsionStrength: 1.0,   // Stronger repulsion to push nodes apart
        minNodeDistance: 50       // Keep nodes at least this far apart
      });
    }
    
    // Get list of connected sectors
    const connectedSectors = currentSectorId 
      ? getConnectedSectors(this.sectorMap, currentSectorId) 
      : [];
    
    const connectedIds = connectedSectors.map(s => s.id);
    
    // Draw the map on canvas
    this._drawSectorMap(currentSectorId, connectedIds);
    
    // Add connected sectors to the list for selection
    if (connectedSectors.length > 0) {
      // First add current sector (but disabled)
      const currentSector = sectors.find(s => s.id === currentSectorId);
      if (currentSector) {
        const el = document.createElement('div');
        el.className = 'sector-item current';
        el.innerHTML = `<strong>${currentSector.name}</strong> (Current Location)`;
        this.mapList.appendChild(el);
      }
      
      // Then add connected sectors
      connectedSectors.forEach(conn => {
        const sector = sectors.find(s => s.id === conn.id);
        if (sector) {
          const el = document.createElement('div');
          el.className = 'sector-item';
          el.innerHTML = `<span>${sector.name}</span><span class="fuel-cost">Fuel: ${conn.fuelCost}</span>`;
          el.dataset.sectorId = sector.id;
          el.addEventListener('click', () => {
            this.onSectorSelect && this.onSectorSelect(el.dataset.sectorId);
          });
          this.mapList.appendChild(el);
        }
      });
    } else {
      // First game load might not have a current sector
      sectors.forEach(sector => {
        const el = document.createElement('div');
        el.className = 'sector-item';
        el.innerHTML = `<span>${sector.name}</span>`;
        el.dataset.sectorId = sector.id;
        el.addEventListener('click', () => {
          this.onSectorSelect && this.onSectorSelect(el.dataset.sectorId);
        });
        this.mapList.appendChild(el);
      });
    }
    
    this.mapModal.style.display = 'block';
    
    // Set up mouse move handler for tooltip
    this.mapCanvas.addEventListener('mousemove', this._boundMapMouseMove);
    this.mapCanvas.addEventListener('mouseout', this._boundMapMouseOut);
    
    // Set up click handler for sector selection
    this.mapCanvas.addEventListener('click', this._boundMapClick);
  }

  /**
   * Hides the map modal
   */
  hide() {
    this.mapModal.style.display = 'none';
    
    // Remove event listeners
    this.mapCanvas.removeEventListener('mousemove', this._boundMapMouseMove);
    this.mapCanvas.removeEventListener('mouseout', this._boundMapMouseOut);
    this.mapCanvas.removeEventListener('click', this._boundMapClick);
    this.sectorTooltip.style.display = 'none';
  }

  /**
   * Sets the callback function to be called when a sector is selected
   * @param {Function} callback - Function to call when a sector is selected
   */
  setOnSectorSelect(callback) {
    this.onSectorSelect = callback;
  }

  /**
   * Checks if the map modal is currently visible
   * @returns {boolean} - True if map is visible, false otherwise
   */
  isVisible() {
    return this.mapModal.style.display === 'block';
  }

  /**
   * Draws the sector map on the canvas
   * @private
   * @param {string} currentSectorId - ID of the current sector
   * @param {Array<string>} connectedIds - IDs of sectors connected to the current sector
   */
  _drawSectorMap(currentSectorId, connectedIds) {
    const canvas = this.mapCanvas;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.15)';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let x = 50; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    
    // Horizontal lines
    for (let y = 50; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    
    // Draw connections first (behind nodes)
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    
    for (const node of this.sectorMap.nodes) {
      // Only draw connections from current node or connected nodes
      if (node.id === currentSectorId || connectedIds.includes(node.id)) {
        for (const conn of node.connections) {
          // Find target node
          const targetNode = this.sectorMap.nodes.find(n => n.id === conn.id);
          if (targetNode) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(targetNode.x, targetNode.y);
            ctx.stroke();
            
            // Draw the fuel cost on the connection
            const midX = (node.x + targetNode.x) / 2;
            const midY = (node.y + targetNode.y) / 2;
            
            // Draw fuel cost with background for better readability
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const textWidth = ctx.measureText(String(conn.fuelCost)).width;
            ctx.fillRect(midX - textWidth/2 - 5, midY - 9, textWidth + 10, 18);
            
            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${conn.fuelCost}`, midX, midY);
          }
        }
      }
    }
    
    // Draw nodes
    const nodeRadius = 12; // Increased node size
    
    // First pass - draw shadows/glows
    for (const node of this.sectorMap.nodes) {
      if (node.id === currentSectorId) {
        // Add glow effect for current sector
        const gradient = ctx.createRadialGradient(
          node.x, node.y, nodeRadius,
          node.x, node.y, nodeRadius * 2
        );
        gradient.addColorStop(0, 'rgba(255, 255, 0, 0.4)');
        gradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (connectedIds.includes(node.id)) {
        // Add subtle glow for connected sectors
        const gradient = ctx.createRadialGradient(
          node.x, node.y, nodeRadius,
          node.x, node.y, nodeRadius * 1.5
        );
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, nodeRadius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    
    // Second pass - draw node circles
    for (const node of this.sectorMap.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      
      // Color based on connectivity
      if (node.id === currentSectorId) {
        ctx.fillStyle = '#ffff00'; // Current sector: yellow
      } else if (connectedIds.includes(node.id)) {
        ctx.fillStyle = '#00ff00'; // Connected: green
      } else {
        ctx.fillStyle = '#444444'; // Not connected: gray
      }
      
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    
    // Third pass - draw labels for visible sectors
    for (const node of this.sectorMap.nodes) {
      if (node.id === currentSectorId || connectedIds.includes(node.id)) {
        // Calculate best position for label
        // Try different positions in order: below, above, right, left
        const positions = [
          { x: node.x, y: node.y + nodeRadius + 18, align: 'center', baseline: 'top' },
          { x: node.x, y: node.y - nodeRadius - 8, align: 'center', baseline: 'bottom' },
          { x: node.x + nodeRadius + 12, y: node.y, align: 'left', baseline: 'middle' },
          { x: node.x - nodeRadius - 12, y: node.y, align: 'right', baseline: 'middle' }
        ];
        
        ctx.font = 'bold 12px monospace';
        const textWidth = ctx.measureText(node.name).width;
        const textHeight = 14; // Approximate text height
        
        // Find best position with least overlap
        let bestPosition = positions[0];
        let leastOverlap = Infinity;
        
        for (const pos of positions) {
          let overlap = 0;
          
          // Check overlap with all other nodes
          for (const otherNode of this.sectorMap.nodes) {
            if (otherNode === node) continue;
            
            let labelLeft, labelRight, labelTop, labelBottom;
            
            // Calculate label bounds based on alignment
            if (pos.align === 'center') {
              labelLeft = pos.x - textWidth / 2 - 5;
              labelRight = pos.x + textWidth / 2 + 5;
            } else if (pos.align === 'left') {
              labelLeft = pos.x - 5;
              labelRight = pos.x + textWidth + 5;
            } else { // right
              labelLeft = pos.x - textWidth - 5;
              labelRight = pos.x + 5;
            }
            
            if (pos.baseline === 'top') {
              labelTop = pos.y - 5;
              labelBottom = pos.y + textHeight + 5;
            } else if (pos.baseline === 'bottom') {
              labelTop = pos.y - textHeight - 5;
              labelBottom = pos.y + 5;
            } else { // middle
              labelTop = pos.y - textHeight / 2 - 5;
              labelBottom = pos.y + textHeight / 2 + 5;
            }
            
            // Calculate distance to other node
            const dx = node.x - otherNode.x;
            const dy = node.y - otherNode.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // If node is too close, add to overlap score
            if (distance < 100) {
              // Check if node overlaps with label
              const nodeLeft = otherNode.x - nodeRadius;
              const nodeRight = otherNode.x + nodeRadius;
              const nodeTop = otherNode.y - nodeRadius;
              const nodeBottom = otherNode.y + nodeRadius;
              
              if (labelRight > nodeLeft && labelLeft < nodeRight && 
                  labelBottom > nodeTop && labelTop < nodeBottom) {
                overlap += 1000; // Severe penalty for direct overlap
              } else {
                // Otherwise add small penalty based on proximity
                overlap += 200 / (distance + 1);
              }
            }
          }
          
          if (overlap < leastOverlap) {
            leastOverlap = overlap;
            bestPosition = pos;
          }
        }
        
        // Draw label with background at best position
        // Type-safe assignment
        switch (bestPosition.align) {
          case 'center': ctx.textAlign = 'center'; break;
          case 'left': ctx.textAlign = 'left'; break;
          case 'right': ctx.textAlign = 'right'; break;
          default: ctx.textAlign = 'center';
        }
        
        switch (bestPosition.baseline) {
          case 'top': ctx.textBaseline = 'top'; break;
          case 'bottom': ctx.textBaseline = 'bottom'; break;
          case 'middle': ctx.textBaseline = 'middle'; break;
          default: ctx.textBaseline = 'middle';
        }
        
        // Add background rectangle for better readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        let bgX, bgY, bgWidth, bgHeight;
        
        if (bestPosition.align === 'center') {
          bgWidth = textWidth + 10;
          bgX = bestPosition.x - bgWidth / 2;
        } else if (bestPosition.align === 'left') {
          bgWidth = textWidth + 10;
          bgX = bestPosition.x - 5;
        } else { // right
          bgWidth = textWidth + 10;
          bgX = bestPosition.x - textWidth - 5;
        }
        
        if (bestPosition.baseline === 'top') {
          bgHeight = textHeight + 6;
          bgY = bestPosition.y - 3;
        } else if (bestPosition.baseline === 'bottom') {
          bgHeight = textHeight + 6;
          bgY = bestPosition.y - textHeight - 3;
        } else { // middle
          bgHeight = textHeight + 6;
          bgY = bestPosition.y - textHeight / 2 - 3;
        }
        
        ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
        
        // Draw label text
        if (node.id === currentSectorId) {
          ctx.fillStyle = '#ffff00'; // Current sector: yellow text
        } else {
          ctx.fillStyle = '#ffffff'; // Connected: white text
        }
        
        ctx.fillText(node.name, bestPosition.x, bestPosition.y);
      }
    }
  }
  
  /**
   * Handle mouse movement over the map canvas for tooltips
   * @private
   * @param {MouseEvent} event - Mouse move event
   */
  _handleMapMouseMove(event) {
    if (!this.sectorMap) return;
    
    const rect = this.mapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if mouse is over a sector node
    const nodeRadius = 12; // Match the drawing radius
    let hoverNode = null;
    
    for (const node of this.sectorMap.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        hoverNode = node;
        break;
      }
    }
    
    // Show tooltip for the hovered node
    if (hoverNode) {
      // Don't show tooltip for current or connected sectors (they already have labels)
      const currentSectorId = this.currentSectorId;
      const connectedIds = currentSectorId 
        ? getConnectedSectors(this.sectorMap, currentSectorId).map(s => s.id)
        : [];
      
      if (hoverNode.id !== currentSectorId && !connectedIds.includes(hoverNode.id)) {
        this.sectorTooltip.style.display = 'block';
        this.sectorTooltip.style.left = `${event.clientX + 10}px`;
        this.sectorTooltip.style.top = `${event.clientY + 10}px`;
        this.sectorTooltip.textContent = hoverNode.name;
        
        // Change mouse cursor to pointer
        this.mapCanvas.style.cursor = 'pointer';
      } else {
        // Change cursor for connected sectors (clickable)
        if (hoverNode.id !== currentSectorId && connectedIds.includes(hoverNode.id)) {
          this.mapCanvas.style.cursor = 'pointer';
        } else {
          this.mapCanvas.style.cursor = 'default';
        }
        this.sectorTooltip.style.display = 'none';
      }
    } else {
      this.sectorTooltip.style.display = 'none';
      this.mapCanvas.style.cursor = 'default';
    }
  }
  
  /**
   * Handle clicks on the map canvas
   * @private
   * @param {MouseEvent} event - Mouse click event
   */
  _handleMapClick(event) {
    if (!this.sectorMap) return;
    
    const rect = this.mapCanvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Check if click is on a sector node
    const nodeRadius = 12; // Match the drawing radius
    
    for (const node of this.sectorMap.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= nodeRadius) {
        // Check if this sector is connected to current sector
        const currentSectorId = this.currentSectorId;
        const connectedSectors = currentSectorId 
          ? getConnectedSectors(this.sectorMap, currentSectorId) 
          : [];
          
        // Find if clicked sector is in the connected list
        const canJump = connectedSectors.some(s => s.id === node.id);
        
        // Prevent jumping to current sector or disconnected sectors
        if (node.id !== currentSectorId && canJump) {
          this.onSectorSelect && this.onSectorSelect(node.id);
        }
        break;
      }
    }
  }
}