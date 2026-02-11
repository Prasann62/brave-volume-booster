# 🚀 How to Load and Test Audio Enhancer Pro v2.0

## Installation Steps

### 1. Open Extension Management
- Open Brave/Chrome browser
- Navigate to `chrome://extensions/` or `brave://extensions/`
- Or click the puzzle icon → "Manage Extensions"

### 2. Enable Developer Mode
- Look for "Developer mode" toggle in the top-right corner
- Enable it (toggle should turn blue/active)

### 3. Load the Extension
- Click "Load unpacked" button
- Navigate to: `C:\Users\prasanna kumar\OneDrive\Desktop\volume_boost.ex\volume-booster`
- Select the folder and click "Select Folder"

### 4. Verify Installation
The extension should now appear in your extensions list:
- **Name**: Audio Enhancer Pro for Brave
- **Version**: 2.0.0
- **Status**: Enabled ✓

## Testing Guide

### Test 1: Basic Volume Control
1. Open YouTube and play a video
2. Click the extension icon in the toolbar
3. You should see the **Volume tab** (first tab, active by default)
4. Adjust the volume slider - audio should change immediately
5. Try the preset buttons (Normal, Boost, High, Max)

### Test 2: Equalizer
1. Click the **Equalizer tab** (second tab)
2. You should see:
   - Spectrum analyzer at top (showing real-time frequency bars)
   - 10 vertical sliders below (31Hz to 16kHz)
   - Each slider shows its dB value
3. Drag a slider up or down - audio should change
4. Watch the spectrum analyzer respond to audio
5. Click "Reset" to return all bands to 0dB

### Test 3: Audio Presets
1. Click the **Presets tab** (third tab)
2. You should see 8 preset cards in a 2×4 grid
3. Click "Bass Boost" - notice the bass increases
4. Click "Clear Speech" - midrange becomes clearer
5. Try all 8 presets
6. Active preset is highlighted with a blue border

### Test 4: Settings
1. Click the **Settings tab** (fourth tab)
2. Expand "Keyboard Shortcuts" to see the shortcuts
3. Test Export:
   - Click "Export Settings"
   - A JSON file should download
4. Test Import:
   - Change some settings
   - Click "Import Settings"
   - Select the exported file
   - Settings should restore

### Test 5: Multiple Tabs
1. Open two YouTube videos in different tabs
2. Set different volume/EQ on each tab
3. Switch between tabs
4. Each tab should maintain its own settings

## Expected Behavior

### Volume Tab
- ✅ Slider moves smoothly from 0% to 600%
- ✅ Audio visualizer shows animated bars
- ✅ Preset buttons highlight when active
- ✅ +/- buttons adjust volume by 10%
- ✅ Reset button returns to 100%

### Equalizer Tab
- ✅ Spectrum analyzer shows real-time frequency bars
- ✅ Each slider adjusts its frequency band
- ✅ Value displays update as you drag
- ✅ Audio response is immediate
- ✅ Reset button returns all to 0dB

### Presets Tab
- ✅ Preset cards have hover effect
- ✅ Active preset is highlighted
- ✅ Clicking applies preset instantly
- ✅ EQ sliders update to match preset

### Settings Tab
- ✅ Keyboard shortcuts listed
- ✅ Export downloads JSON file
- ✅ Import loads JSON file
- ✅ About section shows version 2.0.0

## Keyboard Shortcuts

Test these shortcuts with audio playing:
- `Alt + ↑` → Volume increases by 10%
- `Alt + ↓` → Volume decreases by 10%
- `Alt + Shift + 0` → Reset to 100%

## Troubleshooting

### Extension not appearing?
- Verify you selected the correct folder
- Check for errors in the extension management page
- Try reloading the extension

### Audio not changing?
- Refresh the webpage
- Make sure audio/video is playing
- Check extension permissions

### Equalizer not working?
- Refresh the page after loading extension
- Try applying a preset first
- Check console for errors (F12)

### Spectrum analyzer not showing bars?
- Analyzer only works when audio is playing
- Switch to Equalizer tab to activate it
- Higher volumes show more activity

## Files Overview

The extension consists of:
- `manifest.json` - Extension configuration (v2.0.0)
- `popup.html` - Tabbed UI interface
- `popup.css` - Styling for all tabs
- `popup.js` - UI logic and controls
- `content.js` - Audio processing engine
- `background.js` - Background service worker
- `icon.svg` - Extension icon
- `README.md` - Documentation

## What's New in v2.0

✨ **Major Features Added:**
- 10-band graphic equalizer (31Hz - 16kHz)
- 8 professional audio presets
- Real-time spectrum analyzer
- Tabbed interface (4 tabs)
- Per-tab EQ persistence
- Custom EQ with -12dB to +12dB range

🎨 **UI Improvements:**
- Modern tabbed navigation
- Vertical EQ sliders
- Preset cards with icons
- Spectrum visualization
- Dark mode support

⚡ **Performance:**
- 60 FPS animations
- Smooth audio transitions
- Zero-latency EQ changes
- Efficient spectrum analysis

## Success Indicators

You'll know it's working when:
1. ✅ Extension icon appears in toolbar
2. ✅ Clicking shows 4 tabs
3. ✅ Volume slider changes audio
4. ✅ EQ sliders affect frequency response
5. ✅ Spectrum analyzer shows dancing bars
6. ✅ Presets instantly change the sound
7. ✅ Settings persist when closing popup

## Next Steps

After testing:
1. Try different audio sources (Spotify, podcasts, Netflix)
2. Experiment with custom EQ settings
3. Save your favorite configurations
4. Share feedback or report issues

---

**Enjoy your enhanced audio experience! 🎵**
