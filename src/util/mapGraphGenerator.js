// Map Graph Generator
// Generates a connected graph of sectors with weighted edges for navigation

// Simple Perlin noise implementation for 2D
class PerlinNoise {
  constructor(seed = 42) {
    this.seed = seed;
    this.permutation = [];

    // Initialize permutation table with seed
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = i;
    }

    // Shuffle based on seed
    this.seed = seed;
    for (let i = 255; i > 0; i--) {
      const j = Math.floor(this._random() * (i + 1));
      [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
    }

    // Extend to avoid overflow when accessing
    for (let i = 0; i < 256; i++) {
      this.permutation[i + 256] = this.permutation[i];
    }
  }

  // Seeded random function
  _random() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  // Linear interpolation
  _lerp(a, b, t) {
    return a + t * (b - a);
  }

  // Fade function
  _fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  // Gradient function
  _grad(hash, x, y) {
    const h = hash & 15;
    // Use hash to determine gradient direction
    const gradX = (h < 8) ? x : y;
    const gradY = (h < 4) ? y : x;
    return ((h & 8) ? -gradX : gradX) + ((h & 4) ? -gradY : gradY);
  }

  // Get noise value at x,y
  noise(x, y) {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Get relative x,y of point in cell
    x -= Math.floor(x);
    y -= Math.floor(y);

    // Compute fade curves
    const u = this._fade(x);
    const v = this._fade(y);

    // Hash coordinates of the 4 square corners
    const a = this.permutation[X] + Y;
    const b = this.permutation[X + 1] + Y;
    const aa = this.permutation[a];
    const ab = this.permutation[a + 1];
    const ba = this.permutation[b];
    const bb = this.permutation[b + 1];

    // Add blended results from 4 corners of the square
    const x1 = this._lerp(
      this._grad(this.permutation[aa], x, y),
      this._grad(this.permutation[ba], x - 1, y),
      u
    );

    const x2 = this._lerp(
      this._grad(this.permutation[ab], x, y - 1),
      this._grad(this.permutation[bb], x - 1, y - 1),
      u
    );

    // Return value between -1 and 1
    return this._lerp(x1, x2, v);
  }
}

// Generates a map of sectors with positions and connections
export function generateSectorMap(sectors, options = {}) {
  const {
    mapWidth = 800,
    mapHeight = 600,
    connectionRadius = 200,
    seed = 12345,
    padding = 50,
    minConnections = 2,
    maxConnections = 5,
    fuelCostBase = 10,
    fuelCostVariance = 5,
    repulsionIterations = 50,  // Number of iterations for repulsion simulation
    repulsionStrength = 0.8,   // Strength of repulsion between nodes
    minNodeDistance = 35       // Minimum distance between nodes (prevents overlap)
  } = options;

  const perlin = new PerlinNoise(seed);
  const sectorNodes = [];
  const connections = [];

  // First pass: generate positions for all sectors using Perlin noise
  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];

    // Use Perlin noise to distribute sectors
    // Map the sector index to coordinates in noise space
    const noiseX = (i % 10) * 0.2;
    const noiseY = Math.floor(i / 10) * 0.2;

    // Use noise to offset position
    const noise1 = perlin.noise(noiseX, noiseY);
    const noise2 = perlin.noise(noiseX + 5.2, noiseY + 3.7);

    // Calculate position with noise influence
    const x = padding + (mapWidth - 2 * padding) * (0.5 + 0.5 * noise1);
    const y = padding + (mapHeight - 2 * padding) * (0.5 + 0.5 * noise2);

    sectorNodes.push({
      id: sector.id,
      name: sector.name,
      x,
      y,
      fx: 0, // Force in x direction (for repulsion)
      fy: 0, // Force in y direction (for repulsion)
      connections: []
    });
  }

  // Apply force-directed repulsion to spread out nodes and avoid overlaps
  for (let iteration = 0; iteration < repulsionIterations; iteration++) {
    // Calculate repulsion forces between all pairs of nodes
    for (let i = 0; i < sectorNodes.length; i++) {
      const node1 = sectorNodes[i];

      // Reset forces
      node1.fx = 0;
      node1.fy = 0;

      for (let j = 0; j < sectorNodes.length; j++) {
        if (i === j) continue;

        const node2 = sectorNodes[j];
        const dx = node1.x - node2.x;
        const dy = node1.y - node2.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Apply stronger repulsion when nodes are too close
        if (distance < minNodeDistance) {
          // Normalized direction vector
          const nx = dx / distance || 0;
          const ny = dy / distance || 0;

          // Force is stronger when nodes are closer
          const force = repulsionStrength * (minNodeDistance - distance) / minNodeDistance;

          // Apply force to node1
          node1.fx += nx * force;
          node1.fy += ny * force;
        }
      }
    }

    // Apply forces to update positions
    for (const node of sectorNodes) {
      node.x += node.fx;
      node.y += node.fy;

      // Keep nodes within bounds
      node.x = Math.max(padding, Math.min(mapWidth - padding, node.x));
      node.y = Math.max(padding, Math.min(mapHeight - padding, node.y));
    }
  }

  // Find the current bounds of the graph
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of sectorNodes) {
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x);
    maxY = Math.max(maxY, node.y);
  }

  // Calculate scale factors to fill the canvas with proper padding
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;

  const targetWidth = mapWidth - 2 * padding;
  const targetHeight = mapHeight - 2 * padding;

  const scaleX = targetWidth / graphWidth;
  const scaleY = targetHeight / graphHeight;

  // Use the smaller scale to maintain aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Scale and center the graph
  for (const node of sectorNodes) {
    // Scale relative to min bounds
    const relX = node.x - minX;
    const relY = node.y - minY;

    // Apply scale
    const scaledX = relX * scale;
    const scaledY = relY * scale;

    // Center in available space
    node.x = padding + scaledX;
    node.y = padding + scaledY;
  }

  // Second pass: create connections between nearby sectors
  for (let i = 0; i < sectorNodes.length; i++) {
    const node = sectorNodes[i];
    const potentialConnections = [];

    // Find all sectors within connection radius
    for (let j = 0; j < sectorNodes.length; j++) {
      if (i === j) continue; // Skip self

      const otherNode = sectorNodes[j];
      const dx = node.x - otherNode.x;
      const dy = node.y - otherNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= connectionRadius) {
        // Check if there's another node blocking this connection
        let blocked = false;
        for (let k = 0; k < sectorNodes.length; k++) {
          if (k === i || k === j) continue;

          // Check if point k is between i and j (approximately)
          const blockNode = sectorNodes[k];
          const isBlocking = isPointBetween(node, otherNode, blockNode, 20);

          if (isBlocking) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          // Use perlin noise to affect fuel cost - make it not exactly match the visual distance
          const noiseFactor = 0.3 + 0.7 * (0.5 + 0.5 * perlin.noise(i * 0.3, j * 0.3));
          const fuelCost = Math.round(fuelCostBase + fuelCostVariance * noiseFactor);

          potentialConnections.push({
            target: j,
            distance,
            fuelCost
          });
        }
      }
    }

    // Sort connections by distance
    potentialConnections.sort((a, b) => a.distance - b.distance);

    // Connect to at least minConnections if possible, but no more than maxConnections
    const numConnections = Math.min(
      Math.max(minConnections, potentialConnections.length),
      maxConnections
    );

    for (let c = 0; c < numConnections; c++) {
      if (c < potentialConnections.length) {
        const connection = potentialConnections[c];
        const targetNode = sectorNodes[connection.target];

        // Add connection (avoiding duplicates)
        if (!node.connections.some(conn => conn.id === targetNode.id)) {
          node.connections.push({
            id: targetNode.id,
            fuelCost: connection.fuelCost
          });

          // Add the reverse connection
          if (!targetNode.connections.some(conn => conn.id === node.id)) {
            targetNode.connections.push({
              id: node.id,
              fuelCost: connection.fuelCost
            });
          }

          // Add to global connections list
          connections.push({
            from: node.id,
            to: targetNode.id,
            fuelCost: connection.fuelCost
          });
        }
      }
    }
  }

  return { nodes: sectorNodes, connections };
}

