document.addEventListener('DOMContentLoaded', async () => {
    // ========== UI ELEMENTS ==========
    // Volume Tab
    const slider = document.getElementById('volumeSlider');
    const display = document.getElementById('volumeValue');
    const currentFavicon = document.getElementById('currentFavicon');
    const currentTitle = document.getElementById('currentTitle');
    const audioTabsList = document.getElementById('audioTabsList');
    const noAudioMsg = document.getElementById('noAudioMsg');
    const visualizer = document.getElementById('visualizer');
    const canvasContext = visualizer.getContext('2d');

    // New Feature Elements
    const btnMute = document.getElementById('btnMute');
    const muteIconOn = document.getElementById('muteIconOn');
    const muteIconOff = document.getElementById('muteIconOff');
    const panSlider = document.getElementById('panSlider');
    const panValue = document.getElementById('panValue');
    const btnResetPan = document.getElementById('btnResetPan');
    const sleepTimerCountdown = document.getElementById('sleepTimerCountdown');
    const btnCancelTimer = document.getElementById('btnCancelTimer');
    const speedSlider = document.getElementById('speedSlider');
    const speedValueEl = document.getElementById('speedValue');

    // Equalizer Tab
    const eqSliders = Array.from({ length: 10 }, (_, i) => document.getElementById(`eq${i}`));
    const spectrumCanvas = document.getElementById('spectrumCanvas');
    const spectrumContext = spectrumCanvas ? spectrumCanvas.getContext('2d') : null;

    // Tab Navigation
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    // Get current tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Environment & Debug Elements
    const envCards = document.querySelectorAll('.env-card');
    const debugToggle = document.getElementById('debugToggle');
    const debugPanel = document.getElementById('debugPanel');
    const btnRefreshDebug = document.getElementById('btnRefreshDebug');

    // Debug Stats Elements
    const dbgState = document.getElementById('dbgState');
    const dbgRate = document.getElementById('dbgRate');
    const dbgNodes = document.getElementById('dbgNodes');
    const dbgEnv = document.getElementById('dbgEnv');

    // ========== TAB NAVIGATION ==========
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Update active states
            tabButtons.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            btn.classList.add('active');
            document.getElementById(`tab-${tabName}`).classList.add('active');

            // Start spectrum analyzer if on equalizer tab
            if (tabName === 'equalizer') {
                startSpectrumAnalyzer();
            }
        });
    });

    // ========== HELPER FUNCTIONS ==========
    const isRestrictedUrl = (url) => {
        if (!url) return true;
        return url.startsWith('chrome://') ||
            url.startsWith('brave://') ||
            url.startsWith('edge://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('about:');
    };

    // ========== INITIALIZE CURRENT TAB ==========
    if (currentTab) {
        currentTitle.textContent = currentTab.title;
        if (currentTab.favIconUrl) {
            currentFavicon.src = currentTab.favIconUrl;
        } else {
            currentFavicon.style.opacity = '0';
        }

        // Check if restricted page
        if (isRestrictedUrl(currentTab.url)) {
            display.textContent = '--';
            currentTitle.textContent = 'Restricted Page';
            noAudioMsg.textContent = 'Audio Enhancer cannot run on this page (chrome://, brave://, or extension pages)';
            noAudioMsg.style.display = 'block';
            noAudioMsg.style.color = '#ff6b6b';
            noAudioMsg.style.fontWeight = '500';

            // Disable all controls
            slider.disabled = true;
            document.getElementById('btnDecrease').disabled = true;
            document.getElementById('btnIncrease').disabled = true;
            document.getElementById('btnReset').disabled = true;
            document.getElementById('btnResetEq').disabled = true;
            document.querySelectorAll('.preset-btn').forEach(btn => btn.disabled = true);
            document.querySelectorAll('.preset-card').forEach(card => card.style.opacity = '0.5');
            eqSliders.forEach(slider => slider.disabled = true);
            if (btnMute) btnMute.disabled = true;
            if (panSlider) panSlider.disabled = true;
            document.querySelectorAll('.sleep-btn').forEach(b => b.disabled = true);
            if (speedSlider) speedSlider.disabled = true;
            document.querySelectorAll('.speed-preset-btn').forEach(b => b.disabled = true);

            slider.style.opacity = '0.3';
            slider.style.cursor = 'not-allowed';
            return;
        }

        // Load saved volume
        const key = `volume_${currentTab.id}`;
        chrome.storage.local.get([key], (result) => {
            if (result[key]) {
                const val = result[key];
                slider.value = val;
                display.textContent = val;
                updatePresetButtons(val);
                updateGlowRing(parseInt(val));
            }
        });

        // Load saved EQ state
        loadEqState();

        // Load saved Environment state
        loadEnvironmentState();

        // Load Debug state
        loadDebugState();

        // Load new feature states
        loadMuteState();
        loadPanState();
        loadSleepTimerState();
        loadSpeedState();


    } else {
        currentTitle.textContent = 'No Tab Available';
        display.textContent = '--';
        noAudioMsg.textContent = 'Could not access current tab';
        noAudioMsg.style.display = 'block';
        slider.disabled = true;
        return;
    }

    // ========== VOLUME VISUALIZER ==========
    let animationId;
    function drawVisualizer(value) {
        const width = visualizer.width;
        const height = visualizer.height;
        const barWidth = 4;
        const gap = 2;
        const numBars = Math.floor(width / (barWidth + gap));
        const volumePercent = value / 600;

        canvasContext.clearRect(0, 0, width, height);

        for (let i = 0; i < numBars; i++) {
            const barHeight = Math.random() * height * volumePercent * 0.8 + height * 0.1;
            const x = i * (barWidth + gap);
            const y = (height - barHeight) / 2;

            const gradient = canvasContext.createLinearGradient(0, y, 0, y + barHeight);
            gradient.addColorStop(0, 'rgba(43, 125, 233, 0.8)');
            gradient.addColorStop(1, 'rgba(43, 125, 233, 0.3)');

            canvasContext.fillStyle = gradient;
            canvasContext.fillRect(x, y, barWidth, barHeight);
        }
    }

    function startVisualizer() {
        if (animationId) cancelAnimationFrame(animationId);

        function animate() {
            drawVisualizer(parseInt(slider.value));
            animationId = requestAnimationFrame(animate);
        }
        animate();
    }

    startVisualizer();

    // ========== VOLUME CONTROLS ==========
    slider.addEventListener('input', () => {
        if (!currentTab) return;
        const val = slider.value;
        display.textContent = val;
        updateVolume(currentTab.id, val);
        updatePresetButtons(val);
        updateGlowRing(parseInt(val));
        triggerRipple();
    });

    document.getElementById('btnDecrease').addEventListener('click', () => {
        let val = parseInt(slider.value);
        val = Math.max(0, val - 10);
        updateUIAndVolume(val);
    });

    document.getElementById('btnIncrease').addEventListener('click', () => {
        let val = parseInt(slider.value);
        val = Math.min(600, val + 10);
        updateUIAndVolume(val);
    });

    document.getElementById('btnReset').addEventListener('click', () => {
        updateUIAndVolume(100);
    });

    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const volume = parseInt(btn.dataset.volume);
            updateUIAndVolume(volume);
        });
    });

    function updatePresetButtons(value) {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            if (parseInt(btn.dataset.volume) === parseInt(value)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function updateUIAndVolume(val) {
        slider.value = val;
        display.textContent = val;
        updateVolume(currentTab.id, val);
        updatePresetButtons(val);
        updateGlowRing(val);
        triggerRipple();
    }

    function updateVolume(tabId, value) {
        chrome.storage.local.set({ [`volume_${tabId}`]: value });
        chrome.tabs.sendMessage(tabId, {
            action: "setVolume",
            value: parseInt(value)
        }).catch(err => {
            console.log("Error sending message:", err);
        });
    }

    // ========== WONDER: GLOW RING ==========
    const volumeCircleEl = document.getElementById('volumeCircle');
    function updateGlowRing(volumePercent) {
        if (!volumeCircleEl) return;
        const t = Math.min(1, volumePercent / 600);
        // glow-intensity: 2px at 0%, 18px at 100%, 42px at 600%
        const glow1 = (2 + t * 40).toFixed(1) + 'px';
        const glow2 = (1 + t * 20).toFixed(1) + 'px';
        const opacity = (0.25 + t * 0.75).toFixed(2);
        volumeCircleEl.style.setProperty('--glow-intensity', glow1);
        volumeCircleEl.style.setProperty('--glow-intensity2', glow2);
        volumeCircleEl.style.setProperty('--ring-opacity', opacity);
        // Also update the outer box-shadow glow on the circle itself
        const cyan = `rgba(0,242,255,${(0.05 + t * 0.35).toFixed(2)})`;
        const purple = `rgba(188,19,254,${(0.03 + t * 0.2).toFixed(2)})`;
        volumeCircleEl.style.boxShadow = `0 0 ${(30 + t * 60).toFixed(0)}px ${cyan}, 0 0 ${(10 + t * 30).toFixed(0)}px ${purple}`;
    }

    // ========== WONDER: RIPPLE BURST ==========
    const rippleEl = document.getElementById('volumeRipple');
    let rippleTimeout;
    function triggerRipple() {
        if (!rippleEl) return;
        rippleEl.classList.remove('burst');
        void rippleEl.offsetWidth; // force reflow
        rippleEl.classList.add('burst');
        clearTimeout(rippleTimeout);
        rippleTimeout = setTimeout(() => rippleEl.classList.remove('burst'), 650);
    }

    // ========== WONDER: AUDIO MOOD RING ==========
    const moodRingEl = document.getElementById('moodRing');
    const moodLabelEl = document.getElementById('moodLabel');
    const moodIconEl = document.getElementById('moodIcon');

    const MOOD_CLASSES = ['mood-bass', 'mood-crisp', 'mood-warm', 'mood-vocal', 'mood-space', 'mood-flat'];

    const MOODS = [
        { label: 'Deep & Thunderous', icon: '🔊', cls: 'mood-bass', match: eq => eq[0] > 4 || eq[1] > 4 },
        { label: 'Punchy Bass', icon: '🎸', cls: 'mood-bass', match: eq => eq[0] > 1 && eq[2] < 2 },
        { label: 'Crystal Clear', icon: '💎', cls: 'mood-crisp', match: eq => eq[7] > 3 || eq[8] > 3 || eq[9] > 3 },
        { label: 'Vocal Spotlight', icon: '🎤', cls: 'mood-vocal', match: eq => eq[4] > 2 || eq[5] > 2 },
        { label: 'Warm & Rich', icon: '☕', cls: 'mood-warm', match: eq => eq[2] > 1 && eq[3] > 0 && eq[7] < 2 },
        { label: 'V-Shape Power', icon: '⚡', cls: 'mood-bass', match: eq => eq[0] > 2 && eq[9] > 2 },
        { label: 'Deep Space', icon: '🌌', cls: 'mood-space', match: eq => eq[0] > 3 && eq[9] > 3 },
        { label: 'Podcast Pro', icon: '🎙️', cls: 'mood-vocal', match: eq => eq[5] > 2 && eq[6] > 2 && eq[0] < 0 },
        { label: 'Treble Shimmer', icon: '✨', cls: 'mood-crisp', match: eq => eq[8] > 3 && eq[9] > 3 },
        { label: 'Balanced', icon: '🎵', cls: 'mood-flat', match: _ => true }, // fallback
    ];

    function analyzeEQ(eqValues) {
        return MOODS.find(m => m.match(eqValues)) || MOODS[MOODS.length - 1];
    }

    function updateMoodRing(eqValues) {
        if (!moodRingEl) return;
        const mood = analyzeEQ(eqValues);

        // Only animate if mood changed
        if (moodLabelEl.textContent === mood.label) return;

        moodLabelEl.textContent = mood.label;
        moodIconEl.textContent = mood.icon;

        // Swap mood class with pop-in animation
        moodRingEl.classList.remove(...MOOD_CLASSES, 'mood-changed');
        void moodRingEl.offsetWidth; // reflow
        moodRingEl.classList.add(mood.cls, 'mood-changed');
    }

    // Initialize glow ring and mood ring at startup
    updateGlowRing(100);
    updateMoodRing([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

    // ========== EQUALIZER CONTROLS ==========
    eqSliders.forEach((slider, index) => {
        const valueDisplay = slider.parentElement.querySelector('.eq-value');

        slider.addEventListener('input', () => {
            const gain = parseFloat(slider.value);
            valueDisplay.textContent = `${gain > 0 ? '+' : ''}${gain.toFixed(1)}dB`;

            // Send to content script
            chrome.tabs.sendMessage(currentTab.id, {
                action: "setEqBand",
                index: index,
                gain: gain
            }).catch(err => console.log("EQ update error:", err));

            // Save to storage
            saveEqState();

            // Update mood ring
            updateMoodRing(eqSliders.map(s => parseFloat(s.value)));
        });
    });

    document.getElementById('btnResetEq').addEventListener('click', () => {
        chrome.tabs.sendMessage(currentTab.id, {
            action: "resetEq"
        }).catch(err => console.log("Reset EQ error:", err));

        // Reset UI
        eqSliders.forEach((slider, index) => {
            slider.value = 0;
            const valueDisplay = slider.parentElement.querySelector('.eq-value');
            valueDisplay.textContent = '0dB';
        });

        // Reset preset selection
        document.querySelectorAll('.preset-card').forEach(card => {
            card.classList.remove('active');
        });
        document.querySelector('[data-preset="flat"]')?.classList.add('active');

        saveEqState();
        updateMoodRing([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    });

    function loadEqState() {
        chrome.storage.local.get([`eq_${currentTab.id}`, `eqPreset_${currentTab.id}`], (result) => {
            const eqValues = result[`eq_${currentTab.id}`] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
            const preset = result[`eqPreset_${currentTab.id}`] || 'flat';

            // Update sliders
            eqSliders.forEach((slider, index) => {
                slider.value = eqValues[index];
                const valueDisplay = slider.parentElement.querySelector('.eq-value');
                const val = eqValues[index];
                valueDisplay.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}dB`;
            });

            // Update preset card
            document.querySelectorAll('.preset-card').forEach(card => {
                card.classList.remove('active');
            });
            document.querySelector(`[data-preset="${preset}"]`)?.classList.add('active');
        });
    }

    function saveEqState() {
        const eqValues = eqSliders.map(s => parseFloat(s.value));
        chrome.storage.local.set({
            [`eq_${currentTab.id}`]: eqValues,
            [`eqPreset_${currentTab.id}`]: 'custom'
        });
    }

    // ========== SPECTRUM ANALYZER ==========
    let spectrumAnimationId;

    function drawSpectrum(dataArray) {
        if (!spectrumContext || !dataArray) return;

        const width = spectrumCanvas.width;
        const height = spectrumCanvas.height;
        const barWidth = 4;
        const gap = 1;
        const numBars = Math.floor(width / (barWidth + gap));

        spectrumContext.clearRect(0, 0, width, height);

        for (let i = 0; i < numBars; i++) {
            const dataIndex = Math.floor(i * dataArray.length / numBars);
            const value = dataArray[dataIndex] / 255;
            const barHeight = value * height * 0.9;
            const x = i * (barWidth + gap);
            const y = height - barHeight;

            // Gradient based on frequency
            const hue = (i / numBars) * 120 + 200; // Blue to cyan
            const gradient = spectrumContext.createLinearGradient(0, y, 0, height);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.9)`);
            gradient.addColorStop(1, `hsla(${hue}, 70%, 60%, 0.3)`);

            spectrumContext.fillStyle = gradient;
            spectrumContext.fillRect(x, y, barWidth, barHeight);
        }
    }

    function startSpectrumAnalyzer() {
        if (spectrumAnimationId) return; // Already running

        function animate() {
            chrome.tabs.sendMessage(currentTab.id, {
                action: "getSpectrumData"
            }).then(response => {
                if (response && response.spectrumData) {
                    drawSpectrum(new Uint8Array(response.spectrumData));
                }
            }).catch(() => {
                // Ignore errors
            });

            spectrumAnimationId = requestAnimationFrame(animate);
        }

        animate();
    }

    // ========== AUDIO PRESETS ==========
    document.querySelectorAll('.preset-card[data-preset]').forEach(card => {
        card.addEventListener('click', () => {
            const preset = card.dataset.preset;

            // Apply preset
            chrome.tabs.sendMessage(currentTab.id, {
                action: "applyPreset",
                preset: preset
            }).then(() => {
                // Get the preset values and update UI
                chrome.tabs.sendMessage(currentTab.id, {
                    action: "getEqState"
                }).then(response => {
                    if (response && response.eqValues) {
                        eqSliders.forEach((slider, index) => {
                            slider.value = response.eqValues[index];
                            const valueDisplay = slider.parentElement.querySelector('.eq-value');
                            const val = response.eqValues[index];
                            valueDisplay.textContent = `${val > 0 ? '+' : ''}${val.toFixed(1)}dB`;
                        });
                        updateMoodRing(response.eqValues);
                    }
                }).catch(err => console.log("Get EQ state error:", err));
            }).catch(err => console.log("Apply preset error:", err));

            // Update active state
            document.querySelectorAll('.preset-card').forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Save preset selection
            chrome.storage.local.set({
                [`eqPreset_${currentTab.id}`]: preset
            });
        });
    });

    // ========== SPATIAL ENVIRONMENTS ==========
    envCards.forEach(card => {
        card.addEventListener('click', () => {
            const envName = card.dataset.env;

            // Send to content script
            chrome.tabs.sendMessage(currentTab.id, {
                action: "setEnvironment",
                name: envName
            }).catch(err => console.log("Set Env error:", err));

            // Update UI
            envCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');

            // Save state
            chrome.storage.local.set({ [`env_${currentTab.id}`]: envName });
        });
    });

    function loadEnvironmentState() {
        chrome.storage.local.get([`env_${currentTab.id}`], (result) => {
            const env = result[`env_${currentTab.id}`] || 'studio';
            envCards.forEach(c => {
                if (c.dataset.env === env) c.classList.add('active');
                else c.classList.remove('active');
            });
        });
    }

    // ========== DEBUG MODE ==========
    let debugPollInterval;

    debugToggle.addEventListener('change', () => {
        const isEnabled = debugToggle.checked;
        debugPanel.style.display = isEnabled ? 'block' : 'none';

        chrome.storage.local.set({ [`debug_${currentTab.id}`]: isEnabled });

        chrome.tabs.sendMessage(currentTab.id, {
            action: "setDebugMode",
            enabled: isEnabled
        }).catch(() => { });

        if (isEnabled) {
            startDebugPolling();
        } else {
            stopDebugPolling();
        }
    });

    btnRefreshDebug.addEventListener('click', updateDebugStats);

    function startDebugPolling() {
        if (debugPollInterval) clearInterval(debugPollInterval);
        updateDebugStats();
        debugPollInterval = setInterval(updateDebugStats, 1000);
    }

    function stopDebugPolling() {
        if (debugPollInterval) clearInterval(debugPollInterval);
    }

    function updateDebugStats() {
        chrome.tabs.sendMessage(currentTab.id, {
            action: "getDebugStats"
        }).then(stats => {
            if (!stats) return;
            dbgState.textContent = stats.state;
            dbgRate.textContent = `${stats.sampleRate} Hz`;
            dbgNodes.textContent = stats.nodes;
            dbgEnv.textContent = stats.environment;
        }).catch(() => {
            dbgState.textContent = "Error/Disconnected";
        });
    }

    function loadDebugState() {
        chrome.storage.local.get([`debug_${currentTab.id}`], (result) => {
            const isEnabled = !!result[`debug_${currentTab.id}`];
            debugToggle.checked = isEnabled;
            debugPanel.style.display = isEnabled ? 'block' : 'none';

            if (isEnabled) {
                // Sync content script state
                chrome.tabs.sendMessage(currentTab.id, {
                    action: "setDebugMode",
                    enabled: true
                }).catch(() => { });
                startDebugPolling();
            }
        });
    }

    // ========== AUDIO TABS LIST ==========
    async function populateAudioTabs(currentTabId) {
        const tabs = await chrome.tabs.query({ audible: true });
        const otherTabs = tabs.filter(t => t.id !== currentTabId);

        if (otherTabs.length === 0) {
            noAudioMsg.style.display = 'block';
            return;
        }

        noAudioMsg.style.display = 'none';

        otherTabs.forEach(tab => {
            const li = document.createElement('li');
            li.className = 'tab-item';

            const img = document.createElement('img');
            img.className = 'favicon';
            img.src = tab.favIconUrl || '';

            const span = document.createElement('span');
            span.className = 'tab-title';
            span.textContent = tab.title;

            li.appendChild(img);
            li.appendChild(span);

            li.addEventListener('click', () => {
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
            });

            audioTabsList.appendChild(li);
        });
    }

    if (currentTab && !isRestrictedUrl(currentTab.url)) {
        populateAudioTabs(currentTab.id);
    }

    // ========== MUTE TOGGLE ==========
    let isMuted = false;
    let volumeBeforeMute = 100;

    function setMuteUI(muted) {
        isMuted = muted;
        btnMute.classList.toggle('muted', muted);
        muteIconOn.style.display = muted ? 'none' : 'block';
        muteIconOff.style.display = muted ? 'block' : 'none';
        btnMute.title = muted ? 'Unmute' : 'Mute';
    }

    btnMute.addEventListener('click', () => {
        if (!currentTab) return;
        if (!isMuted) {
            volumeBeforeMute = parseInt(slider.value);
            setMuteUI(true);
            chrome.tabs.sendMessage(currentTab.id, { action: 'setVolume', value: 0 }).catch(() => { });
        } else {
            setMuteUI(false);
            updateUIAndVolume(volumeBeforeMute);
        }
        chrome.storage.local.set({ [`muted_${currentTab.id}`]: isMuted, [`muteVol_${currentTab.id}`]: volumeBeforeMute });
    });

    function loadMuteState() {
        chrome.storage.local.get([`muted_${currentTab.id}`, `muteVol_${currentTab.id}`], (result) => {
            const wasMuted = !!result[`muted_${currentTab.id}`];
            volumeBeforeMute = result[`muteVol_${currentTab.id}`] || 100;
            if (wasMuted) {
                setMuteUI(true);
                chrome.tabs.sendMessage(currentTab.id, { action: 'setVolume', value: 0 }).catch(() => { });
            } else {
                setMuteUI(false);
            }
        });
    }

    // ========== STEREO PAN ==========
    function formatPan(val) {
        if (Math.abs(val) < 0.01) return 'Center';
        const pct = Math.round(Math.abs(val) * 100);
        return val < 0 ? `L ${pct}%` : `R ${pct}%`;
    }

    panSlider.addEventListener('input', () => {
        const val = parseFloat(panSlider.value);
        panValue.textContent = formatPan(val);
        chrome.tabs.sendMessage(currentTab.id, { action: 'setPan', value: val }).catch(() => { });
        chrome.storage.local.set({ [`pan_${currentTab.id}`]: val });
    });

    btnResetPan.addEventListener('click', () => {
        panSlider.value = 0;
        panValue.textContent = 'Center';
        chrome.tabs.sendMessage(currentTab.id, { action: 'setPan', value: 0 }).catch(() => { });
        chrome.storage.local.set({ [`pan_${currentTab.id}`]: 0 });
    });

    function loadPanState() {
        chrome.storage.local.get([`pan_${currentTab.id}`], (result) => {
            const val = result[`pan_${currentTab.id}`] ?? 0;
            panSlider.value = val;
            panValue.textContent = formatPan(val);
            chrome.tabs.sendMessage(currentTab.id, { action: 'setPan', value: val }).catch(() => { });
        });
    }

    // ========== SLEEP TIMER ==========
    let sleepTimerInterval = null;
    let sleepEndTime = null;

    function startSleepTimer(minutes) {
        clearSleepTimer();
        sleepEndTime = Date.now() + minutes * 60 * 1000;
        chrome.storage.local.set({ sleep_end: sleepEndTime });
        btnCancelTimer.style.display = 'block';
        updateSleepCountdown();
        sleepTimerInterval = setInterval(updateSleepCountdown, 1000);
        document.querySelectorAll('.sleep-btn').forEach(b => b.classList.remove('active'));
        document.querySelector(`.sleep-btn[data-minutes="${minutes}"]`)?.classList.add('active');
    }

    function clearSleepTimer() {
        if (sleepTimerInterval) clearInterval(sleepTimerInterval);
        sleepTimerInterval = null;
        sleepEndTime = null;
        sleepTimerCountdown.textContent = '';
        btnCancelTimer.style.display = 'none';
        document.querySelectorAll('.sleep-btn').forEach(b => b.classList.remove('active'));
        chrome.storage.local.remove('sleep_end');
    }

    function updateSleepCountdown() {
        if (!sleepEndTime) return;
        const remaining = sleepEndTime - Date.now();
        if (remaining <= 0) {
            clearSleepTimer();
            setMuteUI(true);
            chrome.tabs.sendMessage(currentTab.id, { action: 'setVolume', value: 0 }).catch(() => { });
            chrome.storage.local.set({ [`muted_${currentTab.id}`]: true });
            sleepTimerCountdown.textContent = 'Muted!';
            setTimeout(() => sleepTimerCountdown.textContent = '', 3000);
            return;
        }
        const m = Math.floor(remaining / 60000);
        const s = Math.floor((remaining % 60000) / 1000);
        sleepTimerCountdown.textContent = `${m}:${s.toString().padStart(2, '0')}`;
    }

    document.querySelectorAll('.sleep-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes);
            startSleepTimer(minutes);
        });
    });

    btnCancelTimer.addEventListener('click', () => {
        clearSleepTimer();
    });

    function loadSleepTimerState() {
        chrome.storage.local.get(['sleep_end'], (result) => {
            if (result.sleep_end && result.sleep_end > Date.now()) {
                sleepEndTime = result.sleep_end;
                btnCancelTimer.style.display = 'block';
                updateSleepCountdown();
                sleepTimerInterval = setInterval(updateSleepCountdown, 1000);
            }
        });
    }

    // ========== PLAYBACK SPEED ==========
    function formatSpeed(val) {
        return `${parseFloat(val).toFixed(2).replace(/\.?0+$/, '')}×`;
    }

    function updateSpeedPresetButtons(val) {
        document.querySelectorAll('.speed-preset-btn').forEach(btn => {
            btn.classList.toggle('active', Math.abs(parseFloat(btn.dataset.speed) - val) < 0.01);
        });
    }

    function applySpeed(val) {
        val = Math.max(0.25, Math.min(4, val));
        speedSlider.value = val;
        speedValueEl.textContent = formatSpeed(val);
        updateSpeedPresetButtons(val);
        chrome.tabs.sendMessage(currentTab.id, { action: 'setPlaybackSpeed', value: val }).catch(() => { });
        chrome.storage.local.set({ [`speed_${currentTab.id}`]: val });
    }

    speedSlider.addEventListener('input', () => applySpeed(parseFloat(speedSlider.value)));

    document.querySelectorAll('.speed-preset-btn').forEach(btn => {
        btn.addEventListener('click', () => applySpeed(parseFloat(btn.dataset.speed)));
    });

    function loadSpeedState() {
        chrome.storage.local.get([`speed_${currentTab.id}`], (result) => {
            const val = result[`speed_${currentTab.id}`] ?? 1;
            applySpeed(val);
        });
    }

    // ========== SETTINGS: EXPORT/IMPORT ==========
    document.getElementById('btnExport').addEventListener('click', async () => {
        const settings = await chrome.storage.local.get(null);
        const dataStr = JSON.stringify(settings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `audio-enhancer-settings-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    document.getElementById('btnImport').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });

    document.getElementById('fileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const settings = JSON.parse(event.target.result);
                chrome.storage.local.set(settings, () => {
                    alert('Settings imported successfully! Please refresh the page.');
                    const key = `volume_${currentTab.id}`;
                    if (settings[key]) {
                        updateUIAndVolume(settings[key]);
                    }
                    loadEqState();
                });
            } catch (err) {
                alert('Error importing settings: Invalid JSON file');
            }
        };
        reader.readAsText(file);
    });
});
