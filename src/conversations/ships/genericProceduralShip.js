export const genericProceduralShipConversation = {
  greeting: 'This is an automated distress beacon. Please respond if you can hear this transmission.',
  conversationTree: {
    initial: {
      response: (_playerFlags, _ship) => `Derelict vessel ${_ship.name || 'Unknown'}. Automated systems still operational. Limited communication protocols available.`,
      options: (_playerFlags, _ship) => [
        { id: 'status', text: 'Request vessel status' },
        { id: 'crew', text: 'Ask about crew status' },
        { id: 'cargo', text: 'Inquire about cargo manifest' },
        { id: 'assistance', text: 'Offer assistance' },
        { id: 'end', text: 'End communication' }
      ]
    },
    status: {
      response: (_playerFlags, _ship) => {
        const hullIntegrity = Math.floor(Math.random() * 40) + 30; // 30-70%
        const powerLevel = Math.floor(Math.random() * 60) + 20; // 20-80%
        return `Vessel status: Hull integrity at ${hullIntegrity}%, Power systems at ${powerLevel}%. Life support minimal. Navigation systems offline.`;
      },
      options: [
        { id: 'repair', text: 'Ask about repair possibilities' },
        { id: 'crew', text: 'Ask about crew status' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    crew: {
      response: (_playerFlags, _ship) => {
        const crewStatus = Math.random() > 0.5 ? 'No life signs detected. Crew may have evacuated or perished.' : 'Emergency beacon indicates crew evacuation completed. No survivors aboard.';
        return crewStatus;
      },
      options: [
        { id: 'evacuation', text: 'Ask about evacuation details' },
        { id: 'cargo', text: 'Inquire about cargo manifest' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    cargo: {
      response: (_playerFlags, _ship) => {
        const cargoTypes = ['mining equipment', 'medical supplies', 'rare minerals', 'data cores', 'fuel cells', 'food rations'];
        const cargo = cargoTypes[Math.floor(Math.random() * cargoTypes.length)];
        return `Cargo manifest indicates: ${cargo}. Cargo bay integrity compromised. Some containers may be salvageable.`;
      },
      options: [
        { id: 'salvage', text: 'Ask about salvage rights' },
        { id: 'value', text: 'Inquire about cargo value' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    assistance: {
      response: (_playerFlags, _ship) => 'Automated systems acknowledge assistance offer. However, vessel is beyond repair. Recommend salvage operations or data recovery if possible.',
      options: [
        { id: 'salvage', text: 'Ask about salvage rights' },
        { id: 'data', text: 'Inquire about data recovery' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    repair: {
      response: (_playerFlags, _ship) => 'Repair assessment: Critical systems failure. Hull damage extensive. Recommend vessel be marked as derelict and processed for salvage.',
      options: [
        { id: 'salvage', text: 'Ask about salvage rights' },
        { id: 'data', text: 'Inquire about data recovery' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    evacuation: {
      response: (_playerFlags, _ship) => 'Emergency logs indicate crew evacuated to escape pods 2-3 days ago. Distress beacon activated automatically. No further contact with crew.',
      options: [
        { id: 'pods', text: 'Ask about escape pod locations' },
        { id: 'rescue', text: 'Offer to search for escape pods' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    salvage: {
      response: (_playerFlags, _ship) => 'Vessel marked as derelict. Salvage rights available to first claimant. Cargo and equipment may be recovered. Recommend caution due to structural instability.',
      options: [
        { id: 'claim', text: 'Express interest in salvage rights' },
        { id: 'cargo', text: 'Ask about specific cargo' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    data: {
      response: (_playerFlags, _ship) => 'Ship\'s computer core partially intact. Navigation logs, cargo manifests, and communication records may be recoverable. Data extraction possible with proper equipment.',
      options: [
        { id: 'extract', text: 'Ask about data extraction' },
        { id: 'logs', text: 'Inquire about specific logs' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    value: {
      response: (_playerFlags, _ship) => 'Estimated cargo value: Moderate. Some items may have deteriorated. Recommend professional appraisal before claiming salvage rights.',
      options: [
        { id: 'claim', text: 'Express interest in salvage rights' },
        { id: 'cargo', text: 'Ask about specific cargo' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    pods: {
      response: (_playerFlags, _ship) => 'Escape pod launch coordinates logged. Pods likely drifted with local stellar winds. Search radius approximately 50,000 km from current position.',
      options: [
        { id: 'rescue', text: 'Offer to search for escape pods' },
        { id: 'coordinates', text: 'Request specific coordinates' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    rescue: {
      response: (_playerFlags, _ship) => 'Automated systems acknowledge rescue offer. Escape pod emergency beacons should be active. Good luck with your search.',
      options: [
        { id: 'coordinates', text: 'Request specific coordinates' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    claim: {
      response: (_playerFlags, _ship) => 'Salvage claim registered. Vessel marked for your recovery. Exercise caution during approach - structural integrity compromised.',
      options: [
        { id: 'approach', text: 'Ask about safe approach procedures' },
        { id: 'cargo', text: 'Ask about cargo recovery' },
        { id: 'end', text: 'End communication' }
      ]
    },
    extract: {
      response: (_playerFlags, _ship) => 'Data extraction requires specialized equipment. Recommend docking or close approach for direct computer access. Some data may be corrupted.',
      options: [
        { id: 'approach', text: 'Ask about safe approach procedures' },
        { id: 'logs', text: 'Inquire about specific logs' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    logs: {
      response: (_playerFlags, _ship) => 'Available logs: Navigation history, cargo manifests, communication records, engineering reports. Some files may be corrupted or incomplete.',
      options: [
        { id: 'extract', text: 'Ask about data extraction' },
        { id: 'specific', text: 'Ask about specific log types' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    coordinates: {
      response: (_playerFlags, _ship) => 'Escape pod coordinates: Sector 7-Gamma, approximate range 45,000 km. Pods equipped with emergency beacons. Search pattern recommended.',
      options: [
        { id: 'rescue', text: 'Confirm rescue mission' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    },
    approach: {
      response: (_playerFlags, _ship) => 'Safe approach: Maintain 100m minimum distance. Avoid port side - structural damage detected. Use tractor beams for cargo recovery.',
      options: [
        { id: 'cargo', text: 'Ask about cargo recovery' },
        { id: 'extract', text: 'Ask about data extraction' },
        { id: 'end', text: 'End communication' }
      ]
    },
    specific: {
      response: (_playerFlags, _ship) => 'Navigation logs: Route data, jump coordinates. Cargo logs: Manifest, delivery schedules. Communication logs: Distress calls, crew messages.',
      options: [
        { id: 'extract', text: 'Ask about data extraction' },
        { id: 'initial', text: 'Back to main menu' },
        { id: 'end', text: 'End communication' }
      ]
    }
  }
};
