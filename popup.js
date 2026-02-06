document.addEventListener('DOMContentLoaded', async () => {
    const slider = document.getElementById('volumeSlider');
    const display = document.getElementById('volumeValue');
    const resetBtn = document.getElementById('resetBtn');

    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    // Load saved settings for this tab
    const key = `volume_${tab.id}`;
    chrome.storage.local.get([key], (result) => {
        if (result[key]) {
            const val = result[key];
            slider.value = val;
            display.textContent = val;
            updateIcon(val);
        }
    });

    // Slider input event
    slider.addEventListener('input', () => {
        const val = slider.value;
        display.textContent = val;
        updateVolume(tab.id, val);
        updateIcon(val);
    });

    // Reset button
    resetBtn.addEventListener('click', () => {
        slider.value = 100;
        display.textContent = 100;
        updateVolume(tab.id, 100);
        updateIcon(100);
    });

    function updateVolume(tabId, value) {
        // Save state
        chrome.storage.local.set({ [`volume_${tabId}`]: value });

        // Send message to content script
        chrome.tabs.sendMessage(tabId, {
            action: "setVolume",
            value: parseInt(value)
        }).catch(err => {
            // Content script might not be loaded yet or injected
            // We can try to inject it dynamically if it's not there, but manifest "content_scripts" handles mostly.
            // However, for already open tabs, we might need to reload or inject.
            // For now, we assume it's loaded.
            console.log("Could not send message (content script might not be ready):", err);
        });
    }
    
    function updateIcon(value) {
        // Optional: Update badge or icon if implementing dynamic icon
        // For MVP, we just rely on UI
    }
});
