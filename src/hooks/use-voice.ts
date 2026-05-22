"use client";
import { useState, useRef, useCallback, useEffect } from "react";

export type VoiceState = "idle" | "listening" | "speaking" | "error";

export function useVoice() {
  const [voiceState, setVoiceState] = useState<VoiceState>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const hasSR = "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    const hasTTS = "speechSynthesis" in window;
    setIsSupported(hasSR && hasTTS);
  }, []);

  // ── Text-to-Speech ───────────────────────────────────────────────────────
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window) || isMuted) return;
    window.speechSynthesis.cancel();

    // Clean text of markdown/symbols for cleaner speech
    const clean = text
      .replace(/#{1,6}\s/g, "")
      .replace(/\*\*/g, "")
      .replace(/\*/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/```[\s\S]*?```/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^\s*[-•]\s/gm, "")
      .slice(0, 600); // Limit length for better UX

    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.0;
    utt.pitch = 1.0;
    utt.volume = 1.0;

    // Pick a natural-sounding voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural")
    ) || voices[0];
    if (preferred) utt.voice = preferred;

    utt.onstart = () => setVoiceState("speaking");
    utt.onend = () => setVoiceState("idle");
    utt.onerror = () => setVoiceState("idle");

    utteranceRef.current = utt;
    window.speechSynthesis.speak(utt);
  }, [isMuted]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setVoiceState("idle");
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      if (!prev) window.speechSynthesis.cancel();
      return !prev;
    });
  }, []);

  // ── Speech-to-Text ───────────────────────────────────────────────────────
  const startListening = useCallback((onResult: (text: string) => void) => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;

    if (recognitionRef.current) recognitionRef.current.stop();

    const recognition = new SR();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => setVoiceState("listening");

    recognition.onresult = (e: any) => {
      const result = Array.from(e.results as SpeechRecognitionResultList)
        .map((r: any) => r[0].transcript)
        .join("");
      setTranscript(result);
      // When user finishes a sentence, send it
      const lastResult = e.results[e.results.length - 1];
      if (lastResult.isFinal) {
        onResult(lastResult[0].transcript);
        setTranscript("");
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') setVoiceState("error");
    };
    recognition.onend = () => {
      // Only reset state if we're not still in listening mode
      setVoiceState(prev => prev === "listening" ? "idle" : prev);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setVoiceState("idle");
    setTranscript("");
  }, []);

  return {
    voiceState, isMuted, transcript, isSupported,
    speak, stopSpeaking, toggleMute,
    startListening, stopListening,
  };
}
