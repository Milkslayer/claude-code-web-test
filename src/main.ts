import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { AudioEngine } from './components/AudioEngine';
import { VisualizerManager } from './components/VisualizerManager';
import { NeonBars } from './visualizers/NeonBars';
import { HologramSphere } from './visualizers/HologramSphere';
import { ParticleStorm } from './visualizers/ParticleStorm';
import { GridCity } from './visualizers/GridCity';
import { WaveformRibbon } from './visualizers/WaveformRibbon';
import { ThemeManager, SCENE_BG_COLOR } from './theme';
import { PerformanceManager } from './utils/PerformanceManager';
import { PostProcessingManager } from './utils/PostProcessingManager';
import { BeatDetector } from './utils/BeatDetector';
import { CameraMusicSync } from './utils/CameraMusicSync';
import { MouseNeonTrails } from './utils/MouseNeonTrails';
import { GlassPanel } from './ui/GlassPanel';

class CyberpunkVisualizer {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls | null = null;
  private audioEngine: AudioEngine;
  private themeManager: ThemeManager;
  private performanceManager: PerformanceManager;
  private postProcessingManager: PostProcessingManager | null = null;
  private beatDetector: BeatDetector;
  private cameraMusicSync: CameraMusicSync | null = null;
  private mouseNeonTrails: MouseNeonTrails | null = null;

  private visualizers: VisualizerManager[] = [];
  private currentVisualizerIndex = 0;
  private currentVisualizer: VisualizerManager | null = null;

  private isPaused = false;
  private cameraMode: 'orbit' | 'static' | 'music' = 'orbit';
  private sensitivity = 1.0;
  private mouseTrailsEnabled = false;

  private lastFrameTime = 0;

  // UI Elements
  private controlPanel: GlassPanel | null = null;
  private performancePanel: GlassPanel | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.renderer = new THREE.WebGLRenderer({
      canvas: document.getElementById('visualizer-canvas') as HTMLCanvasElement,
      antialias: true,
      alpha: false,
    });
    this.audioEngine = new AudioEngine();
    this.themeManager = new ThemeManager();
    this.performanceManager = new PerformanceManager();
    this.beatDetector = new BeatDetector();

