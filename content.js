let audioContext;
let gainNode;
let compressor;
let analyser;
let eqBands = [];
const connectedElements = new WeakSet();

// Configuration
const MAX_GAIN = 6.0;

// 10-Band Equalizer Frequencies (Hz)
const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Audio Presets (gain values in dB for each band)
const AUDIO_PRESETS = {
    flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    bassBoost: [6, 5, 3, 1, 0, 0, -1, -1, 0, 0],
    vocalEnhance: [0, -2, -1, 1, 3, 3, 2, 0, -1, -1],
    clearSpeech: [-3, -3, -1, 1, 2, 4, 4, 3, 1, 0],
    trebleBoost: [0, 0, -1, -1, 0, 1, 3, 5, 5, 4],
    vShape: [4, 4, 2, -2, -3, -2, 1, 3, 4, 4],
    bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
    electronic: [4, 3, 0, -2, 2, 1, 1, 3, 4, 5]
};

let currentEqValues = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Current EQ settings
let currentPreset = 'flat';

function initAudioContext() {
    if (audioContext && audioContext.state !== 'closed') return;

    // Safe feature detection
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        console.error("Audio Enhancer: Web Audio API not supported in this browser.");
        return;
    }

    audioContext = new AudioContextClass();
    gainNode = audioContext.createGain();

    // Create 10-band equalizer
    eqBands = EQ_FREQUENCIES.map((freq, index) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.Q.value = 1.0; // Standard Q for graphic EQ
        filter.gain.value = 0; // Start flat
        return filter;
    });

    // Spectrum Analyzer
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;

    // Dynamics Compressor to prevent clipping
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    // Connect Chain: Gain -> EQ Bands -> Compressor -> Analyser -> Destination
    gainNode.connect(eqBands[0]);

    for (let i = 0; i < eqBands.length - 1; i++) {
        eqBands[i].connect(eqBands[i + 1]);
    }

    eqBands[eqBands.length - 1].connect(compressor);
    compressor.connect(analyser);
    analyser.connect(audioContext.destination);

    // Default 100% volume
    gainNode.gain.value = 1.0;

    console.log("Audio Enhancer: Initialized with 10-band EQ and spectrum analyzer");
}

function boostElement(media) {
    if (!media || connectedElements.has(media)) return;

    // Ensure we have a context
    initAudioContext();
    if (!audioContext) return;

    try {
        // Create source and connect to valid graph
        const source = audioContext.createMediaElementSource(media);
        source.connect(gainNode);
        connectedElements.add(media);
        console.log("Volume Booster: Connected to media element", media);
    } catch (e) {
        // This is expected if the element is already connected to another node graph 
        // or Cross-Origin issues (CORS)
        console.warn("Volume Booster: Connection error (possibly already connected):", e);
    }
}

function processPage() {
    const mediaElements = document.querySelectorAll('video, audio');
    if (mediaElements.length > 0) {
        // Initialize context only if media exists
        initAudioContext();
        mediaElements.forEach(boostElement);
    }
}

function updateGain(valuePercent) {
    if (!gainNode || !audioContext) initAudioContext();
    if (!gainNode) return;

    // Clamp value
    let target = valuePercent / 100;
    if (target > MAX_GAIN) target = MAX_GAIN;
    if (target < 0) target = 0;

    // Apply smooth transition
    gainNode.gain.setTargetAtTime(target, audioContext.currentTime, 0.1);

    // Resume if suspended (common in Brave/Chrome to conserve power)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
}

// Update EQ band (index 0-9, gain in dB -12 to +12)
function updateEqBand(index, gainDb) {
    if (!eqBands[index] || !audioContext) return;

    // Clamp gain
    let clampedGain = Math.max(-12, Math.min(12, gainDb));
    currentEqValues[index] = clampedGain;

    // Apply smooth transition
    eqBands[index].gain.setTargetAtTime(clampedGain, audioContext.currentTime, 0.05);

    console.log(`EQ Band ${EQ_FREQUENCIES[index]}Hz set to ${clampedGain}dB`);
}

// Apply EQ preset
function applyEqPreset(presetName) {
    if (!AUDIO_PRESETS[presetName]) {
        console.warn(`Unknown preset: ${presetName}`);
        return;
    }

    const presetValues = AUDIO_PRESETS[presetName];
    currentPreset = presetName;

    presetValues.forEach((gainDb, index) => {
        updateEqBand(index, gainDb);
    });

    console.log(`Applied EQ preset: ${presetName}`);
}

// Apply custom EQ values
function applyCustomEq(eqValues) {
    if (!Array.isArray(eqValues) || eqValues.length !== 10) {
        console.warn('Invalid EQ values array');
        return;
    }

    currentPreset = 'custom';
    eqValues.forEach((gainDb, index) => {
        updateEqBand(index, gainDb);
    });
}

// Reset EQ to flat
function resetEq() {
    applyEqPreset('flat');
}

// Get spectrum data for visualization
function getSpectrumData() {
    if (!analyser) return null;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);

    return dataArray;
}

// -----------------------------------------------------
// Observers & Listeners
// -----------------------------------------------------

// Watch for new media elements dynamically added (YouTube, SPAs)
const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
            // Check if any added node is media or contains media
            for (const node of mutation.addedNodes) {
                if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
                    shouldProcess = true;
                    break;
                }
                if (node.querySelectorAll && node.querySelectorAll('video, audio').length > 0) {
                    shouldProcess = true;
                    break;
                }
            }
        }
    }
    if (shouldProcess) processPage();
});

// Start observing as soon as possible
if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
    processPage();
} else {
    document.addEventListener('DOMContentLoaded', () => {
        observer.observe(document.body, { childList: true, subtree: true });
        processPage();
    });
}

// Listen for messages from Popup or Background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setVolume") {
        updateGain(request.value);
    }
    else if (request.action === "setEqBand") {
        // Update individual EQ band
        updateEqBand(request.index, request.gain);
    }
    else if (request.action === "applyPreset") {
        // Apply audio preset
        applyEqPreset(request.preset);
    }
    else if (request.action === "setCustomEq") {
        // Apply custom EQ values
        applyCustomEq(request.values);
    }
    else if (request.action === "resetEq") {
        // Reset EQ to flat
        resetEq();
    }
    else if (request.action === "getSpectrumData") {
        // Return spectrum data for visualization
        const data = getSpectrumData();
        sendResponse({ spectrumData: data ? Array.from(data) : null });
        return true; // Keep channel open for async response
    }
    else if (request.action === "getEqState") {
        // Return current EQ state
        sendResponse({
            eqValues: currentEqValues,
            preset: currentPreset,
            frequencies: EQ_FREQUENCIES
        });
        return true;
    }
    else if (request.action === "shortcut") {
        // Handle keyboard shortcuts
        if (!gainNode) return;

        let currentVal = gainNode.gain.value * 100;
        let newVal = currentVal;

        if (request.command === "volume-up") {
            newVal = Math.min(currentVal + 10, 600);
        } else if (request.command === "volume-down") {
            newVal = Math.max(currentVal - 10, 0);
        } else if (request.command === "volume-reset") {
            newVal = 100;
        }

        updateGain(newVal);
        console.log(`Shortcut: Volume set to ${newVal}%`);
    }
});
