// New MusicManager implementation using soundfont-player + @tonejs/midi
// No direct MIDI device or JZZ usage; all rendering via WebAudio + soundfonts.

// We'll dynamically import soundfont-player to avoid ESM/CJS interop issues.
let _soundfontModulePromise = null;
let _soundfontInstance = null; // instance bound to current AudioContext
// Local/remote resolution
const CDN_SF_BASE = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts/FluidR3_GM';
let _localSoundfontNames = null; // Set of locally available instrument names (from manifest)
async function _loadLocalManifestOnce(){
  if (_localSoundfontNames !== null) return _localSoundfontNames;
  try {
    const res = await fetch('/soundfonts/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const json = await res.json();
      if (Array.isArray(json.instruments)) {
        _localSoundfontNames = new Set(json.instruments.map(n => n.toLowerCase()));
        return _localSoundfontNames;
      }
    }
  } catch (_) { /* ignore */ }
  _localSoundfontNames = new Set();
  return _localSoundfontNames;
}

function _localInstrumentUrl(name){
  return `/soundfonts/${name}-ogg.js`;
}
function _cdnInstrumentUrl(name){
  return `${CDN_SF_BASE}/${name}-ogg.js`;
}

async function _resolveInstrumentUrl(name){
  const manifest = await _loadLocalManifestOnce();
  const lower = name.toLowerCase();
  if (manifest.has(lower)) return _localInstrumentUrl(lower);
  return _cdnInstrumentUrl(lower);
}

// Synchronous fallback resolver used by soundfont-player; it can't await, so we optimistically point to local if we THINK it's there, else CDN.
// We refine our guess based on manifest (loaded earlier in getSoundfont).
function _instrumentUrl(name){
  if (_localSoundfontNames && _localSoundfontNames.has(name.toLowerCase())) return _localInstrumentUrl(name.toLowerCase());
  return _cdnInstrumentUrl(name.toLowerCase());
}

// Known instrument filenames present in FluidR3_GM (subset + common). Any not in this set will be remapped.
const AVAILABLE_INSTRUMENTS = new Set([
  'acoustic_grand_piano','bright_acoustic_piano','electric_grand_piano','honkytonk_piano','electric_piano_1','electric_piano_2','harpsichord','clavinet',
  'celesta','glockenspiel','music_box','vibraphone','marimba','xylophone','tubular_bells','dulcimer','drawbar_organ','percussive_organ','rock_organ',
  'church_organ','reed_organ','accordion','harmonica','acoustic_guitar_nylon','acoustic_guitar_steel','electric_guitar_jazz','electric_guitar_clean',
  'electric_guitar_muted','overdriven_guitar','distortion_guitar','guitar_harmonics','acoustic_bass','electric_bass_finger','electric_bass_pick',
  'fretless_bass','slap_bass_1','slap_bass_2','synth_bass_1','synth_bass_2','violin','viola','cello','contrabass','tremolo_strings','pizzicato_strings',
  'orchestral_harp','timpani','string_ensemble_1','string_ensemble_2','synth_strings_1','synth_strings_2','choir_aahs','voice_oohs','synth_choir',
  'orchestra_hit','trumpet','trombone','tuba','muted_trumpet','french_horn','brass_section','synth_brass_1','synth_brass_2','soprano_sax','alto_sax',
  'tenor_sax','baritone_sax','oboe','english_horn','bassoon','clarinet','piccolo','flute','recorder','pan_flute','blown_bottle','shakuhachi','whistle',
  'ocarina','lead_1_square','lead_2_sawtooth','lead_3_calliope','lead_4_chiff','lead_5_charang','lead_6_voice','lead_7_fifths','lead_8_bass_lead',
  'pad_1_new_age','pad_2_warm','pad_3_polysynth','pad_4_choir','pad_5_bowed','pad_6_metallic','pad_7_halo','pad_8_sweep','fx_1_rain','fx_2_soundtrack',
  'fx_3_crystal','fx_4_atmosphere','fx_5_brightness','fx_6_goblins','fx_7_echoes','fx_8_sci-fi','sitar','banjo','shamisen','koto','kalimba','bagpipe',
  'fiddle','shanai','tinkle_bell','agogo','steel_drums','woodblock','taiko_drum','melodic_tom','synth_drum','reverse_cymbal','seashore','bird_tweet'
]);

