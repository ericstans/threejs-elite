import { genericProceduralConversation } from './conversations/planets/genericProcedural.js';
import { genericProceduralShipConversation } from './conversations/ships/genericProceduralShip.js';

export class ConversationSystem {
  constructor() {
    this.conversations = {};

    // Station detection and docking hooks
    this._isStation = null;
    this._isStationDockable = null;
    
    // Planet detection and entity hooks
    this._isPlanetDockable = null;
    this._getPlanetEntity = null;
    this._getStationForPlanet = null;
  }

  // Load conversations from sector definitions
  loadConversationsFromSector(sectorDefinition) {
    if (!sectorDefinition) return;

    // Load planet conversations
    if (sectorDefinition.planets) {
      for (const planet of sectorDefinition.planets) {
        if (planet.conversation) {
          this.conversations[planet.name] = planet.conversation;
        }
      }
    }

    // Load station conversations
    if (sectorDefinition.stations) {
      for (const station of sectorDefinition.stations) {
        if (station.conversation) {
          this.conversations[station.name] = station.conversation;
        }
      }
    }

    // Load NPC ship conversations
    if (sectorDefinition.npcShips) {
      for (const ship of sectorDefinition.npcShips) {
        if (ship.conversation) {
          this.conversations[ship.name] = ship.conversation;
        }
      }
    }
  }

  getGreeting(planetName) {
    // First check if we have a specific conversation definition
    const planet = this.conversations[planetName];
    if (planet) {
      return planet.greeting;
    }

    // For procedural planets, try to get the actual planet's greeting
    const planetEntity = this._getPlanetEntity?.(planetName);
    if (planetEntity && planetEntity.getGreeting) {
      return planetEntity.getGreeting();
    }

    // Check if this is an NPC ship (with or without defined conversation)
    if (planetEntity && planetEntity.getType && planetEntity.getType() === 'npcShip') {
      return genericProceduralShipConversation.greeting;
    }

    // Fallback to generic procedural planet template
    return genericProceduralConversation.greeting;
  }

