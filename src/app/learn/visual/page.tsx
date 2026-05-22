"use client";
import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { useVoice } from "@/hooks/use-voice";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, MicOff, Volume2, VolumeX, Send, Loader2,
  ArrowLeft, Sparkles, Brain, Eye, Network, Layers
} from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Msg = {
  role: "user" | "assistant";
  content: string;
  diagram?: DiagramNode[];
  image_url?: string;
};

type DiagramNode = {
  id: string;
  label: string;
  color: string;
  children?: string[];
  x?: number;
  y?: number;
};

// ── Inline SVG Concept Diagram ─────────────────────────────────────────────
function ConceptDiagram({ nodes }: { nodes: DiagramNode[] }) {
  if (!nodes || nodes.length === 0) return null;
  const colors = ["#00D1FF", "#7C3AED", "#00F5A0", "#FFB800", "#FF3366"];
  const root = nodes[0];
  const children = nodes.slice(1);
  const cx = 240, cy = 100;
  const radius = 130;

  return (
    <div className="w-full rounded-2xl bg-white border border-slate-900/5 p-4 overflow-x-auto">
      <p className="text-[10px] text-slate-800/20 uppercase tracking-widest mb-3 flex items-center gap-1">
        <Eye className="w-3 h-3" /> Visual Concept Map
      </p>
      <svg width="480" height="260" viewBox="0 0 480 260" className="mx-auto">
        {/* Lines from root to children */}
        {children.map((child, i) => {
          const angle = (i / Math.max(children.length, 1)) * 2 * Math.PI - Math.PI / 2;
          const px = cx + radius * Math.cos(angle);
          const py = cy + 70 + radius * 0.6 * Math.sin(angle);
          return (
            <line key={child.id} x1={cx} y1={cy} x2={px} y2={py}
              stroke="rgba(15,23,42,0.08)" strokeWidth="1.5" strokeDasharray="4 3" />
          );
        })}
        {/* Root node */}
        <circle cx={cx} cy={cy} r={38} fill="#00D1FF18" stroke="#00D1FF" strokeWidth="1.5" />
        <foreignObject x={cx - 34} y={cy - 18} width="68" height="36">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#00D1FF", fontWeight: 600, lineHeight: 1.2 }}>
              {root.label}
            </span>
          </div>
        </foreignObject>
        {/* Child nodes */}
        {children.map((child, i) => {
          const angle = (i / Math.max(children.length, 1)) * 2 * Math.PI - Math.PI / 2;
          const px = cx + radius * Math.cos(angle);
          const py = cy + 70 + radius * 0.6 * Math.sin(angle);
          const color = colors[i % colors.length];
          return (
            <g key={child.id}>
              <circle cx={px} cy={py} r={30} fill={`${color}18`} stroke={color} strokeWidth="1.2" />
              <foreignObject x={px - 26} y={py - 15} width="52" height="30">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                  <span style={{ fontSize: "8px", color, fontWeight: 500, lineHeight: 1.2 }}>
                    {child.label}
                  </span>
                </div>
              </foreignObject>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Parse diagram data from AI response ────────────────────────────────────
function parseDiagram(response: string, topic: string): DiagramNode[] | undefined {
  // Extract bullet points / numbered list as concept nodes
  const lines = response.split("\n")
    .filter(l => l.match(/^[\d\-\*•]/) && l.trim().length > 4)
    .slice(0, 6)
    .map(l => l.replace(/^[\d\.\-\*•]+\s*/, "").replace(/\*\*/g, "").trim())
    .filter(l => l.length > 2 && l.length < 60);

  if (lines.length < 2) return undefined;
  const colors = ["#00D1FF", "#7C3AED", "#00F5A0", "#FFB800", "#FF3366"];
  return [
    { id: "root", label: topic.length > 20 ? topic.slice(0, 20) + "…" : topic, color: "#00D1FF" },
    ...lines.map((l, i) => ({ id: `node-${i}`, label: l.length > 22 ? l.slice(0, 22) + "…" : l, color: colors[i % colors.length] })),
  ];
}

function VisualLearnContent() {
  const searchParams = useSearchParams();
  const skillId = searchParams.get("skill") || "";
  const skillTitle = searchParams.get("title") || "Visual Learning";

  const { voiceState, isMuted, transcript, isSupported, speak, stopSpeaking, toggleMute, startListening, stopListening } = useVoice();
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Welcome to Visual Mode! 🎨 I'm your AI Visualizer — I'll explain "${skillTitle}" using diagrams, concept maps, and visual analogies. Ask me anything about this topic!`,
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (overrideInput?: string) => {
    const question = overrideInput || input.trim();
    if (!question || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const history = messages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(`${API}/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `[VISUAL MODE] You are currently in the AI Visualizer. Analyzing user request for "${skillTitle}": "${question}". 
Requirement: Deeply understand the core mechanics and explain them. Break the answer into a clear hierarchy that I can parse into a concept diagram. Use analogies for clarity.`,
          context_skill: skillId || "general",
          conversation_history: history,
        }),
      });
      const data = await res.json();
      const reply = data.response || "I'm here to help! Could you please rephrase?";
      const diagram = parseDiagram(reply, question.length < 30 ? question : skillTitle);
      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        diagram,
        image_url: data.image_url
      }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again!" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleMic = () => {
    if (voiceState === "listening") { stopListening(); }
    else { startListening((text) => sendMessage(text)); }
  };

  const isMicActive = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";

  const quickPrompts = [
    `What are the key concepts of ${skillTitle}?`,
    `Give me a visual breakdown of ${skillTitle}`,
    `Explain ${skillTitle} with an analogy`,
    `What are the main components?`,
  ];

  return (
    <AppShell>
      <div className="h-[calc(100vh-140px)] flex flex-col bg-[#FDFBF7] rounded-3xl border border-slate-900/5 overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-900/5 flex items-center gap-4">
          <Link href="/learn">
            <button className="p-2 rounded-lg text-slate-800/40 hover:text-slate-800/70 hover:bg-slate-900/5 transition-all">
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED]/30 to-[#00D1FF]/20 flex items-center justify-center">
            <Eye className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div className="flex-1">
            <h1 className="text-sm font-bold">Visual Learning Mode</h1>
            <p className="text-[10px] text-slate-800/30">{skillTitle} · AI Visualizer 🎨</p>
          </div>

          {/* Voice controls */}
          <div className="flex items-center gap-2">
            {isSpeaking && (
              <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}
                className="px-2.5 py-1 rounded-lg bg-[#8B5CF6]/10 text-[9px] text-[#8B5CF6] flex items-center gap-1 border border-[#8B5CF6]/20">
                <Volume2 className="w-3 h-3" /> Speaking...
              </motion.div>
            )}
            <button onClick={toggleMute}
              className={`p-2 rounded-lg transition-all ${isMuted ? "text-slate-800/20 border border-slate-900/5" : "text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"}`}>
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">

          {/* Left: Chat + Diagrams */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <AnimatePresence>
                {messages.map((m, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && (
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#00D1FF]/20 border border-slate-900/10 flex items-center justify-center text-lg shrink-0 mt-0.5">🎨</div>
                    )}
                    <div className={`max-w-[75%] space-y-3 ${m.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`p-4 rounded-2xl text-sm leading-relaxed ${m.role === "user"
                        ? "bg-[#8B5CF6]/20 border border-[#8B5CF6]/20 text-slate-800/90 rounded-tr-none"
                        : "glass text-slate-800/80 rounded-tl-none"}`}>
                        {m.image_url && (
                          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
                            className="mb-4 rounded-2xl overflow-hidden border border-slate-900/10 shadow-2xl relative group w-full">
                            <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/80 backdrop-blur-md rounded-lg text-[10px] text-[#8B5CF6] font-bold border border-[#8B5CF6]/30 z-10">
                              VISUAL AID
                            </div>
                            <img key={m.image_url} src={m.image_url} alt="Visual Explanation" referrerPolicy="no-referrer" className="w-full aspect-video object-cover transition-transform duration-1000 group-hover:scale-110" />
                          </motion.div>
                        )}
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        {m.role === "assistant" && (
                          <button onClick={() => speak(m.content)} className="ml-2 opacity-30 hover:opacity-70 transition-opacity inline-block">
                            <Volume2 className="w-2.5 h-2.5 inline" />
                          </button>
                        )}
                      </div>
                      {/* Concept diagram */}
                      {m.diagram && <ConceptDiagram nodes={m.diagram} />}
                    </div>
                    {m.role === "user" && (
                      <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {user?.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {loading && (
                <div className="flex gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#00D1FF]/20 border border-slate-900/10 flex items-center justify-center text-lg shrink-0">🎨</div>
                  <div className="glass p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-[#8B5CF6] animate-spin" />
                    <span className="text-sm text-slate-800/40">Generating visual explanation...</span>
                  </div>
                </div>
              )}
              {/* Transcript preview */}
              {transcript && (
                <div className="flex justify-end">
                  <div className="px-4 py-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-sm text-[#8B5CF6] italic">
                    🎙 {transcript}...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.length <= 1 && (
              <div className="px-6 pb-2">
                <p className="text-[10px] text-slate-800/20 uppercase tracking-wider mb-2">Try asking...</p>
                <div className="flex flex-wrap gap-2">
                  {quickPrompts.map((q, i) => (
                    <button key={i} onClick={() => sendMessage(q)}
                      className="px-3 py-1.5 rounded-xl bg-slate-900/[0.03] border border-slate-900/5 text-xs text-slate-800/50 hover:text-slate-800/80 hover:bg-slate-900/[0.06] transition-all flex items-center gap-1.5">
                      <Sparkles className="w-2.5 h-2.5 text-[#8B5CF6]" />{q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="p-4 border-t border-slate-900/5">
              <div className="flex gap-3 items-end">
                <div className="flex-1 glass-strong rounded-2xl border border-slate-900/5 flex items-end gap-2 px-4 py-3">
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder={isMicActive ? "🎙 Listening..." : "Ask anything — I'll explain it visually..."}
                    rows={2}
                    className="flex-1 bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder-white/20 leading-relaxed"
                  />
                </div>
                {isSupported && (
                  <button onClick={handleMic}
                    className={`p-3 rounded-xl shrink-0 transition-all ${isMicActive
                      ? "bg-[#FF3366] text-slate-800 shadow-[0_0_20px_rgba(255,51,102,0.4)] animate-pulse"
                      : "bg-[#8B5CF6]/10 text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/20"}`}>
                    {isMicActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                )}
                <button onClick={() => sendMessage()} disabled={!input.trim() || loading}
                  className="p-3 rounded-xl gradient-primary disabled:opacity-40 shrink-0 transition-all hover:scale-105">
                  <Send className="w-5 h-5 text-slate-800" />
                </button>
              </div>
              <div className="mt-2 text-[10px] text-slate-800/15 text-center">
                Visual Mode · AI generates concept maps from your questions
              </div>
            </div>
          </div>

          {/* Right: Info panel */}
          <div className="w-[220px] border-l border-slate-900/5 p-4 space-y-4 overflow-y-auto shrink-0">
            <div className="glass p-4 rounded-xl space-y-3">
              <div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Learning Mode</div>
              <div className="flex flex-col gap-2">
                {[
                  { icon: Eye, label: "Visual Maps", active: true, color: "#7C3AED" },
                  { icon: Brain, label: "AI Explanations", active: true, color: "#00D1FF" },
                  { icon: Network, label: "Concept Graphs", active: true, color: "#00F5A0" },
                  { icon: Layers, label: "Analogies", active: true, color: "#FFB800" },
                ].map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: `${f.color}15` }}>
                      <f.icon className="w-3 h-3" style={{ color: f.color }} />
                    </div>
                    <span className="text-xs text-slate-800/50">{f.label}</span>
                    {f.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#10B981]" />}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass p-4 rounded-xl space-y-2">
              <div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Topic</div>
              <div className="text-sm font-semibold text-slate-800/80">{skillTitle}</div>
              <Link href="/learn">
                <button className="w-full mt-2 py-2 text-xs rounded-lg text-slate-800/40 hover:text-slate-800/70 border border-slate-900/5 hover:bg-slate-900/5 transition-all flex items-center justify-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to Lessons
                </button>
              </Link>
            </div>

            <div className="glass p-4 rounded-xl">
              <div className="text-[10px] text-slate-800/30 uppercase tracking-widest mb-2">Voice</div>
              <button onClick={toggleMute}
                className={`w-full py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 transition-all ${isMuted
                  ? "text-slate-800/30 border border-slate-900/5"
                  : "text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20"}`}>
                {isMuted ? <><VolumeX className="w-3 h-3" /> Unmute AI</> : <><Volume2 className="w-3 h-3" /> AI Speaking</>}
              </button>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}

export default function VisualLearnPage() {
  return (
    <Suspense fallback={<div className="flex h-screen bg-[#FDFBF7] items-center justify-center"><Loader2 className="w-8 h-8 text-[#00B4D8] animate-spin" /></div>}>
      <VisualLearnContent />
    </Suspense>
  );
}
