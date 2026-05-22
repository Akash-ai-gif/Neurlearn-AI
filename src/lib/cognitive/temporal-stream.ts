/**
 * Stream 6: Temporal Data Analyzer
 * Uses time-of-day, session length, and break patterns:
 *   - Peak learning hours (9am-12pm, 3pm-6pm)
 *   - Session fatigue curve (diminishing returns after 45min)
 *   - Break frequency → cognitive recovery
 */

export interface TemporalMetrics {
  hourOfDay: number;       // 0-23
  sessionMinutes: number;  // current session length
  peakHourScore: number;   // 0-100: how optimal is the current hour
  sessionFatigue: number;  // 0-100: fatigue from session length
  dayOfWeek: number;       // 0=Sun, 6=Sat
  breaksSinceLast: number; // minutes since last break
}

const PEAK_HOURS: Record<number, number> = {
  6: 50, 7: 65, 8: 75, 9: 90, 10: 95, 11: 90,
  12: 70, 13: 55, 14: 60, 15: 80, 16: 85, 17: 75,
  18: 60, 19: 55, 20: 45, 21: 35, 22: 25, 23: 15,
};

export class TemporalStream {
  private sessionStart = Date.now();
  private lastBreak = Date.now();

  recordBreak() {
    this.lastBreak = Date.now();
  }

  resetSession() {
    this.sessionStart = Date.now();
  }

  getMetrics(): TemporalMetrics {
    const now = new Date();
    const hourOfDay = now.getHours();
    const sessionMinutes = (Date.now() - this.sessionStart) / 60000;
    const minutesSinceBreak = (Date.now() - this.lastBreak) / 60000;

    const peakHourScore = PEAK_HOURS[hourOfDay] ?? 40;

    // Fatigue curve: starts at 0, peaks exponentially after 45 min
    const sessionFatigue = Math.min(100,
      sessionMinutes < 15 ? 5 :
      sessionMinutes < 30 ? 10 :
      sessionMinutes < 45 ? 20 :
      sessionMinutes < 60 ? 40 :
      sessionMinutes < 90 ? 65 :
      80 + Math.min(20, (sessionMinutes - 90) * 0.5)
    );

    return {
      hourOfDay,
      sessionMinutes: Math.round(sessionMinutes),
      peakHourScore,
      sessionFatigue: Math.round(sessionFatigue),
      dayOfWeek: now.getDay(),
      breaksSinceLast: Math.round(minutesSinceBreak),
    };
  }

  toCognitiveSignal(m: TemporalMetrics): { engagement: number; fatigue: number; flow: number } {
    const engagement = Math.min(100, m.peakHourScore * 0.6 + (m.sessionFatigue < 30 ? 30 : 10));
    const fatigue = Math.min(100, m.sessionFatigue * 0.7 + (m.breaksSinceLast > 60 ? 25 : 0));
    const flow = Math.min(100,
      m.peakHourScore * 0.4 +
      (m.sessionMinutes > 5 && m.sessionFatigue < 50 ? 40 : 10) +
      (m.breaksSinceLast < 30 ? 20 : 0)
    );
    return {
      engagement: Math.round(engagement),
      fatigue: Math.round(fatigue),
      flow: Math.round(flow),
    };
  }
}
