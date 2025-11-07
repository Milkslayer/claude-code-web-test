export interface PerformanceProfile {
  performanceMode: boolean;
  postProcessing: boolean;
  particleCount: number;
  meshQuality: number; // 0-1, affects subdivisions
}

export class PerformanceManager {
  private fps = 60;
  private frameTimeHistory: number[] = [];
  private readonly historySize = 60; // 1 second at 60fps
  private performanceProfile: PerformanceProfile;
  private readonly fpsThreshold = 30;
  private readonly checkInterval = 2000; // Check every 2 seconds
  private lastCheckTime = 0;
  private onProfileChange?: (profile: PerformanceProfile) => void;

  constructor() {
    // Try to load saved profile from localStorage
    const saved = this.loadProfile();
    this.performanceProfile = saved || this.getDefaultProfile();
  }

  private getDefaultProfile(): PerformanceProfile {
    return {
      performanceMode: false,
      postProcessing: true,
      particleCount: 10000,
      meshQuality: 1.0,
    };
  }

  private loadProfile(): PerformanceProfile | null {
    try {
      const saved = localStorage.getItem('performanceProfile');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Failed to load performance profile:', error);
    }
    return null;
  }

  private saveProfile(): void {
    try {
      localStorage.setItem('performanceProfile', JSON.stringify(this.performanceProfile));
    } catch (error) {
      console.warn('Failed to save performance profile:', error);
    }
  }

  update(deltaTime: number): void {
    const currentTime = performance.now();

    // Calculate FPS
    if (deltaTime > 0) {
      const instantFps = 1 / deltaTime;
      this.frameTimeHistory.push(instantFps);

      // Keep history at fixed size
      if (this.frameTimeHistory.length > this.historySize) {
        this.frameTimeHistory.shift();
      }

      // Calculate average FPS
      this.fps = this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length;
    }

    // Check if we need to adjust performance settings
    if (currentTime - this.lastCheckTime > this.checkInterval) {
      this.lastCheckTime = currentTime;
      this.checkAndAdjustPerformance();
    }
  }

  private checkAndAdjustPerformance(): void {
    const shouldEnablePerformanceMode = this.fps < this.fpsThreshold;

    if (shouldEnablePerformanceMode && !this.performanceProfile.performanceMode) {
      console.warn(`FPS dropped to ${this.fps.toFixed(1)}, enabling performance mode`);
      this.enablePerformanceMode();
    } else if (!shouldEnablePerformanceMode && this.performanceProfile.performanceMode && this.fps > this.fpsThreshold + 10) {
      // Only disable performance mode if FPS is consistently above threshold + buffer
      console.log(`FPS recovered to ${this.fps.toFixed(1)}, disabling performance mode`);
      this.disablePerformanceMode();
    }
  }

  private enablePerformanceMode(): void {
    this.performanceProfile = {
      performanceMode: true,
      postProcessing: false,
      particleCount: 3000,
      meshQuality: 0.5,
    };

    this.saveProfile();
    this.notifyProfileChange();
  }

  private disablePerformanceMode(): void {
    this.performanceProfile = this.getDefaultProfile();
    this.saveProfile();
    this.notifyProfileChange();
  }

  private notifyProfileChange(): void {
    if (this.onProfileChange) {
      this.onProfileChange(this.performanceProfile);
    }
  }

  getFps(): number {
    return this.fps;
  }

  getProfile(): PerformanceProfile {
    return { ...this.performanceProfile };
  }

  setProfile(profile: Partial<PerformanceProfile>): void {
    this.performanceProfile = { ...this.performanceProfile, ...profile };
    this.saveProfile();
    this.notifyProfileChange();
  }

  onPerformanceChange(callback: (profile: PerformanceProfile) => void): void {
    this.onProfileChange = callback;
  }

  getAverageFps(): number {
    return this.fps;
  }

  getMinFps(): number {
    if (this.frameTimeHistory.length === 0) return 60;
    return Math.min(...this.frameTimeHistory);
  }

  getMaxFps(): number {
    if (this.frameTimeHistory.length === 0) return 60;
    return Math.max(...this.frameTimeHistory);
  }

  reset(): void {
    this.frameTimeHistory = [];
    this.fps = 60;
  }
}
