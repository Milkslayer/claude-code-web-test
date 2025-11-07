import * as THREE from 'three';
import { VisualizerManager, VisualizerConfig } from '../components/VisualizerManager';
import { ColorPalette } from '../theme';
import { holographicVertexShader, holographicFragmentShader } from '../shaders/holographicSphere';

export class HologramSphere extends VisualizerManager {
  private sphere: THREE.Mesh | null = null;
  private energyLines: THREE.Line[] = [];
  private pulsatingCore: THREE.Mesh | null = null;
  private time = 0;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    super(scene, palette, config);
  }

  initialize(): void {
    // Create main holographic sphere
    const sphereGeometry = new THREE.IcosahedronGeometry(
      3,
      this.config.performanceMode ? 3 : 5
    );

    const sphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        primaryColor: { value: this.palette.primary },
        secondaryColor: { value: this.palette.secondary },
        time: { value: 0 },
        displacement: { value: 0 },
        glowIntensity: { value: 2.0 },
      },
      vertexShader: holographicVertexShader,
      fragmentShader: holographicFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    this.scene.add(this.sphere);

    // Create pulsating core
    const coreGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    const coreMaterial = new THREE.MeshBasicMaterial({
      color: this.palette.glow,
      transparent: true,
      opacity: 0.8,
    });

    this.pulsatingCore = new THREE.Mesh(coreGeometry, coreMaterial);
    this.scene.add(this.pulsatingCore);

    // Create energy lines
    this.createEnergyLines();
  }

  private createEnergyLines(): void {
    const lineCount = this.config.performanceMode ? 8 : 16;

    for (let i = 0; i < lineCount; i++) {
      const points: THREE.Vector3[] = [];

      // Create spiral line
      const turns = 3;
      const segments = 100;

      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        const angle = t * Math.PI * 2 * turns + (i / lineCount) * Math.PI * 2;
        const radius = 3.5 + Math.sin(t * Math.PI * 4) * 0.5;
        const y = (t - 0.5) * 8;

        points.push(new THREE.Vector3(
          Math.cos(angle) * radius,
          y,
          Math.sin(angle) * radius
        ));
      }

      const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const lineMaterial = new THREE.LineBasicMaterial({
        color: this.palette.accent,
        transparent: true,
        opacity: 0.6,
      });

      const line = new THREE.Line(lineGeometry, lineMaterial);
      this.energyLines.push(line);
      this.scene.add(line);
    }
  }

  update(
    _frequencyData: Uint8Array,
    _timeData: Uint8Array,
    bassLevel: number,
    midLevel: number,
    _trebleLevel: number,
    averageVolume: number,
    deltaTime: number
  ): void {
    this.time += deltaTime;

    if (!this.sphere || !this.pulsatingCore) return;

    // Update sphere displacement based on bass
    const material = this.sphere.material as THREE.ShaderMaterial;
    material.uniforms.time.value = this.time;
    material.uniforms.displacement.value = bassLevel * this.config.sensitivity;
    material.uniforms.glowIntensity.value = 1.0 + averageVolume * 3.0;

    // Rotate sphere
    this.sphere.rotation.y += deltaTime * 0.5;
    this.sphere.rotation.x += deltaTime * 0.2;

    // Pulse the core based on bass
    const coreScale = 1.0 + bassLevel * 2.0;
    this.pulsatingCore.scale.set(coreScale, coreScale, coreScale);

    // Update core opacity
    const coreMaterial = this.pulsatingCore.material as THREE.MeshBasicMaterial;
    coreMaterial.opacity = 0.5 + bassLevel * 0.5;

    // Animate energy lines
    this.energyLines.forEach((line, index) => {
      line.rotation.y = this.time * 0.5 + (index / this.energyLines.length) * Math.PI * 2;

      const lineMaterial = line.material as THREE.LineBasicMaterial;
      // Pulse opacity based on mid frequencies
      lineMaterial.opacity = 0.4 + midLevel * 0.4;

      // Animate line color between palette colors
      const colorPhase = (this.time + index) % 3;
      if (colorPhase < 1) {
        lineMaterial.color = this.palette.primary;
      } else if (colorPhase < 2) {
        lineMaterial.color = this.palette.secondary;
      } else {
        lineMaterial.color = this.palette.accent;
      }
    });
  }

  protected onPaletteChange(): void {
    if (this.sphere) {
      const material = this.sphere.material as THREE.ShaderMaterial;
      material.uniforms.primaryColor.value = this.palette.primary;
      material.uniforms.secondaryColor.value = this.palette.secondary;
    }

    if (this.pulsatingCore) {
      const material = this.pulsatingCore.material as THREE.MeshBasicMaterial;
      material.color = this.palette.glow;
    }
  }

  dispose(): void {
    if (this.sphere) {
      this.scene.remove(this.sphere);
      this.sphere.geometry.dispose();
      (this.sphere.material as THREE.Material).dispose();
    }

    if (this.pulsatingCore) {
      this.scene.remove(this.pulsatingCore);
      this.pulsatingCore.geometry.dispose();
      (this.pulsatingCore.material as THREE.Material).dispose();
    }

    this.energyLines.forEach(line => {
      this.scene.remove(line);
      line.geometry.dispose();
      (line.material as THREE.Material).dispose();
    });

    this.energyLines = [];
  }

  getName(): string {
    return 'Hologram Sphere';
  }
}
