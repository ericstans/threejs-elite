let midiOut = null;

window.addEventListener('DOMContentLoaded', () => {
	if (window.JZZ && window.JZZ.synth && !midiOut) {
		midiOut = JZZ().openMidiOut().or(() => { midiReady = false; });
		if (midiOut) {
			midiReady = true;
			// Use the built-in software synth
			JZZ.synth.Tiny.register('WebAudioTinySynth');
			midiOut = JZZ().openMidiOut('WebAudioTinySynth');
		}
	}
});

function midiToFreq(midi) {
	return 440 * Math.pow(2, (midi - 69) / 12);
}

function playNote(freq, duration = 0.18, colors = [NOTE_COLORS[0]]) {
	if (!audioCtx) {
		audioCtx = new (window.AudioContext || window.webkitAudioContext)();
	}
	if (!bus) {
		bus = audioCtx.createGain();
		sequencerCompressor = audioCtx.createDynamicsCompressor();
		masterGain = audioCtx.createGain();
		sequencerCompressor.threshold.value = -12;
		sequencerCompressor.ratio.value = 12;
		sequencerCompressor.attack.value = 0.003;
		sequencerCompressor.release.value = 0.25;
		sequencerBus.connect(sequencerCompressor).connect(masterGain).connect(audioCtx.destination);
		// Set initial master volume from slider if present
		const volSlider = document.getElementById('master-volume');
		if (volSlider) masterGain.gain.value = parseFloat(volSlider.value);
	}

	const note = audioCtx.createOscillator();
	note.frequency.value = freq;
	note.connect(bus);
	note.start();
	note.stop(audioCtx.currentTime + duration);
}