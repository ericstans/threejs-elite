import { generateSectorMap, getConnectedSectors } from '../util/mapGraphGenerator.js';

/**
 * MapUI handles the interactive sector map display
 */
export class MapUI {
  /**
   * Normalize node positions to fill the canvas with padding
   * @private
   * @param {Object} sectorMap - The sector map object with nodes
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} [pad=40] - Padding in pixels
   */
  _normalizeNodePositions(sectorMap, width, height, pad = 40) {
    if (!sectorMap || !sectorMap.nodes || sectorMap.nodes.length === 0) return;
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const node of sectorMap.nodes) {
      if (node.x < minX) minX = node.x;
      if (node.x > maxX) maxX = node.x;
      if (node.y < minY) minY = node.y;
      if (node.y > maxY) maxY = node.y;
    }
    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const scale = Math.min(
      (width - 2 * pad) / (graphWidth || 1),
      (height - 2 * pad) / (graphHeight || 1)
    );
    // First, scale and pad
    for (const node of sectorMap.nodes) {
      node.x = ((node.x - minX) * scale) + pad;
      node.y = ((node.y - minY) * scale) + pad;
    }
    // Then, center horizontally and vertically
    let newMinX = Infinity, newMaxX = -Infinity, newMinY = Infinity, newMaxY = -Infinity;
    for (const node of sectorMap.nodes) {
      if (node.x < newMinX) newMinX = node.x;
      if (node.x > newMaxX) newMaxX = node.x;
      if (node.y < newMinY) newMinY = node.y;
      if (node.y > newMaxY) newMaxY = node.y;
    }
    const actualWidth = newMaxX - newMinX;
    const actualHeight = newMaxY - newMinY;
    const offsetX = (width - actualWidth) / 2 - newMinX;
    const offsetY = (height - actualHeight) / 2 - newMinY;
    for (const node of sectorMap.nodes) {
      node.x += offsetX;
      node.y += offsetY;
    }
  }

  /**
   * Generate a refined sector map with better spacing by creating extra nodes
   * @private
   * @param {Array} sectors - The actual sectors to map
   * @returns {Object} - The sector map with refined positioning
   */
  _generateRefinedSectorMap(sectors) {
    const extraSectors = 9;
    // Create N+10 temporary sectors for spacing calculation (N = sectors.length)
    const tempSectors = [...sectors];
    for (let i = 0; i < extraSectors; i++) {
      tempSectors.push({
        id: `temp_${i}`,
        name: `Temp ${i}`
        // Add any other properties that sectors might have
      });
    }

    // Generate map with extra nodes for better spacing
    const tempMap = generateSectorMap(tempSectors, {
      mapWidth: this.mapCanvas.width,
      mapHeight: this.mapCanvas.height,
      connectionRadius: 250,
      seed: 12345,
      padding: 60,
      minConnections: 2,
      maxConnections: 5,
      fuelCostBase: 10,
      fuelCostVariance: 5,
      repulsionIterations: 80,
      repulsionStrength: 1.0,
      minNodeDistance: 50
    });

    // Remove 10 random temp nodes, keeping only the original sectors
    const finalNodes = tempMap.nodes.filter(node =>
      !node.id.startsWith('temp_')
    );

    // Clean up connections to removed nodes
    finalNodes.forEach(node => {
      node.connections = node.connections.filter(conn =>
        !conn.id.startsWith('temp_')
      );
    });

    return {
      ...tempMap,
      nodes: finalNodes
    };
  }

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
    this.mapModal.style.display = 'none'; // Hide by default
    document.body.appendChild(this.mapModal);

    this.mapContent = document.createElement('div');
    this.mapContent.className = 'map-content';
    this.mapModal.appendChild(this.mapContent);

    // Add close button
    this.closeButton = document.createElement('button');
    this.closeButton.className = 'map-close-btn';
    this.closeButton.innerHTML = '&times;';
    this.closeButton.title = 'Close';
    this.closeButton.style.position = 'absolute';
    this.closeButton.style.top = '18px';
    this.closeButton.style.right = '24px';
    this.closeButton.style.fontSize = '2rem';
    this.closeButton.style.background = 'none';
    this.closeButton.style.border = 'none';
    this.closeButton.style.color = '#00ff00';
    this.closeButton.style.cursor = 'pointer';
    this.closeButton.style.zIndex = '10';
    this.closeButton.addEventListener('click', () => this.hide());
    this.mapContent.appendChild(this.closeButton);

    this.mapTitle = document.createElement('h2');
    this.mapTitle.className = 'map-title';
    this.mapTitle.textContent = 'SECTOR MAP';
    this.mapContent.appendChild(this.mapTitle);

    // Add canvas for the sector graph
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.className = 'map-canvas';
    this.mapCanvas.width = 960;
    this.mapCanvas.height = 480;
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
   * @param {Array} [jobDestinationIds=[]] - IDs of sectors that are job destinations
   */
  show(sectors, currentSectorId, jobDestinationIds = []) {
    // Clear previous content
    this.mapList.innerHTML = '';

    // Set current sector ID
    this.currentSectorId = currentSectorId;

    // Generate sector map if not already done or if sector count changed
    if (!this.sectorMap || this.sectorMap.nodes.length !== sectors.length) {
      this.sectorMap = this._generateRefinedSectorMap(sectors);
      // Normalize node positions to fill the canvas
      this._normalizeNodePositions(this.sectorMap, this.mapCanvas.width, this.mapCanvas.height, 40);
    }

    // Get list of connected sectors
    const connectedSectors = currentSectorId
      ? getConnectedSectors(this.sectorMap, currentSectorId)
      : [];

    const connectedIds = connectedSectors.map(s => s.id);

    // Draw the map on canvas
    this._drawSectorMap(currentSectorId, connectedIds, jobDestinationIds);

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
   * @param {Array<string>} jobDestinationIds - IDs of sectors that are job destinations
   */
  _drawSectorMap(currentSectorId, connectedIds, jobDestinationIds = []) {
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

    // Draw all edges in grey first
    ctx.save();
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 2;
    for (const node of this.sectorMap.nodes) {
      for (const conn of node.connections) {
        const targetNode = this.sectorMap.nodes.find(n => n.id === conn.id);
        if (targetNode && node.id < targetNode.id) { // avoid double-drawing
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(targetNode.x, targetNode.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();

    // Draw green edges for current/connected
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.6)';
    ctx.lineWidth = 2;
    for (const node of this.sectorMap.nodes) {
      if (node.id === currentSectorId || connectedIds.includes(node.id)) {
        for (const conn of node.connections) {
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
            ctx.fillRect(midX - textWidth / 2 - 5, midY - 9, textWidth + 10, 18);

            ctx.fillStyle = 'rgba(0, 255, 255, 0.9)';
            ctx.font = 'bold 12px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${conn.fuelCost}`, midX, midY);
          }
        }
      }
    }
    ctx.restore();

    // Draw nodes
    const nodeRadius = 14; // Slightly larger for bigger canvas

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

    // Second pass - draw node circles (always circles, border matches fill)
    for (const node of this.sectorMap.nodes) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
      let fill, border;
      if (node.id === currentSectorId) {
        fill = border = '#ffff00';
      } else if (connectedIds.includes(node.id)) {
        fill = border = '#00ff00';
      } else {
        fill = border = '#444444';
      }
      ctx.fillStyle = fill;
      ctx.strokeStyle = border;
      ctx.lineWidth = 3;
      ctx.fill();
      ctx.stroke();
    }

    // Third pass - draw yellow dots for job destinations
    for (const node of this.sectorMap.nodes) {
      if (jobDestinationIds.includes(node.id)) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffff00';
        ctx.fill();
      }
    }

    // Fourth pass - draw labels only for current sector
    for (const node of this.sectorMap.nodes) {
      if (node.id === currentSectorId) {
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
        ctx.fillStyle = '#ffff00'; // Current sector: yellow text

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
    // Scale mouse coordinates to canvas coordinate system
    const scaleX = this.mapCanvas.width / rect.width;
    const scaleY = this.mapCanvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

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
        this.sectorTooltip.style.left = `${event.pageX + 10}px`;
        this.sectorTooltip.style.top = `${event.pageY + 10}px`;
        this.sectorTooltip.textContent = hoverNode.name;
        // Change mouse cursor to pointer
        this.mapCanvas.style.cursor = 'pointer';
      } else if (hoverNode.id !== currentSectorId && connectedIds.includes(hoverNode.id)) {
        // Show tooltip for connected sectors too
        this.sectorTooltip.style.display = 'block';
        this.sectorTooltip.style.left = `${event.pageX + 10}px`;
        this.sectorTooltip.style.top = `${event.pageY + 10}px`;
        this.sectorTooltip.textContent = hoverNode.name;
        this.mapCanvas.style.cursor = 'pointer';
      } else {
        // Current sector - no tooltip but default cursor
        this.sectorTooltip.style.display = 'none';
        this.mapCanvas.style.cursor = 'default';
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
