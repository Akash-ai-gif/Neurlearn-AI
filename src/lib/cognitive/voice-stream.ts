/**
 * Stream 3: Voice Prosody Analyzer
 * Uses Web Audio API to analyze microphone input in real-time:
 *   - Volume/Energy → engagement level
 *   - Pitch variance → emotional state
 *   - Speaking rate → cognitive load
 *   - Silence ratio → fatigue / disengagement
 */

export interface VoiceMetrics {
  volume: number;          // 0-100 RMS energy
  pitchVariance: number;   // 0-100 spectral variance
  silenceRatio: number;    // 0-1 fraction of silence
  speakingRate: number;    // 0-100 estimated rate
  isActive: boolean;
}

export class VoiceStream {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private dataArray: Uint8Array | null = null;
  private silentFrames = 0;
  private totalFrames = 0;
  private pitchHistory: number[] = [];
  private isRunning = false;

  async start(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      this.ctx = new AudioContext();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.source = this.ctx.createMediaStreamSource(this.stream);
      this.source.connect(this.analyser);
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.isRunning = true;
      return true;
    } catch {
      return false;
    }
  }

  stop() {
    this.isRunning = false;
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
  }

  getMetrics(): VoiceMetrics {
    if (!this.analyser || !this.dataArray || !this.isRunning) {
      return { volume: 0, pitchVariance: 0, silenceRatio: 1, speakingRate: 0, isActive: false };
    }

    this.analyser.getByteFrequencyData(this.dataArray as any);
    this.totalFrames++;

    // RMS volume
    const sum = this.dataArray.reduce((s, v) => s + v * v, 0);
    const rms = Math.sqrt(sum / this.dataArray.length);
    const volume = Math.min(100, (rms / 128) * 100);

    // Silence detection
    const SILENCE_THRESHOLD = 8;
    if (volume < SILENCE_THRESHOLD) this.silentFrames++;
    const silenceRatio = this.totalFrames > 0 ? this.silentFrames / this.totalFrames : 1;

    // Spectral centroid (pitch proxy) using lower 32 bins (voice range)
    const voiceBins = Array.from(this.dataArray.slice(0, 32));
    const centroid = voiceBins.reduce((s, v, i) => s + v * i, 0) /
      Math.max(1, voiceBins.reduce((s, v) => s + v, 0));

    this.pitchHistory.push(centroid);
    if (this.pitchHistory.length > 20) this.pitchHistory.shift();

    // Pitch variance
    const mean = this.pitchHistory.reduce((a, b) => a + b, 0) / this.pitchHistory.length;
    const variance = this.pitchHistory.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / this.pitchHistory.length;
    const pitchVariance = Math.min(100, Math.sqrt(variance) * 5);

    // Speaking rate proxy: zero-crossings in voice band
    let crossings = 0;
    for (let i = 1; i < voiceBins.length; i++) {
      if ((voiceBins[i] > 50) !== (voiceBins[i - 1] > 50)) crossings++;
    }
    const speakingRate = Math.min(100, crossings * 10);

    return { volume, pitchVariance, silenceRatio, speakingRate, isActive: this.isRunning };
  }

  toCognitiveSignal(m: VoiceMetrics): { engagement: number; fatigue: number; frustration: number } {
    // High volume + low silence → engaged
    const engagement = Math.min(100, m.volume * 0.6 + (1 - m.silenceRatio) * 40);
    // High silence + low volume → fatigue
    const fatigue = Math.min(100, m.silenceRatio * 60 + (m.volume < 10 ? 30 : 0));
    // High pitch variance + high volume → frustration/excitement
    const frustration = Math.min(100, m.pitchVariance * 0.5 + (m.volume > 70 ? 20 : 0));
    return {
      engagement: Math.round(engagement),
      fatigue: Math.round(fatigue),
      frustration: Math.round(frustration),
    };
  }
}
