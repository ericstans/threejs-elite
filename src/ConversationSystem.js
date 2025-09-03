import * as THREE from 'three';

export class ConversationSystem {
  constructor() {
    this.conversations = this.initializeConversations();
  }

  initializeConversations() {
    return {
      'Aridus Prime': {
        greeting: "Thank you for contacting Aridus Prime.",
        conversationTree: {
          'information': {
            response: "Aridus Prime is a small outpost established in GY166, and the base of operations for mining operations in the Aridus system.",
            options: [
              { id: 'mining', text: 'Tell me more about mining.' },
              { id: 'planet', text: 'Tell me more about Aridus Prime.' },
              { id: 'system', text: 'Tell me more about the Aridus system.' },
              { id: 'end', text: 'Interesting, thanks. (End conversation)' }
            ]
          },
          'mining': {
            response: "Our mining operations focus on extracting rare minerals from the asteroid fields. We've been operating for over 50 years and have established several automated mining stations throughout the system.",
            options: [
              { id: 'mining_tech', text: 'What technology do you use?' },
              { id: 'mining_profit', text: 'How profitable is the operation?' },
              { id: 'back_info', text: 'Back to information about Aridus Prime.' },
              { id: 'end', text: 'Interesting, thanks. (End conversation)' }
            ]
          },
          'planet': {
            response: "Aridus Prime was originally a research station studying the unique geological formations of this system. Over time, it evolved into a mining outpost due to the rich mineral deposits discovered in nearby asteroids.",
            options: [
              { id: 'planet_history', text: 'What was the original research about?' },
              { id: 'planet_population', text: 'How many people live here?' },
              { id: 'back_info', text: 'Back to information about Aridus Prime.' },
              { id: 'end', text: 'Interesting, thanks. (End conversation)' }
            ]
          },
          'system': {
            response: "The Aridus system consists of three planets and numerous asteroid fields. It's located in the outer rim of the galaxy, making it a strategic location for mining operations away from major trade routes.",
            options: [
              { id: 'system_planets', text: 'Tell me about the other planets.' },
              { id: 'system_asteroids', text: 'What about the asteroid fields?' },
              { id: 'back_info', text: 'Back to information about Aridus Prime.' },
              { id: 'end', text: 'Interesting, thanks. (End conversation)' }
            ]
          },
            'docking': {
             response: "Docking requests are processed through our automated system. Please provide your ship registration and cargo manifest. Standard docking fees apply.",
             options: [
               { id: 'confirm_dock', text: 'Initiating docking request.' },
               { id: 'docking_services', text: 'What services are available on the planet?' },
               { id: 'cancel_dock', text: 'Actually, never mind. (End conversation)' }
             ]
           },
           'mining_tech': {
             response: "We use advanced plasma cutting technology and automated drones for extraction. Our systems can process up to 500 tons of ore per day with minimal environmental impact.",
             options: [
               { id: 'back_mining', text: 'Back to mining information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'mining_profit': {
             response: "The operation is quite profitable, with annual revenues exceeding 2.5 million credits. The rare minerals we extract are in high demand across the galaxy.",
             options: [
               { id: 'back_mining', text: 'Back to mining information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'planet_history': {
             response: "The original research focused on studying the unique magnetic field anomalies in this system. Scientists discovered that the asteroids contain rare magnetic minerals that are crucial for advanced technology.",
             options: [
               { id: 'back_planet', text: 'Back to planet information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'planet_population': {
             response: "Aridus Prime has a population of approximately 1,200 people, including miners, engineers, support staff, and their families. It's a tight-knit community focused on the mining operations.",
             options: [
               { id: 'back_planet', text: 'Back to planet information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'system_planets': {
             response: "The other two planets are Aridus Secundus, a gas giant with valuable atmospheric gases, and Aridus Tertius, a rocky world with extensive cave systems that we use for storage.",
             options: [
               { id: 'back_system', text: 'Back to system information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'system_asteroids': {
             response: "The asteroid fields contain over 10,000 individual asteroids, ranging from small rocks to massive bodies several kilometers across. They're rich in rare earth metals and precious minerals.",
             options: [
               { id: 'back_system', text: 'Back to system information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'docking_services': {
             response: "We offer fuel refueling, basic repairs, cargo storage, and crew accommodations. Our facilities can handle ships up to 200 meters in length.",
             options: [
               { id: 'back_docking', text: 'Back to docking information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_mining': {
             response: "Our mining operations focus on extracting rare minerals from the asteroid fields. We've been operating for over 50 years and have established several automated mining stations throughout the system.",
             options: [
               { id: 'mining_tech', text: 'What technology do you use?' },
               { id: 'mining_profit', text: 'How profitable is the operation?' },
               { id: 'back_info', text: 'Back to information about Aridus Prime.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_planet': {
             response: "Aridus Prime was originally a research station studying the unique geological formations of this system. Over time, it evolved into a mining outpost due to the rich mineral deposits discovered in nearby asteroids.",
             options: [
               { id: 'planet_history', text: 'What was the original research about?' },
               { id: 'planet_population', text: 'How many people live here?' },
               { id: 'back_info', text: 'Back to information about Aridus Prime.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_system': {
             response: "The Aridus system consists of three planets and numerous asteroid fields. It's located in the outer rim of the galaxy, making it a strategic location for mining operations away from major trade routes.",
             options: [
               { id: 'system_planets', text: 'Tell me about the other planets.' },
               { id: 'system_asteroids', text: 'What about the asteroid fields?' },
               { id: 'back_info', text: 'Back to information about Aridus Prime.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           }
        }
      },
      'Oceanus': {
        greeting: "Thank you for contacting Oceanus.",
        conversationTree: {
          'information': {
            response: "Oceanus is a water world with extensive research facilities studying aquatic life forms and oceanographic phenomena.",
            options: [
              { id: 'research', text: 'Tell me about the research.' },
              { id: 'planet', text: 'Tell me about the planet.' },
              { id: 'docking', text: 'Request docking.' },
              { id: 'end', text: 'Interesting, thanks. (End conversation)' }
            ]
          },
          'docking': {
             response: "Docking is available at our orbital research station. Please note that surface access is restricted to authorized personnel only.",
             options: [
              { id: 'confirm_dock', text: 'Initiating docking request.' },
              { id: 'docking_services', text: 'What services are available?' },
              { id: 'cancel_dock', text: 'Actually, never mind. (End conversation)' }
             ]
           },
           'research': {
             response: "Our research focuses on studying the unique aquatic ecosystems of Oceanus. We've discovered over 200 new species of marine life and are studying their potential applications in biotechnology.",
             options: [
               { id: 'research_species', text: 'Tell me about the new species.' },
               { id: 'research_biotech', text: 'What biotechnology applications?' },
               { id: 'back_info', text: 'Back to information about Oceanus.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'planet': {
             response: "Oceanus is 95% covered by water, with only small island chains breaking the surface. The planet has a unique magnetic field that creates spectacular aurora displays visible from orbit.",
             options: [
               { id: 'planet_islands', text: 'Tell me about the islands.' },
               { id: 'planet_aurora', text: 'What about the aurora displays?' },
               { id: 'back_info', text: 'Back to information about Oceanus.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'docking_restrictions': {
             response: "Surface access is limited to research personnel with proper clearance. Visitors can access the orbital station's observation deck and basic facilities, but underwater research areas are off-limits.",
             options: [
               { id: 'docking', text: 'Back to docking information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'docking_services': {
             response: "The orbital station offers fuel refueling, basic repairs, and research data access. We also have a small trading post for scientific equipment and samples.",
             options: [
               { id: 'docking', text: 'Back to docking information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           }, 
           'research_species': {
             response: "We've discovered bioluminescent fish that can survive in extreme pressure, coral-like organisms that build underwater cities, and intelligent cephalopods with complex communication systems.",
             options: [
               { id: 'back_research', text: 'Back to research information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'research_biotech': {
             response: "The bioluminescent organisms show promise for medical imaging, the pressure-resistant fish could lead to new materials science, and the cephalopods' communication patterns are being studied for AI development.",
             options: [
               { id: 'back_research', text: 'Back to research information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'planet_islands': {
             response: "The islands are volcanic in origin and support unique ecosystems adapted to the constant storms. They serve as research outposts and emergency landing sites for our operations.",
             options: [
               { id: 'back_planet', text: 'Back to planet information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'planet_aurora': {
             response: "The aurora displays are caused by the interaction between solar wind and Oceanus's unique magnetic field. They create beautiful light shows that can be seen from space and are a major tourist attraction.",
             options: [
               { id: 'back_planet', text: 'Back to planet information.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_research': {
             response: "Our research focuses on studying the unique aquatic ecosystems of Oceanus. We've discovered over 200 new species of marine life and are studying their potential applications in biotechnology.",
             options: [
               { id: 'research_species', text: 'Tell me about the new species.' },
               { id: 'research_biotech', text: 'What biotechnology applications?' },
               { id: 'back_info', text: 'Back to information about Oceanus.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_planet': {
             response: "Oceanus is 95% covered by water, with only small island chains breaking the surface. The planet has a unique magnetic field that creates spectacular aurora displays visible from orbit.",
             options: [
               { id: 'planet_islands', text: 'Tell me about the islands.' },
               { id: 'planet_aurora', text: 'What about the aurora displays?' },
               { id: 'back_info', text: 'Back to information about Oceanus.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           },
           'back_docking': {
             response: "Docking is available at our orbital research station. Please note that surface access is restricted to authorized personnel only.",
             options: [
               { id: 'docking_restrictions', text: 'What are the restrictions?' },
               { id: 'docking_services', text: 'What services are available?' },
               { id: 'back_info', text: 'Back to information about Oceanus.' },
               { id: 'end', text: 'Interesting, thanks. (End conversation)' }
             ]
           }
        }
      }
    };
  }

  getGreeting(planetName) {
    const planet = this.conversations[planetName];
    return planet ? planet.greeting : "Thank you for contacting us.";
  }

  getConversationNode(planetName, nodeId) {
    const planet = this.conversations[planetName];
    if (!planet || !planet.conversationTree) {
      return null;
    }
    return planet.conversationTree[nodeId];
  }

  getInitialOptions(planetName) {
    const planet = this.conversations[planetName];
    if (!planet || !planet.conversationTree) {
      return [];
    }
    
    // Return the main options (information, docking, etc.)
    return [
      { id: 'information', text: `Information about ${planetName}` },
      { id: 'docking', text: 'Request docking' }
    ];
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
