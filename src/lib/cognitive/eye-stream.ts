/**
 * Stream 1: Eye / Gaze Tracking
 * Two layers:
 *   Layer A – Cursor heuristics (always available):
 *     Mouse velocity, dwell time, scroll patterns
 *   Layer B – Webcam gaze (when camera is active):
 *     Receives gaze region from FaceTracker pixel analysis
 *
 * Maps to: engagement (focus on content), confusion (erratic movement),
 * fatigue (slow/no movement), flow (smooth linear tracking)
 */

export interface EyeMetrics {
  gazeRegion: "center" | "edges" | "off";   // where on screen
  dwellTime: number;         // ms dwelling on one spot
  movementVelocity: number;  // 0-100 cursor speed
  scrollBehavior: number;    // 0-100 scroll frequency
  blinkRate: number;         // 0-100 from face tracker (if available)
  saccadeScore: number;      // 0-100 smoothness of movement
}

export class EyeStream {
  private positions: { x: number; y: number; t: number }[] = [];
  private scrollEvents = 0;
  private dwellStart = 0;
  private dwellPos = { x: 0, y: 0 };
  private blinkRate = 50; // set externally from face tracker
  private sessionStart = Date.now();
  private mouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private scrollHandler: (() => void) | null = null;

  start() {
    this.sessionStart = Date.now();
    this.positions = [];
    this.scrollEvents = 0;
    this.dwellStart = Date.now();

    this.mouseMoveHandler = (e: MouseEvent) => {
      const now = Date.now();
      this.positions.push({ x: e.clientX, y: e.clientY, t: now });
      if (this.positions.length > 60) this.positions.shift();

      // Reset dwell if moved significantly
      const dx = e.clientX - this.dwellPos.x;
      const dy = e.clientY - this.dwellPos.y;
      if (Math.sqrt(dx * dx + dy * dy) > 30) {
        this.dwellStart = now;
        this.dwellPos = { x: e.clientX, y: e.clientY };
      }
    };

    this.scrollHandler = () => {
      this.scrollEvents++;
    };

    document.addEventListener("mousemove", this.mouseMoveHandler);
    document.addEventListener("scroll", this.scrollHandler, { passive: true });
  }

  stop() {
    if (this.mouseMoveHandler) document.removeEventListener("mousemove", this.mouseMoveHandler);
    if (this.scrollHandler) document.removeEventListener("scroll", this.scrollHandler);
  }

  // Called from FaceTracker when camera data is available
  setBlinkRate(rate: number) {
    this.blinkRate = rate;
  }

  getMetrics(): EyeMetrics {
    const now = Date.now();
    const elapsed = (now - this.sessionStart) / 1000; // seconds

    // Movement velocity (pixels per second)
    let velocity = 0;
    let saccadeScore = 50;
    if (this.positions.length > 2) {
      const recent = this.positions.slice(-10);
      let totalDist = 0;
      let dirChanges = 0;
      for (let i = 1; i < recent.length; i++) {
        const dx = recent[i].x - recent[i - 1].x;
        const dy = recent[i].y - recent[i - 1].y;
        totalDist += Math.sqrt(dx * dx + dy * dy);
        if (i > 1) {
          const pdx = recent[i - 1].x - recent[i - 2].x;
          const pdy = recent[i - 1].y - recent[i - 2].y;
          // Direction change = saccade
          if (Math.sign(dx) !== Math.sign(pdx) || Math.sign(dy) !== Math.sign(pdy)) dirChanges++;
        }
      }
      const timeDelta = (recent[recent.length - 1].t - recent[0].t) / 1000;
      velocity = timeDelta > 0 ? Math.min(100, (totalDist / timeDelta) / 10) : 0;
      // Fewer direction changes = smoother = higher saccade score
      saccadeScore = Math.max(0, 100 - dirChanges * 15);
    }

    // Dwell time (time spent on current spot)
    const dwellTime = now - this.dwellStart;

    // Gaze region based on last position
    let gazeRegion: "center" | "edges" | "off" = "off";
    if (this.positions.length > 0) {
      const last = this.positions[this.positions.length - 1];
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = Math.abs(last.x - cx) / window.innerWidth;
      const dy = Math.abs(last.y - cy) / window.innerHeight;
      gazeRegion = (dx < 0.3 && dy < 0.35) ? "center" : "edges";
    }

    // Scroll frequency
    const scrollBehavior = elapsed > 0 ? Math.min(100, (this.scrollEvents / elapsed) * 30) : 0;

    return {
      gazeRegion,
      dwellTime,
      movementVelocity: Math.round(velocity),
      scrollBehavior: Math.round(scrollBehavior),
      blinkRate: this.blinkRate,
      saccadeScore: Math.round(saccadeScore),
    };
  }

  toCognitiveSignal(m: EyeMetrics): { engagement: number; confusion: number; fatigue: number; flow: number } {
    // Center gaze + long dwell = engaged with content
    const gazeBonus = m.gazeRegion === "center" ? 30 : m.gazeRegion === "edges" ? 10 : 0;
    const engagement = Math.min(100, gazeBonus + (m.movementVelocity > 5 ? 40 : 20) + m.saccadeScore * 0.3);

    // Very high velocity + many direction changes = scanning/confused
    const confusion = Math.min(100,
      (m.movementVelocity > 70 ? 40 : 0) +
      (100 - m.saccadeScore) * 0.5 +
      (m.scrollBehavior > 60 ? 20 : 0)
    );

    // Very slow movement + long dwell = either deep focus or fatigue
    const fatigue = Math.min(100,
      (m.movementVelocity < 5 ? 40 : 0) +
      (m.dwellTime > 15000 ? 30 : 0) +
      (m.blinkRate > 70 ? 20 : 0)
    );

    // Smooth, moderate velocity + center gaze = flow
    const flow = Math.min(100,
      m.saccadeScore * 0.5 +
      (m.movementVelocity > 10 && m.movementVelocity < 60 ? 30 : 0) +
      gazeBonus * 0.5
    );

    return {
      engagement: Math.round(engagement),
      confusion: Math.round(confusion),
      fatigue: Math.round(fatigue),
      flow: Math.round(flow),
    };
  }
}
