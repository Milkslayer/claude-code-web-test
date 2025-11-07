import * as THREE from 'three';
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  BloomEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  GlitchEffect,
  ScanlineEffect,
  BlendFunction,
} from 'postprocessing';

export class PostProcessingManager {
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private chromaticAberrationEffect: ChromaticAberrationEffect;
  private noiseEffect: NoiseEffect;
  private glitchEffect: GlitchEffect;
  private scanlineEffect: ScanlineEffect;
  private effectPass: EffectPass;
  private glitchPass: EffectPass;
  private enabled = true;
  private glitchEnabled = false;

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

    // Create glitch effect (disabled by default, triggered by beats)
    this.glitchEffect = new GlitchEffect({
      delay: new THREE.Vector2(0.5, 1.0),
      duration: new THREE.Vector2(0.1, 0.3),
      strength: new THREE.Vector2(0.2, 0.4),
    });

    // Create scanline effect
    this.scanlineEffect = new ScanlineEffect({
      blendFunction: BlendFunction.OVERLAY,
      density: 0.8,
    });
    this.scanlineEffect.blendMode.opacity.value = 0.1;

    // Create effect pass with all effects (except glitch)
    this.effectPass = new EffectPass(
      camera,
      this.bloomEffect,
      this.chromaticAberrationEffect,
      this.noiseEffect,
      this.scanlineEffect
    );

    this.composer.addPass(this.effectPass);

    // Create separate pass for glitch effect (can be dynamically added/removed)
    this.glitchPass = new EffectPass(camera, this.glitchEffect);
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

  triggerGlitch(intensity: number = 0.5): void {
    // Temporarily add glitch pass
    if (!this.glitchEnabled) {
      this.composer.addPass(this.glitchPass);
      this.glitchEnabled = true;

      // Remove after short duration
      setTimeout(() => {
        this.composer.removePass(this.glitchPass);
        this.glitchEnabled = false;
      }, 100 + intensity * 200);
    }
  }

  updateScanlineOpacity(opacity: number): void {
    this.scanlineEffect.blendMode.opacity.value = opacity;
  }

  setSize(width: number, height: number): void {
    this.composer.setSize(width, height);
  }

  dispose(): void {
    this.composer.dispose();
  }
}