  getConversationNode(planetName, nodeId, playerFlags = {}) {
    let planet = this.conversations[planetName];
    if (!planet) {
      // Check if this is an NPC ship by entity type
      const entity = this._getPlanetEntity?.(planetName);
      if (entity && entity.getType && entity.getType() === 'npcShip') {
        // This is an NPC ship without a defined conversation, use ship conversation
        this.conversations[planetName] = genericProceduralShipConversation;
        planet = genericProceduralShipConversation;
      } else {
        // Attach generic on-demand so subsequent lookups see it
        this.conversations[planetName] = genericProceduralConversation;
        planet = genericProceduralConversation;
      }
    }
    if (!planet.conversationTree) return null;

    const node = planet.conversationTree[nodeId];
    if (!node) {
      return null;
    }

    // Check if this is a ship conversation and handle differently
    const isShipConversation = (planet && planet === genericProceduralShipConversation) ||
                              (this._getPlanetEntity?.(planetName)?.getType?.() === 'npcShip');

    if (isShipConversation) {
      // For ship conversations, create ship attributes
      const shipAttributes = { name: planetName };
      const context = {
        playerFlags,
        ship: shipAttributes
      };

      if (node.options) {
        // Handle ship conversation options
        let rawOptions = node.options;
        if (typeof rawOptions === 'function') {
          try {
            rawOptions = rawOptions(playerFlags, shipAttributes) || [];
          } catch (e) {
            console.warn('ConversationSystem: ship option function threw', e);
            rawOptions = [];
          }
        }
        if (!Array.isArray(rawOptions)) {
          console.warn('ConversationSystem: ship node.options is not an array after evaluation', nodeId, rawOptions);
          rawOptions = [];
        }
        const processedOptions = rawOptions
          .map(option => {
            if (typeof option === 'function') {
              try { return option(playerFlags, shipAttributes); } catch (e) { console.warn('ConversationSystem: ship inline option fn error', e); return null; }
            }
            return option;
          })
          .filter(option => option !== null && option !== undefined);

        return {
          ...node,
          response: typeof node.response === 'function' ? this._safeEvalShipResponse(node.response, context) : node.response,
          options: processedOptions
        };
      }
      return {
        ...node,
        response: typeof node.response === 'function' ? this._safeEvalShipResponse(node.response, context) : node.response
      };
    }

    // Resolve planet entity (if hook provided) to expose attributes
    const planetEntity = this._getPlanetEntity ? this._getPlanetEntity(planetName) : null;
    const stationEntity = this._getStationForPlanet ? this._getStationForPlanet(planetName) : null;
    const planetAttributes = planetEntity ? {
      name: planetEntity.getName ? planetEntity.getName() : planetName,
      radius: planetEntity.radius,
      color: planetEntity.color,
      dockable: planetEntity.dockable,
      hasRings: !!planetEntity.rings,
      hasMoon: !!planetEntity.moon
    } : { name: planetName };
    const stationAttributes = stationEntity ? {
      name: stationEntity.getName ? stationEntity.getName() : 'Station',
      orbitRadius: stationEntity.orbitRadius,
      size: stationEntity.size,
      orbitSpeed: stationEntity.orbitSpeed
    } : null;
    const context = { playerFlags, planet: planetEntity, planetAttributes, station: stationEntity, stationAttributes };

    // Process options with inline conditional logic
    if (node.options) {
      // node.options can itself be: (a) an array, (b) a function returning an array, (c) array containing functions.
      let rawOptions = node.options;
      if (typeof rawOptions === 'function') {
        try {
          rawOptions = rawOptions(playerFlags, planetAttributes, stationAttributes) || [];
        } catch (e) {
          if (DEBUG) console.warn('ConversationSystem: option function threw', e);
          rawOptions = [];
        }
      }
      if (!Array.isArray(rawOptions)) {
        if (DEBUG) console.warn('ConversationSystem: node.options is not an array after evaluation', nodeId, rawOptions);
        rawOptions = [];
      }
      const processedOptions = rawOptions
        .map(option => {
          if (typeof option === 'function') {
            try { return option(playerFlags, planetAttributes, stationAttributes); } catch (e) { if (DEBUG) console.warn('ConversationSystem: inline option fn error', e); return null; }
          }
          return option;
        })
        .filter(option => option !== null && option !== undefined);

      return {
        ...node,
        response: typeof node.response === 'function' ? this._safeEvalNodeResponse(node.response, context) : node.response,
        options: processedOptions
      };
    }
    return {
      ...node,
      response: typeof node.response === 'function' ? this._safeEvalNodeResponse(node.response, context) : node.response
    };
  }

  _safeEvalNodeResponse(fn, context) {
    try {
      return fn(context.playerFlags, context.planetAttributes, context.planet, context.stationAttributes, context.station);
    } catch (e) {
      if (DEBUG) console.warn('ConversationSystem: response function error', e);
      return '...signal distortion...';
    }
  }

  _safeEvalShipResponse(fn, context) {
    try {
      return fn(context.playerFlags, context.ship);
    } catch (e) {
      if (DEBUG) console.warn('ConversationSystem: ship response function error', e);
      return '...signal distortion...';
    }
  }

  getInitialOptions(targetName, playerFlags = {}) {
    // Check if it's a station first
    if (this._isStation?.(targetName)) {
      return this.getInitialStationOptions(targetName, playerFlags);
    }

    // Check if it's an NPC ship by entity type
    const entity = this._getPlanetEntity?.(targetName);
    const isNPCShip = (entity && entity.getType && entity.getType() === 'npcShip') ||
                     (this.conversations[targetName] === genericProceduralShipConversation);
    console.log('isNPCShip', isNPCShip);
    if (isNPCShip) {
      const ship = this.conversations[targetName] || genericProceduralShipConversation;
      if (ship && ship.conversationTree && ship.conversationTree.initial) {
        const node = ship.conversationTree.initial;
        const options = typeof node.options === 'function' ? node.options(playerFlags, { name: targetName }) : node.options;
        return options || [];
      }
      return [];
    }

    // Otherwise treat as planet
    let planet = this.conversations[targetName];
    // Dockable detection: we rely on external planet entity lookup via optional hook
    const dockable = this._isPlanetDockable?.(targetName) !== false; // default true if unknown

    // If no specific conversation, check if it's an NPC ship
    if (!planet || !planet.conversationTree) {
      const entity = this._getPlanetEntity?.(targetName);
      if (entity && entity.getType && entity.getType() === 'npcShip') {
        // This is an NPC ship without a defined conversation, use ship conversation
        planet = genericProceduralShipConversation;
        this.conversations[targetName] = planet;
      } else {
        // Use generic procedural conversation for planets/stations
        planet = genericProceduralConversation;
        this.conversations[targetName] = planet;
      }
    }

    // Base options with inline conditional logic
    const baseOptions = [
      { id: 'information', text: `Tell me about ${targetName}.` },
      dockable ? (
        playerFlags.isDocked === true ? { id: 'request_takeoff', text: 'Request Takeoff Authorization' } :
          (playerFlags.commTargetInDockingRange === true && !playerFlags.isDocked ? { id: 'docking', text: 'Request docking' } :
            playerFlags.commTargetInDockingRange === false && !playerFlags.isDocked ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null)
      ) : { id: 'docking_unavailable', text: 'Docking unavailable' }
    ];

    // Filter out null/undefined options
    return baseOptions.filter(option => option !== null && option !== undefined);
  }

