# 🎵 Audio Enhancer Pro for Brave/Chrome

A professional, open-source browser extension that transforms audio playback with a **10-band equalizer**, **audio presets**, **spectrum analyzer**, and volume boost up to **600%**. Powered by the Web Audio API.

![Audio Enhancer Pro](icon.svg)

## ✨ Features

### 🎚️ 10-Band Graphic Equalizer
- **Professional EQ**: Adjust 10 frequency bands from 31Hz to 16kHz
- **Per-band control**: -12dB to +12dB range for each frequency
- **Real-time adjustments**: Smooth transitions with no audio gaps
- **Frequency bands**: 31Hz, 62Hz, 125Hz, 250Hz, 500Hz, 1kHz, 2kHz, 4kHz, 8kHz, 16kHz

### 🎵 Audio Presets
- **Flat**: No EQ modification (reference)
- **Bass Boost**: Enhanced low frequencies for deep bass
- **Vocal Enhance**: Clear vocals and mid-range focus
- **Clear Speech**: Optimized for podcasts and audiobooks
- **Treble Boost**: Bright, crisp high frequencies
- **V-Shape**: Bass and treble emphasis (popular for music)
- **Bass**: Maximum bass power
- **Electronic**: Perfect for EDM and electronic music

### 📊 Real-Time Spectrum Analyzer
- Visual frequency spectrum display
- 60 FPS smooth animation
- Color-coded frequency visualization
- Live audio analysis

### 🔊 Advanced Volume Control
- **Boost up to 600%**: Increase volume beyond browser limits
- **Per-tab control**: Each tab maintains its own settings
- **Quick presets**: One-click access to 100%, 200%, 400%, and 600%
- **Fine-tune control**: Precise slider with ±10% adjustment buttons

### 🌌 Spatial Environments & Reverb
- **Simulation**: Experience audio as if you were in a Studio, Small Room, Large Hall, Cathedral, or Outer Space
- **Convolution Reverb**: Smooth crossfading between different acoustic environments

### 🎚️ Playback & Pan Controls
- **Stereo Panning**: Precise left/right audio balance control
- **Playback Speed**: Adjust speed from 0.25x to 4.0x with quick presets

### ⏱️ Sleep Timer
- **Auto-pause**: Automatically stop audio after 15, 30, 60, or 90 minutes
- Perfect for listening while falling asleep

### 🎨 Modern Tabbed Interface
- **Volume Tab**: Main volume controls with visualizer, pan, speed, and sleep timer
- **Equalizer Tab**: 10-band EQ with spectrum analyzer
- **Presets Tab**: Quick access to audio enhancement modes
- **Environments Tab**: Simulated acoustic spaces
- **Settings Tab**: Export/import, shortcuts, and configuration

### ⌨️ Keyboard Shortcuts
- `Alt + ↑` - Increase volume by 10%
- `Alt + ↓` - Decrease volume by 10%
- `Alt + Shift + 0` - Reset to 100%

### 💾 Settings Management
- **Export settings**: Save your entire configuration as JSON
- **Import settings**: Restore settings from backup
- **Persistent storage**: Volume and EQ settings saved per tab
- **Custom presets**: Save your own EQ configurations

### 🔧 Audio Tabs Management
- View all tabs currently playing audio
- Quick switch to any audio-playing tab
- Visual indicators for active tabs

## 🚀 Installation

### From Source
1. Download or clone this repository
2. Open Brave/Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the `volume-booster` folder

## 📖 Usage

### Volume Control
1. Click the extension icon in your browser toolbar
2. Adjust volume with the slider or preset buttons
3. Your settings are automatically saved per tab

### Equalizer
1. Switch to the **Equalizer** tab
2. Drag individual frequency sliders to customize sound
3. Watch the real-time spectrum analyzer
4. Click **Reset** to restore flat EQ

### Audio Presets
1. Switch to the **Presets** tab
2. Click any preset card to apply it instantly
3. The EQ will update to match the preset
4. Active preset is highlighted

### Keyboard Shortcuts
Press combinations anywhere in the browser:
- **Increase**: `Alt + ↑`
- **Decrease**: `Alt + ↓`
- **Reset**: `Alt + Shift + 0`

## 🛠️ Technical Details

