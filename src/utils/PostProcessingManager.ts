import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  BlendFunction,
} from 'postprocessing';

export class PostProcessingManager {
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private chromaticAberrationEffect: ChromaticAberrationEffect;
  private noiseEffect: NoiseEffect;
  private effectPass: EffectPass;
  private enabled = true;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.Camera
  ) {
    // Create composer
    this.composer = new EffectComposer(renderer);

    // Add render pass
    const renderPass = new RenderPass(scene, camera);
    this.composer.addPass(renderPass);

    // Create bloom effect (neon glow)
    this.bloomEffect = new BloomEffect({
      intensity: 1.5,
      luminanceThreshold: 0.3,
      luminanceSmoothing: 0.7,
    });

    // Create chromatic aberration effect
    this.chromaticAberrationEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.002, 0.002),
      radialModulation: true,
      modulationOffset: 0.5,
    });

    // Create noise/film grain effect
    this.noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
    });
    this.noiseEffect.blendMode.opacity.value = 0.15;

    // Create effect pass with all effects
    this.effectPass = new EffectPass(
      camera,
      this.bloomEffect,
      this.chromaticAberrationEffect,
      this.noiseEffect
    );

    this.composer.addPass(this.effectPass);
  }

  render(deltaTime: number): void {
    if (this.enabled) {
      this.composer.render(deltaTime);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updateBloomIntensity(intensity: number): void {
    this.bloomEffect.intensity = intensity;
  }

  updateChromaticAberration(offset: number): void {
    this.chromaticAberrationEffect.offset = new THREE.Vector2(offset, offset);
  }

  updateNoiseOpacity(opacity: number): void {
    this.noiseEffect.blendMode.opacity.value = opacity;
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  dispose(): void {
    this.composer.dispose();
  }
}
