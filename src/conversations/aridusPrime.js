export const aridusPrimeConversation = {
  greeting: "Thank you for contacting Aridus Prime.",
  conversationTree: {
    information: {
      response: "Aridus Prime is a small outpost established in GY166, and the base of operations for mining operations in the Aridus system.",
      options: (playerFlags) => [
        { id: 'mining', text: 'Tell me more about mining.' },
        { id: 'planet', text: 'Tell me more about Aridus Prime.' },
        { id: 'system', text: 'Tell me more about the Aridus system.' },
  playerFlags.isDocked && playerFlags.dockedPlanet === 'Aridus Prime' ? { id: 'request_takeoff', text: 'Request Takeoff Authorization' } :
  playerFlags.commTargetInDockingRange === true ? { id: 'docking', text: 'Request docking.' } : 
        playerFlags.commTargetInDockingRange === false ? { id: 'docking_too_far', text: 'Request docking (too far away)' } : null,
        playerFlags.hasVisitedOceanus ? { id: 'oceanus_comparison', text: 'How does this compare to Oceanus?' } : null,
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ].filter(o => o)
    },
    mining: {
      response: "Our mining operations focus on extracting rare minerals from the asteroid fields. We've been operating for over 50 years and have established several automated mining stations throughout the system.",
      options: [
        { id: 'mining_tech', text: 'What technology do you use?' },
        { id: 'mining_profit', text: 'How profitable is the operation?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet: {
      response: "Aridus Prime was originally a research station studying the unique geological formations of this system. Over time, it evolved into a mining outpost due to the rich mineral deposits discovered in nearby asteroids.",
      options: [
        { id: 'planet_history', text: 'What was the original research about?' },
        { id: 'planet_population', text: 'How many people live here?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    system: {
      response: "The Aridus system consists of three planets and numerous asteroid fields. It's located in the outer rim of the galaxy, making it a strategic location for mining operations away from major trade routes.",
      options: [
        { id: 'system_planets', text: 'Tell me about the other planets.' },
        { id: 'system_asteroids', text: 'What about the asteroid fields?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    docking: {
      response: "You are authorized to dock. Please provide your ship registration and cargo manifest.",
      options: [
        { id: 'confirm_dock', text: 'Initiating docking request.', flags: { player: { isDocking: true }, global: { firstDocking: true } } },
        { id: 'docking_services', text: 'What services are available on the planet?' },
        { id: 'cancel_dock', text: 'Actually, never mind. (End conversation)' }
      ]
    },
    docking_too_far: {
      response: "You are too far away to dock. Please approach within 200 units of the station before requesting docking clearance.",
      options: [
        { id: 'docking_services', text: 'What services are available on the planet?' },
        { id: 'end', text: 'Understood. (End conversation)' }
      ]
    },
    oceanus_comparison: {
      response: "Unlike Oceanus's aquatic research focus, Aridus Prime is purely industrial. We don't have the luxury of studying marine life - we're here to extract resources and keep the system's economy running.",
      options: [
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting comparison. (End conversation)' }
      ]
    },
    mining_tech: {
      response: "We use advanced plasma cutting technology and automated drones for extraction. Our systems can process up to 500 tons of ore per day.",
      options: [
        { id: 'back_mining', text: 'Back to mining information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    mining_profit: {
      response: "The operation is quite profitable, with annual revenues exceeding 2.5 million credits. The rare minerals we extract are in high demand across the galaxy.",
      options: [
        { id: 'back_mining', text: 'Back to mining information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet_history: {
      response: "The original research focused on studying the unique magnetic field anomalies in this system. Scientists discovered that the asteroids contain rare magnetic minerals that are crucial for advanced technology.",
      options: [
        { id: 'back_planet', text: 'Back to planet information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet_population: {
      response: "Aridus Prime has a population of approximately 1,200 people, including miners, engineers, support staff, and their families. It's a tight-knit community focused on the mining operations.",
      options: [
        { id: 'back_planet', text: 'Back to planet information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    system_planets: {
      response: "The other two planets are Aridus Secundus, a gas giant with valuable atmospheric gases, and Aridus Tertius, a rocky world with extensive cave systems that we use for storage.",
      options: [
        { id: 'back_system', text: 'Back to system information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    system_asteroids: {
      response: "The asteroid fields contain over 10,000 individual asteroids, ranging from small rocks to massive bodies several kilometers across. They're rich in rare earth metals and precious minerals.",
      options: [
        { id: 'back_system', text: 'Back to system information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    docking_services: {
      response: "We offer fuel refueling, basic repairs, cargo storage, and crew accommodations. Our facilities can handle ships up to 200 meters in length.",
      options: [
        { id: 'back_docking', text: 'Back to docking information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    request_takeoff: {
      response: "Takeoff authorization granted. Launching now.",
      options: [
        { id: 'confirm_takeoff', text: 'Acknowledged.' }
      ]
    },
    back_mining: {
      response: "Our mining operations focus on extracting rare minerals from the asteroid fields. We've been operating for over 50 years and have established several automated mining stations throughout the system.",
      options: [
        { id: 'mining_tech', text: 'What technology do you use?' },
        { id: 'mining_profit', text: 'How profitable is the operation?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    back_planet: {
      response: "Aridus Prime was originally a research station studying the unique geological formations of this system. Over time, it evolved into a mining outpost due to the rich mineral deposits discovered in nearby asteroids.",
      options: [
        { id: 'planet_history', text: 'What was the original research about?' },
        { id: 'planet_population', text: 'How many people live here?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    back_system: {
      response: "The Aridus system consists of three planets and numerous asteroid fields. It's located in the outer rim of the galaxy, making it a strategic location for mining operations away from major trade routes.",
      options: [
        { id: 'system_planets', text: 'Tell me about the other planets.' },
        { id: 'system_asteroids', text: 'What about the asteroid fields?' },
        { id: 'back_info', text: 'Back to information about Aridus Prime.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    }
  }
};
