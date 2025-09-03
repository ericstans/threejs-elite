import { 
  initMIDI, 
  playMIDINote, 
  setMIDIInstrument,
  setMasterVolume, 
  getMasterVolume, 
  isMIDIReady 
} from './util/JZZutil.js';

// Import MIDI files as bundled resources
import ambient1 from './assets/midi/ambient/ambient1.mid';
import ambient2 from './assets/midi/ambient/ambient2.mid';
import ambient3 from './assets/midi/ambient/ambient3.mid';
import ambient4 from './assets/midi/ambient/ambient4.mid';
import { JZZ } from 'jzz';
import { SMF } from 'jzz-midi-smf';
SMF(JZZ);
// Array of available ambient MIDI files
const ambientMidiFiles = [ambient1, ambient2, ambient3, ambient4];

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
    console.log('MusicManager: init() called');
    try {
      // Initialize MIDI using JZZutil
      console.log('MusicManager: Initializing MIDI');
      initMIDI();
      console.log('MusicManager: MIDI initialized');
      
      // Set initial volume
      console.log('MusicManager: Setting initial volume to', this.volume);
      setMasterVolume(this.volume);
      
      // Create ambient MIDI track
      console.log('MusicManager: Creating ambient MIDI track');
      await this.createAmbientTrackMidi();
      console.log('MusicManager: Ambient MIDI track created');
      
      this.isInitialized = true;
      console.log('MusicManager: Initialization completed successfully');
    } catch (error) {
      console.error('MusicManager: Failed to initialize:', error);
      console.error('MusicManager: Error details:', error.message);
      console.error('MusicManager: Error stack:', error.stack);
    }
  }

  // Load a music track
  loadTrack(trackName, trackData) {
    this.tracks.set(trackName, trackData);
  }

  // Play a specific track
  playTrack(trackName) {
    console.log('MusicManager: playTrack() called with trackName:', trackName);
    
    if (!this.isInitialized) {
      console.warn('MusicManager: Not initialized');
      return;
    }

    const track = this.tracks.get(trackName);
    if (!track) {
      console.warn(`MusicManager: Track not found: ${trackName}`);
      return;
    }

    console.log('MusicManager: Found track:', track);

    this.stopTrack();
    this.currentTrack = trackName;
    this.isPlaying = true;

    if (track.type === 'sequence') {
      console.log('MusicManager: Playing sequence track');
      this.playSequence(track);
    } else if (track.type === 'ambient') {
      console.log('MusicManager: Playing ambient track');
      this.playAmbient(track);
    } else if (track.type === 'midi') {
      console.log('MusicManager: Playing MIDI track');
      this.playMidiFile(track);
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

    // Stop MIDI player if it exists
    if (this.midiPlayer) {
      this.midiPlayer.stop();
      this.midiPlayer = null;
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
        { midiNote: 45, velocity: 30, duration: 4.0 }, // A2 - Low bass note
        { midiNote: 57, velocity: 25, duration: 5 }, // A3 - Mid bass note  
        { midiNote: 61, velocity: 25, duration: 5 }, // C#3 - Mid bass note  
        { midiNote: 69, velocity: 20, duration: 6 },  // A4 - Higher note
        { midiNote: 71, velocity: 16, duration: 2 }  // B4 - Higher note
      ],
      duration: 16 // 16 seconds per cycle
    };
    this.loadTrack('ambient', ambientTrack);
  }

  async createAmbientTrackMidi(){
    console.log('MusicManager: createAmbientTrackMidi() called');
    console.log('MusicManager: Available MIDI files:', ambientMidiFiles.length);
    
    // use the midi files in the /midi/ambient/ directory. Play one at a time at random. Midi files will specify their own instruments and may have more than one part.
    // Select a random MIDI file from the bundled resources
    const randomMidiUrl = ambientMidiFiles[Math.floor(Math.random() * ambientMidiFiles.length)];
    console.log('MusicManager: Selected random MIDI file URL:', randomMidiUrl);
    
    try {
      // Fetch the actual MIDI file data from the URL
      console.log('MusicManager: Fetching MIDI file data...');
      const response = await fetch(randomMidiUrl);
      const midiArrayBuffer = await response.arrayBuffer();
      const midiData = new Uint8Array(midiArrayBuffer);
      console.log('MusicManager: MIDI file data fetched, size:', midiData.length, 'bytes');
      
      // Create MIDI track object with actual binary data
      const midiTrack = {
        type: 'midi',
        name: 'ambient',
        data: midiData
      };
      
      console.log('MusicManager: Created MIDI track object with binary data');
      this.loadTrack('ambient', midiTrack);
      console.log('MusicManager: Loaded ambient track');
    } catch (error) {
      console.error('MusicManager: Failed to load MIDI file data:', error);
      throw error;
    }
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
          setTimeout(playSustainedNote, instrument.duration * 2000 + (index * 500)); // Stagger the notes
        }
      };
      
      // Start the first note after a delay
      setTimeout(playSustainedNote, index * 500);
    });
  }

  playMidiFile(track) {
    console.log('MusicManager: playMidiFile() called');
    console.log('MusicManager: Track data:', track);
    
    if (!this.isInitialized) {
      console.warn('MusicManager: Not initialized for MIDI playback');
      return;
    }

    try {
      console.log('MusicManager: Playing MIDI file using JZZ-midi-SMF');
      
      // Create MIDI output
      const midiout = JZZ().openMidiOut('WebAudioTinySynth');
      console.log('MusicManager: MIDI output created');
      
      console.log('track.data', track.data);
      // Parse the MIDI file data
      const smf = new JZZ.MIDI.SMF(track.data);
      console.log('MusicManager: MIDI file parsed');
      
      // Log MIDI file information
      console.log('MusicManager: MIDI file info:');
      console.log('  - Format:', smf.format);
      console.log('  - Tracks type:', typeof smf.tracks);
      console.log('  - Tracks:', smf.tracks);
      console.log('  - Ticks per quarter note:', smf.ticks);
      
      // Log each track's information (handle different track formats)
      if (Array.isArray(smf.tracks)) {
        console.log('  - Number of tracks:', smf.tracks.length);
        smf.tracks.forEach((track, trackIndex) => {
          console.log(`  - Track ${trackIndex}: ${track.length} events`);
        });
      } else if (smf.tracks && typeof smf.tracks === 'object') {
        console.log('  - Tracks object keys:', Object.keys(smf.tracks));
        Object.keys(smf.tracks).forEach((trackKey, index) => {
          const track = smf.tracks[trackKey];
          console.log(`  - Track ${index} (${trackKey}): ${track.length || 'unknown'} events`);
        });
      } else {
        console.log('  - Tracks structure unknown:', smf.tracks);
      }
      
      // Create player and connect to output
      const player = smf.player();
      player.connect(midiout);
      console.log('MusicManager: Player connected to MIDI output');
      
      // Log player information
      console.log('MusicManager: Player info:');
      console.log('  - Player tracks:', player.tracks ? player.tracks.length : 'unknown');
      console.log('  - Player duration:', player.duration ? player.duration + 'ms' : 'unknown');
      
      // Add event listener for when the track finishes
      player.onEnd = () => {
        console.log('MusicManager: Current MIDI track finished');
        if (this.isPlaying && this.currentTrack === 'ambient') {
          console.log('MusicManager: Queueing next random ambient MIDI track with 1 second delay');
          // Load and play the next random MIDI file after a 1 second delay
          setTimeout(() => {
            if (this.isPlaying && this.currentTrack === 'ambient') {
              this.playNextRandomAmbientMidi();
            }
          }, 1000);
        }
      };
      
      // Start playback
      player.play();
      console.log('MusicManager: MIDI file playback started');
      
      // Store player reference so we can control it later
      this.midiPlayer = player;
      
    } catch (error) {
      console.error('MusicManager: Failed to play MIDI file:', error);
      console.error('MusicManager: Error details:', error.message);
      console.error('MusicManager: Error stack:', error.stack);
    }
  }

  async playNextRandomAmbientMidi() {
    try {
      console.log('MusicManager: Loading next random ambient MIDI track');
      
      // Select a random MIDI file URL
      const randomMidiUrl = ambientMidiFiles[Math.floor(Math.random() * ambientMidiFiles.length)];
      console.log('MusicManager: Selected next random MIDI file URL:', randomMidiUrl);
      
      // Fetch the actual MIDI file data
      const response = await fetch(randomMidiUrl);
      const midiArrayBuffer = await response.arrayBuffer();
      const midiData = new Uint8Array(midiArrayBuffer);
      console.log('MusicManager: Next MIDI file data fetched, size:', midiData.length, 'bytes');
      
      // Create new MIDI track object
      const nextMidiTrack = {
        type: 'midi',
        name: 'ambient',
        data: midiData
      };
      
      // Play the next track
      this.playMidiFile(nextMidiTrack);
      
    } catch (error) {
      console.error('MusicManager: Failed to load next ambient MIDI track:', error);
    }
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