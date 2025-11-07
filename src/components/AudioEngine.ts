export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private fftSize = 2048;
  private smoothingTimeConstant = 0.8;
  private initialized = false;
  private permissionRequested = false;

  async initialize(): Promise<boolean> {
    if (this.initialized) return true;
    if (this.permissionRequested) return false;

    this.permissionRequested = true;

    try {
      // Try system audio capture first (Chrome only)
      await this.trySystemAudioCapture();
      return true;
    } catch (error) {
      console.warn('System audio capture failed, falling back to microphone:', error);

      try {
        // Fallback to microphone
        await this.tryMicrophoneCapture();
        return true;
      } catch (micError) {
        console.error('Microphone capture failed:', micError);
        return false;
      }
    }
  }

  private async trySystemAudioCapture(): Promise<void> {
    // @ts-ignore - Chrome desktop capture API
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        // @ts-ignore - Chrome-specific
        mandatory: {
          chromeMediaSource: 'desktop',
        },
      },
    });

    this.setupAudioNodes();
    this.initialized = true;
  }

  private async tryMicrophoneCapture(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.setupAudioNodes();
    this.initialized = true;
  }

  private setupAudioNodes(): void {
    if (!this.stream) return;

    this.audioContext = new AudioContext();
    this.analyser = this.audioContext.createAnalyser();

    this.analyser.fftSize = this.fftSize;
    this.analyser.smoothingTimeConstant = this.smoothingTimeConstant;

    this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

    this.source = this.audioContext.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
  }

  getFrequencyData(): Uint8Array {
    if (!this.analyser || !this.dataArray) {
      return new Uint8Array(1024);
    }

    // @ts-expect-error - TypeScript type mismatch between ArrayBufferLike and ArrayBuffer, but safe in practice
    this.analyser.getByteFrequencyData(this.dataArray);
    return this.dataArray;
  }

  getTimeDomainData(): Uint8Array {
    if (!this.analyser || !this.dataArray) {
      return new Uint8Array(1024);
    }

    // @ts-expect-error - TypeScript type mismatch between ArrayBufferLike and ArrayBuffer, but safe in practice
    this.analyser.getByteTimeDomainData(this.dataArray);
    return this.dataArray;
  }

  getAverageVolume(): number {
    const data = this.getFrequencyData();
    let sum = 0;

    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }

    return sum / data.length / 255; // Normalized to 0-1
  }

  getBassLevel(): number {
    const data = this.getFrequencyData();
    // Focus on lower frequencies (0-250 Hz roughly corresponds to first 10% of bins)
    const bassRange = Math.floor(data.length * 0.1);
    let sum = 0;

    for (let i = 0; i < bassRange; i++) {
      sum += data[i];
    }

    return sum / bassRange / 255; // Normalized to 0-1
  }

  getMidLevel(): number {
    const data = this.getFrequencyData();
    // Mid frequencies (roughly 250-2000 Hz, middle 40% of spectrum)
    const start = Math.floor(data.length * 0.1);
    const end = Math.floor(data.length * 0.5);
    let sum = 0;

    for (let i = start; i < end; i++) {
      sum += data[i];
    }

    return sum / (end - start) / 255; // Normalized to 0-1
  }

  getTrebleLevel(): number {
    const data = this.getFrequencyData();
    // High frequencies (upper 50% of spectrum)
    const start = Math.floor(data.length * 0.5);
    let sum = 0;

    for (let i = start; i < data.length; i++) {
      sum += data[i];
    }

    return sum / (data.length - start) / 255; // Normalized to 0-1
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(): void {
    if (this.source) {
      this.source.disconnect();
    }

    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }

    if (this.audioContext) {
      this.audioContext.close();
    }

    this.initialized = false;
  }
}
