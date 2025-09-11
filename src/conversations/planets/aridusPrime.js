export const aridusPrimeConversation = {
  greeting: 'Thank you for contacting Aridus Prime.',
  conversationTree: {
    information: {
      response: 'Aridus Prime is a small outpost established in GY166, and the base of operations for mining operations in the Aridus system.',
      options: (playerFlags) => [
        { id: 'mining', text: 'Tell me more about mining.' },
        { id: 'planet', text: 'Tell me more about Aridus Prime.' },
        { id: 'system', text: 'Tell me more about the Aridus system.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ].filter(o => o)
    },
    mining: {
      response: "Our mining operations focus on extracting rare minerals from the asteroid fields. We've been operating for over 50 years and have established several automated mining stations throughout the system.",
      options: [
        { id: 'back_info', text: 'Fascinating. (Go back).' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet: {
      response: 'Aridus Prime was originally a research station studying the unique geological formations of this system. Over time, it evolved into a mining outpost due to the rich mineral deposits discovered in nearby asteroids.',
      options: [
        { id: 'back_info', text: 'Fascinating. (Go back).' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    system: {
      response: "The Aridus system consists of three planets. It's located in the outer rim of the galaxy, making it a strategic location for mining operations away from major trade routes.",
      options: [
        { id: 'back_info', text: 'Fascinating. (Go back).' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    docking: {
      response: 'You are authorized to dock. Please provide your ship registration and cargo manifest.',
      options: [
        { id: 'confirm_dock', text: 'Initiating docking request.', flags: { player: { isDocking: true } } },
        { id: 'docking_services', text: 'What services are available on the planet?' },
        { id: 'end', text: 'Actually, never mind. (End conversation)' }
      ]
    },
    docking_too_far: {
      response: 'You are too far away to dock. Please approach within 500 units of the planet before requesting docking clearance.',
      options: [
        { id: 'end', text: 'Understood. (End conversation)' }
      ]
    },
    docking_services: {
      response: 'We offer fuel refueling, basic repairs, cargo storage, and crew accommodations. Our facilities can handle ships up to 200 meters in length.',
      options: (playerFlags) => [
        playerFlags.commTargetInDockingRange ? { id: 'docking', text: 'Back to docking information.' } :
          !playerFlags.commTargetInDockingRange ? { id: 'docking_too_far', text: 'Back to docking information.' } : null,
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    request_takeoff: {
      response: 'Takeoff authorization granted. Launching now.',
      options: [
        { id: 'confirm_takeoff', text: 'Acknowledged.' }
      ]
    }
  }
};
