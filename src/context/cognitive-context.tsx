"use client";
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

export type CognitiveState = {
  engagement: number;
  confusion: number;
  fatigue: number;
  eyeContact: number;
  focus: number;
  stress: number;
  flow: number;
  frustration: number;
  confidence: number;
  dominantState: string;
  fusionConfidence: number;
  adaptiveRecommendation: string;
  streamStatus: {
    eye: boolean;
    face: boolean;
    voice: boolean;
    typing: boolean;
    answer: boolean;
    temporal: boolean;
  };
  timestamp: number;
};

type CognitiveContextType = {
  state: CognitiveState;
  isTracking: boolean;
  voiceEnabled: boolean;
  sessionDuration: number;
  startTracking: () => void;
  stopTracking: () => void;
  enableVoice: () => Promise<void>;
  disableVoice: () => void;
  updateFaceStream: (metrics: Partial<CognitiveState>) => void;
  updateState: (update: Partial<CognitiveState>) => void;
  dominantState: string;
  fusionConfidence: number;
  adaptiveRecommendation: string;
};

const CognitiveContext = createContext<CognitiveContextType | undefined>(undefined);

export function CognitiveProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<CognitiveState>({
    engagement: 75,
    confusion: 15,
    fatigue: 10,
    eyeContact: 85,
    focus: 80,
    stress: 20,
    flow: 65,
    frustration: 10,
    confidence: 88,
    dominantState: "engaged",
    fusionConfidence: 82,
    adaptiveRecommendation: "Maintain current focus. You are in a high engagement zone.",
    streamStatus: {
      eye: true,
      face: true,
      voice: false,
      typing: true,
      answer: true,
      temporal: true,
    },
    timestamp: Date.now(),
  });

  const [isTracking, setIsTracking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isTracking) {
      timerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);

      // Interaction-based cognitive simulation (no camera needed)
      // Simulates realistic cognitive state changes based on session duration
      const cogInterval = setInterval(() => {
        setState(prev => {
          const mins = sessionDuration / 60;
          // Fatigue increases gradually over time (realistic learning fatigue curve)
          const fatigueDelta = mins > 20 ? 0.8 : mins > 10 ? 0.4 : 0.1;
          // Engagement naturally dips over long sessions
          const engagementDrift = mins > 15 ? -0.3 : mins > 5 ? 0.1 : 0.2;
          // Small random variation to feel organic
          const rand = () => (Math.random() - 0.5) * 3;

          const newState = {
            ...prev,
            fatigue: Math.min(100, Math.max(0, prev.fatigue + fatigueDelta + rand())),
            engagement: Math.min(100, Math.max(10, prev.engagement + engagementDrift + rand())),
            focus: Math.min(100, Math.max(10, prev.focus + rand() * 0.5)),
            confusion: Math.min(100, Math.max(0, prev.confusion + rand() * 0.3)),
            stress: Math.min(100, Math.max(0, prev.stress + rand() * 0.2)),
            flow: Math.min(100, Math.max(0, prev.engagement > 70 && prev.focus > 70 ? prev.flow + 0.5 : prev.flow - 0.3)),
            eyeContact: Math.min(100, Math.max(30, 75 + rand())),
            confidence: Math.min(100, Math.max(20, prev.confidence + rand() * 0.2)),
            streamStatus: { ...prev.streamStatus, eye: false, face: false, typing: true, answer: true, temporal: true },
          };

          // Determine dominant state
          let dom = "engaged";
          let rec = "You are doing great! Keep going.";
          if (newState.confusion > 60) { dom = "confused"; rec = "I noticed some confusion. Let's break this down."; }
          else if (newState.fatigue > 55) { dom = "fatigued"; rec = "You seem tired. Try Visual Mode to recharge."; }
          else if (newState.engagement > 85 && newState.focus > 85) { dom = "in-flow"; rec = "Peak flow! Ideal for complex challenges!"; }
          else if (newState.stress > 70) { dom = "frustrated"; rec = "Stress rising. Let's take a quick break."; }

          const conf = Math.min(100, Math.round(newState.engagement * 0.4 + newState.focus * 0.3 + 30));

          return { ...newState, dominantState: dom, adaptiveRecommendation: rec, fusionConfidence: conf };
        });
      }, 3000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearInterval(cogInterval);
      };
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isTracking, sessionDuration]);

  const startTracking = useCallback(() => setIsTracking(true), []);
  const stopTracking = useCallback(() => setIsTracking(false), []);

  const enableVoice = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setVoiceEnabled(true);
      setState(prev => ({ ...prev, streamStatus: { ...prev.streamStatus, voice: true } }));
    } catch (err) {
      console.error("Mic access denied:", err);
      setVoiceEnabled(false);
    }
  }, []);

  const disableVoice = useCallback(() => {
    setVoiceEnabled(false);
    setState(prev => ({ ...prev, streamStatus: { ...prev.streamStatus, voice: false } }));
  }, []);

  const updateFaceStream = useCallback((metrics: Partial<CognitiveState>) => {
    setState((prev) => {
      const newState = { ...prev, ...metrics };
      
      // Dynamic Dominant State Logic
      let dom = "engaged";
      let rec = "You are doing great! Keep going.";
      
      if (newState.confusion > 60) {
        dom = "confused";
        rec = "I noticed some confusion. Let's break this down into smaller steps.";
      } else if (newState.fatigue > 55) {
        dom = "fatigued";
        rec = "You seem tired. Switching to Visual Mode might help you recharge.";
      } else if (newState.engagement > 85 && newState.focus > 85) {
        dom = "in-flow";
        rec = "Peak flow detected. Ideal time for complex challenges!";
      } else if (newState.stress > 70) {
        dom = "frustrated";
        rec = "Stress levels are rising. Let's take a quick micro-break.";
      }

      const conf = Math.min(100, Math.round(newState.engagement * 0.4 + newState.eyeContact * 0.3 + 30));

      return { 
        ...newState, 
        dominantState: dom, 
        adaptiveRecommendation: rec,
        fusionConfidence: conf
      };
    });
  }, []);

  const updateState = useCallback((update: Partial<CognitiveState>) => {
    setState((prev) => ({ ...prev, ...update }));
  }, []);

  return (
    <CognitiveContext.Provider value={{
      state, isTracking, voiceEnabled, sessionDuration,
      startTracking, stopTracking, enableVoice, disableVoice,
      updateFaceStream, updateState,
      dominantState: state.dominantState,
      fusionConfidence: state.fusionConfidence,
      adaptiveRecommendation: state.adaptiveRecommendation
    }}>
      {children}
    </CognitiveContext.Provider>
  );
}

export function useCognitiveFusion() {
  const context = useContext(CognitiveContext);
  if (!context) throw new Error("useCognitiveFusion must be used within a CognitiveProvider");
  return context;
}