  getInitialStationOptions(stationName, playerFlags = {}) {
    // Check if station has custom conversation data
    const station = this.conversations[stationName];
    if (station && station.conversationTree) {
      // Use custom station conversation if available
      const dockable = this._isStationDockable?.(stationName) !== false; // default true if unknown

      const baseOptions = [
        { id: 'information', text: `Tell me about ${stationName}.` },
        dockable ? (
          playerFlags.isDocked === true ? { id: 'request_takeoff', text: 'Request Takeoff Authorization' } :
            (playerFlags.commTargetInDockingRange === true && !playerFlags.isDocked ? { id: 'docking', text: 'Request docking' } :
              playerFlags.commTargetInDockingRange === false && !playerFlags.isDocked ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null)
        ) : { id: 'docking_unavailable', text: 'Docking unavailable' }
      ];

      return baseOptions.filter(option => option !== null && option !== undefined);
    }

    // Default station options if no custom conversation
    const dockable = this._isStationDockable?.(stationName) !== false; // default true if unknown

    const baseOptions = [
      { id: 'information', text: `Tell me about ${stationName}.` },
      { id: 'services', text: 'What services are available?' },
      dockable ? (
        playerFlags.isDocked === true ? { id: 'request_takeoff', text: 'Request Takeoff Authorization' } :
          (playerFlags.commTargetInDockingRange === true && !playerFlags.isDocked ? { id: 'docking', text: 'Request docking' } :
            playerFlags.commTargetInDockingRange === false && !playerFlags.isDocked ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null)
      ) : { id: 'docking_unavailable', text: 'Docking unavailable' }
    ];

    return baseOptions.filter(option => option !== null && option !== undefined);
  }

  addConversation(planetName, conversationData) {
    this.conversations[planetName] = conversationData;
  }

  addStationConversation(stationName, conversationData) {
    this.conversations[stationName] = conversationData;
  }

  setStationDetectionHook(isStationFunction) {
    this._isStation = isStationFunction;
  }

  setStationDockableHook(isStationDockableFunction) {
    this._isStationDockable = isStationDockableFunction;
  }

  // Hook methods for external systems to provide planet/station data
  setPlanetDockableHook(isPlanetDockableFunction) {
    this._isPlanetDockable = isPlanetDockableFunction;
  }

  setPlanetEntityHook(getPlanetEntityFunction) {
    this._getPlanetEntity = getPlanetEntityFunction;
  }

  setStationForPlanetHook(getStationForPlanetFunction) {
    this._getStationForPlanet = getStationForPlanetFunction;
  }

  // Method to add new conversation branches dynamically
  addConversationBranch(planetName, nodeId, nodeData) {
    if (!this.conversations[planetName]) {
      this.conversations[planetName] = {
        greeting: 'Thank you for contacting us.',
        conversationTree: {}
      };
    }

    if (!this.conversations[planetName].conversationTree) {
      this.conversations[planetName].conversationTree = {};
    }

    this.conversations[planetName].conversationTree[nodeId] = nodeData;
  }
}