// Helper function to check if a point is approximately between two other points
function isPointBetween(a, b, point, tolerance = 10) {
  const distAB = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
  const distAP = Math.sqrt((point.x - a.x) ** 2 + (point.y - a.y) ** 2);
  const distPB = Math.sqrt((b.x - point.x) ** 2 + (b.y - point.y) ** 2);

  // Point is between a and b if the sum of distances is approximately equal to the distance from a to b
  return Math.abs(distAP + distPB - distAB) < tolerance &&
         distAP < distAB &&
         distPB < distAB;
}

// Get all sectors directly connected to the specified sector
export function getConnectedSectors(sectorMap, currentSectorId) {
  const currentNode = sectorMap.nodes.find(node => node.id === currentSectorId);
  if (!currentNode) return [];

  return currentNode.connections.map(conn => {
    const node = sectorMap.nodes.find(n => n.id === conn.id);
    return {
      id: node.id,
      name: node.name,
      fuelCost: conn.fuelCost
    };
  });
}

// Calculate shortest path between two sectors using Dijkstra's algorithm
export function getShortestPath(sectorMap, fromSectorId, toSectorId) {
  if (!sectorMap || !fromSectorId || !toSectorId) return null;
  if (fromSectorId === toSectorId) return { path: [fromSectorId], totalCost: 0 };

  const nodes = sectorMap.nodes;
  const distances = {};
  const previous = {};
  const unvisited = new Set();

  // Initialize distances
  nodes.forEach(node => {
    distances[node.id] = node.id === fromSectorId ? 0 : Infinity;
    previous[node.id] = null;
    unvisited.add(node.id);
  });

  while (unvisited.size > 0) {
    // Find unvisited node with minimum distance
    let current = null;
    let minDistance = Infinity;
    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId];
        current = nodeId;
      }
    }

    if (current === null || distances[current] === Infinity) break;

    unvisited.delete(current);

    // If we reached the destination, reconstruct path
    if (current === toSectorId) {
      const path = [];
      let node = current;
      while (node !== null) {
        path.unshift(node);
        node = previous[node];
      }
      return { path, totalCost: distances[current] };
    }

    // Check neighbors
    const currentNode = nodes.find(n => n.id === current);
    if (currentNode) {
      currentNode.connections.forEach(conn => {
        if (unvisited.has(conn.id)) {
          const alt = distances[current] + conn.fuelCost;
          if (alt < distances[conn.id]) {
            distances[conn.id] = alt;
            previous[conn.id] = current;
          }
        }
      });
    }
  }

  return null; // No path found
}
