export const genericProceduralConversation = {
  greeting: 'Automated relay online. State your query.',
  conversationTree: {
    initial: {
      response: (playerFlags, planet) => `Automated services node for ${planet.name}. Limited liaison personnel available.`,
      options: (playerFlags, planet) => [
        { id: 'information', text: `Request ${planet.name} information` },
        planet.dockable ? { id: 'docking', text: 'Request docking clearance' } : { id: 'docking_unavailable', text: 'Docking services inquiry' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    // Docking request path (planet-based docking)
    docking: {
      response: "You are authorized to dock. Please provide your ship registration and cargo manifest.",
      options: [
        { id: 'confirm_dock', text: 'Initiating docking request.', flags: { player: { isDocking: true }, global: { firstDocking: true } } },
        { id: 'end', text: 'Actually, never mind. (End conversation)' }
      ]
    },
    docking_too_far: {
      response: 'Approach denied. You are outside authorized corridor envelope. Reduce range to 500 and reattempt.',
      options: [
        { id: 'end', text: 'Understood. (End conversation)' }
      ]
    },
    docking_unavailable: {
      response: 'Docking services not available on this body. Surface infrastructure is limited or restricted.',
      options: [
        { id: 'back_initial', text: 'Return to root menu' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    request_takeoff: {
      response: 'Takeoff authorization granted.',
      options: [
        { id: 'confirm_takeoff', text: 'Confirm takeoff sequence.' },
        { id: 'end', text: 'Never mind. (End conversation)' }
      ]
    },
    information: {
      response: (playerFlags, planet) => {
        let base = 'Surface telemetry nominal.';
        if (planet.hasRings) base += ' Orbital ring debris monitoring active.';
        if (planet.hasMoon) base += ' Auxiliary lunar relay synchronized.';
        base += planet.dockable ? ' Limited docking infrastructure detected.' : ' No sanctioned docking infrastructure.';
        return base;
      },
      options: (playerFlags, planet) => [
        { id: 'resources', text: 'Ask about known resources' },
        planet.dockable ? { id: 'docking', text: 'Proceed to docking channel' } : null,
        { id: 'end', text: 'End Transmission' }
      ].filter(o => o)
    },
    resources: {
      response: (playerFlags, planet) => `Survey data: trace metals, volatiles, minor organics. Geological variance correlates with radius ${planet.radius.toFixed(0)} sample profiles.`,
      options: [
        { id: 'back_information', text: 'Back to information' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    // traffic: {
    //   response: 'No significant traffic conflicts detected. Maintain standard separation protocols.',
    //   options: [
    //     { id: 'safety', text: 'Request approach safety guidelines' },
    //     { id: 'back_initial', text: 'Return to root menu' },
    //     { id: 'end', text: 'End Transmission' }
    //   ]
    // },
    // safety: {
    //   response: 'Caution: unpredictable debris vectors and intermittent ion interference reported. Proceed using visual confirmation.',
    //   options: [
    //     { id: 'back_traffic', text: 'Back to traffic advisories' },
    //     { id: 'end', text: 'End Transmission' }
    //   ]
    // },
    // trade: {
    //   response: 'Local trade index: LOW VOLUME. Autonomous procurement channels active. Submit manifest for docking priority.',
    //   options: [
    //     { id: 'market', text: 'Ask about market demand' },
    //     { id: 'back_initial', text: 'Return to root menu' },
    //     { id: 'end', text: 'End Transmission' }
    //   ]
    // },
    // market: {
    //   response: 'High demand: refined alloys, medical substrates, nav-grade carbon composites. Low demand: bulk ore, frozen water.',
    //   options: [
    //     { id: 'back_trade', text: 'Back to trade console' },
    //     { id: 'end', text: 'End Transmission' }
    //   ]
    // }
  }
};
