import { aridusPrimeConversation } from './conversations/aridusPrime.js';
import { oceanusConversation } from './conversations/oceanus.js';

export class ConversationSystem {
  constructor() {
    this.conversations = {
      'Aridus Prime': aridusPrimeConversation,
      'Oceanus': oceanusConversation
    };
  }

  getGreeting(planetName) {
    const planet = this.conversations[planetName];
    return planet ? planet.greeting : "Thank you for contacting us.";
  }

  getConversationNode(planetName, nodeId, playerFlags = {}) {
    const planet = this.conversations[planetName];
    if (!planet || !planet.conversationTree) {
      return null;
    }
    
    const node = planet.conversationTree[nodeId];
    if (!node) {
      return null;
    }
    
    // Process options with inline conditional logic
    if (node.options) {
      // node.options can itself be: (a) an array, (b) a function returning an array, (c) array containing functions.
      let rawOptions = node.options;
      if (typeof rawOptions === 'function') {
        try {
          rawOptions = rawOptions(playerFlags) || [];
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
            try { return option(playerFlags); } catch (e) { console.warn('ConversationSystem: inline option fn error', e); return null; }
          }
          return option;
        })
        .filter(option => option !== null && option !== undefined);
      
      return {
        ...node,
        options: processedOptions
      };
    }
    
    return node;
  }

  getInitialOptions(planetName, playerFlags = {}) {
    const planet = this.conversations[planetName];
    if (!planet || !planet.conversationTree) {
      return [];
    }
    
    // Base options with inline conditional logic
    const baseOptions = [
      { id: 'information', text: `Information about ${planetName}` },
      playerFlags.commTargetInDockingRange === true ? { id: 'docking', text: 'Request docking' } : 
      playerFlags.commTargetInDockingRange === false ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null
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