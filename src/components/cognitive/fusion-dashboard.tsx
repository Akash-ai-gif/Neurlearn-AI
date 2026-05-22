"use client";
/**
 * 6-Stream Cognitive Fusion Dashboard
 * Premium visual panel showing all 6 real-time data streams with live bars,
 * stream status indicators, dominant state badge, and adaptive recommendation.
 */
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Keyboard, Target, Clock,
  Activity, Brain, Zap, AlertTriangle, Coffee,
  TrendingUp, Shield, Waves
} from "lucide-react";
import { useCognitiveFusion, type CognitiveState as FusedState } from "@/context/cognitive-context";

interface Props {
  state: FusedState;
  isTracking: boolean;
  voiceEnabled: boolean;
  sessionDuration: number;
  onToggleVoice?: () => void;
}

const STREAM_CONFIG = [
  { key: "temporal", label: "Session Timer",      icon: Clock,    color: "#00D1FF", desc: "Time context" },
  { key: "typing",   label: "Typing Patterns",    icon: Keyboard, color: "#00F5A0", desc: "Keystroke flow" },
  { key: "voice",    label: "Voice Prosody",       icon: Mic,      color: "#7C3AED", desc: "Tone & energy" },
  { key: "answer",   label: "Answer Quality",      icon: Target,   color: "#FFB800", desc: "Accuracy data" },
] as const;

const STATE_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  "in-flow":    { label: "Peak Flow",   color: "#00F5A0", icon: Zap },
  "engaged":    { label: "High Focus",   color: "#00B4D8", icon: Activity },
  "neutral":    { label: "Stable",      color: "#64748B", icon: Brain },
  "confused":   { label: "Confusion",   color: "#FFB800", icon: AlertTriangle },
  "fatigued":   { label: "Fatigue",     color: "#FF3366", icon: Coffee },
  "frustrated": { label: "Frustration", color: "#FF6B35", icon: AlertTriangle },
};

const METRIC_BARS = [
  { key: "engagement",  label: "Engagement",  color: "#00D1FF", icon: Zap },
  { key: "confusion",   label: "Confusion",   color: "#FFB800", icon: AlertTriangle },
  { key: "flow",        label: "Flow State",  color: "#00F5A0", icon: Waves },
  { key: "fatigue",     label: "Fatigue",     color: "#FF3366", icon: Coffee },
  { key: "frustration", label: "Frustration", color: "#FF6B35", icon: AlertTriangle },
  { key: "confidence",  label: "Confidence",  color: "#7C3AED", icon: Shield },
] as const;

export function CognitiveFusionDashboard({
  state, isTracking, voiceEnabled, sessionDuration, onToggleVoice,
}: Props) {
  const badge = STATE_BADGES[state.dominantState] || STATE_BADGES.neutral;
  const BadgeIcon = badge.icon;
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-3">
      {/* Header: Dominant State + Fusion Confidence */}
      <div className="glass p-4 rounded-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[#00B4D8]/10">
              <Brain className="w-3.5 h-3.5 text-[#00B4D8]" />
            </div>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
              Cognitive State
            </span>
          </div>
          {isTracking && (
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-bold text-emerald-600 uppercase">Live</span>
            </div>
          )}
        </div>

        {/* Dominant state badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={state.dominantState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex items-center gap-3 p-3 rounded-xl mb-4 bg-slate-50 border border-slate-100"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm" style={{ background: badge.color }}>
              <BadgeIcon className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 leading-none mb-1">{badge.label}</div>
              <div className="text-[9px] text-slate-400 font-medium">{formatTime(sessionDuration)} session</div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Fusion confidence bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider">
            <span className="text-slate-400">Fusion Accuracy</span>
            <span className="text-slate-700">{state.fusionConfidence}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-[#00B4D8]"
              animate={{ width: `${state.fusionConfidence}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      {/* 6-Stream Status Grid */}
      <div className="glass p-4 rounded-2xl">
        <div className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">
          Real-time Streams
        </div>
        <div className="grid grid-cols-2 gap-2">
          {STREAM_CONFIG.map(({ key, label, icon: Icon, color }) => {
            const active = state.streamStatus[key as keyof typeof state.streamStatus];
            return (
              <motion.div
                key={key}
                className={`flex items-center gap-2 p-2 rounded-xl transition-all border ${
                  active
                    ? "bg-white border-slate-100 shadow-sm"
                    : "opacity-20 border-transparent"
                }`}
              >
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: active ? `${color}15` : "transparent" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: active ? color : "#94A3B8" }} />
                </div>
                <div className="min-w-0">
                  <div className="text-[9px] font-bold truncate text-slate-500">
                    {label.split(' ')[0]}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Voice toggle button */}
        {onToggleVoice && (
          <button
            onClick={onToggleVoice}
            className={`w-full mt-2 py-1.5 text-[10px] rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              voiceEnabled
                ? "bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/20"
                : "bg-slate-900/[0.03] text-slate-800/30 border border-slate-900/5 hover:bg-slate-900/[0.05]"
            }`}
          >
            <Mic className="w-3 h-3" />
            {voiceEnabled ? "Mic Active" : "Enable Mic"}
          </button>
        )}
      </div>

      {/* Fused Metrics */}
      <div className="glass p-3 rounded-xl space-y-2">
        <div className="text-[10px] text-slate-800/30 uppercase tracking-widest font-semibold">
          Fused Metrics
        </div>
        {METRIC_BARS.map(({ key, label, color, icon: Icon }) => {
          const value = state[key as keyof typeof state] as number;
          return (
            <div key={key} className="space-y-0.5">
              <div className="flex justify-between text-[9px] text-slate-800/30">
                <span className="flex items-center gap-1">
                  <Icon className="w-2.5 h-2.5" style={{ color }} />
                  {label}
                </span>
                <span>{Math.round(value)}%</span>
              </div>
              <div className="h-1 bg-slate-900/5 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: color }}
                  animate={{ width: `${value}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Adaptive Recommendation */}
      {isTracking && (
        <AnimatePresence>
          <motion.div
            className="glass p-3 rounded-xl"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-[#00B4D8] shrink-0 mt-0.5" />
              <div>
                <div className="text-[10px] text-slate-800/30 uppercase tracking-wider mb-0.5">
                  AI Recommendation
                </div>
                <p className="text-[11px] text-slate-800/60 leading-relaxed">
                  {state.adaptiveRecommendation}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