    this.init();
  }

  private async init(): Promise<void> {
    // Setup renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.scene.background = new THREE.Color(SCENE_BG_COLOR);

    // Setup camera
    this.camera.position.z = 15;
    this.camera.position.y = 5;

    // Setup controls
    this.setupControls();

    // Setup post-processing
    this.postProcessingManager = new PostProcessingManager(
      this.renderer,
      this.scene,
      this.camera
    );

    // Setup camera music sync
    this.cameraMusicSync = new CameraMusicSync(this.camera);

    // Setup mouse neon trails
    this.mouseNeonTrails = new MouseNeonTrails(
      this.scene,
      this.camera,
      this.themeManager.getCurrentPalette()
    );

    // Setup beat detection callbacks
    this.beatDetector.onBeat((event) => {
      // Trigger glitch effect on strong beats
      if (this.postProcessingManager && event.type === 'kick') {
        this.postProcessingManager.triggerGlitch(event.energy);
      }
      // Notify camera sync
      if (this.cameraMusicSync) {
        this.cameraMusicSync.onBeat(event);
      }
    });

    // Initialize audio
    const audioInitialized = await this.audioEngine.initialize();
    if (!audioInitialized) {
      this.showAudioError();
      return;
    }

    // Initialize visualizers
    this.initializeVisualizers();

    // Setup UI
    this.setupUI();

    // Setup keyboard shortcuts
    this.setupKeyboardShortcuts();

    // Setup window resize handler
    window.addEventListener('resize', () => this.onWindowResize());

    // Setup performance monitoring
    this.performanceManager.onPerformanceChange((profile) => {
      if (this.currentVisualizer) {
        this.currentVisualizer.updateConfig({
          performanceMode: profile.performanceMode,
        });
      }
    });

    // Start render loop
    this.animate();
  }

  private setupControls(): void {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.maxDistance = 50;
    this.controls.minDistance = 5;
  }

  private initializeVisualizers(): void {
    const palette = this.themeManager.getCurrentPalette();
    const config = {
      sensitivity: this.sensitivity,
      performanceMode: this.performanceManager.getProfile().performanceMode,
    };

    // Create all visualizers
    this.visualizers = [
      new NeonBars(this.scene, palette, config),
      new HologramSphere(this.scene, palette, config),
      new ParticleStorm(this.scene, palette, config),
      new GridCity(this.scene, palette, config),
      new WaveformRibbon(this.scene, palette, config),
    ];

    // Initialize and show first visualizer
    this.switchVisualizer(0);
  }

  private switchVisualizer(index: number): void {
    // Dispose current visualizer
    if (this.currentVisualizer) {
      this.currentVisualizer.dispose();
    }

    // Initialize new visualizer
    this.currentVisualizerIndex = index % this.visualizers.length;
    this.currentVisualizer = this.visualizers[this.currentVisualizerIndex];
    this.currentVisualizer.initialize();

    console.log(`Switched to: ${this.currentVisualizer.getName()}`);
  }

  private setupUI(): void {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;

    // Control Panel
    this.controlPanel = new GlassPanel({
      title: '🎵 Controls',
      x: 20,
      y: 20,
      width: 300,
      draggable: true,
    });

    // Visualizer selector
    this.controlPanel.addDropdown(
      'Visualizer',
      this.visualizers.map(v => v.getName()),
      this.currentVisualizerIndex,
      (index) => this.switchVisualizer(index)
    );

    // Sensitivity slider
    this.controlPanel.addSlider(
      'Sensitivity',
      0.1,
      3.0,
      this.sensitivity,
      0.1,
      (value) => {
        this.sensitivity = value;
        if (this.currentVisualizer) {
          this.currentVisualizer.updateConfig({ sensitivity: value });
        }
      }
    );

    // Color palette selector
    this.controlPanel.addDropdown(
      'Color Palette',
      this.themeManager.getPaletteNames(),
      0,
      (index) => {
        const palette = this.themeManager.setPalette(index);
        if (this.currentVisualizer) {
          this.currentVisualizer.updatePalette(palette);
        }
        this.scene.background = new THREE.Color(palette.background.getHex());
      }
    );

    // Camera mode toggle
    this.controlPanel.addDropdown(
      'Camera Mode',
      ['Orbit', 'Static', 'Music Sync'],
      this.cameraMode === 'orbit' ? 0 : (this.cameraMode === 'static' ? 1 : 2),
      (index) => {
        if (index === 0) {
          this.cameraMode = 'orbit';
          if (this.controls) this.controls.enabled = true;
          if (this.cameraMusicSync) this.cameraMusicSync.setEnabled(false);
        } else if (index === 1) {
          this.cameraMode = 'static';
          if (this.controls) this.controls.enabled = false;
          if (this.cameraMusicSync) this.cameraMusicSync.setEnabled(false);
        } else {
          this.cameraMode = 'music';
          if (this.controls) {
            this.controls.enabled = false;
            if (this.cameraMusicSync) {
              this.cameraMusicSync.updateBasePosition();
              this.cameraMusicSync.setEnabled(true);
            }
          }
        }
      }
    );

    // Mouse trails toggle
    this.controlPanel.addDropdown(
      'Mouse Trails',
      ['Off', 'On'],
      this.mouseTrailsEnabled ? 1 : 0,
      (index) => {
        this.mouseTrailsEnabled = index === 1;
        if (this.mouseNeonTrails) {
          this.mouseNeonTrails.setEnabled(this.mouseTrailsEnabled);
        }
      }
    );

    this.controlPanel.addDivider();

    this.controlPanel.addText('Keyboard Shortcuts:', 'font-semibold text-neon-cyan');
    this.controlPanel.addText('1-5: Switch visualizers');
    this.controlPanel.addText('C: Cycle color palettes');
    this.controlPanel.addText('Space: Toggle pause');

    this.controlPanel.mount(uiRoot);

    // Performance Panel
    this.performancePanel = new GlassPanel({
      title: '⚡ Performance',
      x: window.innerWidth - 320,
      y: 20,
      width: 300,
      draggable: true,
    });

    const fpsText = this.performancePanel.addText('FPS: --', 'text-lg font-bold text-neon-magenta');
    const modeText = this.performancePanel.addText('Mode: Normal', 'text-sm');

    // Update performance display
    setInterval(() => {
      const fps = this.performanceManager.getFps();
      const profile = this.performanceManager.getProfile();

      fpsText.textContent = `FPS: ${fps.toFixed(1)}`;
      fpsText.className = fps >= 30 ? 'text-lg font-bold text-neon-cyan' : 'text-lg font-bold text-red-500';

      modeText.textContent = `Mode: ${profile.performanceMode ? 'Performance' : 'Normal'}`;
    }, 100);

    this.performancePanel.mount(uiRoot);
  }

  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Number keys 1-5 for visualizer selection
      if (e.key >= '1' && e.key <= '5') {
        const index = parseInt(e.key) - 1;
        if (index < this.visualizers.length) {
          this.switchVisualizer(index);
        }
      }

      // C for cycling color palettes
      if (e.key.toLowerCase() === 'c') {
        const palette = this.themeManager.cyclePalette();
        if (this.currentVisualizer) {
          this.currentVisualizer.updatePalette(palette);
        }
        if (this.mouseNeonTrails) {
          this.mouseNeonTrails.updatePalette(palette);
        }
        this.scene.background = new THREE.Color(palette.background.getHex());
        console.log(`Color palette: ${palette.name}`);
      }

      // Space for pause
      if (e.code === 'Space') {
        this.isPaused = !this.isPaused;
        console.log(this.isPaused ? 'Paused' : 'Resumed');
      }
    });
  }

  private showAudioError(): void {
    const uiRoot = document.getElementById('ui-root');
    if (!uiRoot) return;

    const errorPanel = new GlassPanel({
      title: '⚠️ Audio Error',
      x: window.innerWidth / 2 - 200,
      y: window.innerHeight / 2 - 100,
      width: 400,
      draggable: false,
    });

    errorPanel.addText('Failed to initialize audio capture.', 'text-red-500 font-bold');
    errorPanel.addText('Please grant microphone permissions and reload the page.');

    errorPanel.addButton('Reload Page', () => {
      window.location.reload();
    }, 'magenta');

    errorPanel.mount(uiRoot);
  }

  private onWindowResize(): void {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // Update post-processing
    if (this.postProcessingManager) {
      this.postProcessingManager.setSize(window.innerWidth, window.innerHeight);
    }

    // Reposition performance panel
    if (this.performancePanel) {
      this.performancePanel.setPosition(window.innerWidth - 320, 20);
    }
  }

  private animate(): void {
    requestAnimationFrame(() => this.animate());

    const currentTime = performance.now() / 1000;
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;

    // Update performance manager
    this.performanceManager.update(deltaTime);

    if (!this.isPaused && this.currentVisualizer) {
      // Get audio data
      const frequencyData = this.audioEngine.getFrequencyData();
      const timeData = this.audioEngine.getTimeDomainData();
      const averageVolume = this.audioEngine.getAverageVolume();
      const bassLevel = this.audioEngine.getBassLevel();
      const midLevel = this.audioEngine.getMidLevel();
      const trebleLevel = this.audioEngine.getTrebleLevel();

      // Beat detection
      this.beatDetector.detectBeat(
        frequencyData,
        bassLevel,
        midLevel,
        trebleLevel,
        currentTime
      );

      // Update visualizer
      this.currentVisualizer.update(
        frequencyData,
        timeData,
        bassLevel,
        midLevel,
        trebleLevel,
        averageVolume,
        deltaTime
      );

      // Update camera music sync
      if (this.cameraMusicSync && this.cameraMode === 'music') {
        this.cameraMusicSync.update(deltaTime, averageVolume, bassLevel);
      }
    }

    // Update mouse trails
    if (this.mouseNeonTrails) {
      this.mouseNeonTrails.update(deltaTime);
    }

    // Update controls
    if (this.controls && this.cameraMode === 'orbit') {
      this.controls.update();
    }

    // Render scene with post-processing
    if (this.postProcessingManager && this.performanceManager.getProfile().postProcessing) {
      this.postProcessingManager.render(deltaTime);
    } else {
      this.renderer.render(this.scene, this.camera);
    }
  }
}

// Initialize the visualizer
new CyberpunkVisualizer();
