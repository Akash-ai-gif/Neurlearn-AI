"use client";

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Eye, Activity, Camera, CameraOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface FaceTrackerProps {
  onStateUpdate: (metrics: {
    engagement: number;
    confusion: number;
    fatigue: number;
    eyeContact: number;
  }) => void;
  isActive: boolean;
}

/**
 * Real webcam-based cognitive tracker.
 * Uses getUserMedia for live camera feed and canvas pixel analysis
 * to compute real engagement metrics from actual video data:
 *   - Motion delta (movement) → engagement
 *   - Brightness levels → fatigue (darker = drowsy/eyes closing)
 *   - Color variance → confusion (fidgeting causes higher variance)
 *   - Center-frame presence → eye contact (face centered = looking at screen)
 */
export const FaceTracker: React.FC<FaceTrackerProps> = ({ onStateUpdate, isActive }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prevFrameRef = useRef<ImageData | null>(null);
  const animFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Smooth metrics with exponential moving average
  const metricsRef = useRef({ engagement: 70, confusion: 20, fatigue: 15, eyeContact: 80 });

  const analyzeFrame = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !isActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Draw current video frame
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = currentFrame.data;

    // === Real Pixel Analysis ===
    let totalBrightness = 0;
    let motionDelta = 0;
    let centerBrightness = 0;
    let centerPixelCount = 0;
    let colorVariance = 0;

    const prevPixels = prevFrameRef.current?.data;
    const w = canvas.width;
    const h = canvas.height;

    // Define center region (where face should be)
    const cx1 = Math.floor(w * 0.3);
    const cx2 = Math.floor(w * 0.7);
    const cy1 = Math.floor(h * 0.15);
    const cy2 = Math.floor(h * 0.75);

    // Sample every 4th pixel for performance
    for (let i = 0; i < pixels.length; i += 16) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;

      // Color variance (measures fidgeting/movement artifacts)
      colorVariance += Math.abs(r - g) + Math.abs(g - b);

      // Motion detection: compare with previous frame
      if (prevPixels) {
        const diff = Math.abs(r - prevPixels[i]) + Math.abs(g - prevPixels[i + 1]) + Math.abs(b - prevPixels[i + 2]);
        motionDelta += diff;
      }

      // Center region brightness (face presence)
      const pixelIndex = i / 4;
      const px = pixelIndex % w;
      const py = Math.floor(pixelIndex / w);
      if (px >= cx1 && px <= cx2 && py >= cy1 && py <= cy2) {
        centerBrightness += brightness;
        centerPixelCount++;
      }
    }

    const sampleCount = pixels.length / 16;
    const avgBrightness = totalBrightness / sampleCount;
    const avgMotion = prevPixels ? motionDelta / sampleCount : 0;
    const avgCenterBrightness = centerPixelCount > 0 ? centerBrightness / centerPixelCount : avgBrightness;
    const avgColorVariance = colorVariance / sampleCount;

    // === Convert to Biometric Scores (0-100) ===

    // Engagement: based on motion (more motion = more engaged/attentive)
    // Sweet spot: some motion (nodding, gesturing) = high engagement
    const motionScore = Math.min(100, (avgMotion / 15) * 100);
    const engagementRaw = motionScore > 80 ? 100 - (motionScore - 80) : motionScore + 20;

    // Fatigue: low brightness in face region suggests eyes closing/drooping
    // Also, very low motion suggests disengagement
    const brightnessRatio = avgCenterBrightness / 255;
    const fatigueRaw = (1 - brightnessRatio) * 60 + (motionScore < 10 ? 30 : 0);

    // Eye Contact: face centered in frame = looking at screen
    const centerRatio = avgCenterBrightness / Math.max(avgBrightness, 1);
    const eyeContactRaw = Math.min(100, centerRatio * 70 + (motionScore < 50 ? 20 : 0));

    // Confusion: high color variance + moderate motion = fidgeting
    const varianceNorm = Math.min(100, (avgColorVariance / 80) * 100);
    const confusionRaw = varianceNorm * 0.3 + (motionScore > 60 ? 20 : 0);

    // Apply exponential moving average for smooth transitions
    const alpha = 0.15;
    const prev = metricsRef.current;
    const smoothed = {
      engagement: Math.round(Math.min(100, Math.max(0, prev.engagement * (1 - alpha) + engagementRaw * alpha))),
      confusion: Math.round(Math.min(100, Math.max(0, prev.confusion * (1 - alpha) + confusionRaw * alpha))),
      fatigue: Math.round(Math.min(100, Math.max(0, prev.fatigue * (1 - alpha) + fatigueRaw * alpha))),
      eyeContact: Math.round(Math.min(100, Math.max(0, prev.eyeContact * (1 - alpha) + eyeContactRaw * alpha))),
    };
    metricsRef.current = smoothed;

    // Draw overlay visualization on canvas
    // Subtle green scanning grid
    ctx.strokeStyle = 'rgba(0, 209, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Draw face detection region
    ctx.strokeStyle = 'rgba(0, 209, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(cx1, cy1, cx2 - cx1, cy2 - cy1);
    ctx.setLineDash([]);

    // Corner brackets for face region
    const bracketLen = 15;
    ctx.strokeStyle = 'rgba(0, 245, 160, 0.5)';
    ctx.lineWidth = 2;
    // Top-left
    ctx.beginPath(); ctx.moveTo(cx1, cy1 + bracketLen); ctx.lineTo(cx1, cy1); ctx.lineTo(cx1 + bracketLen, cy1); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(cx2 - bracketLen, cy1); ctx.lineTo(cx2, cy1); ctx.lineTo(cx2, cy1 + bracketLen); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(cx1, cy2 - bracketLen); ctx.lineTo(cx1, cy2); ctx.lineTo(cx1 + bracketLen, cy2); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(cx2 - bracketLen, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 - bracketLen); ctx.stroke();

    // Report metrics
    onStateUpdate(smoothed);

    // Store current frame for next comparison
    prevFrameRef.current = currentFrame;

    // Continue loop
    animFrameRef.current = requestAnimationFrame(analyzeFrame);
  }, [isActive, onStateUpdate]);

  useEffect(() => {
    if (!isActive) {
      // Cleanup
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
      setIsReady(false);
      prevFrameRef.current = null;
      return;
    }

    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 320, height: 240, facingMode: 'user' },
          audio: false,
        });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            if (mounted) {
              setIsReady(true);
              // Start analysis loop
              animFrameRef.current = requestAnimationFrame(analyzeFrame);
            }
          };
        }
      } catch (err: any) {
        console.error('Camera access denied:', err);
        if (mounted) {
          setHasCamera(false);
          if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
            setPermissionDenied(true);
          }
        }
      }
    };

    startCamera();
    return () => {
      mounted = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    };
  }, [isActive, analyzeFrame, retryCount]);

  return (
    <div className="relative w-full aspect-video rounded-xl bg-black/20 overflow-hidden border border-slate-900/5">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: isReady ? 0.35 : 0 }}
        playsInline
        muted
        width={320}
        height={240}
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover"
        width={320}
        height={240}
      />

      {/* Status overlay */}
      {isActive && isReady && (
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm rounded-md px-2 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
          <span className="text-[9px] text-[#10B981] font-medium uppercase tracking-wider">Live</span>
        </div>
      )}

      {isActive && !isReady && hasCamera && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FDFBF7]/80 backdrop-blur-sm">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
            <Camera className="w-6 h-6 text-[#00B4D8]" />
          </motion.div>
          <p className="text-slate-800/30 text-[10px] font-medium">Initializing Camera...</p>
        </div>
      )}

      {!hasCamera && !permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[#FDFBF7]/80 backdrop-blur-sm">
          <CameraOff className="w-6 h-6 text-[#FF3366]/60" />
          <p className="text-slate-800/30 text-[10px] font-medium">Camera not available</p>
        </div>
      )}
      {permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#FDFBF7]/90 backdrop-blur-sm p-3">
          <CameraOff className="w-5 h-5 text-[#FF3366]/60" />
          <p className="text-slate-800/40 text-[10px] text-center">Camera blocked. Click below and allow access.</p>
          <button
            onClick={() => { setHasCamera(true); setPermissionDenied(false); setRetryCount(c => c + 1); }}
            className="px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 border border-[#00B4D8]/20 text-[#00B4D8] text-[10px] hover:bg-[#00B4D8]/20 transition-all">
            Retry Camera
          </button>
        </div>
      )}

      {!isActive && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF7]/80 backdrop-blur-sm">
          <p className="text-slate-800/20 text-xs font-medium">Tracking Paused</p>
        </div>
      )}
    </div>
  );
};