// Map uncommon / alias names to available names
const INSTRUMENT_ALIASES = {
  'string_ensemble': 'string_ensemble_1',
  'piano': 'acoustic_grand_piano',
  'percussion': 'synth_drum'
};

function sanitizeInstrumentName(name){
  if (!name) return 'acoustic_grand_piano';
  const lower = name.toLowerCase();
  const mapped = INSTRUMENT_ALIASES[lower];
  if (mapped) return mapped;
  return AVAILABLE_INSTRUMENTS.has(lower) ? lower : 'acoustic_grand_piano';
}

async function getSoundfont(ctx) {
  if (!_soundfontModulePromise) {
    _soundfontModulePromise = import('soundfont-player').then(mod => mod.default || mod);
  }
  const SoundfontCtor = await _soundfontModulePromise;
  if (!_soundfontInstance || _soundfontInstance.ctx !== ctx) {
    _soundfontInstance = SoundfontCtor(ctx);
    // Override global nameToUrl resolver for this instance plus constructor (so further calls reuse it)
    _soundfontInstance.nameToUrl = _instrumentUrl;
    if (SoundfontCtor) SoundfontCtor.nameToUrl = _instrumentUrl;
  // Preload manifest so resolver picks local vs CDN correctly
  await _loadLocalManifestOnce();
  }
  return _soundfontInstance;
}
import { Midi } from '@tonejs/midi';

// Ambient MIDI assets (already bundled by Vite)
import ambient1 from './assets/midi/ambient/ambient1.mid';
import ambient2 from './assets/midi/ambient/ambient2.mid';
import ambient3 from './assets/midi/ambient/ambient3.mid';
import ambient4 from './assets/midi/ambient/ambient4.mid';
import ambient5 from './assets/midi/ambient/ambient5.mid';


const ambientMidiFiles = [ambient1, ambient2, ambient3, ambient4, ambient5];

// Utility: clamp
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

