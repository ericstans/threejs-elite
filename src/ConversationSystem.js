import { aridusPrimeConversation } from './conversations/aridusPrime.js';
import { oceanusConversation } from './conversations/oceanus.js';
import { genericProceduralConversation } from './conversations/genericProcedural.js';

export class ConversationSystem {
  constructor() {
    this.conversations = {
      'Aridus Prime': aridusPrimeConversation,
      'Oceanus': oceanusConversation
    };
  }

  getGreeting(planetName) {
    const planet = this.conversations[planetName];
    if (planet) return planet.greeting;
    // Fallback to generic procedural template
    return genericProceduralConversation.greeting;
  }

  getConversationNode(planetName, nodeId, playerFlags = {}) {
    let planet = this.conversations[planetName];
    if (!planet) {
      // Attach generic on-demand so subsequent lookups see it
      this.conversations[planetName] = genericProceduralConversation;
      planet = genericProceduralConversation;
    }
    if (!planet.conversationTree) return null;

    const node = planet.conversationTree[nodeId];
    if (!node) {
      return null;
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
          console.warn('ConversationSystem: option function threw', e);
          rawOptions = [];
        }
      }
      if (!Array.isArray(rawOptions)) {
        console.warn('ConversationSystem: node.options is not an array after evaluation', nodeId, rawOptions);
        rawOptions = [];
      }
      const processedOptions = rawOptions
        .map(option => {
          if (typeof option === 'function') {
            try { return option(playerFlags, planetAttributes, stationAttributes); } catch (e) { console.warn('ConversationSystem: inline option fn error', e); return null; }
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
      console.warn('ConversationSystem: response function error', e);
      return '...signal distortion...';
    }
  }

  getInitialOptions(planetName, playerFlags = {}) {
    const planet = this.conversations[planetName];
    // Dockable detection: we rely on external planet entity lookup via optional hook
    const dockable = this._isPlanetDockable?.(planetName) !== false; // default true if unknown
    if (!planet || !planet.conversationTree) {
      return [];
    }

    // Base options with inline conditional logic
    const baseOptions = [
      { id: 'information', text: `Tell me about ${planetName}.` },
      dockable ? (
        playerFlags.isDocked === true ? { id: 'request_takeoff', text: 'Request Takeoff Authorization' } :
          (playerFlags.commTargetInDockingRange === true && !playerFlags.isDocked ? { id: 'docking', text: 'Request docking' } :
            playerFlags.commTargetInDockingRange === false && !playerFlags.isDocked ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null)
      ) : { id: 'docking_unavailable', text: 'Docking unavailable' }
    ];

    // Filter out null/undefined options
    return baseOptions.filter(option => option !== null && option !== undefined);
  }

  addConversation(planetName, conversationData) {
    this.conversations[planetName] = conversationData;
  }

  // Method to add new conversation branches dynamically
  addConversationBranch(planetName, nodeId, nodeData) {
    if (!this.conversations[planetName]) {
      this.conversations[planetName] = {
        greeting: "Thank you for contacting us.",
        conversationTree: {}
      };
    }

    if (!this.conversations[planetName].conversationTree) {
      this.conversations[planetName].conversationTree = {};
    }

    this.conversations[planetName].conversationTree[nodeId] = nodeData;
  }
}