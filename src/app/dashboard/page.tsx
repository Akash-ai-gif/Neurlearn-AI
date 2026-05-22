"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { Brain, Target, Zap, Clock, TrendingUp, ChevronRight, Activity, Calendar, Trophy, Loader2, BarChart3, CheckCircle, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // Redirect to onboarding if not logged in
    if (!userLoading && !user) {
      router.push("/onboarding");
      return;
    }
    if (!user) return;

    const fetchDashboardData = async () => {
      try {
        const [pathRes, graphRes, analyticsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/learning/path/${user.user_id}`).catch(() => null),
          fetch(`${API_BASE_URL}/learning/skill-graph/${user.user_id}`).catch(() => null),
          fetch(`${API_BASE_URL}/assessment/history/${user.user_id}`).catch(() => null)
        ]);
        
        const path = pathRes && pathRes.ok ? await pathRes.json() : null;
        const graph = graphRes && graphRes.ok ? await graphRes.json() : null;
        const analytics = analyticsRes && analyticsRes.ok ? await analyticsRes.json() : { assessments: [] };
        
        setSessions(analytics.assessments || []);

        let parsedPath = path || {};
        let rawNodes = parsedPath.nodes;
        if (typeof rawNodes === 'string') {
          try { rawNodes = JSON.parse(rawNodes); } catch(e) {}
        }
        
        if (Array.isArray(rawNodes)) {
          parsedPath.nodes = rawNodes;
        } else if (rawNodes && typeof rawNodes === "object") {
          parsedPath.nodes = Array.isArray(rawNodes.nodes) ? rawNodes.nodes : (Array.isArray(rawNodes.skills) ? rawNodes.skills : []);
        } else {
          parsedPath.nodes = [];
        }

        setData({ path: parsedPath, graph: graph || { nodes: [], links: [] } });
      } catch (e) {
        console.error("Error loading dashboard data:", e);
        setData({ path: {}, graph: { nodes: [], links: [] } });
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, userLoading, router]);

  if (userLoading || isLoading) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
        <div className="relative">
          <motion.div 
            className="absolute -inset-4 rounded-full border-2 border-[#00B4D8]/20"
            animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <Loader2 className="w-12 h-12 text-[#00B4D8] animate-spin relative z-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-slate-900">Synchronizing Cognitive Profile...</h2>
          <p className="text-slate-500 text-sm max-w-xs mx-auto">Our AI architects are building your industry-standard curriculum path based on your selected domain.</p>
        </div>
      </div>
    </AppShell>
  );

  const careerLabels: Record<string, string> = {
    data_analyst: "Data Analyst",
    swe: "Software Engineer",
    digital_marketing: "Digital Marketing",
    uiux: "UI/UX Designer",
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-[#00B4D8]">{user?.name?.split(' ')[0] || 'Learning'}</span> 👋
            </h1>
            <p className="text-slate-500 font-medium mt-1">Your cognitive learning path is looking strong today.</p>
          </motion.div>
          <div className="flex items-center gap-4">
            <div className="glass-strong px-6 py-3 flex items-center gap-4">
              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Goal</div>
                <div className="text-sm font-bold text-slate-700">45 / 60 mins</div>
              </div>
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray="125.6" strokeDashoffset={125.6 * (1 - 0.75)} className="text-[#00B4D8]" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-[#00B4D8]">75%</span>
              </div>
            </div>
          </div>
        </header>

        {/* Analytics Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { label: "Engagement", value: "84%", icon: Zap, color: "#00B4D8", trend: "+12%" },
            { label: "Flow State", value: "12.4h", icon: Activity, color: "#10B981", trend: "High" },
            { label: "Focus Depth", value: "High", icon: Brain, color: "#8B5CF6", trend: "Stable" },
            { label: "Peak Performance", value: "11 AM", icon: Trophy, color: "#FFB800", trend: "Morning" }
          ].map((stat, i) => (
            <motion.div key={i} className="glass p-6 group relative overflow-hidden" whileHover={{ y: -4 }}>
              <div className="absolute top-0 left-0 w-1 h-full" style={{ background: stat.color }} />
              <div className="flex items-center justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ background: `${stat.color}15` }}>
                  <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.trend}</span>
              </div>
              <div className="text-2xl font-black text-slate-900 mb-1">{stat.value}</div>
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Main Path Progress */}
          <div className="col-span-2 space-y-6">
            <div className="glass p-8 relative overflow-hidden">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#00B4D8]/10">
                    <Activity className="w-6 h-6 text-[#00B4D8]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">Learning Journey: {careerLabels[data?.path?.career_goal] || data?.path?.career_goal || "Your Path"}</h3>
                    <div className="text-xs font-medium text-slate-400">Mastery path calculated by AI</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-[#00B4D8]">{data?.path?.completion_percent || 0}% Complete</div>
                  <div className="w-32 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-[#00B4D8]" style={{ width: `${data?.path?.completion_percent || 0}%` }} />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
                {(data?.path?.nodes || []).slice(0, 4).map((node: any, i: number) => (
                  <div key={i} className={cn(
                    "p-5 rounded-2xl border transition-all cursor-pointer group",
                    node.status === 'mastered' ? "bg-emerald-50 border-emerald-100" :
                    node.status === 'available' ? "bg-white border-[#00B4D8]/20 shadow-lg shadow-[#00B4D8]/5" :
                    "bg-slate-50 border-slate-100 opacity-60"
                  )}>
                    <div className="flex items-center gap-2 mb-3">
                      {node.status === 'mastered' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <BookOpen className="w-4 h-4 text-[#00B4D8]/40" />}
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{node.status}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#00B4D8] transition-colors">{node.skill || node.name || node.title || `Module ${i+1}`}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="glass p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Brain className="w-4 h-4 text-[#8B5CF6]" /> Skill DNA
                  </h3>
                  <Sparkles className="w-3 h-3 text-[#8B5CF6]/40" />
                </div>
                <div className="space-y-5">
                  {[
                    { label: "Logic & Math", value: 92, color: "#7C3AED" },
                    { label: "Visual Processing", value: 45, color: "#00D1FF" },
                    { label: "Verbal Recall", value: 78, color: "#00F5A0" },
                    { label: "Problem Solving", value: 85, color: "#FFB800" },
                  ].map(skill => (
                    <div key={skill.label} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-slate-400">{skill.label}</span>
                        <span className="text-slate-900">{skill.value}%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className="h-full rounded-full" style={{ background: skill.color, width: `${skill.value}%` }} initial={{ width: 0 }} animate={{ width: `${skill.value}%` }} transition={{ duration: 1 }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#10B981]" /> Activity Hub
                  </h3>
                  <div className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Active</div>
                </div>
                <div className="flex items-end justify-between h-28 gap-2 px-2">
                  {[40, 65, 30, 85, 45, 90, 70].map((h, i) => (
                    <div key={i} className="flex-1 group relative h-full flex items-end">
                      <motion.div className="w-full gradient-success rounded-t-lg shadow-lg shadow-[#00F5A0]/10" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: i * 0.1 }} />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                        {h}%
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold px-1"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div>
              </div>
            </div>

            <div className="glass p-6 space-y-5">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-400" /> Recent Sessions
              </h3>
              <div className="grid grid-cols-1 gap-4">
                {sessions.slice(0, 3).map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${i % 2 === 0 ? 'bg-[#00B4D8] text-white' : 'bg-[#8B5CF6] text-white'}`}>
                        {i % 2 === 0 ? <Brain className="w-5 h-5" /> : <Activity className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-[#00B4D8] transition-colors">{s.skill} Session</div>
                        <div className="text-[10px] text-slate-400 font-bold">{s.date} · {i === 0 ? "45m" : "32m"} duration</div>
                      </div>
                    </div>
                    <div className="flex gap-6 items-center">
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Engaged</div>
                        <div className="text-xs font-black text-[#00B4D8]">88%</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">Growth</div>
                        <div className="text-xs font-black text-emerald-500">+12</div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Cognitive & Tasks */}
          <div className="space-y-6">
            <div className="glass p-6 space-y-5 border-l-4 border-[#00B4D8] bg-[#00B4D8]/[0.02]">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] font-black text-[#00B4D8] uppercase tracking-[0.2em]">Recommended Now</h3>
                <Sparkles className="w-4 h-4 text-[#00B4D8] animate-pulse" />
              </div>
              <div className="space-y-4">
                <div onClick={() => router.push("/learn")} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#00B4D8]/40 hover:shadow-xl hover:shadow-[#00B4D8]/5 transition-all cursor-pointer group">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Next Priority</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    {(data?.path?.nodes || []).find((n: any) => n.status === 'available')?.skill || "Intro to Neural Nets"}
                    <div className="p-1 rounded-full bg-[#00B4D8]/10 group-hover:bg-[#00B4D8]/20 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-[#00B4D8]" />
                    </div>
                  </div>
                </div>
                <div onClick={() => router.push("/labs/communication")} className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-[#00B4D8]/40 hover:shadow-xl hover:shadow-[#00B4D8]/5 transition-all cursor-pointer group">
                  <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mb-2">Active Lab</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center justify-between">
                    Practice Interview
                    <div className="p-1 rounded-full bg-[#00B4D8]/10 group-hover:bg-[#00B4D8]/20 transition-colors">
                      <ChevronRight className="w-3.5 h-3.5 text-[#00B4D8]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Merged Performance Breakdown */}
            <div className="glass p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800/40 uppercase tracking-widest flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" /> Performance Breakdown</h3>
              <div className="space-y-4">
                {[
                  { label: "Conceptual Strength", value: 92, color: "#00B4D8" },
                  { label: "Practical Execution", value: 78, color: "#10B981" },
                  { label: "Retention Rate", value: 85, color: "#8B5CF6" },
                ].map(item => (
                  <div key={item.label} className="space-y-1.5">
                    <div className="flex justify-between text-[9px] uppercase font-bold tracking-wider"><span className="text-slate-800/40">{item.label}</span><span className="text-slate-800/80">{item.value}%</span></div>
                    <div className="h-1 bg-slate-900/5 rounded-full overflow-hidden"><div className="h-full" style={{ background: item.color, width: `${item.value}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-xl bg-slate-900/[0.02] border border-slate-900/5 mt-2">
                <div className="text-[8px] text-slate-800/30 uppercase mb-1">AI Feedback</div>
                <p className="text-[10px] text-slate-800/60 leading-relaxed italic">&quot;You excel at visual abstractions but tend to lose engagement during long text-heavy modules.&quot;</p>
              </div>
            </div>

            <div className="glass p-5 space-y-4">
              <h3 className="text-xs font-bold text-slate-800/40 uppercase tracking-widest flex items-center gap-2"><Trophy className="w-3.5 h-3.5" /> Recent Achievements</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FFB800]/10 flex items-center justify-center text-lg shadow-inner shadow-[#FFB800]/20">🔥</div>
                  <div><div className="text-[11px] font-bold text-slate-800/80">Getting Started</div><div className="text-[9px] text-slate-800/30">Completed onboarding</div></div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#10B981]/10 flex items-center justify-center text-lg shadow-inner shadow-[#00F5A0]/20">🎯</div>
                  <div><div className="text-[11px] font-bold text-slate-800/80">Path Created</div><div className="text-[9px] text-slate-800/30">Your learning journey begins</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
