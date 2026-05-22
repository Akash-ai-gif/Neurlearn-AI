"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info } from "lucide-react";

interface RadarMetric {
  label: string;
  value: number; // 0-100
  description: string;
}

interface Props {
  metrics: RadarMetric[];
  size?: number;
  color?: string;
}

export function CognitiveRadar({ metrics, size = 200, color = "#00D1FF" }: Props) {
  const [hovered, setHovered] = useState<RadarMetric | null>(null);
  
  const center = size / 2;
  const radius = (size / 2) * 0.7;
  const angleStep = (Math.PI * 2) / metrics.length;

  const points = metrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (m.value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  });

  const polygonPath = points.map(p => `${p.x},${p.y}`).join(" ");

  const axes = metrics.map((m, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const x2 = center + radius * Math.cos(angle);
    const y2 = center + radius * Math.sin(angle);
    const labelX = center + (radius + 22) * Math.cos(angle);
    const labelY = center + (radius + 18) * Math.sin(angle);
    return { x2, y2, labelX, labelY, label: m.label, metric: m };
  });

  const levels = [20, 40, 60, 80, 100];

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
          {/* Levels */}
          {levels.map((level, i) => (
            <circle
              key={i}
              cx={center}
              cy={center}
              r={(level / 100) * radius}
              fill="none"
              stroke="rgba(15, 23, 42, 0.05)"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          {axes.map((axis, i) => (
            <g key={i}>
              <line
                x1={center}
                y1={center}
                x2={axis.x2}
                y2={axis.y2}
                stroke="rgba(15, 23, 42, 0.1)"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <circle 
                cx={axis.labelX} 
                cy={axis.labelY} 
                r="10" 
                fill="transparent" 
                className="cursor-help"
                onMouseEnter={() => setHovered(axis.metric)}
                onMouseLeave={() => setHovered(null)}
              />
              <text
                x={axis.labelX}
                y={axis.labelY}
                textAnchor="middle"
                className={`text-[8px] font-black uppercase tracking-tighter transition-colors duration-300 ${hovered?.label === axis.label ? 'fill-[#00B4D8]' : 'fill-slate-400'}`}
              >
                {axis.label}
              </text>
            </g>
          ))}

          {/* Polygon */}
          <motion.polygon
            points={polygonPath}
            fill={`${color}20`}
            stroke={color}
            strokeWidth="2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
          />

          {/* Points */}
          {points.map((p, i) => (
            <motion.circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="3"
              fill={color}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          ))}
        </svg>

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-48 p-3 rounded-xl glass-strong border border-slate-900/10 shadow-2xl z-50 text-center"
            >
              <div className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">{hovered.label}</div>
              <div className="text-[9px] text-slate-500 leading-tight italic">{hovered.description}</div>
              <div className="mt-2 flex items-center justify-center gap-1">
                <div className="h-1 flex-1 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-[#00B4D8]" style={{ width: `${hovered.value}%` }} />
                </div>
                <span className="text-[9px] font-black text-[#00B4D8]">{hovered.value}%</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
