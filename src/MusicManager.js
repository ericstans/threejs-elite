import { 
  initMIDI, 
  playMIDINote, 
  setMIDIInstrument,
  setMasterVolume, 
  getMasterVolume, 
  isMIDIReady 
} from './util/JZZutil.js';

export class MusicManager {
  constructor() {
    // Initialize music manager
    this.isInitialized = false;
    this.currentTrack = null;
    this.volume = 0.5;
    this.isPlaying = false;
    this.tracks = new Map();
    this.sequencer = null;
    this.currentBPM = 120;
    this.fadeTimeout = null;

    this.createCombatTrack();
    this.createAmbientTrack();
    this.createDockingTrack();
    this.createMenuTrack();
  }

  // Initialize the music system
  async init() {
    try {
      // Initialize MIDI using JZZutil
      initMIDI();
      
      // Set initial volume
      setMasterVolume(this.volume);
      
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize MusicManager:', error);
    }
  }

  // Load a music track
  loadTrack(trackName, trackData) {
    this.tracks.set(trackName, trackData);
  }

  // Play a specific track
  playTrack(trackName) {
    if (!this.isInitialized) {
      console.warn('MusicManager not initialized');
      return;
    }

    const track = this.tracks.get(trackName);
    if (!track) {
      console.warn(`Track not found: ${trackName}`);
      return;
    }

    this.stopTrack();
    this.currentTrack = trackName;
    this.isPlaying = true;

    if (track.type === 'sequence') {
      this.playSequence(track);
    } else if (track.type === 'ambient') {
      this.playAmbient(track);
    }
  }

  // Stop current track
  stopTrack() {
    this.isPlaying = false;
    this.currentTrack = null;

    // Clear sequencer
    if (this.sequencer) {
      clearInterval(this.sequencer);
      this.sequencer = null;
    }

    // Clear fade timeout
    if (this.fadeTimeout) {
      clearTimeout(this.fadeTimeout);
      this.fadeTimeout = null;
    }
  }

  // Pause current track
  pauseTrack() {
    if (this.isPlaying) {
      this.isPlaying = false;
      // Note: Web Audio API doesn't have native pause, so we'll stop and remember position
    }
  }

  // Resume current track
  resumeTrack() {
    if (this.currentTrack && !this.isPlaying) {
      this.isPlaying = true;
      this.playTrack(this.currentTrack);
    }
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    setMasterVolume(this.volume);
  }

  // Get current volume
  getVolume() {
    return getMasterVolume();
  }

  // Check if music is playing
  isTrackPlaying() {
    return this.isPlaying;
  }

