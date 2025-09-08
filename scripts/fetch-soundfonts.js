#!/usr/bin/env node
// Dynamic SoundFont prefetcher: scans project MIDI files to determine the minimal instrument set.
// Usage: node scripts/fetch-soundfonts.js [--all] [--midiDir=src/assets/midi]

const fs = require('fs');
const path = require('path');
const https = require('https');

// Program -> instrument name mapping (subset sufficient for ambient usage)
const GM_MAP = {
  0:'acoustic_grand_piano',1:'bright_acoustic_piano',2:'electric_grand_piano',3:'honkytonk_piano',4:'electric_piano_1',5:'electric_piano_2',6:'harpsichord',7:'clavinet',
  24:'acoustic_guitar_nylon',25:'acoustic_guitar_steel',32:'acoustic_bass',33:'electric_bass_finger',34:'electric_bass_pick',40:'violin',41:'viola',42:'cello',48:'string_ensemble_1',49:'string_ensemble_2',50:'synth_strings_1',52:'choir_aahs',53:'voice_oohs',56:'trumpet',57:'trombone',60:'french_horn',64:'soprano_sax',65:'alto_sax',66:'tenor_sax',68:'oboe',69:'english_horn',70:'bassoon',71:'clarinet',72:'piccolo',73:'flute',80:'lead_1_square',81:'lead_2_sawtooth',88:'pad_1_new_age',89:'pad_2_warm',90:'pad_3_polysynth',91:'pad_4_choir',92:'pad_5_bowed',93:'pad_6_metallic',94:'pad_7_halo',95:'pad_8_sweep',118:'synth_drum'
};

const ALWAYS_INCLUDE = new Set(['acoustic_grand_piano']); // base fallback
const DRUM_CHANNEL = 9; // channel 10
const CDN_BASE = 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts/FluidR3_GM';
const OUT_DIR = path.join(process.cwd(), 'public', 'soundfonts');
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

function parseArgs(){
  const args = process.argv.slice(2);
  const opts = { all:false, midiDir:'src/assets/midi' };
  for (const a of args){
    if (a === '--all') opts.all = true;
    else if (a.startsWith('--midiDir=')) opts.midiDir = a.split('=')[1];
  }
  return opts;
}

async function collectInstruments(midiDir){
  const files = walk(midiDir).filter(f => f.toLowerCase().endsWith('.mid'));
  if (files.length === 0) return new Set(ALWAYS_INCLUDE);
  let midiMod;
  try {
    // Prefer require for simpler CJS interop if available
    // eslint-disable-next-line import/no-dynamic-require
    midiMod = require('@tonejs/midi');
  } catch {
    midiMod = await import('@tonejs/midi');
  }
  const Midi = (midiMod && midiMod.Midi)
    || (midiMod && midiMod.default && midiMod.default.Midi)
    || (midiMod && midiMod.default)
    || midiMod;
  if (typeof Midi !== 'function') {
    const keys = midiMod ? Object.keys(midiMod) : [];
    if (DEBUG) console.error('Could not resolve Midi constructor from @tonejs/midi export shape:', keys);
    return new Set(ALWAYS_INCLUDE);
  }
  const programs = new Set();
  let drumUsed = false;
  for (const f of files){
    try {
      const data = fs.readFileSync(f);
      const midi = new Midi(data);
      midi.tracks.forEach(t => {
        if (t.channel === DRUM_CHANNEL && t.notes.length) drumUsed = true;
        const prog = (t.instrument && typeof t.instrument.number === 'number') ? t.instrument.number : 0;
        programs.add(prog);
      });
    } catch (e){
      if (DEBUG) console.warn('Warn: failed to parse', f, e.message);
    }
  }
  const names = new Set([...programs].map(p => GM_MAP[p] || 'acoustic_grand_piano'));
  ALWAYS_INCLUDE.forEach(n => names.add(n));
  if (drumUsed) names.add('synth_drum');
  return names;
}

function walk(dir){
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const entry of fs.readdirSync(dir)){
    const full = path.join(dir, entry);
    const st = fs.statSync(full);
    if (st.isDirectory()) out.push(...walk(full)); else out.push(full);
  }
  return out;
}

function download(name){
  return new Promise((resolve, reject) => {
    const url = `${CDN_BASE}/${name}-ogg.js`;
    const dest = path.join(OUT_DIR, `${name}-ogg.js`);
    if (fs.existsSync(dest)) return resolve();
    https.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error('HTTP ' + res.statusCode + ' ' + url));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', reject);
  });
}

async function main(){
  const opts = parseArgs();
  let names;
  if (opts.all){
    // union of GM_MAP + fallback base + synth_drum
    names = new Set(Object.values(GM_MAP));
    names.add('synth_drum');
    ALWAYS_INCLUDE.forEach(n => names.add(n));
  } else {
    names = await collectInstruments(opts.midiDir);
  }
  const sorted = [...names].sort();
  if (DEBUG) console.log(`Instruments to fetch (${sorted.length}):`, sorted.join(', '));
  let ok = 0, fail = 0;
  for (const n of sorted){
    try {
      process.stdout.write(`Fetching ${n}...`);
      await download(n);
      ok++;
      process.stdout.write(' ok\n');
    } catch (e){
      fail++;
      process.stdout.write(` fail (${e.message})\n`);
    }
  }
  if (DEBUG) console.log(`Done. Success ${ok}, Failed ${fail}`);
  // Write manifest
  const manifestPath = path.join(OUT_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({ generated: new Date().toISOString(), count: sorted.length, instruments: sorted }, null, 2));
  if (DEBUG) console.log('Manifest written to', manifestPath);
}

main().catch(e => { if (DEBUG) console.error(e); process.exit(1); });