// Mapping of General MIDI program numbers (0-127) -> soundfont instruments names expected by soundfont-player.
// soundfont-player uses instrument names (e.g. 'acoustic_grand_piano'). We'll keep a small map; extend as needed.
// Fallback will be 'acoustic_grand_piano'.
// Complete General MIDI Level 1 instrument map (0-127) to soundfont-player names.
const GM_PROGRAM_MAP = {
  0: 'acoustic_grand_piano',
  1: 'bright_acoustic_piano',
  2: 'electric_grand_piano',
  3: 'honkytonk_piano',
  4: 'electric_piano_1',
  5: 'electric_piano_2',
  6: 'harpsichord',
  7: 'clavinet',
  8: 'celesta',
  9: 'glockenspiel',
  10: 'music_box',
  11: 'vibraphone',
  12: 'marimba',
  13: 'xylophone',
  14: 'tubular_bells',
  15: 'dulcimer',
  16: 'drawbar_organ',
  17: 'percussive_organ',
  18: 'rock_organ',
  19: 'church_organ',
  20: 'reed_organ',
  21: 'accordion',
  22: 'harmonica',
  23: 'tango_accordion',
  24: 'acoustic_guitar_nylon',
  25: 'acoustic_guitar_steel',
  26: 'electric_guitar_jazz',
  27: 'electric_guitar_clean',
  28: 'electric_guitar_muted',
  29: 'overdriven_guitar',
  30: 'distortion_guitar',
  31: 'guitar_harmonics',
  32: 'acoustic_bass',
  33: 'electric_bass_finger',
  34: 'electric_bass_pick',
  35: 'fretless_bass',
  36: 'slap_bass_1',
  37: 'slap_bass_2',
  38: 'synth_bass_1',
  39: 'synth_bass_2',
  40: 'violin',
  41: 'viola',
  42: 'cello',
  43: 'contrabass',
  44: 'tremolo_strings',
  45: 'pizzicato_strings',
  46: 'orchestral_harp',
  47: 'timpani',
  48: 'string_ensemble_1',
  49: 'string_ensemble_2',
  50: 'synth_strings_1',
  51: 'synth_strings_2',
  52: 'choir_aahs',
  53: 'voice_oohs',
  54: 'synth_choir',
  55: 'orchestra_hit',
  56: 'trumpet',
  57: 'trombone',
  58: 'tuba',
  59: 'muted_trumpet',
  60: 'french_horn',
  61: 'brass_section',
  62: 'synth_brass_1',
  63: 'synth_brass_2',
  64: 'soprano_sax',
  65: 'alto_sax',
  66: 'tenor_sax',
  67: 'baritone_sax',
  68: 'oboe',
  69: 'english_horn',
  70: 'bassoon',
  71: 'clarinet',
  72: 'piccolo',
  73: 'flute',
  74: 'recorder',
  75: 'pan_flute',
  76: 'blown_bottle',
  77: 'shakuhachi',
  78: 'whistle',
  79: 'ocarina',
  80: 'lead_1_square',
  81: 'lead_2_sawtooth',
  82: 'lead_3_calliope',
  83: 'lead_4_chiff',
  84: 'lead_5_charang',
  85: 'lead_6_voice',
  86: 'lead_7_fifths',
  87: 'lead_8_bass_lead',
  88: 'pad_1_new_age',
  89: 'pad_2_warm',
  90: 'pad_3_polysynth',
  91: 'pad_4_choir',
  92: 'pad_5_bowed',
  93: 'pad_6_metallic',
  94: 'pad_7_halo',
  95: 'pad_8_sweep',
  96: 'fx_1_rain',
  97: 'fx_2_soundtrack',
  98: 'fx_3_crystal',
  99: 'fx_4_atmosphere',
  100: 'fx_5_brightness',
  101: 'fx_6_goblins',
  102: 'fx_7_echoes',
  103: 'fx_8_sci-fi',
  104: 'sitar',
  105: 'banjo',
  106: 'shamisen',
  107: 'koto',
  108: 'kalimba',
  109: 'bagpipe',
  110: 'fiddle',
  111: 'shanai',
  112: 'tinkle_bell',
  113: 'agogo',
  114: 'steel_drums',
  115: 'woodblock',
  116: 'taiko_drum',
  117: 'melodic_tom',
  118: 'synth_drum',
  119: 'reverse_cymbal',
  120: 'guitar_fret_noise',
  121: 'breath_noise',
  122: 'seashore',
  123: 'bird_tweet',
  124: 'telephone_ring',
  125: 'helicopter',
  126: 'applause',
  127: 'gunshot'
};

// Drum channel (10) uses percussive kit; we map notes -> names handled by soundfont-player's percussion bank via 'percussion'.
const DRUM_CHANNEL = 9; // zero-based channel 9 is MIDI ch 10.

// Attempt to resolve an instrument name from a program number.
function programToInstrument(programNumber) {
  return GM_PROGRAM_MAP[programNumber] || 'acoustic_grand_piano';
}

// Convert MIDI note number to frequency helper (soundfont-player accepts note names or MIDI numbers directly).

export class MusicManager {
  constructor() {
    this.isInitialized = false;
    this.volume = 0.5; // master gain (0-1)
    this.currentTrack = null;
    this.isPlaying = false;
    this._audioCtx = null;
    this._masterGain = null;
    this._activeNotes = new Set();
    this._currentPlayback = null; // { stop: fn, timeoutIds: [] }
    this._ambientQueue = null; // currently playing ambient midi info
    this._scheduledNextTimeout = null;
    this._instrumentsCache = new Map(); // key: instrumentName -> soundfont-player Instrument
  this._instrumentLoading = new Map(); // in-flight loads
  // Effects chain
  this._effectsInput = null;     // entry point for all instruments
  this._dryGain = null;          // dry branch
  this._wetGain = null;          // wet (reverb) branch
  this._reverbConvolver = null;  // convolver node
  this.reverbMix = 0.3;          // 0..1
  this._reverbEnabled = true;
  }

