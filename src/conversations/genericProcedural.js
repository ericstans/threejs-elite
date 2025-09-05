export const genericProceduralConversation = {
  greeting: 'Automated relay online. State your query.',
  conversationTree: {
    initial: {
      response: 'This is an automated planetary services node. Limited liaison personnel available.',
      options: [
        { id: 'information', text: 'Request planetary information' },
        { id: 'traffic', text: 'Query local traffic advisories' },
        { id: 'trade', text: 'Inquire about trade opportunities' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    // Docking request path (planet-based docking)
    docking: {
      response: 'Docking request received. Atmospheric clearance approved. Stand by for surface vector.',
      options: [
        { id: 'confirm_dock', text: 'Confirm approach vector' },
        { id: 'end', text: 'Abort / Close Channel' }
      ]
    },
    docking_too_far: {
      response: 'Approach denied. You are outside authorized corridor envelope. Reduce range and reattempt.',
      options: [
        { id: 'end', text: 'Understood (close channel)' }
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
      response: 'Takeoff authorization pending. Verify systems green and confirm when ready.',
      options: [
        { id: 'confirm_takeoff', text: 'Confirm takeoff sequence' },
        { id: 'end', text: 'Hold position (close channel)' }
      ]
    },
    information: {
      response: 'Surface conditions stable. Standard approach corridor nominal. Limited docking facilities available.',
      options: [
        { id: 'resources', text: 'Ask about known resources' },
        { id: 'back_initial', text: 'Return to root menu' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    resources: {
      response: 'Survey data: mixed trace metals, volatile deposits, and minor organic signatures. Further analysis requires jurisdictional clearance.',
      options: [
        { id: 'back_information', text: 'Back to information' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    traffic: {
      response: 'No significant traffic conflicts detected. Maintain standard separation protocols.',
      options: [
        { id: 'safety', text: 'Request approach safety guidelines' },
        { id: 'back_initial', text: 'Return to root menu' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    safety: {
      response: 'Caution: unpredictable debris vectors and intermittent ion interference reported. Proceed using visual confirmation.',
      options: [
        { id: 'back_traffic', text: 'Back to traffic advisories' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    trade: {
      response: 'Local trade index: LOW VOLUME. Autonomous procurement channels active. Submit manifest for docking priority.',
      options: [
        { id: 'market', text: 'Ask about market demand' },
        { id: 'back_initial', text: 'Return to root menu' },
        { id: 'end', text: 'End Transmission' }
      ]
    },
    market: {
      response: 'High demand: refined alloys, medical substrates, nav-grade carbon composites. Low demand: bulk ore, frozen water.',
      options: [
        { id: 'back_trade', text: 'Back to trade console' },
        { id: 'end', text: 'End Transmission' }
      ]
    }
  }
};
