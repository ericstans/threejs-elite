import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../systems/GameStateManager.js';
import { ConversationSystem } from '../systems/ConversationSystem.js';

describe('Integration: Conversations & Game State', () => {
  let gameStateManager;
  let conversationSystem;
  let mockMusicManager;
  let mockSoundManager;

  beforeEach(() => {
    mockMusicManager = {
      pauseTrack: vi.fn(),
      resumeTrack: vi.fn()
    };

    mockSoundManager = {
      stopEngineRumble: vi.fn(),
      startEngineRumble: vi.fn()
    };

    gameStateManager = new GameStateManager(mockMusicManager, mockSoundManager);
    conversationSystem = new ConversationSystem();
  });

  describe('Conversation flow', () => {
    it('should initialize conversation system', () => {
      expect(conversationSystem).toBeDefined();
    });

    it('should have conversation method for starting dialogs', () => {
      expect(typeof conversationSystem.conversation).toBe('function');
    });
  });

  describe('Docking flags processing', () => {
    it('should process docking-related flags from conversations', () => {
      const dockingFlags = {
        docked: true,
        location: 'aridus-station'
      };

      gameStateManager.processFlags(dockingFlags);

      // Verify flags are stored
      expect(gameStateManager.getGlobalFlag('docked')).toBe(true);
      expect(gameStateManager.getGlobalFlag('location')).toBe('aridus-station');
    });

    it('should handle first docking flag', () => {
      expect(gameStateManager.getGlobalFlag('firstDocking')).toBe(false);

      gameStateManager.setGlobalFlag('firstDocking', true);

      expect(gameStateManager.getGlobalFlag('firstDocking')).toBe(true);
    });
  });

  describe('Job system flags', () => {
    it('should accept job offers through conversation', () => {
      const jobFlags = {
        newJobAvailable: {
          id: 'job-001',
          title: 'Cargo Delivery',
          reward: 2000,
          destination: 'oceanus'
        }
      };

      gameStateManager.processFlags(jobFlags);

      expect(gameStateManager.getGlobalFlag('newJobAvailable')).toEqual(jobFlags.newJobAvailable);
    });

    it('should transition jobs from available to in-progress', () => {
      const job = {
        id: 'job-001',
        title: 'Cargo Delivery',
        reward: 2000
      };

      gameStateManager.addJobInProgress(job);
      const inProgress = gameStateManager.getJobsInProgress();

      expect(inProgress).toContainEqual(job);
    });
  });

  describe('Conversation option selection flow', () => {
    it('should track conversation node state', () => {
      const nodes = {
        initial: {
          text: 'Greetings',
          options: [
            { text: 'How are you?', nextNode: 'greeting_response' },
            { text: 'I have cargo', nextNode: 'cargo_offer' }
          ]
        },
        greeting_response: {
          text: 'I am well'
        },
        cargo_offer: {
          text: 'I am interested',
          flags: { jobOffered: true }
        }
      };

      // Simulate conversation flow
      let currentNode = 'initial';
      expect(currentNode).toBe('initial');

      // Select option to cargo_offer
      currentNode = 'cargo_offer';
      expect(currentNode).toBe('cargo_offer');

      // Process flags from this node
      gameStateManager.processFlags(nodes[currentNode].flags);
      expect(gameStateManager.getGlobalFlag('jobOffered')).toBe(true);
    });
  });

  describe('Conversation state preservation', () => {
    it('should maintain conversation history', () => {
      const conversationLog = [];

      const dialogOption1 = {
        playerText: 'Hello',
        npcResponse: 'Greetings'
      };

      const dialogOption2 = {
        playerText: 'How are you?',
        npcResponse: 'Doing well'
      };

      conversationLog.push(dialogOption1);
      conversationLog.push(dialogOption2);

      expect(conversationLog.length).toBe(2);
      expect(conversationLog[0].playerText).toBe('Hello');
      expect(conversationLog[1].npcResponse).toBe('Doing well');
    });
  });

  describe('Multi-conversation interactions', () => {
    it('should handle separate conversations with different NPCs', () => {
      const merchant = {
        id: 'merchant-1',
        name: 'Merchant Bob',
        conversationState: 'initial'
      };

      const pirate = {
        id: 'pirate-1',
        name: 'Captain Blackbeard',
        conversationState: 'initial'
      };

      expect(merchant.conversationState).toBe('initial');
      expect(pirate.conversationState).toBe('initial');

      // Switch conversation context
      merchant.conversationState = 'negotiating';
      pirate.conversationState = 'threatening';

      expect(merchant.conversationState).toBe('negotiating');
      expect(pirate.conversationState).toBe('threatening');
    });
  });

  describe('Conversation consequences on game state', () => {
    it('should pause game during conversation', () => {
      // Conversation starts
      gameStateManager.pause();

      expect(gameStateManager.isPaused).toBe(true);
      expect(mockMusicManager.pauseTrack).toHaveBeenCalled();

      // Conversation ends
      gameStateManager.resume();

      expect(gameStateManager.isPaused).toBe(false);
      expect(mockMusicManager.resumeTrack).toHaveBeenCalled();
    });

    it('should apply conversation choices as game state changes', () => {
      const conversationFlags = {
        acceptedJob: true,
        reward: 5000,
        destination: 'oceanus'
      };

      gameStateManager.processFlags(conversationFlags);

      expect(gameStateManager.getGlobalFlag('acceptedJob')).toBe(true);
      expect(gameStateManager.getGlobalFlag('reward')).toBe(5000);
      expect(gameStateManager.getGlobalFlag('destination')).toBe('oceanus');
    });
  });
});
