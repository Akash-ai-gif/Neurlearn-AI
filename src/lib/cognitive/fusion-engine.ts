/**
 * Cognitive Fusion Engine
 * Weights and merges all 6 data streams into a single CognitiveState.
 * Uses configurable stream weights with exponential moving average smoothing.
 *
 * Stream weights (reflect reliability & richness):
 *   Face Analysis     → 0.30 (richest signal, real video data)
 *   Eye Tracking      → 0.20
 *   Typing Patterns   → 0.20
 *   Answer Quality    → 0.15 (most accurate but infrequent)
 *   Temporal Data     → 0.10 (baseline, always available)
 *   Voice Prosody     → 0.05 (optional, needs mic permission)
 */

import type { CognitiveState } from "@/types";

export interface StreamSignal {
  engagement?: number;
  confusion?: number;
  fatigue?: number;
  flow?: number;
  frustration?: number;
  confidence?: number;
}

export interface StreamStatus {
  eye: boolean;
  face: boolean;
  voice: boolean;
  typing: boolean;
  answer: boolean;
  temporal: boolean;
}

export interface FusedState extends CognitiveState {
  streamStatus: StreamStatus;
  dominantState: string;
  fusionConfidence: number; // 0-100: how many streams are active
  adaptiveRecommendation: string;
}

const WEIGHTS = {
  face:    0.30,
  eye:     0.20,
  typing:  0.20,
  answer:  0.15,
  temporal: 0.10,
  voice:   0.05,
};

const SMOOTHING = 0.2; // EMA alpha — higher = faster response

function clamp(v: number) { return Math.max(0, Math.min(100, v)); }

function ema(current: number, next: number, alpha: number) {
  return current * (1 - alpha) + next * alpha;
}

export class CognitiveFusionEngine {
  private state: CognitiveState = {
    engagement: 70, confusion: 15, flow: 60,
    fatigue: 20, frustration: 10, confidence: 70, timestamp: Date.now(),
  };

  private streamStatus: StreamStatus = {
    eye: false, face: false, voice: false,
    typing: false, answer: false, temporal: true, // temporal always active
  };

  private streamSignals: Record<keyof StreamStatus, StreamSignal> = {
    eye: {}, face: {}, voice: {}, typing: {}, answer: {}, temporal: {},
  };

  updateStream(stream: keyof StreamStatus, signal: StreamSignal) {
    this.streamSignals[stream] = signal;
    this.streamStatus[stream] = true;
    this.recalculate();
  }

  markStreamInactive(stream: keyof StreamStatus) {
    this.streamStatus[stream] = false;
  }

  private recalculate() {
    // Weighted sum for each dimension
    const dims = ["engagement", "confusion", "fatigue", "flow", "frustration", "confidence"] as const;
    const totals: Record<string, number> = {};
    const weightTotals: Record<string, number> = {};

    dims.forEach(d => { totals[d] = 0; weightTotals[d] = 0; });

    (Object.entries(this.streamSignals) as [keyof StreamStatus, StreamSignal][]).forEach(([stream, signal]) => {
      if (!this.streamStatus[stream]) return;
      const w = WEIGHTS[stream];
      dims.forEach(d => {
        const val = signal[d];
        if (val !== undefined) {
          totals[d] += val * w;
          weightTotals[d] += w;
        }
      });
    });

    // Normalize and apply EMA smoothing
    const next: Partial<CognitiveState> = {};
    dims.forEach(d => {
      if (weightTotals[d] > 0) {
        const raw = totals[d] / weightTotals[d];
        next[d] = clamp(ema(this.state[d], raw, SMOOTHING));
      } else {
        // No stream provided this signal — apply slight drift toward neutral
        next[d] = clamp(ema(this.state[d], 50, 0.02));
      }
    });

    this.state = { ...this.state, ...next, timestamp: Date.now() };
  }

  getState(): FusedState {
    const s = this.state;
    const activeStreams = Object.values(this.streamStatus).filter(Boolean).length;
    const fusionConfidence = Math.round((activeStreams / 6) * 100);

    const dominantState =
      s.confusion > 60 ? "confused" :
      s.fatigue > 70 ? "fatigued" :
      s.frustration > 55 ? "frustrated" :
      s.flow > 70 ? "in-flow" :
      s.engagement > 65 ? "engaged" : "neutral";

    const adaptiveRecommendation =
      s.confusion > 60 ? "Switching to simpler explanation mode" :
      s.fatigue > 70 ? "Recommending a 5-minute break" :
      s.frustration > 55 ? "Offering a step-by-step walkthrough" :
      s.flow > 70 ? "Advancing to challenge content" :
      s.engagement < 30 ? "Introducing an interactive element" :
      "Learning pace is optimal";

    return {
      ...s,
      streamStatus: { ...this.streamStatus },
      dominantState,
      fusionConfidence,
      adaptiveRecommendation,
    };
  }

  reset() {
    this.state = {
      engagement: 70, confusion: 15, flow: 60,
      fatigue: 20, frustration: 10, confidence: 70, timestamp: Date.now(),
    };
  }
}

// Singleton for use across hooks
export const fusionEngine = new CognitiveFusionEngine();
