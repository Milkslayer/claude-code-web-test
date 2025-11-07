export type AudioSource = 'microphone' | 'system' | 'tab';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;

  private fftSize = 2048;
  private smoothingTimeConstant = 0.8;
  private initialized = false;
  private currentSource: AudioSource | null = null;

  async initialize(preferredSource: AudioSource = 'system'): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      switch (preferredSource) {
        case 'system':
          await this.captureSystemAudio();
          break;
        case 'tab':
          await this.captureTabAudio();
          break;
        case 'microphone':
          await this.captureMicrophone();
          break;
      }
      this.currentSource = preferredSource;
      return true;
    } catch (error) {
      console.error(`Failed to capture ${preferredSource} audio:`, error);

      // Try fallbacks
      if (preferredSource !== 'microphone') {
        console.log('Falling back to microphone...');
        try {
          await this.captureMicrophone();
          this.currentSource = 'microphone';
          return true;
        } catch (micError) {
          console.error('Microphone fallback failed:', micError);
          return false;
        }
      }

      return false;
    }
  }

  private async captureSystemAudio(): Promise<void> {
    // Use getDisplayMedia for screen/system audio capture
    // Chrome supports systemAudio option but it's not in TypeScript types yet
    const constraints: any = {
      video: false,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    };

    // Try to enable system audio for Chrome (experimental)
    if (constraints.audio) {
      constraints.audio.systemAudio = 'include';
    }

    this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);

    // Check if audio track was actually captured
    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio track in display capture stream');
    }

    this.setupAudioNodes();
    this.initialized = true;
  }

  private async captureTabAudio(): Promise<void> {
    // Use getDisplayMedia for tab audio capture
    this.stream = await navigator.mediaDevices.getDisplayMedia({
      video: false,
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    // Check if audio track was actually captured
    const audioTracks = this.stream.getAudioTracks();
    if (audioTracks.length === 0) {
      throw new Error('No audio track in tab capture stream');
    }

    this.setupAudioNodes();
    this.initialized = true;
  }

  private async captureMicrophone(): Promise<void> {
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

  // Enhanced 5-band frequency analysis
  getSubBassLevel(): number {
    const data = this.getFrequencyData();
    // Sub bass: 20-60 Hz (first 3% of bins)
    const range = Math.floor(data.length * 0.03);
    let sum = 0;

    for (let i = 0; i < range; i++) {
      sum += data[i];
    }

    return sum / range / 255;
  }

  getLowMidLevel(): number {
    const data = this.getFrequencyData();
    // Low mids: 250-500 Hz (10-25% of bins)
    const start = Math.floor(data.length * 0.1);
    const end = Math.floor(data.length * 0.25);
    let sum = 0;

    for (let i = start; i < end; i++) {
      sum += data[i];
    }

    return sum / (end - start) / 255;
  }

  getHighMidLevel(): number {
    const data = this.getFrequencyData();
    // High mids: 2-4 kHz (25-50% of bins)
    const start = Math.floor(data.length * 0.25);
    const end = Math.floor(data.length * 0.5);
    let sum = 0;

    for (let i = start; i < end; i++) {
      sum += data[i];
    }

    return sum / (end - start) / 255;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  getCurrentSource(): AudioSource | null {
    return this.currentSource;
  }

  async switchSource(newSource: AudioSource): Promise<boolean> {
    // Dispose current source
    this.dispose();

    // Initialize with new source
    return await this.initialize(newSource);
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
    this.currentSource = null;
  }
}
