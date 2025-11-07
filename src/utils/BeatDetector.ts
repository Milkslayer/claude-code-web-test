export interface BeatEvent {
  type: 'kick' | 'snare' | 'hihat' | 'general';
  energy: number; // 0-1
  time: number;
}

export class BeatDetector {
  private lastBeatTime = 0;
  private beatThreshold = 0.65;
  private kickThreshold = 0.75;
  private snareThreshold = 0.7;
  private energyHistory: number[] = [];
  private readonly historySize = 43; // ~1 second at 43fps average
  private beatCooldown = 0.15; // 150ms minimum between beats

  private listeners: Array<(event: BeatEvent) => void> = [];

  detectBeat(
    _frequencyData: Uint8Array,
    bassLevel: number,
    midLevel: number,
    trebleLevel: number,
    currentTime: number
  ): BeatEvent | null {
    // Calculate instant energy
    const instantEnergy = (bassLevel + midLevel + trebleLevel) / 3;

    // Store in history
    this.energyHistory.push(instantEnergy);
    if (this.energyHistory.length > this.historySize) {
      this.energyHistory.shift();
    }

    // Calculate average energy
    const avgEnergy = this.energyHistory.reduce((a, b) => a + b, 0) / this.energyHistory.length;

    // Check cooldown
    if (currentTime - this.lastBeatTime < this.beatCooldown) {
      return null;
    }

    // Detect kick (strong bass)
    if (bassLevel > this.kickThreshold && bassLevel > avgEnergy * 1.3) {
      this.lastBeatTime = currentTime;
      const event: BeatEvent = { type: 'kick', energy: bassLevel, time: currentTime };
      this.notifyListeners(event);
      return event;
    }

    // Detect snare (strong mids)
    if (midLevel > this.snareThreshold && midLevel > avgEnergy * 1.4) {
      this.lastBeatTime = currentTime;
      const event: BeatEvent = { type: 'snare', energy: midLevel, time: currentTime };
      this.notifyListeners(event);
      return event;
    }

    // Detect hi-hat (strong treble)
    if (trebleLevel > 0.6 && trebleLevel > avgEnergy * 1.5) {
      this.lastBeatTime = currentTime;
      const event: BeatEvent = { type: 'hihat', energy: trebleLevel, time: currentTime };
      this.notifyListeners(event);
      return event;
    }

    // Detect general beat
    if (instantEnergy > this.beatThreshold && instantEnergy > avgEnergy * 1.5) {
      this.lastBeatTime = currentTime;
      const event: BeatEvent = { type: 'general', energy: instantEnergy, time: currentTime };
      this.notifyListeners(event);
      return event;
    }

    return null;
  }

  onBeat(callback: (event: BeatEvent) => void): void {
    this.listeners.push(callback);
  }

  private notifyListeners(event: BeatEvent): void {
    this.listeners.forEach(listener => listener(event));
  }

  setSensitivity(threshold: number): void {
    this.beatThreshold = Math.max(0.3, Math.min(0.9, threshold));
    this.kickThreshold = this.beatThreshold + 0.1;
    this.snareThreshold = this.beatThreshold + 0.05;
  }

  reset(): void {
    this.energyHistory = [];
    this.lastBeatTime = 0;
  }
}
