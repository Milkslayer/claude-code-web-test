import * as THREE from 'three';
import { ColorPalette } from '../theme';

interface TrailPoint {
  position: THREE.Vector3;
  age: number;
  maxAge: number;
}

export class MouseNeonTrails {
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  private palette: ColorPalette;
  private trail: TrailPoint[] = [];
  private trailMesh: THREE.Line | null = null;
  private maxTrailLength = 50;
  private enabled = false;
  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;

  constructor(scene: THREE.Scene, camera: THREE.Camera, palette: ColorPalette) {
    this.scene = scene;
    this.camera = camera;
    this.palette = palette;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    document.addEventListener('mousemove', (event) => {
      if (!this.enabled) return;

      // Update mouse position
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // Add trail point
      this.addTrailPoint();
    });
  }

  private addTrailPoint(): void {
    // Cast ray from mouse position
    this.raycaster.setFromCamera(this.mouse, this.camera);

    // Create point at a fixed distance from camera
    const distance = 10;
    const direction = new THREE.Vector3();
    this.raycaster.ray.direction.normalize();
    direction.copy(this.raycaster.ray.direction).multiplyScalar(distance);
    const position = this.raycaster.ray.origin.clone().add(direction);

    this.trail.push({
      position,
      age: 0,
      maxAge: 1.0,
    });

    // Limit trail length
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }
  }

  update(deltaTime: number): void {
    if (!this.enabled || this.trail.length === 0) {
      if (this.trailMesh) {
        this.scene.remove(this.trailMesh);
        this.trailMesh.geometry.dispose();
        (this.trailMesh.material as THREE.Material).dispose();
        this.trailMesh = null;
      }
      return;
    }

    // Age trail points
    this.trail = this.trail.filter(point => {
      point.age += deltaTime;
      return point.age < point.maxAge;
    });

    // Update trail mesh
    this.updateTrailMesh();
  }

  private updateTrailMesh(): void {
    // Remove old mesh
    if (this.trailMesh) {
      this.scene.remove(this.trailMesh);
      this.trailMesh.geometry.dispose();
      (this.trailMesh.material as THREE.Material).dispose();
    }

    if (this.trail.length < 2) return;

    // Create new geometry
    const points: THREE.Vector3[] = [];
    const colors: number[] = [];

    this.trail.forEach((point) => {
      points.push(point.position.clone());

      // Fade color based on age
      const alpha = 1 - (point.age / point.maxAge);
      const color = this.palette.glow.clone();
      colors.push(color.r * alpha, color.g * alpha, color.b * alpha);
    });

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

    const material = new THREE.LineBasicMaterial({
      vertexColors: true,
      linewidth: 3,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    this.trailMesh = new THREE.Line(geometry, material);
    this.scene.add(this.trailMesh);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.trail = [];
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  updatePalette(palette: ColorPalette): void {
    this.palette = palette;
  }

  dispose(): void {
    if (this.trailMesh) {
      this.scene.remove(this.trailMesh);
      this.trailMesh.geometry.dispose();
      (this.trailMesh.material as THREE.Material).dispose();
    }
    this.trail = [];
  }
}
