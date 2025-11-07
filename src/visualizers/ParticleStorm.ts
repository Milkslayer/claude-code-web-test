import * as THREE from 'three';
import { VisualizerManager, VisualizerConfig } from '../components/VisualizerManager';
import { ColorPalette } from '../theme';

export class ParticleStorm extends VisualizerManager {
  private particleSystem: THREE.Points | null = null;
  private particleCount = 10000;
  private velocities: Float32Array | null = null;
  private beatThreshold = 0.6;
  private lastBeatTime = 0;
  private time = 0;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    super(scene, palette, config);
  }

  initialize(): void {
    // Adjust particle count based on performance mode
    if (this.config.performanceMode) {
      this.particleCount = 3000;
    }

    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(this.particleCount * 3);
    const colors = new Float32Array(this.particleCount * 3);
    const sizes = new Float32Array(this.particleCount);
    this.velocities = new Float32Array(this.particleCount * 3);

    // Initialize particles
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Random position in a sphere
      const radius = Math.random() * 15;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);

      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);

      // Random velocity
      this.velocities[i3] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
      this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;

      // Cyberpunk color palette
      const colorChoice = Math.floor(Math.random() * 4);
      let color: THREE.Color;

      switch (colorChoice) {
        case 0:
          color = this.palette.primary;
          break;
        case 1:
          color = this.palette.secondary;
          break;
        case 2:
          color = this.palette.accent;
          break;
        default:
          color = this.palette.glow;
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;

      // Random size
      sizes[i] = Math.random() * 3 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    // Create particle material
    const material = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.particleSystem = new THREE.Points(geometry, material);
    this.scene.add(this.particleSystem);
  }

  update(
    frequencyData: Uint8Array,
    _timeData: Uint8Array,
    bassLevel: number,
    _midLevel: number,
    trebleLevel: number,
    averageVolume: number,
    deltaTime: number
  ): void {
    if (!this.particleSystem || !this.velocities) return;

    this.time += deltaTime;

    const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;
    const colors = this.particleSystem.geometry.attributes.color.array as Float32Array;
    const sizes = this.particleSystem.geometry.attributes.size.array as Float32Array;

    // Detect beat
    const isBeat = bassLevel > this.beatThreshold && (this.time - this.lastBeatTime) > 0.2;
    if (isBeat) {
      this.lastBeatTime = this.time;
      this.emitBeatParticles();
    }

    // Update particles
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;

      // Update position based on velocity
      positions[i3] += this.velocities[i3];
      positions[i3 + 1] += this.velocities[i3 + 1];
      positions[i3 + 2] += this.velocities[i3 + 2];

      // Apply audio influence
      const audioInfluence = averageVolume * this.config.sensitivity;

      // Add some swirl effect
      const distance = Math.sqrt(
        positions[i3] ** 2 +
        positions[i3 + 1] ** 2 +
        positions[i3 + 2] ** 2
      );

      if (distance < 20) {
        const swirlForce = audioInfluence * 0.01;
        this.velocities[i3] += -positions[i3 + 1] * swirlForce;
        this.velocities[i3 + 1] += positions[i3] * swirlForce;
      }

      // Reset particles that go too far
      if (distance > 20) {
        positions[i3] = (Math.random() - 0.5) * 2;
        positions[i3 + 1] = (Math.random() - 0.5) * 2;
        positions[i3 + 2] = (Math.random() - 0.5) * 2;

        this.velocities[i3] = (Math.random() - 0.5) * 0.1;
        this.velocities[i3 + 1] = (Math.random() - 0.5) * 0.1;
        this.velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      }

      // Update size based on audio
      const frequencyIndex = Math.floor((i / this.particleCount) * frequencyData.length);
      const frequency = frequencyData[frequencyIndex] / 255;
      sizes[i] = 1 + frequency * 4 * this.config.sensitivity;

      // Pulse colors based on treble
      const colorBrightness = 0.7 + trebleLevel * 0.3;
      colors[i3] *= colorBrightness;
      colors[i3 + 1] *= colorBrightness;
      colors[i3 + 2] *= colorBrightness;
    }

    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.geometry.attributes.size.needsUpdate = true;
    this.particleSystem.geometry.attributes.color.needsUpdate = true;

    // Rotate the entire system
    this.particleSystem.rotation.y += deltaTime * 0.1;
  }

  private emitBeatParticles(): void {
    if (!this.particleSystem || !this.velocities) return;

    // On beat, give random particles an outward burst
    const burstCount = Math.min(100, this.particleCount / 10);

    for (let i = 0; i < burstCount; i++) {
      const particleIndex = Math.floor(Math.random() * this.particleCount);
      const i3 = particleIndex * 3;

      const positions = this.particleSystem.geometry.attributes.position.array as Float32Array;

      // Create normalized direction
      const length = Math.sqrt(
        positions[i3] ** 2 +
        positions[i3 + 1] ** 2 +
        positions[i3 + 2] ** 2
      );

      if (length > 0) {
        this.velocities[i3] = (positions[i3] / length) * 0.5;
        this.velocities[i3 + 1] = (positions[i3 + 1] / length) * 0.5;
        this.velocities[i3 + 2] = (positions[i3 + 2] / length) * 0.5;
      }
    }
  }

  protected onPaletteChange(): void {
    if (!this.particleSystem) return;

    const colors = this.particleSystem.geometry.attributes.color.array as Float32Array;

    // Update colors to new palette
    for (let i = 0; i < this.particleCount; i++) {
      const i3 = i * 3;
      const colorChoice = Math.floor(Math.random() * 4);
      let color: THREE.Color;

      switch (colorChoice) {
        case 0:
          color = this.palette.primary;
          break;
        case 1:
          color = this.palette.secondary;
          break;
        case 2:
          color = this.palette.accent;
          break;
        default:
          color = this.palette.glow;
      }

      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    this.particleSystem.geometry.attributes.color.needsUpdate = true;
  }

  protected onConfigChange(): void {
    // Adjust particle count if performance mode changed
    if (this.config.performanceMode && this.particleCount > 3000) {
      this.particleCount = 3000;
      this.dispose();
      this.initialize();
    }
  }

  dispose(): void {
    if (this.particleSystem) {
      this.scene.remove(this.particleSystem);
      this.particleSystem.geometry.dispose();
      (this.particleSystem.material as THREE.Material).dispose();
    }
    this.velocities = null;
  }

  getName(): string {
    return 'Particle Storm';
  }
}
