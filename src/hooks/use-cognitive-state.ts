"use client";
/**
 * Backward-compatibility wrapper.
 * Old components that import useCognitiveState will now get the full
 * 6-stream fusion engine under the hood.
 */
import { useCognitiveFusion } from "@/hooks/use-cognitive-fusion";

export function useCognitiveState() {
  const fusion = useCognitiveFusion();
  return {
    state: fusion.state,
    isTracking: fusion.isTracking,
    sessionDuration: fusion.sessionDuration,
    dominantState: fusion.dominantState,
    startTracking: fusion.startTracking,
    stopTracking: fusion.stopTracking,
    resetSession: () => {},
    updateState: fusion.updateState,
  };
}
