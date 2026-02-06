let audioContext;
let gainNode;
const connectedElements = new WeakSet();

function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        gainNode = audioContext.createGain();

        // Add compressor to prevent clipping/distortion
        const compressor = audioContext.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
        compressor.knee.setValueAtTime(40, audioContext.currentTime);
        compressor.ratio.setValueAtTime(12, audioContext.currentTime);
        compressor.attack.setValueAtTime(0, audioContext.currentTime);
        compressor.release.setValueAtTime(0.25, audioContext.currentTime);

        // Chain: Source -> Gain -> Compressor -> Destination
        gainNode.connect(compressor);
        compressor.connect(audioContext.destination);

        gainNode.gain.value = 1; // Default 100%
    }
}

function boostElement(media) {
    if (connectedElements.has(media)) return;

    try {
        // We must be careful: createMediaElementSource can throw if already connected
        const source = audioContext.createMediaElementSource(media);
        source.connect(gainNode);
        connectedElements.add(media);
        console.log("Volume Booster: Connected to media element", media);
    } catch (e) {
        console.warn("Volume Booster: Could not connect to media element. It might already be connected to an AudioContext.", e);
    }
}

function processPage() {
    initAudioContext();
    const mediaElements = document.querySelectorAll('video, audio');
    mediaElements.forEach(boostElement);
}

// Observe for new media elements
const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    for (const mutation of mutations) {
        if (mutation.addedNodes.length) {
            shouldProcess = true;
            break;
        }
    }
    if (shouldProcess) processPage();
});

// Start observing
observer.observe(document.body, { childList: true, subtree: true });

// Initial process
processPage();

// Listen for messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "setVolume") {
        if (!audioContext) initAudioContext();

        // Convert integer 100-600 to float 1.0-6.0
        const gainValue = request.value / 100;

        // Smooth transition
        gainNode.gain.setTargetAtTime(gainValue, audioContext.currentTime, 0.1);

        console.log(`Volume Booster: Set gain to ${gainValue}`);

        // Ensure context is running (browsers might suspend it)
        if (audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }
});