  // Fade in music
  fadeIn(duration = 2000) {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = this.volume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const currentVolume = volumeStep * currentStep;
      setMasterVolume(currentVolume);
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        setMasterVolume(this.volume);
      }
    }, stepDuration);
  }

  // Fade out music
  fadeOut(duration = 2000) {
    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = this.volume / steps;
    let currentStep = 0;
    
    const fadeInterval = setInterval(() => {
      currentStep++;
      const currentVolume = this.volume - (volumeStep * currentStep);
      setMasterVolume(Math.max(0, currentVolume));
      
      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        setMasterVolume(0);
        this.fadeTimeout = setTimeout(() => {
          this.stopTrack();
        }, 100);
      }
    }, stepDuration);
  }

  // Crossfade between tracks
  crossfadeToTrack(trackName, duration = 1000) {
    this.fadeOut(duration / 2);
    setTimeout(() => {
      this.playTrack(trackName);
      this.fadeIn(duration / 2);
    }, duration / 2);
  }

  // Create ambient background music
  createAmbientTrack() {
    const ambientTrack = {
      type: 'ambient',
      name: 'ambient',
      instrumentType: 71,  // bassoon
      instruments: [
        { midiNote: 45, velocity: 30, duration: 2.0 }, // A2 - Low bass note
        { midiNote: 57, velocity: 25, duration: 2.5 }, // A3 - Mid bass note  
        { midiNote: 69, velocity: 20, duration: 3.0 }  // A4 - Higher note
      ],
      duration: 16 // 16 seconds per cycle
    };
    this.loadTrack('ambient', ambientTrack);
  }

  createAmbientTrackMidi(){
    // use the midi files in the /midi/ambient/ directory. Play one at a time at random. Midi files will specify their own instruments and may have more than one part.
    const midiFiles = fs.readdirSync('./midi/ambient/');
    const randomMidiFile = midiFiles[Math.floor(Math.random() * midiFiles.length)];
    const midiFile = fs.readFileSync(`./midi/ambient/${randomMidiFile}`, 'binary');
    const midiData = new Uint8Array(midiFile);
    const midiSequence = new Sequence(midiData);
    this.loadTrack('ambient', midiSequence);
  }

  // Create combat music
  createCombatTrack() {
    const combatTrack = {
      type: 'sequence',
      name: 'combat',
      instrumentType: 81, // Lead 2 (sawtooth)
      bpm: 2000,
      pattern: [
        { note: 60, duration: 0.25, velocity: 0.8 }, 
        { note: 63, duration: 0.25, velocity: 0.8 }, 
        { note: 65, duration: 0.25, velocity: 0.8 }, 
        { note: 72, duration: 0.25, velocity: 0.9 }, 
        { note: 65, duration: 0.25, velocity: 0.8 }, 
        { note: 63, duration: 0.25, velocity: 0.8 }, 
        { note: 65, duration: 0.5, velocity: 0.9 },  
        { note: 0, duration: 0.25, velocity: 0 }     
      ],
      drumPattern: [
        { note: 0, duration: 0.25, velocity: 0 },    // Rest
        { note: 0, duration: 0.25, velocity: 0 },    // Rest
        { note: 36, duration: 0.25, velocity: 0.9 }, // Kick drum
        { note: 0, duration: 0.25, velocity: 0 },    // Rest
        { note: 36, duration: 0.25, velocity: 0.9 }, // Kick drum
        { note: 0, duration: 0.25, velocity: 0 },    // Rest
        { note: 40, duration: 0.25, velocity: 0.9 }, // Electric snare
        { note: 0, duration: 0.25, velocity: 0 }     // Rest
      ],
      drumStartAfter: 8 // Start kick drum after 4 run-throughs
    };
    this.loadTrack('combat', combatTrack);
  }

  // Create menu music
  createMenuTrack() {
    const menuTrack = {
      type: 'sequence',
      name: 'menu',
      instrumentType: 25, // Steel Guitar
      bpm: 100,
      pattern: [
        { note: 60, duration: 0.5, velocity: 0.6 },  // C4
        { note: 64, duration: 0.5, velocity: 0.6 },  // E4
        { note: 67, duration: 0.5, velocity: 0.6 },  // G4
        { note: 72, duration: 1.0, velocity: 0.7 },  // C5
        { note: 0, duration: 1.0, velocity: 0 }      // Rest
      ]
    };
    this.loadTrack('menu', menuTrack);
  }

  // Create docking music
  createDockingTrack() {
    const dockingTrack = {
      type: 'sequence',
      name: 'docking',
      instrumentType: 50, // Synth Strings 1
      bpm: 80,
      pattern: [
        { note: 48, duration: 0.5, velocity: 0.5 },  // C3
        { note: 52, duration: 0.5, velocity: 0.5 },  // E3
        { note: 55, duration: 0.5, velocity: 0.5 },  // G3
        { note: 60, duration: 1.0, velocity: 0.6 },  // C4
        { note: 0, duration: 2.0, velocity: 0 }      // Rest
      ]
    };
    this.loadTrack('docking', dockingTrack);
  }

  // Play sequence-based track
  playSequence(track) {
    if (!this.isInitialized) return;

    // Set the instrument type if specified
    if (track.instrumentType) {
      setMIDIInstrument(track.instrumentType);
    }

    const stepDuration = (60 / track.bpm) * 4; // 4 beats per measured
    let stepIndex = 0;
    let patternRunCount = 0;

    this.sequencer = setInterval(() => {
      if (!this.isPlaying) return;

      const step = track.pattern[stepIndex % track.pattern.length];
      
      if (step.note > 0) {
        const velocity = Math.round(step.velocity * 127); // Convert to MIDI velocity (0-127)
        playMIDINote(step.note, step.duration * stepDuration, velocity);
      }

      // Check if we've completed a full pattern run
      if (stepIndex % track.pattern.length === track.pattern.length - 1) {
        patternRunCount++;
      }

      // Play kick drum if we've passed the start threshold and have a kick pattern
      if (track.drumPattern && track.drumStartAfter && patternRunCount >= track.drumStartAfter) {
        const kickStepIndex = stepIndex % track.drumPattern.length;
        const kickStep = track.drumPattern[kickStepIndex];
        
        if (kickStep.note > 0) {
          const kickVelocity = Math.round(kickStep.velocity * 127);
          // Play kick drum on channel 9 (drum kit channel)
          playMIDINote(kickStep.note, kickStep.duration * stepDuration, kickVelocity, 9);
        }
      }

      stepIndex++;
    }, stepDuration * 1000);
  }

  // Play ambient track
  playAmbient(track) {
    if (!this.isInitialized) return;

    // Set the instrument type if specified
    if (track.instrumentType) {
      setMIDIInstrument(track.instrumentType);
    }

    // For ambient tracks, we'll use a simple sequence of sustained MIDI notes
    track.instruments.forEach((instrument, index) => {
      // Play sustained notes with longer duration
      const playSustainedNote = () => {
        if (this.isPlaying && this.currentTrack === 'ambient') {
          playMIDINote(instrument.midiNote, instrument.duration, instrument.velocity);
          setTimeout(playSustainedNote, instrument.duration * 1000 + (index * 500)); // Stagger the notes
        }
      };
      
      // Start the first note after a delay
      setTimeout(playSustainedNote, index * 500);
    });
  }



  // Update music based on game state
  update(gameState) {
    // Example: Change music based on game state
    if (gameState.inCombat && this.currentTrack !== 'combat') {
      this.crossfadeToTrack('combat', 1000);
    } else if (gameState.isDocking && this.currentTrack !== 'docking') {
      this.crossfadeToTrack('docking', 1000);
    } else if (!gameState.inCombat && !gameState.isDocking && this.currentTrack !== 'ambient') {
      this.crossfadeToTrack('ambient', 1000);
    }
  }

  // Cleanup resources
  dispose() {
    this.stopTrack();
    this.tracks.clear();
    this.isInitialized = false;
  }
}