### Built With
- **Web Audio API**: Professional audio processing
- **Canvas API**: Real-time visualizations
- **Chrome Extensions API**: Tab management and storage
- **Vanilla JavaScript**: Zero external dependencies

### Audio Processing Chain
```
MediaElement → Gain → EQ (10 bands) → Compressor → Analyzer → Destination
```

### EQ Implementation
- **Filter Type**: Biquad peaking filters
- **Q Factor**: 1.0 (standard for graphic EQ)
- **Range**: -12dB to +12dB per band
- **Frequencies**: 31, 62, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz

### Spectrum Analyzer
- **FFT Size**: 2048 (high resolution)
- **Smoothing**: 0.8 for smooth visualization
- **Update Rate**: 60 FPS

### Browser Compatibility
- ✅ Brave Browser
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Other Chromium-based browsers

### Permissions
- `activeTab`: Access current tab audio
- `scripting`: Inject content scripts
- `storage`: Save volume and EQ preferences
- `tabs`: Manage tab information
- `<all_urls>`: Work on any website

## 🎯 Supported Websites

Works on any website with audio/video content:
- ✅ YouTube, Vimeo, Dailymotion
- ✅ Spotify, SoundCloud, Bandcamp
- ✅ Netflix, Prime Video, Disney+
- ✅ Twitter, Facebook, Instagram
- ✅ Podcasts, audiobooks, web radio
- ✅ Any HTML5 audio/video player

### Restrictions
Cannot run on browser internal pages:
- ❌ `chrome://` pages
- ❌ `brave://` pages
- ❌ Extension management pages

## 🔒 Privacy

- **No data collection**: Zero telemetry or analytics
- **Local storage only**: All settings stored locally
- **No external requests**: Completely offline functionality
- **Open source**: Full code transparency

## 🐛 Troubleshooting

### EQ not working?
1. Refresh the webpage
2. Ensure audio is playing
3. Try applying a preset first

### Spectrum analyzer not updating?
- The analyzer requires active audio playback
- Switch to the Equalizer tab to activate it

### Volume not changing?
1. Refresh the webpage
2. Check if audio is playing
3. Verify extension has permissions

## 📝 Changelog

### Version 2.1.0 (Latest Update)
- ✨ **NEW**: Spatial Environments (Studio, Small Room, Large Hall, Cathedral, Space)
- ✨ **NEW**: Stereo Panning control
- ✨ **NEW**: Sleep Timer for automatic pause
- ✨ **NEW**: Playback Speed Control (0.25x - 4.0x)
- 🚀 Enhanced UI with new feature panels for volume tab
- 🌌 New Environments tab for quick access to reverb spaces

### Version 2.0.0 (Major Update)
- ✨ **NEW**: 10-band graphic equalizer (31Hz - 16kHz)
- ✨ **NEW**: 8 professional audio presets
- ✨ **NEW**: Real-time spectrum analyzer
- ✨ **NEW**: Tabbed interface (Volume, Equalizer, Presets, Settings)
- ✨ **NEW**: Per-tab EQ and volume persistence
- ✨ **NEW**: Custom EQ preset saving
- 🎨 Redesigned modern UI with improved accessibility
- ⚡ Enhanced audio processing pipeline
- 📊 Advanced frequency visualization

### Version 1.2.0
- ➕ Added audio visualizer with Canvas API
- ➕ Implemented volume presets (100%, 200%, 400%, 600%)
- ➕ Modern SVG icons
- ➕ Settings export/import functionality
- ➕ Keyboard shortcuts reference panel
- ➕ Enhanced accessibility with ARIA labels

### Version 1.0.0
- 🎉 Initial release
- Basic volume boost up to 600%

## 🤝 Contributing

Contributions are welcome! This is an open-source project.

### Development Setup
1. Clone the repository
2. Make your changes
3. Test thoroughly in Brave/Chrome
4. Submit a pull request

## 📄 License

This project is open source and available for free use.

## 💡 Credits

- Icons: Material Design Icons (SVG)
- Audio Processing: Web Audio API
- Developed with ❤️ using open-source technologies

## 🌟 Support

If you find this extension useful:
- ⭐ Star the repository
- 🐛 Report bugs and issues
- 💡 Suggest new features
- 🔄 Share with others

---

**Made with 🎵 for music and video lovers everywhere**
