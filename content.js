/**
 * Audio Enhancer Pro - Content Script
 * Implements a professional Audio Graph with 10-band EQ, Dynamics Compressor,
 * Spectrum Analyzer, and Convolution Reverb for Spatial Environments.
 */

class AudioEnhancer {
    constructor() {
        this.audioContext = null;
        this.gainNode = null;
        this.compressor = null;
        this.analyser = null;
        this.convolver = null;
        this.eqBands = [];
        this.connectedElements = new WeakSet();
        this.initialized = false;

        // Configuration
        this.MAX_GAIN = 6.0;
        this.EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

        // State
        this.currentEqValues = new Array(10).fill(0);
        this.currentPreset = 'flat';
        this.currentEnvironment = 'studio'; // studio (dry), small, large, cathedral, outer_space
        this.isDebugMode = false;

        // Presets
        this.AUDIO_PRESETS = {
            flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            bassBoost: [6, 5, 3, 1, 0, 0, -1, -1, 0, 0],
            vocalEnhance: [0, -2, -1, 1, 3, 3, 2, 0, -1, -1],
            clearSpeech: [-3, -3, -1, 1, 2, 4, 4, 3, 1, 0],
            trebleBoost: [0, 0, -1, -1, 0, 1, 3, 5, 5, 4],
            vShape: [4, 4, 2, -2, -3, -2, 1, 3, 4, 4],
            bass: [8, 6, 4, 2, 0, 0, 0, 0, 0, 0],
            electronic: [4, 3, 0, -2, 2, 1, 1, 3, 4, 5]
        };

        // Environment Impulse Responses settings (seconds, decay)
        this.ENVIRONMENTS = {
            studio: { duration: 0.1, decay: 20, mix: 0 }, // Effectively dry
            small_room: { duration: 0.5, decay: 3, mix: 0.2 },
            large_hall: { duration: 1.5, decay: 3, mix: 0.4 },
            cathedral: { duration: 3.0, decay: 2, mix: 0.6 },
            outer_space: { duration: 5.0, decay: 1, mix: 0.8 }
        };

        this.dryGain = null;
        this.wetGain = null;

        // Auto-initialize if media is found
        this.observeDOM();
    }

    /**
     * Initialize the Web Audio API context and graph
     */
    initContext() {
        if (this.initialized && this.audioContext?.state !== 'closed') return;

        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.error("Audio Enhancer: Web Audio API not supported.");
            return;
        }

        this.audioContext = new AudioContextClass();

        // --- Create Nodes ---

        // Input Gain (Master Volume)
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 1.0;

        // 10-Band EQ
        this.eqBands = this.EQ_FREQUENCIES.map(freq => {
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'peaking';
            filter.frequency.value = freq;
            filter.Q.value = 1.0;
            filter.gain.value = 0;
            return filter;
        });

        // Reverb (Convolver) setup
        // We need a Dry/Wet mix.
        // Source -> Gain -> EQ -> Split -> [Dry Gain] -> Compressor -> Destination
        //                              -> [Convolver] -> [Wet Gain] -> Compressor

        this.convolver = this.audioContext.createConvolver();
        this.dryGain = this.audioContext.createGain();
        this.wetGain = this.audioContext.createGain();

        // Default to dry
        this.dryGain.gain.value = 1.0;
        this.wetGain.gain.value = 0.0;
        this.convolver.normalize = true;

        // Compressor (Limiter protection)
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
        this.compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
        this.compressor.ratio.setValueAtTime(12, this.audioContext.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);

        // Spectrum Analyser
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0.8;

        // --- Connect Graph ---

        // 1. Gain -> EQ Chain
        this.gainNode.connect(this.eqBands[0]);
        for (let i = 0; i < this.eqBands.length - 1; i++) {
            this.eqBands[i].connect(this.eqBands[i + 1]);
        }
        const lastEqBand = this.eqBands[this.eqBands.length - 1];

        // 2. Split to Dry and Wet paths
        // Dry Path
        lastEqBand.connect(this.dryGain);
        this.dryGain.connect(this.compressor);

        // Wet Path (Reverb)
        lastEqBand.connect(this.convolver);
        this.convolver.connect(this.wetGain);
        this.wetGain.connect(this.compressor);

