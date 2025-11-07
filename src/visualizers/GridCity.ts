import * as THREE from 'three';
import { VisualizerManager, VisualizerConfig } from '../components/VisualizerManager';
import { ColorPalette } from '../theme';

export class GridCity extends VisualizerManager {
  private grid: THREE.GridHelper | null = null;
  private buildings: THREE.Mesh[] = [];
  private buildingCount = 50;
  private gridSize = 40;

  constructor(scene: THREE.Scene, palette: ColorPalette, config: VisualizerConfig) {
    super(scene, palette, config);
  }

  initialize(): void {
    // Adjust building count based on performance mode
    if (this.config.performanceMode) {
      this.buildingCount = 25;
    }

    // Create ground grid
    this.grid = new THREE.GridHelper(
      this.gridSize,
      40,
      this.palette.primary.getHex(),
      this.palette.secondary.getHex()
    );
    this.grid.position.y = 0;

    const gridMaterial = this.grid.material as THREE.Material;
    gridMaterial.transparent = true;
    // @ts-ignore
    gridMaterial.opacity = 0.5;

    this.scene.add(this.grid);

    // Create holographic buildings
    this.createBuildings();

    // Add fog
    this.scene.fog = new THREE.Fog(this.palette.background.getHex(), 20, 50);
  }

  private createBuildings(): void {
    for (let i = 0; i < this.buildingCount; i++) {
      // Random position on grid
      const x = (Math.random() - 0.5) * this.gridSize;
      const z = (Math.random() - 0.5) * this.gridSize;

      // Random building dimensions
      const width = 0.5 + Math.random() * 1.5;
      const depth = 0.5 + Math.random() * 1.5;
      const height = 2 + Math.random() * 8;

      // Create wireframe building
      const geometry = new THREE.BoxGeometry(width, height, depth);
      const edges = new THREE.EdgesGeometry(geometry);

      // Choose color from palette
      let color: THREE.Color;
      const colorChoice = i % 3;
      if (colorChoice === 0) {
        color = this.palette.primary;
      } else if (colorChoice === 1) {
        color = this.palette.secondary;
      } else {
        color = this.palette.accent;
      }

      const lineMaterial = new THREE.LineBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.7,
      });

      const building = new THREE.LineSegments(edges, lineMaterial);
      building.position.set(x, height / 2, z);

      // Store original height for animation
      building.userData.originalHeight = height;
      building.userData.targetScale = 1;
      building.userData.frequencyBin = Math.floor((i / this.buildingCount) * 64);

      this.buildings.push(building as any);
      this.scene.add(building);
    }
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
    // Animate grid
    if (this.grid) {
      // Pulse grid opacity with bass
      const gridMaterial = this.grid.material as THREE.Material;
      // @ts-ignore
      gridMaterial.opacity = 0.3 + bassLevel * 0.4;

      // Animate grid colors
      const time = Date.now() * 0.001;
      const colorPhase = (time % 6) / 2;

      if (colorPhase < 1) {
        // @ts-ignore
        this.grid.material.color = this.palette.primary;
      } else if (colorPhase < 2) {
        // @ts-ignore
        this.grid.material.color = this.palette.secondary;
      } else {
        // @ts-ignore
        this.grid.material.color = this.palette.accent;
      }
    }

    // Animate buildings
    this.buildings.forEach((building, index) => {
      const frequencyBin = building.userData.frequencyBin;
      const frequency = frequencyData[frequencyBin] / 255;

      // Scale buildings based on frequency data
      const targetScale = 1 + frequency * this.config.sensitivity * 2;
      building.userData.targetScale = targetScale;

      // Smooth scale transition
      building.scale.y = THREE.MathUtils.lerp(
        building.scale.y,
        targetScale,
        0.2
      );

      // Update position to keep bottom on ground
      const originalHeight = building.userData.originalHeight;
      building.position.y = (originalHeight * building.scale.y) / 2;

      // Pulse opacity
      const material = (building as any).material as THREE.LineBasicMaterial;
      material.opacity = 0.5 + frequency * 0.5;

      // On beat, flash buildings
      if (bassLevel > 0.7) {
        material.opacity = Math.min(material.opacity + 0.3, 1.0);
      }

      // Color cycling
      const colorIndex = Math.floor((Date.now() * 0.001 + index) % 3);
      if (colorIndex === 0) {
        material.color = this.palette.primary;
      } else if (colorIndex === 1) {
        material.color = this.palette.secondary;
      } else {
        material.color = this.palette.accent;
      }
    });
  }

  protected onPaletteChange(): void {
    if (this.grid) {
      // Update grid colors
      const gridMaterial = this.grid.material as THREE.LineBasicMaterial;
      gridMaterial.color = this.palette.primary;
    }

    if (this.scene.fog) {
      (this.scene.fog as THREE.Fog).color = this.palette.background;
    }
  }

  protected onConfigChange(): void {
    if (this.config.performanceMode && this.buildingCount > 25) {
      // Remove excess buildings
      const buildingsToRemove = this.buildings.slice(25);
      buildingsToRemove.forEach(building => {
        this.scene.remove(building);
        building.geometry.dispose();
        (building.material as THREE.Material).dispose();
      });
      this.buildings = this.buildings.slice(0, 25);
      this.buildingCount = 25;
    }
  }

  dispose(): void {
    if (this.grid) {
      this.scene.remove(this.grid);
      this.grid.geometry.dispose();
      (this.grid.material as THREE.Material).dispose();
    }

    this.buildings.forEach(building => {
      this.scene.remove(building);
      building.geometry.dispose();
      (building.material as THREE.Material).dispose();
    });

    this.buildings = [];
    this.scene.fog = null;
  }

  getName(): string {
    return 'Grid City';
  }
}
