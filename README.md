# 🔊 Volume Booster for Brave/Chrome

A powerful, open-source browser extension that boosts audio volume up to **600%** on any website using the Web Audio API. Features real-time audio visualization, quick presets, and comprehensive keyboard shortcuts.

![Volume Booster](icon.svg)

## ✨ Features

### 🎚️ Advanced Volume Control
- **Boost up to 600%**: Increase volume beyond browser limits
- **Per-tab control**: Each tab maintains its own volume level
- **Quick presets**: One-click access to 100%, 200%, 400%, and 600% volume
- **Fine-tune control**: Precise slider with ±10% adjustment buttons

### 🎵 Audio Visualizer
- Real-time frequency bars showing audio activity
- Dynamic visualization that responds to volume changes
- Smooth animations using Canvas API

### ⌨️ Keyboard Shortcuts
- `Alt + ↑` - Increase volume by 10%
- `Alt + ↓` - Decrease volume by 10%
- `Alt + Shift + 0` - Reset to 100%

### 🎨 Modern UI
- Clean, minimalist design with SVG icons
- Automatic dark/light mode based on system preferences
- Smooth animations and transitions
- Accessibility-friendly with ARIA labels

### 💾 Settings Management
- **Export settings**: Save your volume preferences as JSON
- **Import settings**: Restore settings from backup
- Persistent storage across sessions

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

### Manual Installation
1. Download the latest release
2. Unzip the file
3. Follow steps 2-5 from "From Source"

## 📖 Usage

### Basic Volume Control
1. Click the extension icon in your browser toolbar
2. Use the slider or preset buttons to adjust volume
3. Your settings are automatically saved per tab

### Keyboard Shortcuts
Press the keyboard combinations anywhere in the browser to control volume:
- **Increase**: `Alt + ↑`
- **Decrease**: `Alt + ↓`
- **Reset**: `Alt + Shift + 0`

### Export/Import Settings
1. Click **Export** to save your current settings
2. Click **Import** to restore settings from a JSON file
3. Settings include all tab volumes and preferences

## 🛠️ Technical Details

### Built With
- **Web Audio API**: Core audio processing
- **Canvas API**: Real-time visualizer
- **Chrome Extensions API**: Tab management and storage
- **Vanilla JavaScript**: No external dependencies

### Audio Processing
- Uses `GainNode` for volume amplification
- `DynamicsCompressor` prevents audio clipping
- Smooth transitions with `setTargetAtTime()`
- Maximum gain: 6.0 (600%)

### Browser Compatibility
- ✅ Brave Browser
- ✅ Google Chrome
- ✅ Microsoft Edge
- ✅ Other Chromium-based browsers

### Permissions
- `activeTab`: Access current tab audio
- `scripting`: Inject content scripts
- `storage`: Save volume preferences
- `tabs`: Manage tab information
- `<all_urls>`: Work on any website

## 🎯 Supported Websites

Works on any website with audio/video content:
- ✅ YouTube, Vimeo, Dailymotion
- ✅ Spotify, SoundCloud, Bandcamp
- ✅ Netflix, Prime Video, Disney+
- ✅ Twitter, Facebook, Instagram
- ✅ Any HTML5 audio/video player

### Restrictions
Cannot run on browser internal pages:
- ❌ `chrome://` pages
- ❌ `brave://` pages
- ❌ Extension management pages
- ❌ Browser settings pages

## 🔒 Privacy

- **No data collection**: Zero telemetry or analytics
- **Local storage only**: All settings stored locally
- **No external requests**: Completely offline functionality
- **Open source**: Full code transparency

## 🐛 Troubleshooting

### Volume not changing?
1. Refresh the webpage
2. Check if audio is playing
3. Verify the extension has permissions

### Visualizer not working?
- The visualizer shows activity based on volume level
- If no audio is playing, bars may be minimal

### Keyboard shortcuts not working?
1. Check if another extension is using the same shortcuts
2. Try clicking on the webpage first to focus it
3. Verify shortcuts in `chrome://extensions/shortcuts`

## 📝 Changelog

### Version 1.2.0 (Latest)
- ➕ Added audio visualizer with Canvas API
- ➕ Implemented volume presets (100%, 200%, 400%, 600%)
- ➕ Modern SVG icons for better UX
- ➕ Settings export/import functionality
- ➕ Keyboard shortcuts reference panel
- ➕ Enhanced accessibility with ARIA labels
- ➕ Smooth animations and transitions
- 🔧 Improved UI responsiveness

### Version 1.1.0
- ➕ Added keyboard shortcuts
- ➕ Per-tab volume control
- ➕ Audio tabs list
- 🔧 Improved audio processing

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

### Code Style
- Use ES6+ JavaScript
- Follow existing code formatting
- Add comments for complex logic
- Test on multiple websites

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
