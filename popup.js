document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const slider = document.getElementById('volumeSlider');
    const display = document.getElementById('volumeValue');
    const currentFavicon = document.getElementById('currentFavicon');
    const currentTitle = document.getElementById('currentTitle');
    const audioTabsList = document.getElementById('audioTabsList');
    const noAudioMsg = document.getElementById('noAudioMsg');

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

    // Slider Event Listener
    slider.addEventListener('input', () => {
        if (!currentTab) return;
        const val = slider.value;
        display.textContent = val;
        updateVolume(currentTab.id, val);
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

    function updateUIAndVolume(val) {
        slider.value = val;
        display.textContent = val;
        updateVolume(currentTab.id, val);
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
