"use client";
/**
 * useCognitiveFusion — Master Hook
 * Orchestrates all 6 cognitive streams and feeds them into the Fusion Engine.
 * Replaces the old useCognitiveState hook everywhere in the app.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { fusionEngine, FusedState } from "@/lib/cognitive/fusion-engine";
import { TypingStream } from "@/lib/cognitive/typing-stream";
import { EyeStream } from "@/lib/cognitive/eye-stream";
import { VoiceStream } from "@/lib/cognitive/voice-stream";
import { TemporalStream } from "@/lib/cognitive/temporal-stream";
import { AnswerStream, AnswerRecord } from "@/lib/cognitive/answer-stream";

export type { FusedState };

const DEFAULT_STATE: FusedState = {
  engagement: 70, confusion: 15, flow: 60, fatigue: 20,
  frustration: 10, confidence: 70, timestamp: Date.now(),
  streamStatus: { eye: false, face: false, voice: false, typing: false, answer: false, temporal: true },
  dominantState: "neutral",
  fusionConfidence: 16,
  adaptiveRecommendation: "Starting cognitive analysis...",
};

export function useCognitiveFusion() {
  const [fusedState, setFusedState] = useState<FusedState>(DEFAULT_STATE);
  const [isTracking, setIsTracking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);

  // Stream instances (stable refs)
  const typingRef = useRef(new TypingStream());
  const eyeRef    = useRef(new EyeStream());
  const voiceRef  = useRef(new VoiceStream());
  const temporalRef = useRef(new TemporalStream());
  const answerRef = useRef(new AnswerStream());
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Tick: read all streams every 1.5s ──────────────────────────────────────
  const tick = useCallback(() => {
    // Stream 4: Typing
    const typingM = typingRef.current.getMetrics();
    fusionEngine.updateStream("typing", typingRef.current.toCognitiveSignal(typingM));

    // Stream 1: Eye
    const eyeM = eyeRef.current.getMetrics();
    fusionEngine.updateStream("eye", eyeRef.current.toCognitiveSignal(eyeM));

    // Stream 6: Temporal
    const temporalM = temporalRef.current.getMetrics();
    fusionEngine.updateStream("temporal", temporalRef.current.toCognitiveSignal(temporalM));

    // Stream 5: Answer (runs passively via recordAnswer)
    const answerM = answerRef.current.getMetrics();
    fusionEngine.updateStream("answer", answerRef.current.toCognitiveSignal(answerM));

    // Stream 3: Voice (if active)
    if (voiceEnabled) {
      const voiceM = voiceRef.current.getMetrics();
      if (voiceM.isActive) {
        fusionEngine.updateStream("voice", voiceRef.current.toCognitiveSignal(voiceM));
      } else {
        fusionEngine.markStreamInactive("voice");
      }
    }

    setFusedState(fusionEngine.getState());
    setSessionDuration(prev => prev + 1.5);
  }, [voiceEnabled]);

  // ── Start / Stop tracking ──────────────────────────────────────────────────
  const startTracking = useCallback(async () => {
    typingRef.current.start();
    eyeRef.current.start();
    temporalRef.current.resetSession();
    setIsTracking(true);
    intervalRef.current = setInterval(tick, 1500);
  }, [tick]);

  const stopTracking = useCallback(() => {
    setIsTracking(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    typingRef.current.stop();
    eyeRef.current.stop();
    fusionEngine.markStreamInactive("eye");
    fusionEngine.markStreamInactive("typing");
  }, []);

  const enableVoice = useCallback(async () => {
    const ok = await voiceRef.current.start();
    if (ok) {
      setVoiceEnabled(true);
      return true;
    }
    return false;
  }, []);

  const disableVoice = useCallback(() => {
    voiceRef.current.stop();
    setVoiceEnabled(false);
    fusionEngine.markStreamInactive("voice");
  }, []);

  // ── Called from FaceTracker component (Stream 2) ────────────────────────────
  const updateFaceStream = useCallback((metrics: {
    engagement: number;
    confusion: number;
    fatigue: number;
    eyeContact: number;
  }) => {
    fusionEngine.updateStream("face", {
      engagement: metrics.engagement,
      confusion: metrics.confusion,
      fatigue: metrics.fatigue,
      flow: metrics.eyeContact, // proxy for focus/flow
    });
    // Pass blink-proxy to eye stream
    eyeRef.current.setBlinkRate(100 - metrics.fatigue);
  }, []);

  // ── Called from quiz/answer components (Stream 5) ─────────────────────────
  const recordAnswer = useCallback((record: Omit<AnswerRecord, "timestamp">) => {
    answerRef.current.recordAnswer(record);
  }, []);

  // ── Restart tick when voiceEnabled changes ────────────────────────────────
  useEffect(() => {
    if (!isTracking) return;
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(tick, 1500);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [isTracking, tick]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopTracking();
      voiceRef.current.stop();
    };
  }, [stopTracking]);

  // Backward-compat shim — old components used updateState(partial)
  const updateState = useCallback((partial: Partial<typeof fusedState>) => {
    if (partial.engagement !== undefined || partial.fatigue !== undefined) {
      fusionEngine.updateStream("face", partial);
      setFusedState(fusionEngine.getState());
    }
  }, []);

  return {
    state: fusedState,          // Full FusedState (all 6 streams merged)
    isTracking,
    voiceEnabled,
    sessionDuration,
    startTracking,
    stopTracking,
    enableVoice,
    disableVoice,
    updateFaceStream,           // Pass to <FaceTracker onStateUpdate={updateFaceStream} />
    recordAnswer,               // Pass to quiz components
    updateState,                // Backward compat
    // Convenience accessors
    dominantState: fusedState.dominantState,
    fusionConfidence: fusedState.fusionConfidence,
    adaptiveRecommendation: fusedState.adaptiveRecommendation,
  };
}
