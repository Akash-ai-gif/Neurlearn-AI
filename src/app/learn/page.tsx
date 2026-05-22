"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { TutorOrb } from "@/components/ai/tutor-orb";
import { CognitiveFusionDashboard } from "@/components/cognitive/fusion-dashboard";
import { CognitiveProvider, useCognitiveFusion } from "@/context/cognitive-context";
import { useVoice } from "@/hooks/use-voice";
import { AgentOrchestrator } from "@/lib/ai/orchestrator";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Send, BookOpen, Play, Loader2, CheckCircle, Lock,
  ArrowRight, Code2, HelpCircle, MessageSquare,
  Mic, MicOff, Volume2, VolumeX, Sparkles, Eye,
  AlertTriangle, Zap, Coffee, X, Lightbulb, BarChart3,
  Video, FileText, ClipboardCheck, ExternalLink, Trophy, CircleDot
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type Block = { type: string; content: string; language?: string };
type Lesson = { skill_id: string; title: string; content_blocks: Block[] };
type SkillNode = { id: string; skill: string; status: string; score: number; order: number; level?: string };
type Msg = { role: "user" | "assistant"; content: string; icon?: string; image_url?: string };
type Video = { title: string; channel: string; duration: string; search_url: string };
type QuizQ = { question: string; options: string[]; correct: number; explanation: string };
type LessonTab = "lesson" | "videos" | "summary" | "quiz";

