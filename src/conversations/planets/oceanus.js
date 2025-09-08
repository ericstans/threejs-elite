export const oceanusConversation = {
  greeting: 'Thank you for contacting Oceanus.',
  conversationTree: {
    information: {
      response: 'Oceanus is a water world with extensive research facilities studying aquatic life forms and oceanographic phenomena.',
      options: [
        { id: 'research', text: 'Tell me about the research.' },
        { id: 'planet', text: 'Tell me about the planet.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    docking: {
      response: 'Surface access is restricted to authorized personnel only. Docking is available at our orbital research station; you may contact them directly.',
      options: [
        { id: 'end', text: 'I understand. (End conversation)' }
      ]
    },
    docking_too_far: {
      response: 'Surface access is restricted to authorized personnel only. Docking is available at our orbital research station; you may contact them directly.',
      options: [
        { id: 'end', text: 'I understand. (End conversation)' }
      ]
    },
    research: {
      response: "Our research focuses on studying the unique aquatic ecosystems of Oceanus. We've discovered over 200 new species of marine life and are studying their potential applications in biotechnology.",
      options: [
        { id: 'research_species', text: 'Tell me about the new species.' },
        { id: 'research_biotech', text: 'What biotechnology applications?' },
        { id: 'back_info', text: 'Back to information about Oceanus.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet: {
      response: 'Oceanus is 95% covered by water, with only small island chains breaking the surface. The planet has a unique magnetic field that creates spectacular aurora displays visible from orbit.',
      options: [
        { id: 'planet_islands', text: 'Tell me about the islands.' },
        { id: 'planet_aurora', text: 'What about the aurora displays?' },
        { id: 'back_info', text: 'Back to information about Oceanus.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    research_species: {
      response: "We've discovered bioluminescent fish that can survive in extreme pressure, coral-like organisms that build underwater cities, and intelligent cephalopods with complex communication systems.",
      options: [
        { id: 'back_research', text: 'Back to research information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    research_biotech: {
      response: "The bioluminescent organisms show promise for medical imaging, the pressure-resistant fish could lead to new materials science, and the cephalopods' communication patterns are being studied for AI development.",
      options: [
        { id: 'back_research', text: 'Back to research information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet_islands: {
      response: 'The islands are volcanic in origin and support unique ecosystems adapted to the constant storms. They serve as research outposts and emergency landing sites for our operations.',
      options: [
        { id: 'back_planet', text: 'Back to planet information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    planet_aurora: {
      response: "The aurora displays are caused by the interaction between solar wind and Oceanus's unique magnetic field. They create beautiful light shows that can be seen from space and are a major tourist attraction.",
      options: [
        { id: 'back_planet', text: 'Back to planet information.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    back_research: {
      response: "Our research focuses on studying the unique aquatic ecosystems of Oceanus. We've discovered over 200 new species of marine life and are studying their potential applications in biotechnology.",
      options: [
        { id: 'research_species', text: 'Tell me about the new species.' },
        { id: 'research_biotech', text: 'What biotechnology applications?' },
        { id: 'back_info', text: 'Back to information about Oceanus.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    back_planet: {
      response: 'Oceanus is 95% covered by water, with only small island chains breaking the surface. The planet has a unique magnetic field that creates spectacular aurora displays visible from orbit.',
      options: [
        { id: 'planet_islands', text: 'Tell me about the islands.' },
        { id: 'planet_aurora', text: 'What about the aurora displays?' },
        { id: 'back_info', text: 'Back to information about Oceanus.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    },
    back_docking: {
      response: 'Docking is available at our orbital research station. Please note that surface access is restricted to authorized personnel only.',
      options: [
        { id: 'docking_restrictions', text: 'What are the restrictions?' },
        { id: 'docking_services', text: 'What services are available?' },
        { id: 'back_info', text: 'Back to information about Oceanus.' },
        { id: 'end', text: 'Interesting, thanks. (End conversation)' }
      ]
    }
  }
};