        // 3. Compressor -> Analyser -> Destination
        this.compressor.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);

        this.initialized = true;
        this.log("Initialized Audio Graph");
    }

    /**
     * Connect a media element to the graph
     * @param {HTMLMediaElement} media 
     */
    connectElement(media) {
        if (this.connectedElements.has(media)) return;

        this.initContext();
        if (!this.audioContext) return;

        try {
            const source = this.audioContext.createMediaElementSource(media);
            source.connect(this.gainNode);
            this.connectedElements.add(media);
            this.log(`Connected media element: ${media.tagName}`);
        } catch (e) {
            // Often fails if element is already connected or CORS restricted
            if (this.isDebugMode) {
                console.warn("Audio Enhancer: Connection error:", e);
            }
        }
    }

    /**
     * Set Master Volume (0 - 6.0)
     * @param {number} valuePercent 0 to 600
     */
    setVolume(valuePercent) {
        if (!this.initialized) this.initContext();

        let target = valuePercent / 100;
        target = Math.max(0, Math.min(target, this.MAX_GAIN));

        this.gainNode.gain.setTargetAtTime(target, this.audioContext.currentTime, 0.1);

        // Resume context if suspended (browser autoplay policy)
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * Set EQ Band Gain
     * @param {number} index 0-9
     * @param {number} gainDb -12 to 12
     */
    setEqBand(index, gainDb) {
        if (!this.initialized) return;

        const clamped = Math.max(-12, Math.min(12, gainDb));
        this.currentEqValues[index] = clamped;
        this.eqBands[index].gain.setTargetAtTime(clamped, this.audioContext.currentTime, 0.1);
    }

    /**
     * Apply a named EQ preset
     * @param {string} name 
     */
    applyPreset(name) {
        if (this.AUDIO_PRESETS[name]) {
            this.currentPreset = name;
            this.AUDIO_PRESETS[name].forEach((gain, i) => this.setEqBand(i, gain));
        } else if (name === 'custom') {
            this.currentPreset = 'custom';
            // Do nothing else, assumes setEqBand handles values
        }
    }

    /**
     * Generate Impulse Response for Convolution Reverb
     * @param {number} duration Seconds
     * @param {number} decay Exponential decay factor
     * @param {boolean} reverse Reverse reverb effect
     * @returns {AudioBuffer}
     */
    generateImpulseResponse(duration, decay, reverse) {
        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);
        const left = impulse.getChannelData(0);
        const right = impulse.getChannelData(1);

        for (let i = 0; i < length; i++) {
            const n = reverse ? length - i : i;
            // Generate noise with exponential decay
            let val = (Math.random() * 2 - 1) * Math.pow(1 - n / length, decay);
            left[i] = val;
            right[i] = val;
        }

        return impulse;
    }

    /**
     * Set Spatial Environment
     * @param {string} envName 
     */
    setEnvironment(envName) {
        if (!this.initialized) this.initContext();
        if (!this.ENVIRONMENTS[envName]) return;

        this.currentEnvironment = envName;
        const env = this.ENVIRONMENTS[envName];

        this.log(`Setting environment: ${envName}`);

        // If studio/dry, just kill wet mix
        if (envName === 'studio') {
            this.wetGain.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.2);
            this.dryGain.gain.setTargetAtTime(1.0, this.audioContext.currentTime, 0.2);
            return;
        }

        // Generate and set buffer (memoize this in real app, but generation is fast enough for now)
        const buffer = this.generateImpulseResponse(env.duration, env.decay, false);
        this.convolver.buffer = buffer;

        // Crossfade Dry/Wet
        // Equal Power Crossfade would be better, but linear is fine for this
        const wet = env.mix;
        const dry = 1 - (wet * 0.5); // Don't reduce dry too much

        this.wetGain.gain.setTargetAtTime(wet, this.audioContext.currentTime, 0.3);
        this.dryGain.gain.setTargetAtTime(dry, this.audioContext.currentTime, 0.3);
    }

    /**
     * Get Spectrum Analysis Data
     * @returns {Array<number>}
     */
    getSpectrum() {
        if (!this.analyser) return [];
        const data = new Uint8Array(this.analyser.frequencyBinCount);
        this.analyser.getByteFrequencyData(data);
        return Array.from(data);
    }

    /**
     * Log messages if in debug mode
     */
    log(msg) {
        if (this.isDebugMode) {
            console.log(`[Audio Enhancer] ${msg}`);
        }
    }

    /**
     * Setup DOM Mutation Observer to catch new video/audio elements
     */
    observeDOM() {
        const observer = new MutationObserver(mutations => {
            for (const m of mutations) {
                m.addedNodes.forEach(node => {
                    if (node.nodeName === 'VIDEO' || node.nodeName === 'AUDIO') {
                        this.connectElement(node);
                    } else if (node.querySelectorAll) {
                        node.querySelectorAll('video, audio').forEach(v => this.connectElement(v));
                    }
                });
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Initial scan
        document.querySelectorAll('video, audio').forEach(v => this.connectElement(v));
    }

    /**
     * Handle Chrome Runtime Messages
     */
    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'setVolume':
                this.setVolume(request.value);
                break;
            case 'setEqBand':
                this.setEqBand(request.index, request.gain);
                break;
            case 'applyPreset':
                this.applyPreset(request.preset);
                break;
            case 'setEnvironment':
                this.setEnvironment(request.name);
                break;
            case 'getSpectrumData':
                sendResponse({ spectrumData: this.getSpectrum() });
                break;
            case 'getDebugStats':
                sendResponse({
                    state: this.audioContext?.state || 'closed',
                    sampleRate: this.audioContext?.sampleRate,
                    nodes: this.initialized ? 'Active' : 'Inactive',
                    volume: this.gainNode?.gain.value,
                    environment: this.currentEnvironment
                });
                break;
            case 'setDebugMode':
                this.isDebugMode = request.enabled;
                break;
            case 'shortcut':
                this.handleShortcut(request.command);
                break;
        }
        return true; // Keep channel open
    }

    handleShortcut(command) {
        if (!this.gainNode) return;
        let current = this.gainNode.gain.value * 100;

        if (command === 'volume-up') this.setVolume(current + 10);
        if (command === 'volume-down') this.setVolume(current - 10);
        if (command === 'volume-reset') this.setVolume(100);
    }
}

// Singleton Instance
const enhancer = new AudioEnhancer();

// Message Listener
chrome.runtime.onMessage.addListener((req, sender, sendVal) => enhancer.handleMessage(req, sender, sendVal));

console.log("Audio Enhancer Pro: Loaded (Class-Based)");
