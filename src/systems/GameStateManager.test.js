import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameStateManager } from './GameStateManager.js';

describe('GameStateManager', () => {
  let gameStateManager;
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
  });

  describe('initialization', () => {
    it('should initialize with paused false', () => {
      expect(gameStateManager.paused).toBe(false);
      expect(gameStateManager.isPaused).toBe(false);
    });

    it('should initialize with default global flags', () => {
      expect(gameStateManager.globalFlags.gameStarted).toBe(false);
      expect(gameStateManager.globalFlags.firstDocking).toBe(false);
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['title']);
    });

    it('should initialize with empty jobs state', () => {
      expect(gameStateManager.jobs.availableByLocation).toEqual({});
      expect(gameStateManager.jobs.inProgress).toEqual([]);
    });

    it('should store music and sound managers', () => {
      expect(gameStateManager.musicManager).toBe(mockMusicManager);
      expect(gameStateManager.soundManager).toBe(mockSoundManager);
    });
  });

  describe('pause/resume functionality', () => {
    it('should set paused state when pausing', () => {
      gameStateManager.pause();
      
      expect(gameStateManager.paused).toBe(true);
      expect(gameStateManager.isPaused).toBe(true);
      expect(gameStateManager.isGamePaused).toBe(true);
    });

    it('should pause music when pausing', () => {
      gameStateManager.pause();
      
      expect(mockMusicManager.pauseTrack).toHaveBeenCalled();
    });

    it('should stop engine rumble when pausing', () => {
      gameStateManager.pause();
      
      expect(mockSoundManager.stopEngineRumble).toHaveBeenCalled();
    });

    it('should clear paused state when resuming', () => {
      gameStateManager.pause();
      gameStateManager.resume();
      
      expect(gameStateManager.paused).toBe(false);
      expect(gameStateManager.isPaused).toBe(false);
      expect(gameStateManager.isGamePaused).toBe(false);
    });

    it('should resume music when resuming', () => {
      gameStateManager.pause();
      gameStateManager.resume();
      
      expect(mockMusicManager.resumeTrack).toHaveBeenCalled();
    });

    it('should start engine rumble when resuming', () => {
      gameStateManager.pause();
      gameStateManager.resume();
      
      expect(mockSoundManager.startEngineRumble).toHaveBeenCalled();
    });

    it('should handle pause when music manager is missing', () => {
      gameStateManager.musicManager = null;
      
      expect(() => gameStateManager.pause()).not.toThrow();
      expect(gameStateManager.paused).toBe(true);
    });

    it('should handle pause when sound manager is missing', () => {
      gameStateManager.soundManager = null;
      
      expect(() => gameStateManager.pause()).not.toThrow();
      expect(gameStateManager.paused).toBe(true);
    });

    it('should handle resume when music manager is missing', () => {
      gameStateManager.pause();
      gameStateManager.musicManager = null;
      
      expect(() => gameStateManager.resume()).not.toThrow();
      expect(gameStateManager.paused).toBe(false);
    });

    it('should handle resume when sound manager is missing', () => {
      gameStateManager.pause();
      gameStateManager.soundManager = null;
      
      expect(() => gameStateManager.resume()).not.toThrow();
      expect(gameStateManager.paused).toBe(false);
    });
  });

  describe('global flag management', () => {
    it('should set a global flag', () => {
      gameStateManager.setGlobalFlag('testFlag', true);
      
      expect(gameStateManager.globalFlags.testFlag).toBe(true);
    });

    it('should get a global flag', () => {
      gameStateManager.setGlobalFlag('testFlag', 'value');
      
      expect(gameStateManager.getGlobalFlag('testFlag')).toBe('value');
    });

    it('should return false for non-existent flag', () => {
      expect(gameStateManager.getGlobalFlag('nonExistentFlag')).toBe(false);
    });

    it('should check if flag exists and is truthy', () => {
      gameStateManager.setGlobalFlag('testFlag', true);
      
      expect(gameStateManager.hasGlobalFlag('testFlag')).toBe(true);
    });

    it('should return false if flag is falsy', () => {
      gameStateManager.setGlobalFlag('testFlag', false);
      
      expect(gameStateManager.hasGlobalFlag('testFlag')).toBe(false);
    });

    it('should return false if flag does not exist', () => {
      expect(gameStateManager.hasGlobalFlag('nonExistentFlag')).toBe(false);
    });

    it('should get all global flags as a copy', () => {
      gameStateManager.setGlobalFlag('testFlag', 'value');
      const flags = gameStateManager.getAllGlobalFlags();
      
      expect(flags.testFlag).toBe('value');
      expect(flags.gameStarted).toBe(false);
      
      // Verify it's a copy, not the original
      flags.newFlag = 'newValue';
      expect(gameStateManager.globalFlags.newFlag).toBeUndefined();
    });

    it('should process flags from conversation options', () => {
      const flags = {
        global: {
          questStarted: true,
          questComplete: false,
          customFlag: 'customValue'
        }
      };
      
      gameStateManager.processFlags(flags);
      
      expect(gameStateManager.getGlobalFlag('questStarted')).toBe(true);
      expect(gameStateManager.getGlobalFlag('questComplete')).toBe(false);
      expect(gameStateManager.getGlobalFlag('customFlag')).toBe('customValue');
    });

    it('should handle processFlags with no global flags', () => {
      const flags = {};
      
      expect(() => gameStateManager.processFlags(flags)).not.toThrow();
    });

    it('should handle processFlags with empty global flags', () => {
      const flags = { global: {} };
      
      expect(() => gameStateManager.processFlags(flags)).not.toThrow();
    });
  });

  describe('soundtrack management', () => {
    it('should set soundtracks from array', () => {
      gameStateManager.setSoundtracks(['combat', 'exploration']);
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat', 'exploration']);
    });

    it('should set soundtracks from single string', () => {
      gameStateManager.setSoundtracks('combat');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat']);
    });

    it('should get current soundtracks', () => {
      gameStateManager.setSoundtracks(['combat', 'exploration']);
      
      expect(gameStateManager.getCurrentSoundtracks()).toEqual(['combat', 'exploration']);
    });

    it('should return default soundtrack if none set', () => {
      gameStateManager.globalFlags.soundtracks = null;
      
      expect(gameStateManager.getCurrentSoundtracks()).toEqual(['ambient']);
    });

    it('should add soundtrack if not already present', () => {
      gameStateManager.setSoundtracks(['combat']);
      gameStateManager.addSoundtrack('exploration');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat', 'exploration']);
    });

    it('should not add duplicate soundtrack', () => {
      gameStateManager.setSoundtracks(['combat']);
      gameStateManager.addSoundtrack('combat');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat']);
    });

    it('should remove soundtrack', () => {
      gameStateManager.setSoundtracks(['combat', 'exploration', 'ambient']);
      gameStateManager.removeSoundtrack('exploration');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat', 'ambient']);
    });

    it('should handle removing non-existent soundtrack', () => {
      gameStateManager.setSoundtracks(['combat']);
      gameStateManager.removeSoundtrack('exploration');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat']);
    });

    it('should provide currentSoundtracks getter', () => {
      gameStateManager.setSoundtracks(['combat', 'exploration']);
      
      expect(gameStateManager.currentSoundtracks).toEqual(['combat', 'exploration']);
    });

    it('should return a copy of soundtracks from getter', () => {
      gameStateManager.setSoundtracks(['combat']);
      const soundtracks = gameStateManager.currentSoundtracks;
      soundtracks.push('exploration');
      
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['combat']);
    });
  });

  describe('jobs state management', () => {
    const mockJob1 = { id: 'job-1', description: 'Deliver cargo' };
    const mockJob2 = { id: 'job-2', description: 'Escort ship' };
    const mockJob3 = { id: 'job-3', description: 'Scout system' };
    const context1 = { sectorId: 'sector-1', locationName: 'Station Alpha' };
    const context2 = { sectorId: 'sector-2', locationName: 'Station Beta' };

    describe('available jobs', () => {
      it('should set available jobs for location', () => {
        gameStateManager.setJobsAvailableForLocation(context1, [mockJob1, mockJob2]);
        
        const jobs = gameStateManager.getJobsAvailableForLocation(context1);
        expect(jobs).toHaveLength(2);
        expect(jobs[0].id).toBe('job-1');
        expect(jobs[1].id).toBe('job-2');
      });

      it('should get empty array for location with no jobs', () => {
        const jobs = gameStateManager.getJobsAvailableForLocation(context1);
        
        expect(jobs).toEqual([]);
      });

      it('should return a copy of available jobs', () => {
        gameStateManager.setJobsAvailableForLocation(context1, [mockJob1]);
        const jobs = gameStateManager.getJobsAvailableForLocation(context1);
        jobs.push(mockJob2);
        
        const jobsAgain = gameStateManager.getJobsAvailableForLocation(context1);
        expect(jobsAgain).toHaveLength(1);
      });

      it('should isolate jobs by location', () => {
        gameStateManager.setJobsAvailableForLocation(context1, [mockJob1]);
        gameStateManager.setJobsAvailableForLocation(context2, [mockJob2]);
        
        expect(gameStateManager.getJobsAvailableForLocation(context1)).toHaveLength(1);
        expect(gameStateManager.getJobsAvailableForLocation(context2)).toHaveLength(1);
        expect(gameStateManager.getJobsAvailableForLocation(context1)[0].id).toBe('job-1');
        expect(gameStateManager.getJobsAvailableForLocation(context2)[0].id).toBe('job-2');
      });

      it('should remove specific job from available jobs', () => {
        gameStateManager.setJobsAvailableForLocation(context1, [mockJob1, mockJob2, mockJob3]);
        gameStateManager.removeAvailableJob(context1, 'job-2');
        
        const jobs = gameStateManager.getJobsAvailableForLocation(context1);
        expect(jobs).toHaveLength(2);
        expect(jobs.find(j => j.id === 'job-2')).toBeUndefined();
      });

      it('should handle removing job from location with no jobs', () => {
        expect(() => gameStateManager.removeAvailableJob(context1, 'job-1')).not.toThrow();
      });

      it('should handle setting non-array as jobs', () => {
        gameStateManager.setJobsAvailableForLocation(context1, null);
        
        expect(gameStateManager.getJobsAvailableForLocation(context1)).toEqual([]);
      });

      it('should create jobs key from context', () => {
        const key = gameStateManager._jobsKey(context1);
        
        expect(key).toBe('sector-1::Station Alpha');
      });

      it('should handle missing context fields in jobs key', () => {
        const key = gameStateManager._jobsKey({});
        
        expect(key).toBe('unknown-sector::unknown-location');
      });

      it('should handle null context in jobs key', () => {
        const key = gameStateManager._jobsKey(null);
        
        expect(key).toBe('unknown-sector::unknown-location');
      });
    });

    describe('jobs in progress', () => {
      it('should set jobs in progress', () => {
        gameStateManager.setJobsInProgress([mockJob1, mockJob2]);
        
        const jobs = gameStateManager.getJobsInProgress();
        expect(jobs).toHaveLength(2);
        expect(jobs[0].id).toBe('job-1');
      });

      it('should get empty array when no jobs in progress', () => {
        expect(gameStateManager.getJobsInProgress()).toEqual([]);
      });

      it('should return a copy of jobs in progress', () => {
        gameStateManager.setJobsInProgress([mockJob1]);
        const jobs = gameStateManager.getJobsInProgress();
        jobs.push(mockJob2);
        
        expect(gameStateManager.getJobsInProgress()).toHaveLength(1);
      });

      it('should add job to in progress', () => {
        gameStateManager.setJobsInProgress([mockJob1]);
        gameStateManager.addJobInProgress(mockJob2);
        
        const jobs = gameStateManager.getJobsInProgress();
        expect(jobs).toHaveLength(2);
        expect(jobs[1].id).toBe('job-2');
      });

      it('should handle adding job when inProgress is not initialized', () => {
        gameStateManager.jobs.inProgress = null;
        gameStateManager.addJobInProgress(mockJob1);
        
        expect(gameStateManager.getJobsInProgress()).toHaveLength(1);
      });

      it('should remove job from in progress', () => {
        gameStateManager.setJobsInProgress([mockJob1, mockJob2, mockJob3]);
        gameStateManager.removeJobInProgress('job-2');
        
        const jobs = gameStateManager.getJobsInProgress();
        expect(jobs).toHaveLength(2);
        expect(jobs.find(j => j.id === 'job-2')).toBeUndefined();
      });

      it('should handle removing job when inProgress is not an array', () => {
        gameStateManager.jobs.inProgress = null;
        
        expect(() => gameStateManager.removeJobInProgress('job-1')).not.toThrow();
      });

      it('should handle setting non-array as jobs in progress', () => {
        gameStateManager.setJobsInProgress(null);
        
        expect(gameStateManager.getJobsInProgress()).toEqual([]);
      });
    });
  });

  describe('state management', () => {
    it('should initialize to default state', () => {
      gameStateManager.pause();
      gameStateManager.setGlobalFlag('testFlag', true);
      
      gameStateManager.initialize();
      
      expect(gameStateManager.paused).toBe(false);
      expect(gameStateManager.globalFlags.gameStarted).toBe(false);
      expect(gameStateManager.globalFlags.soundtracks).toEqual(['ambient']);
    });

    it('should reset to initial state', () => {
      gameStateManager.pause();
      gameStateManager.setGlobalFlag('testFlag', true);
      
      gameStateManager.reset();
      
      expect(gameStateManager.paused).toBe(false);
      expect(gameStateManager.globalFlags.testFlag).toBeUndefined();
    });
  });

  describe('getters', () => {
    it('should provide isGamePaused getter', () => {
      expect(gameStateManager.isGamePaused).toBe(false);
      
      gameStateManager.pause();
      expect(gameStateManager.isGamePaused).toBe(true);
    });
  });
});
