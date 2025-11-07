import * as THREE from 'three';
import { ColorPalette } from '../theme';

export interface VisualizerConfig {
  sensitivity: number;
  performanceMode: boolean;
}

export abstract class VisualizerManager {
  protected scene: THREE.Scene;
  protected config: VisualizerConfig;
  protected palette: ColorPalette;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    this.scene = scene;
    this.palette = palette;
    this.config = config;
  }

  /**
   * Initialize the visualizer and add objects to the scene
   */
  abstract initialize(): void;

  /**
   * Update the visualizer based on audio data
   * @param frequencyData - FFT frequency data (0-255)
   * @param timeData - Time domain data (0-255)
   * @param bassLevel - Normalized bass level (0-1)
   * @param midLevel - Normalized mid level (0-1)
   * @param trebleLevel - Normalized treble level (0-1)
   * @param averageVolume - Normalized average volume (0-1)
   * @param deltaTime - Time since last frame in seconds
   */
  abstract update(
    frequencyData: Uint8Array,
    timeData: Uint8Array,
    bassLevel: number,
    midLevel: number,
    trebleLevel: number,
    averageVolume: number,
    deltaTime: number
  ): void;

  /**
   * Update the color palette
   */
  updatePalette(palette: ColorPalette): void {
    this.palette = palette;
    this.onPaletteChange();
  }

  /**
   * Called when palette changes - override to update colors
   */
  protected onPaletteChange(): void {
    // Override in subclasses
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<VisualizerConfig>): void {
    this.config = { ...this.config, ...config };
    this.onConfigChange();
  }

  /**
   * Called when config changes - override to update settings
   */
  protected onConfigChange(): void {
    // Override in subclasses
  }

  /**
   * Clean up resources
   */
  abstract dispose(): void;

  /**
   * Get the name of this visualizer
   */
  abstract getName(): string;
}
