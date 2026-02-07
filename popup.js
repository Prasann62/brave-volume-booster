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

    // Initialize Current Tab Info
    if (currentTab) {
        currentTitle.textContent = currentTab.title;
        if (currentTab.favIconUrl) {
            currentFavicon.src = currentTab.favIconUrl;
        } else {
            // Placeholder or transparent
            currentFavicon.style.opacity = '0';
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
    }

    // Slider Event Listener
    slider.addEventListener('input', () => {
        const val = slider.value;
        display.textContent = val;
        updateVolume(currentTab.id, val);
    });

    // Populate "Other Audio Tabs"
    populateAudioTabs(currentTab.id);

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