  async init() {
    if (this.isInitialized) return;
    // Create AudioContext lazily (user interaction must have happened already via Controls.startMusic)
    this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this._masterGain = this._audioCtx.createGain();
    this._masterGain.gain.value = this.volume;
    // Build effects chain: instruments -> effectsInput -> (dry + convolver->wet) -> master -> destination
    this._effectsInput = this._audioCtx.createGain();
    this._dryGain = this._audioCtx.createGain();
    this._wetGain = this._audioCtx.createGain();
    this._reverbConvolver = this._audioCtx.createConvolver();
    try {
      this._reverbConvolver.buffer = this._createImpulseResponse(this._audioCtx, 2.5, 2.0);
    } catch (e) {
      console.warn('MusicManager: failed to create impulse response', e);
    }
    this._applyReverbMix();
    // Wire up
    this._effectsInput.connect(this._dryGain);
    this._effectsInput.connect(this._reverbConvolver);
    this._reverbConvolver.connect(this._wetGain);
    this._dryGain.connect(this._masterGain);
    this._wetGain.connect(this._masterGain);
    this._masterGain.connect(this._audioCtx.destination);
    this.isInitialized = true;
  }

  // Volume handling
  setVolume(v) {
    this.volume = clamp(v, 0, 1);
    if (this._masterGain) this._masterGain.gain.value = this.volume;
  }
  getVolume() { return this.volume; }
  isTrackPlaying() { return this.isPlaying; }

  // Playback API (compatible with existing usage)
  playTrack(name) {
    if (!this.isInitialized) return;
    if (name === 'ambient') {
      this.stopTrack();
      this.currentTrack = 'ambient';
      this.isPlaying = true;
      this._playRandomAmbientMidi();
    } else {
      console.warn('MusicManager: Only ambient MIDI playback implemented in new soundfont version. Requested:', name);
    }
  }

  stopTrack() {
    this.isPlaying = false;
    this.currentTrack = null;
    this._cancelCurrentPlayback();
    if (this._scheduledNextTimeout) {
      clearTimeout(this._scheduledNextTimeout);
      this._scheduledNextTimeout = null;
    }
  }

  pauseTrack() { // simple pause by suspending context
    if (this._audioCtx && this.isPlaying) {
      this._audioCtx.suspend();
      this.isPlaying = false;
    }
  }
  resumeTrack() {
    if (this._audioCtx && !this.isPlaying && this.currentTrack === 'ambient') {
      this._audioCtx.resume();
      this.isPlaying = true;
    }
  }

  fadeIn(duration = 2000) {
    if (!this._masterGain) return;
    const now = this._audioCtx.currentTime;
    this._masterGain.gain.cancelScheduledValues(now);
    this._masterGain.gain.setValueAtTime(0, now);
    this._masterGain.gain.linearRampToValueAtTime(this.volume, now + duration / 1000);
  }
  fadeOut(duration = 2000) {
    if (!this._masterGain) return;
    const now = this._audioCtx.currentTime;
    const current = this._masterGain.gain.value;
    this._masterGain.gain.cancelScheduledValues(now);
    this._masterGain.gain.setValueAtTime(current, now);
    this._masterGain.gain.linearRampToValueAtTime(0, now + duration / 1000);
    setTimeout(() => this.stopTrack(), duration + 100);
  }

  crossfadeToTrack(name, duration = 1000) {
    if (name === 'ambient' && this.currentTrack !== 'ambient') {
      this.fadeOut(duration / 2);
      setTimeout(() => {
        this.playTrack('ambient');
        this.fadeIn(duration / 2);
      }, duration / 2);
    } else {
      this.playTrack(name); // fallback
    }
  }

  update(gameState) {
    if (!gameState) return;
    // Only ambient available now; keep logic simple.
    if (!gameState.inCombat && !gameState.isDocking && this.currentTrack !== 'ambient') {
      this.crossfadeToTrack('ambient', 1000);
    }
  }

  dispose() { this.stopTrack(); this.isInitialized = false; }

