/**
 * Stream 4: Typing Pattern Analyzer
 * Analyzes keystroke dynamics to infer cognitive load:
 *   - WPM → speed correlates with confidence
 *   - Backspace rate → high deletion = confusion/uncertainty
 *   - Pause duration → long pauses = thinking/fatigue
 *   - Burst pattern → erratic bursts = frustration
 */

export interface TypingMetrics {
  wpm: number;              // Words per minute
  backspaceRate: number;    // 0-100: % of keystrokes that are backspaces
  avgPauseDuration: number; // ms between key groups
  burstScore: number;       // 0-100: regularity of typing rhythm
  totalKeystrokes: number;
}

export class TypingStream {
  private keyTimestamps: number[] = [];
  private keystrokeCount = 0;
  private backspaceCount = 0;
  private pauses: number[] = [];
  private lastKeyTime = 0;
  private wordCount = 0;
  private sessionStart = Date.now();
  private handler: ((e: KeyboardEvent) => void) | null = null;

  start(element?: HTMLElement | Document) {
    const target = element || document;
    this.reset();
    this.handler = this.onKey.bind(this);
    target.addEventListener("keydown", this.handler as EventListener);
  }

  stop(element?: HTMLElement | Document) {
    const target = element || document;
    if (this.handler) {
      target.removeEventListener("keydown", this.handler as EventListener);
    }
  }

  private onKey(e: KeyboardEvent) {
    const now = Date.now();
    this.keystrokeCount++;

    if (e.key === "Backspace" || e.key === "Delete") {
      this.backspaceCount++;
    }
    if (e.key === " " || e.key === "Enter") {
      this.wordCount++;
    }

    if (this.lastKeyTime > 0) {
      const pause = now - this.lastKeyTime;
      // Only track "meaningful" pauses (> 200ms, < 10s)
      if (pause > 200 && pause < 10000) {
        this.pauses.push(pause);
      }
    }
    this.lastKeyTime = now;
    this.keyTimestamps.push(now);

    // Keep only last 100 events
    if (this.keyTimestamps.length > 100) {
      this.keyTimestamps.shift();
    }
  }

  getMetrics(): TypingMetrics {
    const elapsedMin = (Date.now() - this.sessionStart) / 60000;
    const wpm = elapsedMin > 0 ? Math.round(this.wordCount / elapsedMin) : 0;
    const backspaceRate = this.keystrokeCount > 0
      ? Math.min(100, (this.backspaceCount / this.keystrokeCount) * 100)
      : 0;
    const avgPause = this.pauses.length > 0
      ? this.pauses.reduce((a, b) => a + b, 0) / this.pauses.length
      : 0;

    // Burst score: low variance in inter-key intervals = smooth flow
    let burstScore = 50;
    if (this.keyTimestamps.length > 5) {
      const intervals: number[] = [];
      for (let i = 1; i < this.keyTimestamps.length; i++) {
        intervals.push(this.keyTimestamps[i] - this.keyTimestamps[i - 1]);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / intervals.length;
      // Low variance = smooth typing = high burst score
      burstScore = Math.max(0, Math.min(100, 100 - Math.sqrt(variance) / 5));
    }

    return { wpm: Math.min(200, wpm), backspaceRate, avgPauseDuration: avgPause, burstScore, totalKeystrokes: this.keystrokeCount };
  }

  /**
   * Convert typing metrics → cognitive signal (0-100 per dimension)
   */
  toCognitiveSignal(metrics: TypingMetrics): { confidence: number; confusion: number; flow: number } {
    // High WPM + low backspace = confident
    const confidence = Math.min(100, (metrics.wpm / 60) * 60 + (100 - metrics.backspaceRate) * 0.4);
    // High backspace rate + long pauses = confusion
    const confusion = Math.min(100, metrics.backspaceRate * 0.7 + (metrics.avgPauseDuration > 2000 ? 30 : 0));
    // Smooth rhythm + good WPM = flow
    const flow = Math.min(100, metrics.burstScore * 0.6 + (metrics.wpm > 20 ? 40 : metrics.wpm));
    return {
      confidence: Math.round(confidence),
      confusion: Math.round(confusion),
      flow: Math.round(flow),
    };
  }

  reset() {
    this.keyTimestamps = [];
    this.keystrokeCount = 0;
    this.backspaceCount = 0;
    this.pauses = [];
    this.lastKeyTime = 0;
    this.wordCount = 0;
    this.sessionStart = Date.now();
  }
}
