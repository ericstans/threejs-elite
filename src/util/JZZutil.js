let midiOut = null;
const bus = null;
let audioCtx = null;
const masterGain = null;
const compressor = null;
let midiReady = false;

// Initialize MIDI when JZZ is available
async function initMIDI() {
  if (window.JZZ && !midiOut) {
    try {
      // List all available MIDI ports first
      console.log('Listing all available MIDI ports:');
      const ports = JZZ().info().ports;
      ports.forEach((port, index) => {
        console.log(`  ${index}: ${port.name} (${port.type})`);
      });

      // Try Microsoft GS Wavetable Synth first
      console.log('Attempting to use Microsoft GS Wavetable Synth...');
      midiOut = await JZZ().openMidiOut(/Microsoft/);

      if (midiOut) {
        midiReady = true;
        // Test with a program change to ensure it's working
        midiOut.program(0, 0); // Set to Acoustic Grand Piano
        console.log('Successfully initialized Microsoft GS Wavetable Synth');
      } else {
        throw new Error('Microsoft GS Wavetable Synth not available');
      }
    } catch (error) {
      console.warn('Microsoft GS Wavetable Synth failed, falling back to Tiny synthesizer:', error.message);

      // Fallback to Tiny synthesizer
      try {
        if (window.JZZ.synth) {
          JZZ.synth.Tiny.register('WebAudioTinySynth');
          midiOut = JZZ().openMidiOut('WebAudioTinySynth');
          if (midiOut) {
            midiReady = true;
            // Test with a program change to ensure it's working
            midiOut.program(0, 0); // Set to Acoustic Grand Piano
            console.log('Successfully initialized Tiny synthesizer as fallback');
          } else {
            console.error('Failed to open Tiny synthesizer');
            midiReady = false;
          }
        } else {
          console.error('JZZ.synth not available for fallback');
          midiReady = false;
        }
      } catch (fallbackError) {
        console.error('Failed to initialize Tiny synthesizer fallback:', fallbackError);
        midiReady = false;
      }
    }
  } else if (!window.JZZ) {
    console.warn('JZZ not available');
  } else if (midiOut) {
    console.log('MIDI already initialized');
  }
}

// Try to initialize MIDI immediately if JZZ is available
if (window.JZZ) {
  initMIDI();
} else {
  // Wait for JZZ to load
  window.addEventListener('DOMContentLoaded', initMIDI);
}

function midiToFreq(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function playNote(freq, duration = 0.18, velocity) {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  const note = audioCtx.createOscillator();
  note.frequency.value = freq;
  note.volume = velocity;
  note.connect(bus);
  note.start();
  note.stop(audioCtx.currentTime + duration);
}

// Set MIDI instrument (program change)
function setMIDIInstrument(instrumentNumber) {
  if (midiReady && midiOut) {
    try {
      midiOut.program(0, instrumentNumber - 1); // MIDI program change (0-based)
      return true;
    } catch (error) {
      console.error('Failed to set MIDI instrument:', error);
      return false;
    }
  }
  return false;
}

// Play MIDI note using JZZ
function playMIDINote(midiNote, duration = 0.5, velocity = 50, channel = 0) {
  if (midiReady && midiOut) {
    // Note on
    midiOut.noteOn(channel, midiNote, velocity);
    // Note off after duration
    setTimeout(() => {
      if (midiOut) {
        midiOut.noteOff(channel, midiNote);
      }
    }, duration * 1000);
  } else {
    // Fallback to Web Audio API
    console.warn('MIDI not ready, using Web Audio fallback');
    const freq = midiToFreq(midiNote);
    playNote(freq, duration, velocity);
  }
}

// Set master volume
function setMasterVolume(volume) {
  if (masterGain) {
    masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }
}

// Get master volume
function getMasterVolume() {
  return masterGain ? masterGain.gain.value : 0;
}

// Check if MIDI is ready
function isMIDIReady() {
  return midiReady;
}

// Export functions for use in other modules
export {
  initMIDI,
  midiToFreq,
  playNote,
  playMIDINote,
  setMIDIInstrument,
  setMasterVolume,
  getMasterVolume,
  isMIDIReady
};
