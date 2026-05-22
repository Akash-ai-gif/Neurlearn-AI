"use client";
import { useState, useRef, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageSquare, Sparkles, Loader2, BookOpen, Trash2, Target, TrendingUp, Briefcase, ChevronRight, BarChart3, Zap, ArrowRight, X } from "lucide-react";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Msg = {
  role: "user" | "assistant";
  content: string;
  related?: string[];
  practice?: string[];
  image_url?: string;
};

type CareerRec = {
  title: string; match_percent: number; icon: string;
  skill_gap: { skill: string; current: number; required: number }[];
  estimated_time: string; open_jobs: number; salary_range: string; description: string;
};

type CareerData = {
  career_goal: string;
  recommendations: CareerRec[];
  market_insights: { trending_skills: string[]; hot_industries: string[]; avg_salary_growth: string };
};

export default function AskAnythingPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [career, setCareer] = useState<CareerData | null>(null);
  const [careerLoading, setCareerLoading] = useState(true);
  const [showCareer, setShowCareer] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // Load chat history
  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/doubt/history/${user.user_id}`);
        const data = await res.json();
        if (data.doubts?.length > 0) {
          setMessages(data.doubts.reverse().map((d: any) => ([
            { role: "user" as const, content: d.question },
            { role: "assistant" as const, content: d.ai_response || "...", image_url: d.image_url }
          ])).flat());
        } else {
          setMessages([{ role: "assistant", content: `Hey ${user.name || ""}! I'm your AI Mentor 🎓 — ask me anything about coding, career advice, science, or just say hi!` }]);
        }
      } catch { /* ignore */ }
    })();
  }, [user]);

  // Load career data
  useEffect(() => {
    if (!user?.user_id) return;
    (async () => {
      try {
        const res = await fetch(`${API}/career/recommendations/${user.user_id}`);
        setCareer(await res.json());
      } catch { /* ignore */ }
      finally { setCareerLoading(false); }
    })();
  }, [user]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async (overrideInput?: string) => {
    const question = (overrideInput || input).trim();
    if (!question || isLoading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setIsLoading(true);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(`${API}/doubt/ask`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user?.user_id || "guest", input_type: "text", content: question, context_skill: null, conversation_history: history }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, {
        role: "assistant", content: data.response,
        related: data.related_concepts?.length > 0 ? data.related_concepts : undefined,
        practice: data.practice_problems?.length > 0 ? data.practice_problems : undefined,
        image_url: data.image_url,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again!" }]);
    } finally { setIsLoading(false); }
  };

  const clearChat = () => setMessages([{ role: "assistant", content: "Chat cleared! Ask me anything — I'm ready 🎓" }]);

  const suggestedQuestions = [
    "Explain machine learning like I'm 10",
    "What career should I choose in tech?",
    "How does the internet actually work?",
    "What's the difference between AI and ML?",
    "How do I stay motivated while learning?",
    "Give me a fun coding challenge",
  ];

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-80px)] gap-0 overflow-hidden -m-6">

        {/* ─── Left: AI Chat ─── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="px-8 py-5 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
            <div>
              <h1 className="text-xl font-black text-slate-900 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#00B4D8]/10 to-[#8B5CF6]/10">
                  <MessageSquare className="w-5 h-5 text-[#00B4D8]" />
                </div>
                AI Mentor
              </h1>
              <p className="text-xs text-slate-400 mt-1 ml-12">Career advice · Coding help · Science · Anything</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCareer(!showCareer)}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5",
                  showCareer ? "bg-[#FFB800] text-white border-[#FFB800]" : "bg-white text-[#FFB800] border-[#FFB800]/20 hover:bg-[#FFB800]/5")}>
                <Target className="w-3 h-3" /> {showCareer ? "Hide Career" : "Career Intel"}
              </button>
              <button onClick={clearChat} className="flex items-center gap-1.5 text-[10px] text-slate-300 hover:text-slate-500 transition-all px-2 py-1.5 rounded-lg hover:bg-slate-50">
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
            <AnimatePresence>
              {messages.map((m, i) => (
                <motion.div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
                  {m.role === "assistant" && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D1FF]/20 to-[#7C3AED]/20 border border-slate-100 flex items-center justify-center text-lg shrink-0 mt-0.5">🎓</div>
                  )}
                  <div className={`max-w-[75%] space-y-2 flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={cn("p-4 rounded-2xl text-sm leading-relaxed",
                      m.role === "user" ? "bg-[#8B5CF6]/10 border border-[#8B5CF6]/10 text-slate-800 rounded-tr-none" : "bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none")}>
                      {m.content || "..."}
                      {m.image_url && (
                        <div className="mt-4 overflow-hidden rounded-xl border border-slate-100 shadow-lg">
                          <img src={m.image_url} alt="AI visual" className="w-full h-auto max-h-96 object-contain bg-black/40 rounded-xl" />
                        </div>
                      )}
                    </div>
                    {m.related && m.related.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[9px] text-slate-300 self-center">Explore:</span>
                        {m.related.map((c, j) => (
                          <button key={j} onClick={() => sendMessage(`Tell me more about ${c}`)}
                            className="text-[10px] px-2 py-1 rounded-full bg-[#00B4D8]/5 text-[#00B4D8] border border-[#00B4D8]/10 hover:bg-[#00B4D8]/15 transition-all font-medium">{c}</button>
                        ))}
                      </div>
                    )}
                    {m.practice && m.practice.length > 0 && (
                      <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl space-y-1.5 w-full">
                        <span className="text-[9px] text-slate-400 uppercase tracking-wider flex items-center gap-1 font-bold"><BookOpen className="w-3 h-3" /> Practice</span>
                        {m.practice.map((p, j) => (
                          <button key={j} onClick={() => sendMessage(p)} className="w-full text-left text-xs text-slate-500 hover:text-slate-800 py-1 border-b border-slate-100 last:border-0 transition-all">→ {p}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {m.role === "user" && (
                    <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{user?.name?.charAt(0).toUpperCase() || "U"}</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#00D1FF]/20 to-[#7C3AED]/20 border border-slate-100 flex items-center justify-center text-lg shrink-0">🎓</div>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-[#00B4D8] animate-spin" /><span className="text-sm text-slate-400">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="px-8 pb-4">
              <p className="text-[9px] text-slate-300 uppercase tracking-widest mb-3 font-bold">Try asking...</p>
              <div className="grid grid-cols-3 gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button key={i} onClick={() => sendMessage(q)}
                    className="text-left text-[11px] p-3 bg-slate-50 border border-slate-100 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-white hover:border-slate-200 hover:shadow-sm transition-all flex items-start gap-2">
                    <Sparkles className="w-3 h-3 text-[#00B4D8] shrink-0 mt-0.5" />{q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-8 py-4 border-t border-slate-100 bg-white shrink-0">
            <div className="flex gap-3 items-end bg-slate-50 border border-slate-200 rounded-2xl p-3 focus-within:border-[#00B4D8]/30 focus-within:shadow-lg focus-within:shadow-[#00B4D8]/5 transition-all">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="Ask anything — career, coding, science, or just chat..."
                rows={1} className="flex-1 bg-transparent text-sm text-slate-800 resize-none focus:outline-none placeholder-slate-400 leading-relaxed" />
              <button onClick={() => sendMessage()} disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-[#00B4D8] text-white disabled:opacity-30 shrink-0 transition-all hover:scale-105 shadow-lg shadow-[#00B4D8]/20">
                <Send className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-2 text-[9px] text-slate-300 text-right font-medium">Enter to send · Shift+Enter for new line</div>
          </div>
        </div>

        {/* ─── Right: Career Intelligence Sidebar ─── */}
        <AnimatePresence>
          {showCareer && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 360, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: "spring", damping: 25 }}
              className="border-l border-slate-100 bg-white flex flex-col shrink-0 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-[#FFB800]/10"><Target className="w-4 h-4 text-[#FFB800]" /></div>
                  <span className="text-sm font-black text-slate-900">Career Intelligence</span>
                </div>
                <button onClick={() => setShowCareer(false)} className="p-1 rounded-lg hover:bg-slate-50"><X className="w-4 h-4 text-slate-300" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                {careerLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Analyzing market...</span>
                  </div>
                ) : career ? (
                  <>
                    {/* Domain Badge */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-[#FFB800]/5 to-[#FF6B00]/5 border border-[#FFB800]/10">
                      <div className="text-[9px] text-[#FFB800] font-black uppercase tracking-widest mb-1">Your Domain</div>
                      <div className="text-base font-black text-slate-900">{career.career_goal || "Tech Professional"}</div>
                    </div>

                    {/* Career Paths */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommended Paths</h3>
                      {career.recommendations.map((rec, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          className="p-4 rounded-2xl bg-white border border-slate-100 hover:border-[#00B4D8]/20 hover:shadow-lg hover:shadow-[#00B4D8]/5 transition-all cursor-pointer group"
                          onClick={() => sendMessage(`Tell me how to become a ${rec.title}. What skills do I need and what's the roadmap?`)}>
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{rec.icon}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-[#00B4D8] transition-colors">{rec.title}</span>
                                <span className="text-[10px] font-black text-[#00B4D8]">{rec.match_percent}%</span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-1 leading-snug">{rec.description}</p>
                              <div className="flex items-center gap-3 mt-3 text-[9px] font-bold text-slate-400">
                                <span>⏱ {rec.estimated_time}</span>
                                <span>💼 {rec.open_jobs?.toLocaleString()} jobs</span>
                                <span>💰 {rec.salary_range}</span>
                              </div>
                              {/* Skill Gaps */}
                              <div className="mt-3 space-y-2">
                                {rec.skill_gap.map((gap, gi) => (
                                  <div key={gi}>
                                    <div className="flex justify-between text-[9px] font-bold mb-0.5">
                                      <span className="text-slate-500">{gap.skill}</span>
                                      <span className="text-slate-400">{gap.current}/{gap.required}</span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                      <div className="h-full rounded-full bg-[#00B4D8]" style={{ width: `${(gap.current / gap.required) * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-3 text-[9px] text-[#00B4D8] font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                            Ask AI about this path <ArrowRight className="w-3 h-3" />
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Market Insights */}
                    <div className="space-y-3">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3" /> Market Pulse
                      </h3>
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-4">
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase mb-2">Trending Skills</div>
                          <div className="flex flex-wrap gap-1.5">
                            {career.market_insights.trending_skills.map((s, i) => (
                              <button key={i} onClick={() => sendMessage(`What is ${s} and why is it trending?`)}
                                className="text-[10px] px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:border-[#00B4D8]/30 hover:text-[#00B4D8] transition-all font-medium">{s}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase mb-2">Hot Industries</div>
                          <div className="flex flex-wrap gap-1.5">
                            {career.market_insights.hot_industries.map((ind, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded-lg bg-[#FFB800]/5 text-[#FFB800] border border-[#FFB800]/10 font-bold">{ind}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-emerald-50 to-emerald-50/30 border border-emerald-100">
                          <span className="text-[10px] text-emerald-600 font-bold">Avg Salary Growth</span>
                          <span className="text-sm font-black text-emerald-600">{career.market_insights.avg_salary_growth}</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-20 text-center">
                    <p className="text-sm text-slate-400">Unable to load career data.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
