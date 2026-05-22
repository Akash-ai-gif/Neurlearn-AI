"use client";

import { motion } from "framer-motion";
import { Camera, Zap, Brain, Ghost, Activity, Timer, Eye, Frown } from "lucide-react";
import { CognitiveState } from "@/types";

interface Props {
  state: CognitiveState;
  isTracking: boolean;
  sessionDuration: number;
}

function MetricBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-800/40">{icon}</span>
          <span className="text-[11px] text-slate-800/50 font-medium">{label}</span>
        </div>
        <span className="text-[11px] font-mono" style={{ color }}>{Math.round(value)}%</span>
      </div>
      <div className="progress-bar">
        <motion.div className="progress-bar-fill" style={{ background: color, width: `${value}%` }} animate={{ width: `${value}%` }} transition={{ duration: 0.5 }} />
      </div>
    </div>
  );
}

export function CognitiveDashboard({ state, isTracking, sessionDuration }: Props) {
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const metrics = [
    { label: "Engagement", value: state.engagement, color: "#00D1FF", icon: <Zap className="w-3 h-3" /> },
    { label: "Confusion", value: state.confusion, color: "#FF3366", icon: <Frown className="w-3 h-3" /> },
    { label: "Flow", value: state.flow, color: "#00F5A0", icon: <Activity className="w-3 h-3" /> },
    { label: "Fatigue", value: state.fatigue, color: "#FFB800", icon: <Ghost className="w-3 h-3" /> },
    { label: "Confidence", value: state.confidence, color: "#7C3AED", icon: <Brain className="w-3 h-3" /> },
  ];

  return (
    <div className="glass p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-[#10B981] animate-pulse' : 'bg-slate-900/20'}`} />
          <span className="text-xs text-slate-800/40 uppercase tracking-wider font-medium">Cognitive Monitor</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-800/30">
          <Timer className="w-3 h-3" />
          <span className="font-mono">{formatTime(sessionDuration)}</span>
        </div>
      </div>
      {/* Camera preview placeholder */}
      <div className="relative aspect-video rounded-xl bg-slate-900/[0.02] border border-slate-900/5 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <Camera className="w-6 h-6 text-slate-800/15 mx-auto mb-1" />
          <span className="text-[10px] text-slate-800/20">{isTracking ? 'Tracking Active' : 'Camera Off'}</span>
        </div>
        {isTracking && (
          <motion.div className="absolute inset-0 rounded-xl" style={{ border: '2px solid rgba(0,209,255,0.2)' }} animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 2, repeat: Infinity }} />
        )}
      </div>
      {/* Metrics */}
      <div className="space-y-3">
        {metrics.map((m, i) => <MetricBar key={i} {...m} />)}
      </div>
    </div>
  );
}
