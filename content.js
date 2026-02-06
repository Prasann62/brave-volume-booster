let audioContext;
let gainNode;
let compressor;
const connectedElements = new WeakSet();

// Configuration
const MAX_GAIN = 6.0;

function initAudioContext() {
    if (audioContext && audioContext.state !== 'closed') return;

    // Safe feature detection
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) {
        console.error("Volume Booster: Web Audio API not supported in this browser.");
        return;
    }

    audioContext = new AudioContextClass();
    gainNode = audioContext.createGain();

    // Dynamics Compressor to prevent clipping
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);

    // Connect Chain: Gain -> Compressor -> Destination
    gainNode.connect(compressor);
    compressor.connect(audioContext.destination);

    // Default 100%
    gainNode.gain.value = 1.0;
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

    // Resume if suspended (common in Brave/Chrome to duplicate power)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
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

        // Save new state so popup is synced next time (optional but nice)
        // chrome.storage.local.set... (Can't easily sync back to popup UI if it's open without long-lived connection, but mostly fine)
        console.log(`Shortcut: Volume set to ${newVal}%`);
    }
});
