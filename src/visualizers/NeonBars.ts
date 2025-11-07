import * as THREE from 'three';
import { VisualizerManager, VisualizerConfig } from '../components/VisualizerManager';
import { ColorPalette } from '../theme';
import { neonGlowVertexShader, neonGlowFragmentShader } from '../shaders/neonGlow';

export class NeonBars extends VisualizerManager {
  private bars: THREE.Mesh[] = [];
  private barCount = 64;
  private fog: THREE.Fog | null = null;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    super(scene, palette, config);
  }

  initialize(): void {
    // Adjust bar count based on performance mode
    if (this.config.performanceMode) {
      this.barCount = 32;
    }

    // Add fog for volumetric effect
    this.fog = new THREE.Fog(this.palette.background.getHex(), 10, 50);
    this.scene.fog = this.fog;

    // Create bars
    const geometry = new THREE.BoxGeometry(0.2, 1, 0.2);

    for (let i = 0; i < this.barCount; i++) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          glowColor: { value: this.palette.primary },
          intensity: { value: 0.5 },
          glowIntensity: { value: 2.0 },
        },
        vertexShader: neonGlowVertexShader,
        fragmentShader: neonGlowFragmentShader,
      });

      const bar = new THREE.Mesh(geometry, material);

      // Position bars in a circle
      const angle = (i / this.barCount) * Math.PI * 2;
      const radius = 5;
      bar.position.x = Math.cos(angle) * radius;
      bar.position.z = Math.sin(angle) * radius;
      bar.position.y = 0;

      // Rotate to face center
      bar.lookAt(0, 0, 0);
      bar.rotateY(Math.PI / 2);

      this.bars.push(bar);
      this.scene.add(bar);
    }

    // Add ground grid for cyberpunk effect
    this.addGroundGrid();
  }

  private addGroundGrid(): void {
    const gridSize = 50;
    const divisions = 50;

    const gridHelper = new THREE.GridHelper(
      gridSize,
      divisions,
      this.palette.primary.getHex(),
      this.palette.secondary.getHex()
    );
    gridHelper.position.y = -5;

    // Make grid glow
    const gridMaterial = gridHelper.material as THREE.Material;
    gridMaterial.transparent = true;
    // @ts-ignore
    gridMaterial.opacity = 0.3;

    this.scene.add(gridHelper);
  }

  update(
    frequencyData: Uint8Array,
    _timeData: Uint8Array,
    bassLevel: number,
    _midLevel: number,
    _trebleLevel: number,
    _averageVolume: number,
    _deltaTime: number
  ): void {
    const binSize = Math.floor(frequencyData.length / this.barCount);

    this.bars.forEach((bar, index) => {
      // Get frequency data for this bar
      let sum = 0;
      for (let i = 0; i < binSize; i++) {
        const binIndex = index * binSize + i;
        if (binIndex < frequencyData.length) {
          sum += frequencyData[binIndex];
        }
      }
      const average = sum / binSize / 255; // Normalize to 0-1

      // Apply sensitivity
      const intensity = average * this.config.sensitivity;

      // Animate bar height with smooth easing
      const targetHeight = 1 + intensity * 8;
      bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight, 0.3);

      // Update glow intensity
      const material = bar.material as THREE.ShaderMaterial;
      material.uniforms.intensity.value = 0.5 + intensity;
      material.uniforms.glowIntensity.value = 1.0 + intensity * 3.0;

      // Alternate colors for visual variety
      if (index % 3 === 0) {
        material.uniforms.glowColor.value = this.palette.primary;
      } else if (index % 3 === 1) {
        material.uniforms.glowColor.value = this.palette.secondary;
      } else {
        material.uniforms.glowColor.value = this.palette.accent;
      }

      // Add scanline effect with bass
      bar.position.y = Math.sin(Date.now() * 0.001 + index) * bassLevel * 0.5;
    });
  }

  protected onPaletteChange(): void {
    if (this.fog) {
      this.fog.color = this.palette.background;
    }
  }

  protected onConfigChange(): void {
    // Adjust bar count if performance mode changed
    if (this.config.performanceMode && this.barCount > 32) {
      // Remove excess bars
      const barsToRemove = this.bars.slice(32);
      barsToRemove.forEach(bar => {
        this.scene.remove(bar);
        bar.geometry.dispose();
        (bar.material as THREE.Material).dispose();
      });
      this.bars = this.bars.slice(0, 32);
      this.barCount = 32;
    }
  }

  dispose(): void {
    this.bars.forEach(bar => {
      this.scene.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    });
    this.bars = [];
    this.scene.fog = null;
  }

  getName(): string {
    return 'Neon Bars';
  }
}
