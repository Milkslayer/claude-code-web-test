import * as THREE from 'three';
import { BeatEvent } from './BeatDetector';

export class CameraMusicSync {
  private camera: THREE.Camera;
  private basePosition: THREE.Vector3;
  private baseRotation: THREE.Euler;
  private shakeIntensity = 0;
  private shakeDecay = 5; // How fast shake fades
  private swoopPhase = 0;
  private enabled = false;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
    this.basePosition = camera.position.clone();
    this.baseRotation = camera.rotation.clone();
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      // Reset to base position
      this.camera.position.copy(this.basePosition);
      this.camera.rotation.copy(this.baseRotation);
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateBasePosition(): void {
    this.basePosition.copy(this.camera.position);
    this.baseRotation.copy(this.camera.rotation);
  }

  onBeat(event: BeatEvent): void {
    if (!this.enabled) return;

    // Different shake intensities for different beat types
    switch (event.type) {
      case 'kick':
        this.shakeIntensity = Math.max(this.shakeIntensity, event.energy * 0.5);
        break;
      case 'snare':
        this.shakeIntensity = Math.max(this.shakeIntensity, event.energy * 0.3);
        break;
      case 'hihat':
        this.shakeIntensity = Math.max(this.shakeIntensity, event.energy * 0.15);
        break;
      case 'general':
        this.shakeIntensity = Math.max(this.shakeIntensity, event.energy * 0.2);
        break;
    }
  }

  update(deltaTime: number, averageVolume: number, bassLevel: number): void {
    if (!this.enabled) return;

    // Decay shake
    this.shakeIntensity = Math.max(0, this.shakeIntensity - this.shakeDecay * deltaTime);

    // Apply shake
    if (this.shakeIntensity > 0.01) {
      const shakeX = (Math.random() - 0.5) * this.shakeIntensity * 0.3;
      const shakeY = (Math.random() - 0.5) * this.shakeIntensity * 0.3;
      const shakeZ = (Math.random() - 0.5) * this.shakeIntensity * 0.2;

      this.camera.position.x = this.basePosition.x + shakeX;
      this.camera.position.y = this.basePosition.y + shakeY;
      this.camera.position.z = this.basePosition.z + shakeZ;
    } else {
      // Smooth return to base
      this.camera.position.lerp(this.basePosition, deltaTime * 2);
    }

    // Add subtle swoop/sway based on music energy
    this.swoopPhase += deltaTime * (1 + averageVolume * 2);

    const swoopX = Math.sin(this.swoopPhase) * averageVolume * 0.5;
    const swoopY = Math.cos(this.swoopPhase * 0.7) * averageVolume * 0.3;

    this.camera.position.x += swoopX;
    this.camera.position.y += swoopY;

    // Bass-driven zoom effect
    const zoomEffect = bassLevel * 0.5;
    this.camera.position.z = this.basePosition.z - zoomEffect;
  }

  reset(): void {
    this.camera.position.copy(this.basePosition);
    this.camera.rotation.copy(this.baseRotation);
    this.shakeIntensity = 0;
    this.swoopPhase = 0;
  }
}
