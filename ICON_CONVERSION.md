# Icon Conversion Instructions

The extension currently has an SVG icon (`icon.svg`), but Chrome/Brave extensions work best with PNG icons.

## Quick Conversion Options:

### Option 1: Online Converter (Recommended)
1. Go to https://cloudconvert.com/svg-to-png
2. Upload `icon.svg`
3. Convert to PNG with these sizes:
   - 16x16 → save as `icon16.png`
   - 48x48 → save as `icon48.png`
   - 128x128 → save as `icon128.png`
4. Place all PNG files in the same directory as `manifest.json`

### Option 2: Using ImageMagick (if installed)
```bash
magick icon.svg -resize 16x16 icon16.png
magick icon.svg -resize 48x48 icon48.png
magick icon.svg -resize 128x128 icon128.png
```

### Option 3: Using Python with Pillow and CairoSVG
```bash
pip install pillow cairosvg
python -c "from cairosvg import svg2png; svg2png(url='icon.svg', write_to='icon16.png', output_width=16, output_height=16); svg2png(url='icon.svg', write_to='icon48.png', output_width=48, output_height=48); svg2png(url='icon.svg', write_to='icon128.png', output_width=128, output_height=128)"
```

## After Conversion:
Update `manifest.json` to reference the PNG files instead of SVG:
```json
"icons": {
  "16": "icon16.png",
  "48": "icon48.png",
  "128": "icon128.png"
}
```

**Note:** The manifest currently references `icon.svg` which will work in most cases, but PNG is preferred for maximum compatibility.
