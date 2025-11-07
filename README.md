# 🎵 Cyberpunk Audio Visualizer

A high-performance, browser-based 3D audio visualizer with cyberpunk aesthetics and glassmorphic UI.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)
![Three.js](https://img.shields.io/badge/Three.js-0.160-green)

## ✨ Features

### 🎨 Visual Packs

1. **Neon Bars** - Extruded FFT bars with glow shaders and volumetric fog
2. **Hologram Sphere** - Displacement-mapped sphere with energy lines
3. **Particle Storm** - GPU-accelerated particle system with beat detection
4. **Grid City** - Wireframe city with amplitude-reactive buildings
5. **Waveform Ribbon** - Real-time waveform display with dynamic ribbon mesh

### 🎛️ Controls

- **Visualizer Selection** - Switch between 5 unique visual styles
- **Sensitivity Control** - Adjust audio reactivity
- **Color Palettes** - 10 cyberpunk color schemes
- **Camera Modes** - Orbit, Static, or Music Sync camera
- **Mouse Neon Trails** - Toggle interactive neon trails following mouse
- **Real-time FPS Monitoring** - Performance tracking

### ⌨️ Keyboard Shortcuts

- `1-5` - Switch between visualizers
- `C` - Cycle color palettes
- `Space` - Toggle pause

### 🎭 Glassmorphic UI

- Apple-inspired frosted glass panels
- Draggable control panels
- Neon accent glows
- Scanline effects

### ⚡ Performance

- **60 FPS** target on mid-range hardware
- **Automatic performance mode** when FPS drops below 30
- **Dynamic quality adjustment** (particle count, mesh subdivisions)
- **Post-processing fallback** for low-end devices
- **localStorage profile persistence**

### 🎬 Post-Processing Effects

- **Bloom** - Neon glow enhancement
- **Chromatic Aberration** - RGB split effect
- **Film Grain** - Vintage noise overlay
- **Glitch Effect** - Beat-reactive glitch distortion (triggers on kick beats)
- **Scanlines** - CRT screen effect overlay

### 🎵 Audio Intelligence

- **Beat Detection** - Real-time kick, snare, and hi-hat classification
- **5-Band Frequency Analysis** - Sub-bass, Bass, Low-Mid, High-Mid, Treble
- **Camera Music Sync** - Camera shake, swoop, and zoom synced to beats and bass
- **Adaptive Thresholds** - Smart beat detection with energy history tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Audio Permissions

On first load, the app will request microphone permissions:

1. **System Audio** (Chrome only) - Capture desktop audio
2. **Microphone** (fallback) - Capture mic input

The permission is requested **once** and remembered.

## 🏗️ Architecture

### Tech Stack

- **Three.js** - 3D rendering
- **WebAudio API** - FFT audio analysis
- **GLSL Shaders** - Custom visual effects
- **Tailwind CSS** - Glassmorphic UI styling
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Postprocessing** - Bloom, noise, aberration effects

### Data Flow

```
System Audio → WebAudio API → AnalyserNode → FFT Data
    ↓
Audio Engine (normalize, process)
    ↓
Visualizer Manager (update meshes, shaders)
    ↓
Three.js Scene → Post-Processing → Canvas
```

## 📁 Project Structure

```
src/
├── components/
│   ├── AudioEngine.ts           # Audio capture & 5-band FFT analysis
│   └── VisualizerManager.ts     # Base visualizer class
├── visualizers/
│   ├── NeonBars.ts              # FFT bar visualizer
│   ├── HologramSphere.ts        # Holographic sphere
│   ├── ParticleStorm.ts         # Particle system
│   ├── GridCity.ts              # Wireframe city
│   └── WaveformRibbon.ts        # Waveform ribbon
├── shaders/
│   ├── neonGlow.ts              # Glow shader
│   └── holographicSphere.ts     # Displacement shader
├── ui/
│   └── GlassPanel.ts            # Glassmorphic UI component
├── utils/
│   ├── PerformanceManager.ts    # FPS monitoring
│   ├── PostProcessingManager.ts # Bloom, glitch, scanlines, aberration
│   ├── BeatDetector.ts          # Beat detection & classification
│   ├── CameraMusicSync.ts       # Music-reactive camera movement
│   └── MouseNeonTrails.ts       # Interactive mouse trails
├── theme.ts                      # 10 Color palettes
├── style.css                     # Tailwind + custom styles
└── main.ts                       # Application entry
```

## 🎨 Color Palettes

1. **Cyber Neon** - Cyan, Magenta, Purple
2. **Sunset Wave** - Orange, Hot Pink, Purple
3. **Electric Blue** - Blue, Cyan, Mint
4. **Toxic Green** - Green, Yellow, Mint
5. **Blood Moon** - Red, Orange, Magenta
6. **Night City** - Yellow, Neon Red, Cyan Blue
7. **Neo-Tokyo** - Hot Pink, Deep Purple, Bright Cyan
8. **Hologram Grid** - Mint Green, Sky Blue, White
9. **Neon Storm** - Bright Magenta, Cyan, Yellow
10. **Vaporwave Temple** - Pink, Teal, Purple

## 🔧 Configuration

### Performance Profiles

Stored in `localStorage` as `performanceProfile`:

```typescript
{
  performanceMode: boolean,    // Reduce quality
  postProcessing: boolean,     // Enable effects
  particleCount: number,       // Particle density
  meshQuality: number          // Mesh subdivisions (0-1)
}
```

### Audio Settings

Configured in `AudioEngine.ts`:

- **FFT Size**: 2048
- **Smoothing**: 0.8
- **Frequency Bands** (5-band analysis):
  - Sub-Bass: 20-60 Hz (0-3%)
  - Bass: 60-250 Hz (3-10%)
  - Low-Mid: 250-500 Hz (10-25%)
  - High-Mid: 2-4 kHz (25-50%)
  - Treble: 4+ kHz (50-100%)

## 🎯 Browser Support

- ✅ Chrome/Edge (recommended) - System audio + mic
- ✅ Firefox - Microphone only
- ✅ Safari - Microphone only

## 🐛 Troubleshooting

### Audio not working
- Check microphone permissions in browser settings
- Reload the page after granting permissions
- Try a different browser (Chrome recommended)

### Low FPS
- Performance mode activates automatically at <30 FPS
- Manually disable post-processing in performance settings
- Close other GPU-intensive applications

### Black screen
- Check console for WebGL errors
- Update graphics drivers
- Try disabling browser extensions

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Credits

Built with:
- [Three.js](https://threejs.org/)
- [Postprocessing](https://github.com/pmndrs/postprocessing)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vite](https://vitejs.dev/)

## 🚧 Roadmap

- [ ] WebRTC audio streaming
- [ ] WASM DSP enhancements
- [ ] Custom shader editor
- [ ] Recording/export functionality
- [ ] VR/XR support
- [ ] Audio file upload

---

**Made with ❤️ for the cyberpunk community**
