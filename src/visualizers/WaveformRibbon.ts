import * as THREE from 'three';
import { VisualizerManager, VisualizerConfig } from '../components/VisualizerManager';
import { ColorPalette } from '../theme';

export class WaveformRibbon extends VisualizerManager {
  private ribbon: THREE.Mesh | null = null;
  private segments = 128;
  private ribbonLength = 20;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    super(scene, palette, config);
  }

  initialize(): void {
    // Adjust quality based on performance mode
    if (this.config.performanceMode) {
      this.segments = 64;
    }

    // Create ribbon geometry
    const geometry = new THREE.PlaneGeometry(
      this.ribbonLength,
      2,
      this.segments,
      10
    );

    // Create gradient material
    const material = new THREE.MeshBasicMaterial({
      color: this.palette.primary,
      wireframe: false,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8,
    });

    this.ribbon = new THREE.Mesh(geometry, material);
    this.ribbon.rotation.x = Math.PI / 2;
    this.scene.add(this.ribbon);

    // Add wireframe overlay
    const wireframeGeometry = new THREE.EdgesGeometry(geometry);
    const wireframeMaterial = new THREE.LineBasicMaterial({
      color: this.palette.glow,
      transparent: true,
      opacity: 0.6,
    });
    const wireframe = new THREE.LineSegments(wireframeGeometry, wireframeMaterial);
    wireframe.rotation.x = Math.PI / 2;
    this.ribbon.add(wireframe);
  }

  update(
    _frequencyData: Uint8Array,
    timeData: Uint8Array,
    bassLevel: number,
    midLevel: number,
    trebleLevel: number,
    averageVolume: number,
    deltaTime: number
  ): void {
    if (!this.ribbon) return;

    const geometry = this.ribbon.geometry as THREE.PlaneGeometry;
    const positionAttribute = geometry.attributes.position;

    // Sample time domain data
    const sampleRate = Math.floor(timeData.length / this.segments);

    for (let i = 0; i <= this.segments; i++) {
      const dataIndex = Math.min(i * sampleRate, timeData.length - 1);
      const amplitude = ((timeData[dataIndex] - 128) / 128) * this.config.sensitivity;

      // Update vertices
      for (let j = 0; j <= 10; j++) {
        const vertexIndex = i + j * (this.segments + 1);
        const z = positionAttribute.getZ(vertexIndex);

        // Apply waveform displacement
        const y = amplitude * 3 * (1 - Math.abs(z) / 1);
        positionAttribute.setY(vertexIndex, y);
      }
    }

    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();

    // Rotate ribbon
    this.ribbon.rotation.z += deltaTime * 0.5 * (1 + averageVolume);

    // Update colors based on audio
    const material = this.ribbon.material as THREE.MeshBasicMaterial;

    // Blend colors based on frequency levels
    const primaryWeight = bassLevel;
    const secondaryWeight = midLevel;
    const accentWeight = trebleLevel;
    const totalWeight = primaryWeight + secondaryWeight + accentWeight;

    if (totalWeight > 0) {
      const color = new THREE.Color(
        (this.palette.primary.r * primaryWeight +
          this.palette.secondary.r * secondaryWeight +
          this.palette.accent.r * accentWeight) / totalWeight,
        (this.palette.primary.g * primaryWeight +
          this.palette.secondary.g * secondaryWeight +
          this.palette.accent.g * accentWeight) / totalWeight,
        (this.palette.primary.b * primaryWeight +
          this.palette.secondary.b * secondaryWeight +
          this.palette.accent.b * accentWeight) / totalWeight
      );
      material.color = color;
    }

    material.opacity = 0.6 + averageVolume * 0.4;
  }

  protected onPaletteChange(): void {
    if (this.ribbon) {
      const material = this.ribbon.material as THREE.MeshBasicMaterial;
      material.color = this.palette.primary;
    }
  }

  protected onConfigChange(): void {
    if (this.config.performanceMode && this.segments > 64) {
      this.segments = 64;
      this.dispose();
      this.initialize();
    }
  }

  dispose(): void {
    if (this.ribbon) {
      this.scene.remove(this.ribbon);
      this.ribbon.geometry.dispose();
      (this.ribbon.material as THREE.Material).dispose();
      this.ribbon = null;
    }
  }

  getName(): string {
    return 'Waveform Ribbon';
  }
}
