document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const slider = document.getElementById('volumeSlider');
    const display = document.getElementById('volumeValue');
    const currentFavicon = document.getElementById('currentFavicon');
    const currentTitle = document.getElementById('currentTitle');
    const audioTabsList = document.getElementById('audioTabsList');
    const noAudioMsg = document.getElementById('noAudioMsg');
    const visualizer = document.getElementById('visualizer');
    const canvasContext = visualizer.getContext('2d');

    // Get current tab
    const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Check if we have a valid tab and if it's not a restricted URL
    const isRestrictedUrl = (url) => {
        if (!url) return true;
        return url.startsWith('chrome://') ||
            url.startsWith('brave://') ||
            url.startsWith('edge://') ||
            url.startsWith('chrome-extension://') ||
            url.startsWith('about:');
    };

    // Initialize Current Tab Info
    if (currentTab) {
        currentTitle.textContent = currentTab.title;
        if (currentTab.favIconUrl) {
            currentFavicon.src = currentTab.favIconUrl;
        } else {
            // Placeholder or transparent
            currentFavicon.style.opacity = '0';
        }

        // Check if this is a restricted page
        if (isRestrictedUrl(currentTab.url)) {
            // Show error message
            display.textContent = '--';
            currentTitle.textContent = 'Restricted Page';
            noAudioMsg.textContent = 'Volume Booster cannot run on this page (chrome://, brave://, or extension pages)';
            noAudioMsg.style.display = 'block';
            noAudioMsg.style.color = '#ff6b6b';
            noAudioMsg.style.fontWeight = '500';

            // Disable controls
            slider.disabled = true;
            document.getElementById('btnDecrease').disabled = true;
            document.getElementById('btnIncrease').disabled = true;
            document.getElementById('btnReset').disabled = true;
            document.querySelectorAll('.preset-btn').forEach(btn => btn.disabled = true);

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
            }
        });
    } else {
        // No tab available
        currentTitle.textContent = 'No Tab Available';
        display.textContent = '--';
        noAudioMsg.textContent = 'Could not access current tab';
        noAudioMsg.style.display = 'block';
        slider.disabled = true;
        return;
    }

    // --- Audio Visualizer ---
    let animationId;
    function drawVisualizer(value) {
        const width = visualizer.width;
        const height = visualizer.height;
        const barWidth = 4;
        const gap = 2;
        const numBars = Math.floor(width / (barWidth + gap));
        const volumePercent = value / 600; // Normalize to 0-1

        // Clear canvas
        canvasContext.clearRect(0, 0, width, height);

        // Draw bars
        for (let i = 0; i < numBars; i++) {
            const barHeight = Math.random() * height * volumePercent * 0.8 + height * 0.1;
            const x = i * (barWidth + gap);
            const y = (height - barHeight) / 2;

            // Gradient
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

    // Start visualizer
    startVisualizer();

    // Slider Event Listener
    slider.addEventListener('input', () => {
        if (!currentTab) return;
        const val = slider.value;
        display.textContent = val;
        updateVolume(currentTab.id, val);
        updatePresetButtons(val);
    });

    // Populate "Other Audio Tabs"
    if (currentTab && !isRestrictedUrl(currentTab.url)) {
        populateAudioTabs(currentTab.id);
    }

    // --- Button Event Listeners ---
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

    // --- Preset Buttons ---
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

    // --- Settings: Export/Import ---
    document.getElementById('btnExport').addEventListener('click', async () => {
        const settings = await chrome.storage.local.get(null);
        const dataStr = JSON.stringify(settings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `volume-booster-settings-${new Date().toISOString().split('T')[0]}.json`;
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
                    // Reload current volume
                    const key = `volume_${currentTab.id}`;
                    if (settings[key]) {
                        updateUIAndVolume(settings[key]);
                    }
                });
            } catch (err) {
                alert('Error importing settings: Invalid JSON file');
            }
        };
        reader.readAsText(file);
    });

    function updateUIAndVolume(val) {
        slider.value = val;
        display.textContent = val;
        updateVolume(currentTab.id, val);
        updatePresetButtons(val);
    }

    // --- Functions ---

    function updateVolume(tabId, value) {
        // Save state
        chrome.storage.local.set({ [`volume_${tabId}`]: value });

        // Send message to content script
        chrome.tabs.sendMessage(tabId, {
            action: "setVolume",
            value: parseInt(value)
        }).catch(err => {
            // Ignore errors if content script not ready
            console.log("Error sending message:", err);
        });
    }

    async function populateAudioTabs(currentTabId) {
        // Find all tabs that are audible
        const tabs = await chrome.tabs.query({ audible: true });

        // Filter out current tab (since it's already main control)
        const otherTabs = tabs.filter(t => t.id !== currentTabId);

        if (otherTabs.length === 0) {
            noAudioMsg.style.display = 'block';
            return;
        }

        noAudioMsg.style.display = 'none';

        otherTabs.forEach(tab => {
            const li = document.createElement('li');
            li.className = 'tab-item';

            // Layout: [Favicon] [Title] [Vol % - optional feature for later]
            const img = document.createElement('img');
            img.className = 'favicon';
            img.src = tab.favIconUrl || '';

            const span = document.createElement('span');
            span.className = 'tab-title';
            span.textContent = tab.title;

            li.appendChild(img);
            li.appendChild(span);

            // Click -> Switch to tab
            li.addEventListener('click', () => {
                chrome.tabs.update(tab.id, { active: true });
                chrome.windows.update(tab.windowId, { focused: true });
            });

            audioTabsList.appendChild(li);
        });
    }
});
