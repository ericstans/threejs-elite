import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from '../systems/GameStateManager.js';

describe('Integration: Game Flow', () => {
  let gameStateManager;
  let mockMusicManager;
  let mockSoundManager;

  beforeEach(() => {
    mockMusicManager = {
      pauseTrack: vi.fn(),
      resumeTrack: vi.fn(),
      fadeIn: vi.fn(),
      switchSoundtracksImmediate: vi.fn()
    };

    mockSoundManager = {
      stopEngineRumble: vi.fn(),
      startEngineRumble: vi.fn()
    };

    gameStateManager = new GameStateManager(mockMusicManager, mockSoundManager);
  });

  describe('Pause/Resume flow with audio systems', () => {
    it('should coordinate pause across GameStateManager and AudioManagers', () => {
      gameStateManager.pause();

      expect(gameStateManager.isPaused).toBe(true);
      expect(mockMusicManager.pauseTrack).toHaveBeenCalled();
      expect(mockSoundManager.stopEngineRumble).toHaveBeenCalled();
    });

    it('should coordinate resume across GameStateManager and AudioManagers', () => {
      gameStateManager.pause();
      gameStateManager.resume();

      expect(gameStateManager.isPaused).toBe(false);
      expect(mockMusicManager.resumeTrack).toHaveBeenCalled();
      expect(mockSoundManager.startEngineRumble).toHaveBeenCalled();
    });

    it('should handle multiple pause/resume cycles', () => {
      // Cycle 1
      gameStateManager.pause();
      gameStateManager.resume();

      // Cycle 2
      gameStateManager.pause();
      gameStateManager.resume();

      expect(mockMusicManager.pauseTrack).toHaveBeenCalledTimes(2);
      expect(mockMusicManager.resumeTrack).toHaveBeenCalledTimes(2);
    });
  });

  describe('Global flag management across systems', () => {
    it('should allow setting and retrieving global flags', () => {
      gameStateManager.setGlobalFlag('testFlag', true);
      expect(gameStateManager.getGlobalFlag('testFlag')).toBe(true);
    });

    it('should support complex flag objects', () => {
      const flagData = { location: 'Aridus Prime', status: 'docked' };
      gameStateManager.setGlobalFlag('dockingState', flagData);
      expect(gameStateManager.getGlobalFlag('dockingState')).toEqual(flagData);
    });

    it('should track game started state transitions', () => {
      expect(gameStateManager.getGlobalFlag('gameStarted')).toBe(false);

      gameStateManager.setGlobalFlag('gameStarted', true);
      expect(gameStateManager.getGlobalFlag('gameStarted')).toBe(true);
    });
  });

  describe('Job management flow', () => {
    it('should manage available jobs by location', () => {
      const jobs = [
        { id: 'job1', name: 'Delivery', reward: 1000 },
        { id: 'job2', name: 'Mining', reward: 500 }
      ];

      gameStateManager.setJobsAvailableForLocation('aridus', jobs);
      const retrieved = gameStateManager.getJobsAvailableForLocation('aridus');

      expect(retrieved).toEqual(jobs);
    });

    it('should transition jobs from available to in-progress', () => {
      const job = { id: 'job1', name: 'Delivery', reward: 1000 };
      gameStateManager.setJobsAvailableForLocation('aridus', [job]);

      gameStateManager.removeAvailableJob('aridus', 'job1');
      gameStateManager.addJobInProgress(job);

      expect(gameStateManager.getJobsAvailableForLocation('aridus')).toEqual([]);
      expect(gameStateManager.getJobsInProgress()).toContain(job);
    });

    it('should complete and remove jobs', () => {
      const job = { id: 'job1', name: 'Delivery', reward: 1000 };
      gameStateManager.addJobInProgress(job);

      expect(gameStateManager.getJobsInProgress().length).toBe(1);

      gameStateManager.removeJobInProgress('job1');

      expect(gameStateManager.getJobsInProgress().length).toBe(0);
    });
  });
});