export default function LearnPage() {
  const {
    state, isTracking, voiceEnabled, sessionDuration,
    startTracking, stopTracking, enableVoice, disableVoice,
    updateFaceStream, updateState,
    dominantState, fusionConfidence, adaptiveRecommendation,
  } = useCognitiveFusion();

  const {
    voiceState, isMuted, transcript, isSupported,
    speak, stopSpeaking, toggleMute,
    startListening, stopListening,
  } = useVoice();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [skillTree, setSkillTree] = useState<SkillNode[]>([]);
  const [activeSkill, setActiveSkill] = useState<SkillNode | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [lessonLoading, setLessonLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [lessonStartTime, setLessonStartTime] = useState<number | null>(null);
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
  const [cognitivePopup, setCognitivePopup] = useState<{type: string; title: string; message: string; action: string; color: string; icon: any} | null>(null);
  const [dismissedPopups, setDismissedPopups] = useState<Set<string>>(new Set());
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();

  // New feature states
  const [activeTab, setActiveTab] = useState<LessonTab>("lesson");
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [showSideSummary, setShowSideSummary] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQ[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResults, setQuizResults] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(false);
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [quizPassed, setQuizPassed] = useState(false);

  // ── Cognitive Intervention Popups ──
  useEffect(() => {
    if (!isTracking || !lesson) return;
    const checkInterval = setInterval(() => {
      const s = state;
      if (s.fatigue > 55 && !dismissedPopups.has('fatigue')) {
        setCognitivePopup({ type: 'fatigue', title: '😴 Fatigue Detected', message: `Your fatigue level is at ${s.fatigue}%. Research shows a 5-minute break improves retention by 40%. Try Visual Mode for lighter learning.`, action: 'Switch to Visual Mode', color: '#FFB800', icon: Coffee });
      } else if (s.confusion > 55 && !dismissedPopups.has('confusion')) {
        setCognitivePopup({ type: 'confusion', title: '🤔 Confusion Detected', message: `Confusion level: ${s.confusion}%. Let me simplify this topic with an analogy. Ask me to "explain it simply" in the chat!`, action: 'Ask for Simpler Explanation', color: '#FF3366', icon: AlertTriangle });
      } else if (s.frustration > 55 && !dismissedPopups.has('frustration')) {
        setCognitivePopup({ type: 'frustration', title: '😤 Stress Rising', message: `Frustration at ${s.frustration}%. Let\'s take a step back. Sometimes a different approach makes all the difference.`, action: 'Take a Micro-Break', color: '#FF3366', icon: AlertTriangle });
      } else if (s.flow > 80 && s.engagement > 80 && !dismissedPopups.has('flow')) {
        setCognitivePopup({ type: 'flow', title: '🚀 Flow State!', message: `You're in peak flow (${s.flow}%)! This is the optimal learning zone. Keep going — your brain is absorbing information 5x faster!`, action: 'Keep Going!', color: '#00F5A0', icon: Zap });
      }
    }, 5000);
    return () => clearInterval(checkInterval);
  }, [isTracking, state, lesson, dismissedPopups]);

  const dismissPopup = (type: string) => {
    setDismissedPopups(prev => new Set(prev).add(type));
    setCognitivePopup(null);
  };

  // Auto-start tracking on page load
  useEffect(() => { if (!isTracking) startTracking(); }, []);

  const agent = AgentOrchestrator.selectAgent(state);
  const agentConfig = AgentOrchestrator.getAgentConfig(agent);
  const orbState = AgentOrchestrator.getOrbState(state);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Load skill tree on mount
  useEffect(() => {
    if (!user) return;
    fetch(`${API}/learning/path/${user.user_id}`)
      .then(r => r.json())
      .then(data => {
        let nodes: SkillNode[] = [];
        let rawNodes = data.nodes;
        if (typeof rawNodes === "string") {
          try { rawNodes = JSON.parse(rawNodes); } catch (e) {}
        }
        if (Array.isArray(rawNodes)) {
          nodes = rawNodes;
        } else if (rawNodes && typeof rawNodes === "object") {
          nodes = Array.isArray(rawNodes.nodes) ? rawNodes.nodes : (Array.isArray(rawNodes.skills) ? rawNodes.skills : []);
        }
        
        setSkillTree(nodes);
        setCompletedSkills(new Set(nodes.filter(n => n.status === "completed").map(n => n.id)));
        const first = nodes.find(n => n.status === "available") || nodes[0];
        if (first && !activeSkill) openLesson(first);
      })
      .catch(console.error);
  }, [user]);

  const forceBuildCurriculum = async () => {
    if (!user) return;
    setLessonLoading(true);
    try {
      const res = await fetch(`${API}/learning/path/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, career_goal: user.career_goal || "Software Engineer" }),
      });
      const data = await res.json();
      setSkillTree(data.nodes || []);
      if (data.nodes && data.nodes[0]) openLesson(data.nodes[0]);
    } catch (e) {
      console.error("Force build failed:", e);
    } finally {
      setLessonLoading(false);
    }
  };

  const openLesson = async (skill: SkillNode) => {
    if (!user) return;
    setActiveSkill(skill);
    setLesson(null);
    setMessages([]);
    setLessonLoading(true);
    setLessonStartTime(Date.now());
    setActiveTab("lesson");
    setVideos([]); setQuizQuestions([]); setQuizAnswers([]); setQuizResults(null);
    setSummaryData(null); setQuizPassed(false);
    fetch(`${API}/progress/lesson/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.user_id, skill_id: skill.id, skill_name: skill.skill }),
    }).catch(() => {});

    try {
      const res = await fetch(`${API}/learning/generate-lesson`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: skill.id, user_id: user.user_id, cognitive_state: state }),
      });
      const data: Lesson = await res.json();
      setLesson(data);
      const greeting = `I've loaded "${data.title}" for you. Complete the lesson, watch videos, review the summary, then pass the quiz to unlock the next module! 🎓`;
      setMessages([{ role: "assistant", content: greeting, icon: agentConfig.icon }]);
      speak(greeting);
      // Auto-fetch videos in background
      fetchVideos(skill.skill);
    } catch (e) {
      console.error("Lesson load failed:", e);
      setMessages([{ role: "assistant", content: "I encountered a synchronization delay with the Professor. Please click the skill again or refresh to retry!", icon: "⚠️" }]);
    } finally {
      setLessonLoading(false);
    }
  };

  const fetchVideos = async (skillName: string) => {
    setVideosLoading(true);
    try {
      const res = await fetch(`${API}/learning/videos/${encodeURIComponent(skillName)}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch { setVideos([]); }
    finally { setVideosLoading(false); }
  };

  const fetchQuiz = async () => {
    if (!activeSkill) return;
    setQuizLoading(true); setQuizResults(null); setQuizAnswers([]);
    try {
      const content = lesson?.content_blocks?.map(b => b.content).join("\n").slice(0, 1000) || "";
      const res = await fetch(`${API}/assessment/quiz/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_name: activeSkill.skill, lesson_content: content }),
      });
      const data = await res.json();
      setQuizQuestions(data.questions || []);
      setQuizAnswers(new Array(data.questions?.length || 0).fill(-1));
    } catch { setQuizQuestions([]); }
    finally { setQuizLoading(false); }
  };

  const submitQuiz = async () => {
    if (!user || !activeSkill || quizQuestions.length === 0) return;
    setQuizSubmitting(true);
    try {
      const res = await fetch(`${API}/assessment/submit`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.user_id, skill_id: activeSkill.id, skill_name: activeSkill.skill, answers: quizAnswers, questions: quizQuestions }),
      });
      const data = await res.json();
      setQuizResults(data);
      if (data.passed) { setQuizPassed(true); markComplete(); }
    } catch (e) { console.error("Quiz submit error:", e); }
    finally { setQuizSubmitting(false); }
  };

  const fetchSummary = async () => {
    if (!activeSkill) return;
    setSummaryLoading(true);
    try {
      const content = lesson?.content_blocks?.map(b => b.content).join("\n").slice(0, 1500) || "";
      const res = await fetch(`${API}/learning/summary/generate`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_name: activeSkill.skill, lesson_content: content }),
      });
      setSummaryData(await res.json());
    } catch { setSummaryData(null); }
    finally { setSummaryLoading(false); }
  };

  // Auto-fetch data when tab changes
  useEffect(() => {
    if (activeTab === "videos" && videos.length === 0 && activeSkill && !videosLoading) fetchVideos(activeSkill.skill);
    if (activeTab === "quiz" && quizQuestions.length === 0 && !quizLoading) fetchQuiz();
    if (activeTab === "summary" && !summaryData && !summaryLoading) fetchSummary();
  }, [activeTab]);

  const markComplete = useCallback(async () => {
    if (!user || !activeSkill) return;
    const timeSpent = lessonStartTime ? Math.round((Date.now() - lessonStartTime) / 60000) : 5;
    try {
      const res = await fetch(`${API}/progress/lesson/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.user_id, skill_id: activeSkill.id, skill_name: activeSkill.skill,
          score: 85, time_spent_minutes: Math.max(1, timeSpent),
        }),
      });
      const data = await res.json();
      if (data.nodes) {
        setSkillTree(data.nodes);
        setCompletedSkills(new Set(data.nodes.filter((n: SkillNode) => n.status === "completed").map((n: SkillNode) => n.id)));
      }
      const msg = `🎉 Excellent! You've completed "${activeSkill.skill}"! ${data.message || "Next skill is now unlocked!"}`;
      setMessages(prev => [...prev, { role: "assistant", content: msg, icon: "🏆" }]);
      speak(msg);
    } catch (e) { console.error("Complete error:", e); }
  }, [user, activeSkill, lessonStartTime]);

  const sendMessage = async (overrideInput?: string) => {
    const question = overrideInput || input.trim();
    if (!question || chatLoading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setChatLoading(true);
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    try {
      const res = await fetch(`${API}/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: question,
          context_skill: activeSkill?.id || null,
          conversation_history: history,
          cognitive_state: {
            engagement: state.engagement,
            confusion: state.confusion,
            fatigue: state.fatigue,
            flow: state.flow,
            dominantState: state.dominantState,
          },
        }),
      });
      const data = await res.json();
      const reply = data.response || "I'm here to help! Could you please rephrase?";
      setMessages(prev => [...prev, {
        role: "assistant",
        content: reply,
        icon: data.agent_icon || agentConfig.icon,
        image_url: data.image_url
      }]);
      speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Connection issue. Please try again!", icon: "⚠️" }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleMicClick = () => {
    if (voiceState === "listening") {
      stopListening();
    } else {
      startListening((text) => {
        sendMessage(text);
      });
    }
  };

  const renderBlock = (block: Block, i: number) => {
    const delay = i * 0.07;
    if (block.type === "text") return (
      <motion.div key={i} className="glass p-5 rounded-xl" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <p className="text-sm text-slate-800/75 leading-relaxed whitespace-pre-wrap">{block.content}</p>
      </motion.div>
    );
    if (block.type === "code") return (
      <motion.div key={i} className="rounded-xl overflow-hidden border border-[#00B4D8]/20" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-slate-900/5">
          <Code2 className="w-3.5 h-3.5 text-[#00B4D8]" /><span className="text-xs text-slate-800/30 uppercase">{block.language || "code"}</span>
        </div>
        <pre className="bg-slate-900 p-4 text-sm font-mono text-[#79C0FF] overflow-x-auto leading-relaxed">{block.content}</pre>
      </motion.div>
    );
    if (block.type === "diagram") return (
      <motion.div key={i} className="rounded-xl overflow-hidden border border-[#10B981]/20 bg-white" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-900/5">
          <BarChart3 className="w-3.5 h-3.5 text-[#10B981]" /><span className="text-xs text-[#10B981]/60 uppercase">Visual Diagram</span>
        </div>
        <pre className="bg-slate-900 p-4 text-sm font-mono text-[#10B981] overflow-x-auto leading-relaxed">{block.content}</pre>
      </motion.div>
    );
    if (block.type === "tip") return (
      <motion.div key={i} className="rounded-xl border border-[#FFB800]/20 bg-[#FFB800]/5 p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-[#FFB800]" />
          <span className="text-xs text-[#FFB800] font-semibold uppercase tracking-wider">Pro Tip</span>
        </div>
        <p className="text-sm text-slate-800/80">{block.content}</p>
      </motion.div>
    );
    if (block.type === "interactive") return (
      <motion.div key={i} className="rounded-xl border border-[#8B5CF6]/30 bg-[#8B5CF6]/5 p-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-[#8B5CF6]" />
          <span className="text-xs text-[#8B5CF6] font-semibold uppercase tracking-wider">Quick Check</span>
        </div>
        <p className="text-sm text-slate-800/80 mb-3">{block.content}</p>
        <button onClick={() => sendMessage(block.content)} className="text-xs text-[#8B5CF6] border border-[#8B5CF6]/30 px-3 py-1.5 rounded-lg hover:bg-[#8B5CF6]/10 transition-all">
          Ask the Professor →
        </button>
      </motion.div>
    );
    return null;
  };

  const isMicActive = voiceState === "listening";
  const isSpeaking = voiceState === "speaking";

  return (
    <AppShell>
      <div className="h-[calc(100vh-140px)] flex bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/5 overflow-hidden">

        {/* ─── Skill Tree Sidebar ──── */}
        <div className="w-[240px] bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-200 bg-white/50">
            <h3 className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Curriculum Path</h3>
            {skillTree.length > 0 && <span className="text-[9px] text-slate-400 font-bold">{completedSkills.size}/{skillTree.length}</span>}
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {skillTree.length === 0 && (
              <div className="py-12 px-6 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#00B4D8]/10 flex items-center justify-center mx-auto">
                   <Zap className="w-6 h-6 text-[#00B4D8]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-800">No path found</p>
                  <p className="text-[10px] text-slate-400">Initialize your neural curriculum to start learning.</p>
                </div>
                <button onClick={forceBuildCurriculum} className="btn-primary w-full py-2 text-[10px] font-bold">
                  Build Neural Path
                </button>
              </div>
            )}
            {skillTree.map((node: any, i: number) => (
              <button key={node.id || i} disabled={node.status === "locked"}
                onClick={() => node.status !== "locked" && openLesson(node)}
                className={cn("w-full text-left px-3 py-2.5 rounded-xl flex items-start gap-2.5 text-xs transition-all",
                  activeSkill?.id === node.id ? "bg-white border border-[#00B4D8]/20 shadow-lg shadow-[#00B4D8]/5 text-[#00B4D8] font-bold" :
                  node.status === "completed" ? "text-emerald-600 font-medium hover:bg-white" :
                  node.status === "available" ? "text-slate-600 font-medium hover:bg-white border border-slate-100" :
                  "text-slate-300 cursor-not-allowed"
                )}>
                <div className="shrink-0 mt-0.5">
                  {node.status === "completed" ? <CheckCircle className="w-4 h-4 text-emerald-500" /> :
                   node.status === "available" ? <CircleDot className="w-4 h-4 text-[#00B4D8]" /> :
                   <Lock className="w-3.5 h-3.5 text-slate-300" />}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block truncate tracking-tight">{node.skill || node.name || node.title || `Module ${i+1}`}</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{node.level || "beginner"} · Module {i+1}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="p-3 border-t border-slate-900/5 space-y-2">
            <button onClick={isTracking ? stopTracking : startTracking}
              className={`w-full py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium transition-all
                ${isTracking ? "bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20" : "btn-primary text-white"}`}>
              <Play className="w-3 h-3" />{isTracking ? "Monitor ON" : "Enable Monitor"}
            </button>
            {lesson && (
              <Link href={`/learn/visual?skill=${activeSkill?.id || ""}&title=${encodeURIComponent(activeSkill?.skill || "")}`}>
                <button className="w-full py-2 text-xs rounded-lg flex items-center justify-center gap-1.5 font-medium text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/10 transition-all">
                  <Eye className="w-3 h-3" /> Visual Mode
                </button>
              </Link>
            )}
          </div>
        </div>

        {/* ─── Main Lesson Area ──── */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header with Tabs */}
          <div className="px-6 py-3 border-b border-slate-200 bg-white">
            <div className="flex items-center gap-4 mb-3">
              <div className="p-2 rounded-xl bg-[#00B4D8]/10">
                <BookOpen className="w-4 h-4 text-[#00B4D8]" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-sm font-bold truncate">{lesson?.title || (lessonLoading ? "Generating lesson..." : "Select a skill to start")}</h1>
                {activeSkill && <p className="text-[10px] text-slate-400">{activeSkill.level || "beginner"} · {activeSkill.skill}</p>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={toggleMute} className={cn("p-1.5 rounded-lg transition-all", isMuted ? "text-slate-300" : "text-[#00B4D8] bg-[#00B4D8]/10")}>
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* Tab Bar */}
            {lesson && (
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {([
                    { key: "lesson", label: "Lesson", icon: BookOpen },
                    { key: "videos", label: "Videos", icon: Video },
                    { key: "summary", label: "Summary", icon: FileText },
                    { key: "quiz", label: "Quiz", icon: ClipboardCheck },
                  ] as { key: LessonTab; label: string; icon: any }[]).map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                      className={cn("flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        activeTab === tab.key
                          ? "bg-[#00B4D8] text-white shadow-lg shadow-[#00B4D8]/20"
                          : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                      )}>
                      <tab.icon className="w-3.5 h-3.5" />{tab.label}
                      {tab.key === "quiz" && quizPassed && <CheckCircle className="w-3 h-3 text-emerald-300" />}
                    </button>
                  ))}
                </div>
                {activeTab === "lesson" && (
                  <button onClick={() => { if (!summaryData) fetchSummary(); setShowSideSummary(!showSideSummary); }}
                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1.5",
                      showSideSummary ? "bg-[#8B5CF6] text-white border-[#8B5CF6]" : "bg-white text-[#8B5CF6] border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/5")}>
                    <Zap className="w-3 h-3" /> {showSideSummary ? "Hide Summary" : "Concept Summary"}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Lesson + Side Summary + Chat */}
          <div className="flex-1 flex overflow-hidden">
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0 relative">
              {lessonLoading && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <Loader2 className="w-8 h-8 text-[#00B4D8] animate-spin" />
                  <p className="text-sm text-slate-400">Professor AI is generating your personalized lesson...</p>
                </div>
              )}
              {!lessonLoading && !lesson && (
                <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-[#00B4D8]/5 flex items-center justify-center text-2xl">🧠</div>
                  <p className="text-slate-400 text-sm max-w-[260px]">Click any skill in the tree to generate your personalized AI lesson</p>
                </div>
              )}

              {/* ── TAB: Lesson ── */}
              {lesson && activeTab === "lesson" && (
                <>
                  {lesson.content_blocks?.map((b, i) => renderBlock(b, i))}
                  <div className="flex justify-center pt-4">
                    <button onClick={() => setActiveTab("videos")} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#00B4D8]/10 text-[#00B4D8] text-xs font-bold hover:bg-[#00B4D8]/20 transition-all">
                      Next: Watch Videos <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </>
              )}

              {/* ── TAB: Videos ── */}
              {lesson && activeTab === "videos" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-red-500" />
                      <h2 className="text-sm font-bold text-slate-900">Neural Video Labs</h2>
                    </div>
                    <button onClick={() => fetchVideos(activeSkill?.skill || "")} className="text-[10px] text-[#00B4D8] font-bold flex items-center gap-1 hover:underline">
                      <Sparkles className="w-3 h-3" /> Refresh Content
                    </button>
                  </div>
                  
                  {videosLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-red-400 animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">Orchestrating multi-modal resources...</p>
                    </div>
                  ) : videos.length === 0 ? (
                    <div className="py-20 text-center glass rounded-3xl">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                        <Video className="w-6 h-6 text-slate-300" />
                      </div>
                      <p className="text-sm text-slate-500 font-medium">No direct videos found yet.</p>
                      <button onClick={() => fetchVideos(activeSkill?.skill || "")} className="mt-4 text-xs font-bold text-[#00B4D8]">Try Re-Generating</button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {videos.map((v, i) => (
                        <motion.a key={i} href={v.search_url} target="_blank" rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                          className="group bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden hover:border-red-200 hover:shadow-xl hover:shadow-red-500/5 transition-all">
                          <div className="aspect-video bg-slate-900 relative flex items-center justify-center overflow-hidden">
                            <img src={`https://img.youtube.com/vi/placeholder/0.jpg`} className="absolute inset-0 w-full h-full object-cover opacity-20 blur-[2px] group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:bg-white group-hover:scale-110 transition-all">
                              <Play className="w-5 h-5 text-white group-hover:text-red-500 fill-current" />
                            </div>
                            {v.duration && <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-[9px] text-white font-bold">{v.duration}</div>}
                          </div>
                          <div className="p-4 space-y-2">
                            <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight group-hover:text-red-600 transition-colors">{v.title}</h4>
                            <div className="flex items-center justify-between mt-auto">
                              <span className="text-[9px] text-red-500 font-bold uppercase tracking-tighter">{v.channel || "Curated Lab"}</span>
                              <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 group-hover:text-red-400">
                                View Studio <ExternalLink className="w-2.5 h-2.5" />
                              </div>
                            </div>
                          </div>
                        </motion.a>
                      ))}
                    </div>
                  )}
                  
                  {!videosLoading && videos.length > 0 && (
                    <div className="flex justify-center pt-4">
                      <button onClick={() => setActiveTab("summary")} className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white text-xs font-bold hover:scale-105 transition-all shadow-lg shadow-slate-900/10">
                        Continue to Summary <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Summary ── */}
              {lesson && activeTab === "summary" && (
                <div className="space-y-6 max-w-3xl mx-auto">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText className="w-5 h-5 text-[#8B5CF6]" />
                    <h2 className="text-sm font-bold text-slate-900">Neural Concept Synthesis</h2>
                  </div>
                  
                  {summaryLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                      <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
                      <p className="text-xs text-slate-400 font-medium">Distilling core logic...</p>
                    </div>
                  ) : summaryData ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                      <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-5"><FileText className="w-20 h-20" /></div>
                        <div className="prose prose-slate max-w-none text-sm text-slate-700 leading-relaxed relative z-10 font-medium">
                          {summaryData.summary}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {summaryData.key_points?.length > 0 && (
                          <div className="p-6 rounded-3xl bg-white border border-slate-100 shadow-sm space-y-4">
                            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Key Insights</h3>
                            <div className="space-y-3">
                              {summaryData.key_points.map((p: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 text-[13px] text-slate-700">
                                  <div className="w-5 h-5 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle className="w-3 h-3 text-emerald-500" />
                                  </div>
                                  <span className="font-medium">{p}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {summaryData.real_world && (
                          <div className="p-6 rounded-3xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white shadow-xl shadow-[#8B5CF6]/20 relative overflow-hidden">
                            <div className="absolute -bottom-4 -right-4 p-4 opacity-10"><Lightbulb className="w-24 h-24" /></div>
                            <h3 className="text-[10px] font-bold opacity-70 uppercase tracking-widest mb-4">Neural Application</h3>
                            <p className="text-sm leading-relaxed font-bold">{summaryData.real_world}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex justify-center pt-4">
                        <button onClick={() => setActiveTab("quiz")} className="flex items-center gap-2 px-8 py-4 rounded-2xl bg-[#00B4D8] text-white text-sm font-bold hover:scale-105 transition-all shadow-xl shadow-[#00B4D8]/20">
                          Launch Neural Assessment <ClipboardCheck className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="py-20 text-center glass rounded-3xl">
                      <p className="text-sm text-slate-500">Failed to generate summary.</p>
                      <button onClick={fetchSummary} className="mt-4 text-xs font-bold text-[#8B5CF6]">Retry Synthesis</button>
                    </div>
                  )}
                </div>
              )}

              {/* ── TAB: Quiz ── */}
              {lesson && activeTab === "quiz" && (
                <div className="space-y-6 max-w-2xl mx-auto pb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <ClipboardCheck className="w-5 h-5 text-emerald-500" />
                      <h2 className="text-sm font-bold text-slate-900">Module Assessment</h2>
                    </div>
                    {!quizResults && <div className="px-3 py-1 rounded-full bg-emerald-50 text-[9px] text-emerald-600 font-bold uppercase tracking-widest border border-emerald-100">Neural Gatekeeping Active</div>}
                  </div>

                  {quizLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="relative">
                        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10" />
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Assembling Neural Assessment...</p>
                    </div>
                  ) : quizResults ? (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
                      <div className={cn("p-10 rounded-[2.5rem] border text-center space-y-4 relative overflow-hidden", 
                        quizResults.passed ? "bg-emerald-50/50 border-emerald-100" : "bg-red-50/50 border-red-100")}>
                        <div className="text-5xl mb-4">{quizResults.passed ? "🏆" : "💪"}</div>
                        <div>
                          <div className="text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em] mb-1">Final Score</div>
                          <div className="text-5xl font-black text-slate-900">{quizResults.overall_score}%</div>
                        </div>
                        <div className="max-w-xs mx-auto">
                          <p className="text-sm font-bold text-slate-600">{quizResults.message}</p>
                          <div className="text-[11px] text-slate-400 mt-2 font-medium">{quizResults.correct} of {quizResults.total} neurons fired correctly</div>
                        </div>
                        
                        {!quizResults.passed && (
                          <button onClick={() => { setQuizResults(null); fetchQuiz(); }} 
                            className="mt-6 px-10 py-4 rounded-2xl bg-slate-900 text-white text-sm font-bold hover:scale-105 transition-all shadow-xl shadow-slate-900/20">
                            Re-Calibrate Responses
                          </button>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4">Detailed Signal Analysis</h3>
                        {quizResults.results?.map((r: any, i: number) => (
                          <div key={i} className={cn("p-6 rounded-3xl border-l-4 bg-white shadow-sm border", 
                            r.is_correct ? "border-emerald-400 border-emerald-50" : "border-red-400 border-red-50")}>
                            <p className="text-[13px] font-bold text-slate-800 leading-tight mb-3">{i+1}. {r.question}</p>
                            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500 font-medium leading-relaxed">
                              <span className="font-bold text-slate-800 block mb-1">Neural Explanation:</span>
                              {r.explanation}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ) : quizQuestions.length > 0 ? (
                    <div className="space-y-6">
                      {quizQuestions.map((q, qi) => (
                        <motion.div key={qi} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: qi * 0.1 }}
                          className="bg-white border border-slate-100 p-8 rounded-[2rem] shadow-sm space-y-6">
                          <div className="flex gap-4">
                            <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 font-black text-slate-400 text-xs">
                              {qi + 1}
                            </div>
                            <p className="text-base font-bold text-slate-800 leading-snug">{q.question}</p>
                          </div>
                          <div className="grid grid-cols-1 gap-3 ml-12">
                            {q.options.map((opt, oi) => (
                              <button key={oi} onClick={() => { const a = [...quizAnswers]; a[qi] = oi; setQuizAnswers(a); }}
                                className={cn("text-left px-5 py-4 rounded-2xl text-[13px] border-2 transition-all group",
                                  quizAnswers[qi] === oi ? "bg-[#00B4D8]/5 border-[#00B4D8] text-[#00B4D8] font-bold" : "bg-slate-50/50 border-slate-100 text-slate-600 hover:border-slate-300"
                                )}>
                                <div className="flex items-center gap-4">
                                  <div className={cn("w-6 h-6 rounded-lg border flex items-center justify-center text-[10px] font-bold transition-colors",
                                    quizAnswers[qi] === oi ? "bg-[#00B4D8] border-[#00B4D8] text-white" : "bg-white border-slate-200 text-slate-400 group-hover:border-slate-400"
                                  )}>
                                    {String.fromCharCode(65+oi)}
                                  </div>
                                  {opt}
                                </div>
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      ))}
                      
                      <div className="pt-8">
                        <button onClick={submitQuiz} disabled={quizAnswers.includes(-1) || quizSubmitting}
                          className="w-full py-5 rounded-3xl bg-[#00B4D8] text-white text-lg font-black disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-[#00B4D8]/30 flex items-center justify-center gap-3">
                          {quizSubmitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Trophy className="w-6 h-6" />}
                          {quizSubmitting ? "Orchestrating Evaluation..." : "Verify Module Mastery"}
                        </button>
                        <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-6">Secure Assessment Protocol Active</p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-24 text-center glass rounded-[3rem]">
                      <div className="w-16 h-16 rounded-3xl bg-slate-50 flex items-center justify-center mx-auto mb-6">
                        <ClipboardCheck className="w-8 h-8 text-slate-200" />
                      </div>
                      <p className="text-sm text-slate-400 font-medium">Neural assessment generator is offline.</p>
                      <button onClick={fetchQuiz} className="mt-4 px-6 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200 transition-all">Retry Calibration</button>
                    </div>
                  )}
                </div>
              )}

              {/* Cognitive Intervention Popup Overlay */}
              <AnimatePresence>
                {cognitivePopup && (
                  <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="fixed bottom-6 right-6 z-50 w-[360px] rounded-2xl border p-5 space-y-3 shadow-2xl bg-white"
                    style={{ borderColor: `${cognitivePopup.color}40` }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${cognitivePopup.color}20` }}>
                          <cognitivePopup.icon className="w-4 h-4" style={{ color: cognitivePopup.color }} />
                        </div>
                        <span className="text-sm font-bold" style={{ color: cognitivePopup.color }}>{cognitivePopup.title}</span>
                      </div>
                      <button onClick={() => dismissPopup(cognitivePopup.type)} className="p-1 rounded-lg hover:bg-slate-100"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{cognitivePopup.message}</p>
                    <div className="flex gap-2">
                      <button onClick={() => dismissPopup(cognitivePopup.type)}
                        className="flex-1 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: `${cognitivePopup.color}15`, color: cognitivePopup.color }}>
                        {cognitivePopup.action}
                      </button>
                      <button onClick={() => dismissPopup(cognitivePopup.type)} className="px-3 py-2 rounded-xl text-xs text-slate-400 border border-slate-100">Dismiss</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Side Summary Panel */}
            <AnimatePresence>
              {showSideSummary && (
                <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 280, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
                  className="border-l border-slate-200 bg-white overflow-hidden flex flex-col shrink-0">
                  <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                      <Zap className="w-3 h-3 text-[#FFB800]" /> Concept Brief
                    </span>
                    <button onClick={() => setShowSideSummary(false)}><X className="w-3.5 h-3.5 text-slate-300" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {summaryLoading ? (
                      <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <Loader2 className="w-5 h-5 text-[#8B5CF6] animate-spin" />
                        <span className="text-[10px] text-slate-400 font-bold uppercase">Distilling...</span>
                      </div>
                    ) : summaryData ? (
                      <>
                        <div className="space-y-2">
                          <h4 className="text-[11px] font-bold text-slate-900">Neural Synthesis</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed italic">&quot;{summaryData.summary.slice(0, 150)}...&quot;</p>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-900">Key Pillars</h4>
                          <div className="space-y-2">
                            {summaryData.key_points?.slice(0, 3).map((p: string, i: number) => (
                              <div key={i} className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-500 shrink-0 mt-0.5" />
                                {p}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-[#8B5CF6] to-[#6D28D9] text-white space-y-2 shadow-lg shadow-[#8B5CF6]/10">
                          <h4 className="text-[9px] font-black opacity-60 uppercase tracking-widest">Real-World Logic</h4>
                          <p className="text-[10px] font-bold leading-tight">{summaryData.real_world}</p>
                        </div>
                      </>
                    ) : (
                      <p className="text-[10px] text-slate-400 text-center">No brief generated yet.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Chat Panel */}
            <div className="w-[340px] border-l border-slate-200 bg-slate-50/30 flex flex-col shrink-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-200 bg-white flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-[#00B4D8]/10">
                  <MessageSquare className="w-4 h-4 text-[#00B4D8]" />
                </div>
                <span className="text-sm font-bold text-slate-900">Professor AI</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                  {agentConfig.icon} {agentConfig.name}
                </span>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
                <AnimatePresence>
                  {messages.map((m, i) => (
                    <motion.div key={i} className={`flex gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                      {m.role === "assistant" && (
                        <div className="w-6 h-6 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[10px] shrink-0 mt-0.5">{m.icon || "🎓"}</div>
                      )}
                      <div className={`max-w-[88%] p-2.5 rounded-xl text-xs leading-relaxed ${m.role === "user" ? "bg-[#8B5CF6]/20 text-slate-800/80 rounded-tr-none" : "glass text-slate-800/70 rounded-tl-none"}`}>
                        {m.image_url && (
                          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="mb-3 rounded-xl overflow-hidden border border-slate-900/10 shadow-2xl relative group">
                            <div className="absolute top-2 left-2 px-2 py-1 bg-white/80 backdrop-blur-md rounded-lg text-[9px] text-[#00B4D8] font-bold border border-[#00B4D8]/30 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              VISUAL AI
                            </div>
                            <img key={m.image_url} src={m.image_url} alt="AI Visualization" referrerPolicy="no-referrer" className="w-full aspect-video object-cover hover:scale-105 transition-transform duration-700" />
                          </motion.div>
                        )}
                        <div className="whitespace-pre-wrap">{m.content}</div>
                        {m.role === "assistant" && (
                          <button onClick={() => speak(m.content)} className="ml-2 opacity-40 hover:opacity-80 transition-opacity inline-block">
                            <Volume2 className="w-2.5 h-2.5 inline" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {chatLoading && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#00B4D8]/10 flex items-center justify-center text-[10px] shrink-0">🎓</div>
                    <div className="glass px-3 py-2 rounded-xl text-xs text-slate-800/30 flex items-center gap-1.5">
                      <Loader2 className="w-3 h-3 animate-spin" />Thinking...
                    </div>
                  </div>
                )}
                {/* Live transcript preview */}
                {transcript && (
                  <div className="px-3 py-2 rounded-xl bg-[#8B5CF6]/10 border border-[#8B5CF6]/20 text-xs text-[#8B5CF6] italic">
                    🎙 {transcript}...
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Input area */}
              <div className="p-3 border-t border-slate-900/5 space-y-2">
                <div className="flex gap-2">
                  <input value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    placeholder={isMicActive ? "Listening..." : "Ask me anything..."}
                    className="flex-1 bg-slate-900/[0.03] border border-slate-900/5 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00B4D8]/30 placeholder-slate-800/30" />
                  {/* Mic button */}
                  {isSupported && (
                    <button onClick={handleMicClick}
                      className={`p-2 rounded-xl shrink-0 transition-all ${isMicActive
                        ? "bg-[#FF3366] text-slate-800 animate-pulse"
                        : "bg-slate-900/[0.04] text-slate-800/40 hover:text-slate-800/70 border border-slate-900/5"}`}>
                      {isMicActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    </button>
                  )}
                  <button onClick={() => sendMessage()} disabled={!input.trim() || chatLoading}
                    className="p-2 rounded-xl gradient-primary disabled:opacity-40 shrink-0">
                    <Send className="w-3.5 h-3.5 text-slate-800" />
                  </button>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[9px] text-slate-800/15">Enter to send · {isSupported ? "Mic available" : "No mic"}</span>
                  <button onClick={toggleMute} className={`text-[9px] flex items-center gap-0.5 transition-colors ${isMuted ? "text-slate-800/20" : "text-[#00B4D8]/60"}`}>
                    {isMuted ? <><VolumeX className="w-2.5 h-2.5" /> Muted</> : <><Volume2 className="w-2.5 h-2.5" /> Voice On</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── 6-Stream Cognitive Panel ──── */}
        <div className="w-[260px] border-l border-slate-200 bg-white overflow-y-auto shrink-0 min-h-0">
          <div className="p-5 space-y-5">
            <TutorOrb state={orbState} size="sm" agentName={agentConfig.name} agentIcon={agentConfig.icon} />
            <CognitiveFusionDashboard
              state={state}
              isTracking={isTracking}
              voiceEnabled={voiceEnabled}
              sessionDuration={sessionDuration}
              onToggleVoice={async () => voiceEnabled ? disableVoice() : enableVoice()}
            />
            {skillTree.length > 0 && (
              <div className="glass p-3 space-y-2">
                <div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Progress</div>
                <div className="text-lg font-bold text-[#00B4D8]">{completedSkills.size}/{skillTree.length}</div>
                <div className="h-1.5 bg-slate-900/5 rounded-full overflow-hidden">
                  <motion.div className="h-full rounded-full gradient-primary"
                    animate={{ width: `${(completedSkills.size / skillTree.length) * 100}%` }} transition={{ duration: 0.5 }} />
                </div>
                <p className="text-[9px] text-slate-800/20">Skills mastered</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppShell>
  );
}
