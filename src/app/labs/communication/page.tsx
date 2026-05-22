"use client";
import { useState, useRef, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { motion } from "framer-motion";
import { Video, Mic, MessageSquare, Send, Sparkles, Target, Star, Brain, Play, Square, Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const DEFAULT_SCENARIO = {
  title: "Behavioral Interview",
  company: "Tech Corp",
  question: "Tell me about a time you faced a difficult challenge in a project. How did you handle it?",
  tips: ["Use the STAR method", "Focus on your specific actions", "Quantify the results if possible"],
};

export default function CommunicationLabPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [response, setResponse] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentScenario, setCurrentScenario] = useState(DEFAULT_SCENARIO);
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();

  const fetchScenario = async () => {
    setScenarioLoading(true);
    try {
      const userDomain = user?.career_goal || "Professional";
      const res = await fetch(`${API_BASE_URL}/doubt/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `Generate a realistic interview scenario for a ${userDomain}. 
          Return ONLY a JSON object with: 
          {
            "title": "Scenario Title",
            "company": "Company Name",
            "question": "The interview question",
            "tips": ["Tip 1", "Tip 2", "Tip 3"]
          }
          Strictly NO preamble or explanation. Just JSON.`,
          context_skill: null,
        }),
      });
      const data = await res.json();
      const rawResponse = data.response || "";
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setCurrentScenario(parsed);
        } catch (parseErr) {
          console.error("JSON Parse Error:", parseErr);
          setCurrentScenario(DEFAULT_SCENARIO);
        }
      } else {
        console.warn("No JSON block found in AI response. Using default scenario.");
        // If AI just gave text, try to use it as the question
        if (rawResponse.length > 20 && rawResponse.length < 500) {
          setCurrentScenario({
            ...DEFAULT_SCENARIO,
            question: rawResponse.replace(/["']/g, "").trim()
          });
        } else {
          setCurrentScenario(DEFAULT_SCENARIO);
        }
      }
    } catch (e) {
      console.error("Failed to fetch scenario", e);
    } finally {
      setScenarioLoading(false);
    }
  };

  useEffect(() => {
    if (user?.career_goal) fetchScenario();
  }, [user]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsRecording(true);
    } catch (e) {
      console.error("Camera failed:", e);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject as MediaStream;
    stream?.getTracks().forEach(t => t.stop());
    setIsRecording(false);
  };

  const analyzeResponse = async () => {
    if (!response.trim()) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/learning/analyze-comm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: response, 
          scenario_id: currentScenario.title,
          question: currentScenario.question 
        }),
      });
      const data = await res.json();
      setAnalysis(data);
      // Refresh scenario after analysis for next practice
      setTimeout(fetchScenario, 5000);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex">
        <div className="flex-1 p-6 space-y-6 flex flex-col">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">🗣️ Communication Lab</h1>
              <p className="text-slate-800/40 text-sm mt-1">Practice soft skills and interviews with AI analysis</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="glass px-4 py-2 flex items-center gap-2">
                <span className="text-[10px] text-slate-800/40 uppercase tracking-widest font-medium">Scenario:</span>
                <span className="text-xs font-semibold text-[#00B4D8]">
                  {scenarioLoading ? "Generating..." : `${currentScenario.title} at ${currentScenario.company}`}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-6 flex-1">
            <div className="flex-1 space-y-4 flex flex-col">
              <div className="glass p-5 border-[#00B4D8]/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3"><Sparkles className="w-5 h-5 text-[#00B4D8] opacity-20" /></div>
                <div className="text-[10px] text-[#00B4D8] font-semibold uppercase tracking-widest mb-2 flex items-center gap-1"><Brain className="w-3 h-3" /> Interviewer AI</div>
                {scenarioLoading ? (
                  <div className="h-20 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-[#00B4D8] animate-spin" />
                  </div>
                ) : (
                  <p className="text-lg font-medium text-slate-800/90 leading-relaxed italic">&quot;{currentScenario.question}&quot;</p>
                )}
              </div>

              <div className="flex-1 relative rounded-2xl overflow-hidden bg-black/40 border border-slate-900/5">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4">
                  {!isRecording ? (
                    <button onClick={startCamera} className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-slate-800 shadow-xl hover:scale-110 transition-transform"><Video className="w-6 h-6" /></button>
                  ) : (
                    <button onClick={stopCamera} className="w-14 h-14 rounded-full bg-[#FF3366] flex items-center justify-center text-slate-800 shadow-xl hover:scale-110 transition-transform"><Square className="w-6 h-6 fill-current" /></button>
                  )}
                </div>
                {!isRecording && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF7]/60 backdrop-blur-[2px]">
                    <div className="text-center space-y-2">
                      <Video className="w-10 h-10 text-slate-800/10 mx-auto" />
                      <div className="text-sm text-slate-800/40">Camera is off</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="w-[340px] space-y-4 flex flex-col">
              <div className="glass p-5 space-y-4">
                <h3 className="text-xs text-slate-800/40 uppercase tracking-widest font-semibold flex items-center gap-2"><Mic className="w-3.5 h-3.5" /> Your Response</h3>
                <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Type or speak your answer..." className="w-full h-[180px] bg-slate-900/[0.03] border border-slate-900/5 rounded-xl p-4 text-sm text-slate-800 focus:outline-none focus:border-[#00B4D8]/30 resize-none" />
                <button onClick={analyzeResponse} disabled={isLoading || !response.trim()} className="w-full btn-primary py-3 flex items-center justify-center gap-2 text-sm text-slate-800">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />} Analyze Performance
                </button>
              </div>

              {analysis ? (
                <motion.div className="glass p-5 space-y-5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 className="text-xs text-slate-800/40 uppercase tracking-widest font-semibold flex items-center gap-2"><Star className="w-3.5 h-3.5 text-[#FFB800]" /> Analysis</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(analysis.metrics).map(([k, v]: [string, any]) => (
                      <div key={k} className="p-3 rounded-xl bg-slate-900/[0.02] border border-slate-900/5 text-center">
                        <div className="text-[10px] text-slate-800/30 uppercase mb-1">{k}</div>
                        <div className="text-lg font-bold text-[#10B981]">{v}%</div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-xl bg-[#00B4D8]/5 border border-[#00B4D8]/10">
                    <div className="text-[10px] text-[#00B4D8] uppercase font-bold mb-2">AI Pro Tip</div>
                    <div className="text-xs text-slate-800/70 italic leading-relaxed">&quot;{analysis.tip}&quot;</div>
                  </div>
                  <div className="text-xs text-slate-800/40 italic text-center pt-2">{analysis.feedback}</div>
                </motion.div>
              ) : (
                <div className="flex-1 glass p-6 border-dashed flex flex-col items-center justify-center text-center opacity-40">
                  <MessageSquare className="w-8 h-8 mb-3" />
                  <div className="text-sm font-medium">No analysis yet</div>
                  <div className="text-[10px] mt-1">Submit your response to see AI feedback</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
