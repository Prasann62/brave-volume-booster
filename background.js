// Background Service Worker
// Handles installation, shortcuts, and global events

chrome.runtime.onInstalled.addListener(() => {
    console.log("Volume Booster extension installed.");
});

// Handle Keyboard Shortcuts
chrome.commands.onCommand.addListener((command) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs || tabs.length === 0) return;

        const tabId = tabs[0].id;

        // Skip restricted URLs (chrome://)
        if (tabs[0].url && (tabs[0].url.startsWith('chrome://') || tabs[0].url.startsWith('brave://'))) {
            return;
        }

        chrome.tabs.sendMessage(tabId, {
            action: "shortcut",
            command: command
        }).catch(err => {
            console.log("Could not send command to tab (content script might not be loaded):", err);
        });
    });
});