  // --- Reverb / Effects -------------------------------------------------
  _createImpulseResponse(ctx, duration = 2, decay = 2) {
    const rate = ctx.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const impulse = ctx.createBuffer(2, length, rate);
    for (let ch = 0; ch < 2; ch++) {
      const channel = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        const n = i / length;
        // Exponential-ish decay noise
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - n, decay);
      }
    }
    return impulse;
  }

  _applyReverbMix() {
    if (!this._dryGain || !this._wetGain) return;
    const mix = this._reverbEnabled ? this.reverbMix : 0;
    this._dryGain.gain.value = 1 - mix;
    this._wetGain.gain.value = mix;
  }

  setReverbMix(mix) {
    this.reverbMix = Math.min(1, Math.max(0, mix));
    this._applyReverbMix();
  }

  setReverbEnabled(enabled) {
    this._reverbEnabled = !!enabled;
    this._applyReverbMix();
  }

  _attachInstrumentToEffects(inst) {
    if (!inst || !this._effectsInput) return;
    try {
      if (typeof inst.connect === 'function') {
        inst.connect(this._effectsInput); // soundfont-player API
      } else if (inst.output && typeof inst.output.connect === 'function') {
        inst.output.connect(this._effectsInput);
      }
    } catch (e) {
      console.warn('MusicManager: failed to attach instrument to effects chain', e);
    }
  }

  // Internal: cancel scheduled notes/timeouts
  _cancelCurrentPlayback() {
    if (this._currentPlayback) {
      this._currentPlayback.stop();
      this._currentPlayback.timeoutIds.forEach(id => clearTimeout(id));
      this._currentPlayback = null;
    }
    this._activeNotes.forEach(stopFn => { try { stopFn(); } catch (_) {} });
    this._activeNotes.clear();
  }

  async _playRandomAmbientMidi() {
    if (!this.isPlaying || this.currentTrack !== 'ambient') return;
    const src = ambientMidiFiles[Math.floor(Math.random() * ambientMidiFiles.length)];
    try {
      const resp = await fetch(src);
      const arrayBuf = await resp.arrayBuffer();
      const midi = new Midi(arrayBuf); // parsed via @tonejs/midi
      // Schedule playback
      this._cancelCurrentPlayback();
      const startTime = this._audioCtx.currentTime + 0.05; // small offset
      const timeoutIds = [];

      const instruments = {};
      const baseProgram = 0;
      const uniquePrograms = new Set([baseProgram]);
      midi.tracks.forEach(t => {
        const prog = (t.instrument && typeof t.instrument.number === 'number') ? t.instrument.number : baseProgram;
        // Skip programs outside 0-127 just in case
        if (prog >= 0 && prog <= 127) uniquePrograms.add(prog);
      });

      const waitOnReady = (inst) => new Promise(res => {
        // If instrument already has sample buffers loaded, its play function name is 'buffersPlayer'
        if (typeof inst.play === 'function' && inst.play.name === 'buffersPlayer') return res(inst);
        if (typeof inst.onready === 'function') inst.onready(() => res(inst)); else res(inst);
      });

      const loadProgramInstrument = async (programNum) => {
  const name = sanitizeInstrumentName(programToInstrument(programNum));
        if (this._instrumentsCache.has(name)) {
          instruments[programNum] = this._instrumentsCache.get(name);
          return;
        }
        if (this._instrumentLoading.has(name)) {
          await this._instrumentLoading.get(name);
          instruments[programNum] = this._instrumentsCache.get(name);
          return;
        }
        const loadPromise = (async () => {
            let inst;
            try {
              const SF = await getSoundfont(this._audioCtx);
              inst = SF.instrument(name, { gain: 1 });
              // Pre-flight URL existence check (HEAD) to reduce onload errors
              try {
                // Light existence check only if manifest claims local; otherwise rely on CDN
                if (_localSoundfontNames && _localSoundfontNames.has(name)) {
                  const url = _instrumentUrl(name);
                  const head = await fetch(url, { method: 'HEAD' });
                  if (!head.ok) throw new Error('Instrument file missing locally: '+url+' status:'+head.status);
                }
              } catch (preErr) {
                console.warn('MusicManager: instrument file missing, fallback chain', name, preErr);
                inst = null; // force fallback execution
              }
              await waitOnReady(inst);
        this._attachInstrumentToEffects(inst);
            } catch (primaryErr) {
              console.warn('MusicManager: primary instrument load failed, attempting fallback', name, primaryErr);
              const fallbackNames = ['string_ensemble_1', 'acoustic_grand_piano'];
              for (const fb of fallbackNames) {
                try {
                  const SF2 = await getSoundfont(this._audioCtx);
                  inst = SF2.instrument(fb, { gain: 1 });
                  await waitOnReady(inst);
          this._attachInstrumentToEffects(inst);
                  break;
                } catch (_) { /* continue */ }
              }
            }
            if (inst) this._instrumentsCache.set(name, inst);
            if (!inst) {
              // final fallback to cached piano
              inst = this._instrumentsCache.get('acoustic_grand_piano');
              if (!inst) {
                const SF3 = await getSoundfont(this._audioCtx);
                inst = SF3.instrument('acoustic_grand_piano', { gain: 0.8 });
                await waitOnReady(inst);
                this._instrumentsCache.set('acoustic_grand_piano', inst);
              }
        this._attachInstrumentToEffects(inst);
            }
        })().finally(() => this._instrumentLoading.delete(name));
        this._instrumentLoading.set(name, loadPromise);
        await loadPromise;
        instruments[programNum] = this._instrumentsCache.get(name) || this._instrumentsCache.get('acoustic_grand_piano');
      };

      for (const p of uniquePrograms) { // sequential to control load order
        // eslint-disable-next-line no-await-in-loop
        await loadProgramInstrument(p);
      }

      // For drum channel we load a percussion kit instrument (soundfont may map 'percussion'). Use acoustic_grand_piano fallback if unavailable.
    if (!this._instrumentsCache.has('percussion')) {
        try {
          const SF = await getSoundfont(this._audioCtx);
      const drumInst = SF.instrument('synth_drum', { gain: 0.9 });
          await waitOnReady(drumInst);
      this._instrumentsCache.set('percussion', drumInst);
      this._attachInstrumentToEffects(drumInst);
        } catch (e) {
          console.warn('MusicManager: percussion kit not found; falling back');
          const synthDrumName = programToInstrument(118);
          if (!this._instrumentsCache.has(synthDrumName)) {
            try {
              const SF2 = await getSoundfont(this._audioCtx);
              const synthDrumInst = SF2.instrument(synthDrumName, { gain: 0.9 });
              await waitOnReady(synthDrumInst);
              this._instrumentsCache.set(synthDrumName, synthDrumInst);
        this._attachInstrumentToEffects(synthDrumInst);
            } catch {}
          }
          this._instrumentsCache.set('percussion', this._instrumentsCache.get(synthDrumName) || this._instrumentsCache.get('acoustic_grand_piano'));
        }
      }

      // --- High precision scheduling (no per-note setTimeout jitter) ---
      const scheduledNodes = [];
      const scheduleAheadSafety = 0.01; // seconds; skip notes already too far in the past
      midi.tracks.forEach(track => {
        const isDrum = track.channel === DRUM_CHANNEL;
        const program = (track.instrument && typeof track.instrument.number === 'number') ? track.instrument.number : 0;
        const inst = isDrum ? this._instrumentsCache.get('percussion') : instruments[program];
        if (!inst) return;
        track.notes.forEach(note => {
          const noteStart = startTime + note.time; // absolute AudioContext time
          const noteDuration = note.duration || 0.3;
          // If the note would start in the past by more than a tiny safety window, skip it.
          if (noteStart < this._audioCtx.currentTime - scheduleAheadSafety) return;
          try {
            const velocityGain = Math.min(1, (note.velocity || 0.5) * 0.9);
            // Schedule directly at noteStart; provide duration so it auto stops without extra timers.
            const node = inst.play(note.midi, noteStart, { gain: velocityGain, duration: noteDuration });
            if (node && typeof node.stop === 'function') {
              scheduledNodes.push(node);
            }
          } catch (err) {
            console.warn('MusicManager: note schedule failed', err);
          }
        });
      });

      const totalDuration = midi.duration; // seconds
      // Schedule next ambient after 1s gap
      const nextId = setTimeout(() => {
        if (this.isPlaying && this.currentTrack === 'ambient') {
          this._playRandomAmbientMidi();
        }
      }, (totalDuration * 1000) + 1000);
      this._scheduledNextTimeout = nextId;
      this._currentPlayback = {
        stop: () => {
          scheduledNodes.forEach(n => { try { n.stop(); } catch(_){} });
        },
        timeoutIds
      };
    } catch (err) {
      console.error('MusicManager: Failed to play ambient MIDI via soundfont-player', err);
      // Try another file after short delay
      setTimeout(() => {
        if (this.isPlaying && this.currentTrack === 'ambient') this._playRandomAmbientMidi();
      }, 1000);
    }
  }
}
