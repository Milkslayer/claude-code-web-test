import * as THREE from 'three';

export interface ColorPalette {
  name: string;
  primary: THREE.Color;
  secondary: THREE.Color;
  accent: THREE.Color;
  background: THREE.Color;
  glow: THREE.Color;
}

export const COLOR_PALETTES: ColorPalette[] = [
  {
    name: 'Cyber Neon',
    primary: new THREE.Color(0x00ffff), // Cyan
    secondary: new THREE.Color(0xff00ff), // Magenta
    accent: new THREE.Color(0x9d00ff), // Purple
    background: new THREE.Color(0x0a0a0a), // Dark
    glow: new THREE.Color(0x00ffff),
  },
  {
    name: 'Sunset Wave',
    primary: new THREE.Color(0xff6b00), // Orange
    secondary: new THREE.Color(0xff0066), // Hot Pink
    accent: new THREE.Color(0x9d00ff), // Purple
    background: new THREE.Color(0x0a0014), // Dark Purple
    glow: new THREE.Color(0xff0066),
  },
  {
    name: 'Electric Blue',
    primary: new THREE.Color(0x0066ff), // Blue
    secondary: new THREE.Color(0x00ffff), // Cyan
    accent: new THREE.Color(0x00ff99), // Mint
    background: new THREE.Color(0x000a1a), // Dark Blue
    glow: new THREE.Color(0x00ffff),
  },
  {
    name: 'Toxic Green',
    primary: new THREE.Color(0x00ff00), // Green
    secondary: new THREE.Color(0xffff00), // Yellow
    accent: new THREE.Color(0x00ff99), // Mint
    background: new THREE.Color(0x0a140a), // Dark Green
    glow: new THREE.Color(0x00ff00),
  },
  {
    name: 'Blood Moon',
    primary: new THREE.Color(0xff0033), // Red
    secondary: new THREE.Color(0xff6600), // Orange
    accent: new THREE.Color(0xff00ff), // Magenta
    background: new THREE.Color(0x140000), // Dark Red
    glow: new THREE.Color(0xff0033),
  },
];

export const SCENE_BG_COLOR = 0x0a0a0a;
export const FOG_COLOR = 0x0a0a0a;
export const FOG_NEAR = 10;
export const FOG_FAR = 100;

export class ThemeManager {
  private currentPaletteIndex = 0;

  getCurrentPalette(): ColorPalette {
    return COLOR_PALETTES[this.currentPaletteIndex];
  }

  cyclePalette(): ColorPalette {
    this.currentPaletteIndex = (this.currentPaletteIndex + 1) % COLOR_PALETTES.length;
    return this.getCurrentPalette();
  }

  setPalette(index: number): ColorPalette {
    if (index >= 0 && index < COLOR_PALETTES.length) {
      this.currentPaletteIndex = index;
    }
    return this.getCurrentPalette();
  }

  getPaletteNames(): string[] {
    return COLOR_PALETTES.map(p => p.name);
  }
}
