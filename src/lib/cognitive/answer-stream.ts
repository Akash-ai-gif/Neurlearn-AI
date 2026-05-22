/**
 * Stream 5: Answer Quality Evaluator
 * Scores the quality of user answers/responses to detect:
 *   - Comprehension level → confidence, confusion
 *   - Improvement over time → flow state
 *   - Speed of response → cognitive load
 */

export interface AnswerRecord {
  questionId: string;
  isCorrect: boolean;
  responseTimeMs: number;
  attemptNumber: number;
  timestamp: number;
}

export interface AnswerMetrics {
  recentAccuracy: number;     // 0-100: last 5 answers
  avgResponseTime: number;    // ms
  improvementTrend: number;   // -100 to 100: positive = improving
  totalAttempts: number;
  streakCorrect: number;      // consecutive correct answers
}

export class AnswerStream {
  private records: AnswerRecord[] = [];

  recordAnswer(record: Omit<AnswerRecord, "timestamp">) {
    this.records.push({ ...record, timestamp: Date.now() });
    // Keep last 20 answers
    if (this.records.length > 20) this.records.shift();
  }

  getMetrics(): AnswerMetrics {
    if (this.records.length === 0) {
      return { recentAccuracy: 70, avgResponseTime: 3000, improvementTrend: 0, totalAttempts: 0, streakCorrect: 0 };
    }

    const recent = this.records.slice(-5);
    const recentAccuracy = (recent.filter(r => r.isCorrect).length / recent.length) * 100;

    const avgResponseTime = this.records.reduce((s, r) => s + r.responseTimeMs, 0) / this.records.length;

    // Improvement trend: compare first half vs second half accuracy
    let improvementTrend = 0;
    if (this.records.length >= 4) {
      const half = Math.floor(this.records.length / 2);
      const firstHalf = this.records.slice(0, half);
      const secondHalf = this.records.slice(half);
      const firstAcc = firstHalf.filter(r => r.isCorrect).length / firstHalf.length;
      const secondAcc = secondHalf.filter(r => r.isCorrect).length / secondHalf.length;
      improvementTrend = (secondAcc - firstAcc) * 100;
    }

    // Consecutive correct streak
    let streakCorrect = 0;
    for (let i = this.records.length - 1; i >= 0; i--) {
      if (this.records[i].isCorrect) streakCorrect++;
      else break;
    }

    return {
      recentAccuracy: Math.round(recentAccuracy),
      avgResponseTime: Math.round(avgResponseTime),
      improvementTrend: Math.round(improvementTrend),
      totalAttempts: this.records.length,
      streakCorrect,
    };
  }

  toCognitiveSignal(m: AnswerMetrics): { confidence: number; confusion: number; flow: number; engagement: number } {
    const confidence = Math.min(100, m.recentAccuracy * 0.7 + m.streakCorrect * 5);
    const confusion = Math.min(100, (100 - m.recentAccuracy) * 0.6 + (m.avgResponseTime > 8000 ? 30 : 0));
    const flow = Math.min(100,
      m.recentAccuracy * 0.4 +
      (m.improvementTrend > 0 ? 30 : 0) +
      (m.streakCorrect > 2 ? 30 : 0)
    );
    const engagement = Math.min(100, m.totalAttempts > 0 ? 60 + m.recentAccuracy * 0.4 : 50);
    return {
      confidence: Math.round(confidence),
      confusion: Math.round(confusion),
      flow: Math.round(flow),
      engagement: Math.round(engagement),
    };
  }
}
