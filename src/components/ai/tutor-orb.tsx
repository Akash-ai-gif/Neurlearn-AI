"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TutorOrbProps {
  state?: 'explaining' | 'thinking' | 'encouraging' | 'alerting' | 'celebrating';
  size?: 'sm' | 'md' | 'lg';
  agentName?: string;
  agentIcon?: string;
}

const stateColors = {
  explaining: { core: '#00D1FF', glow: 'rgba(0,209,255,0.3)', ring: 'rgba(0,209,255,0.15)' },
  thinking: { core: '#7C3AED', glow: 'rgba(124,58,237,0.3)', ring: 'rgba(124,58,237,0.15)' },
  encouraging: { core: '#FFB800', glow: 'rgba(255,184,0,0.3)', ring: 'rgba(255,184,0,0.15)' },
  alerting: { core: '#FF3366', glow: 'rgba(255,51,102,0.3)', ring: 'rgba(255,51,102,0.15)' },
  celebrating: { core: '#00F5A0', glow: 'rgba(0,245,160,0.3)', ring: 'rgba(0,245,160,0.15)' },
};

const sizes = { sm: 48, md: 72, lg: 96 };

export function TutorOrb({ state = 'explaining', size = 'md', agentName, agentIcon }: TutorOrbProps) {
  const colors = stateColors[state];
  const s = sizes[size];
  return (
    <div className="relative flex flex-col items-center gap-2">
      {/* Outer glow ring */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: s * 1.8, height: s * 1.8, background: colors.ring, filter: `blur(${s * 0.3}px)` }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
      {/* Core orb */}
      <motion.div
        className="relative rounded-full flex items-center justify-center"
        style={{ width: s, height: s, background: `radial-gradient(circle at 35% 35%, ${colors.core}40, ${colors.core}15)`, border: `2px solid ${colors.core}50`, boxShadow: `0 0 ${s * 0.4}px ${colors.glow}` }}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <span className="text-2xl">{agentIcon || '🧠'}</span>
      </motion.div>
      {agentName && (
        <motion.div className="text-xs font-medium text-slate-800/60 mt-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {agentName}
        </motion.div>
      )}
    </div>
  );
}
