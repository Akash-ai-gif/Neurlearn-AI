"use client";
import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { motion } from "framer-motion";
import {
  Trophy, Star, Flame, BookOpen, CheckCircle, Clock,
  TrendingUp, Target, Calendar, Loader2, ArrowRight
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

type JourneyEvent = {
  id: string;
  event_type: string;
  skill_id: string;
  skill_name: string;
  score: number;
  time_spent_minutes: number;
  created_at: string;
};

type Stats = {
  completion_percent: number;
  skills_completed: number;
  total_skills: number;
  career_goal: string;
};

export default function JourneyPage() {
  const { user } = useUser();
  const router = useRouter();
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [stats, setStats] = useState<Stats>({ completion_percent: 0, skills_completed: 0, total_skills: 0, career_goal: "" });
  const [streak, setStreak] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const [journeyRes, streakRes] = await Promise.all([
          fetch(`${API}/progress/journey/${user.user_id}`),
          fetch(`${API}/progress/streak/${user.user_id}`),
        ]);
        const journeyData = await journeyRes.json();
        const streakData = await streakRes.json();
        setEvents(journeyData.events || []);
        setStats(journeyData.stats || {});
        setStreak(streakData.streak || 0);
        setTotalCompleted(streakData.total_completed || 0);
      } catch (e) {
        console.error("Journey load error:", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [user]);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const eventConfig: Record<string, { icon: string; label: string; color: string }> = {
    lesson_started: { icon: "📖", label: "Started Lesson", color: "#00D1FF" },
    lesson_completed: { icon: "✅", label: "Completed Lesson", color: "#00F5A0" },
    quiz_passed: { icon: "🎯", label: "Passed Quiz", color: "#FFB800" },
    skill_unlocked: { icon: "🔓", label: "Skill Unlocked", color: "#7C3AED" },
  };

  const completedEvents = events.filter(e => e.event_type === "lesson_completed");
  const totalMinutes = completedEvents.reduce((sum, e) => sum + (e.time_spent_minutes || 0), 0);
  const avgScore = completedEvents.length > 0
    ? Math.round(completedEvents.reduce((sum, e) => sum + (e.score || 0), 0) / completedEvents.length)
    : 0;

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 ml-[260px] p-10 max-w-6xl">

        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <Trophy className="w-8 h-8 text-[#FFB800]" />
            Learner Journey
          </h1>
          <p className="text-slate-500 font-medium mt-1">Your comprehensive growth history and achievements</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-[#00B4D8] animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
              {[
                { label: "Skills Completed", value: `${stats.skills_completed}/${stats.total_skills}`, icon: <CheckCircle className="w-5 h-5" />, color: "#10B981" },
                { label: "Learning Streak", value: `${streak} days`, icon: <Flame className="w-5 h-5" />, color: "#F97316" },
                { label: "Minutes Learned", value: `${totalMinutes}m`, icon: <Clock className="w-5 h-5" />, color: "#00B4D8" },
                { label: "Avg Score", value: avgScore > 0 ? `${avgScore}%` : "—", icon: <Star className="w-5 h-5" />, color: "#FFB800" },
              ].map((s, i) => (
                <motion.div key={i} className="glass p-6 group relative overflow-hidden"
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} whileHover={{ y: -4 }}>
                  <div className="absolute top-0 left-0 w-1 h-full" style={{ background: s.color }} />
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-xl" style={{ background: `${s.color}15`, color: s.color }}>{s.icon}</div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">{s.label}</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900">{s.value}</div>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="glass p-6 rounded-xl mb-8">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h2 className="text-sm font-semibold">Path Progress</h2>
                  {stats.career_goal && <p className="text-xs text-slate-800/30 mt-0.5">Goal: {stats.career_goal}</p>}
                </div>
                <span className="text-xl font-bold text-[#00B4D8]">{stats.completion_percent}%</span>
              </div>
              <div className="h-3 bg-slate-900/5 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full gradient-primary"
                  initial={{ width: 0 }} animate={{ width: `${stats.completion_percent}%` }} transition={{ duration: 1, delay: 0.3 }} />
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-slate-800/20">Started</span>
                <span className="text-[10px] text-slate-800/20">{stats.skills_completed} of {stats.total_skills} skills mastered</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-slate-800/60 uppercase tracking-wider">Activity Timeline</h2>

              {events.length === 0 ? (
                <motion.div className="glass p-10 rounded-xl text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="text-4xl mb-3">🌱</div>
                  <p className="text-slate-800/40 text-sm mb-4">Your journey starts here! Complete your first lesson to see it tracked.</p>
                  <button onClick={() => router.push("/learn")}
                    className="flex items-center gap-2 mx-auto btn-primary px-5 py-2.5 rounded-xl text-sm text-slate-800">
                    Start Learning <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-900/5" />

                  <div className="space-y-3">
                    {events.map((event, i) => {
                      const cfg = eventConfig[event.event_type] || { icon: "📌", label: event.event_type, color: "#ffffff" };
                      return (
                        <motion.div key={event.id} className="flex gap-4"
                          initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                          {/* Timeline dot */}
                          <div className="relative z-10 w-10 h-10 rounded-full glass flex items-center justify-center text-base shrink-0 border"
                            style={{ borderColor: `${cfg.color}30` }}>
                            {cfg.icon}
                          </div>
                          {/* Event card */}
                          <div className="flex-1 glass p-4 rounded-xl hover:bg-slate-900/[0.03] transition-all">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                                  {event.score > 0 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800]/20">
                                      {event.score}%
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-slate-800/80 mt-1">{event.skill_name || event.skill_id}</p>
                                {event.time_spent_minutes > 0 && (
                                  <p className="text-[10px] text-slate-800/30 mt-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />{event.time_spent_minutes} min
                                  </p>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-800/20 shrink-0 ml-4">{formatTime(event.created_at)}</span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* CTA if not much activity */}
            {events.length > 0 && completedEvents.length < 3 && (
              <motion.div className="mt-8 glass p-6 rounded-xl border border-[#00B4D8]/10 flex items-center justify-between"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                <div>
                  <h3 className="text-sm font-semibold mb-1">Keep the momentum going! 🚀</h3>
                  <p className="text-xs text-slate-800/40">Complete more lessons to build your streak and unlock new skills</p>
                </div>
                <button onClick={() => router.push("/learn")}
                  className="flex items-center gap-2 btn-primary px-4 py-2 rounded-xl text-xs text-slate-800 shrink-0 ml-4">
                  Continue Learning <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
