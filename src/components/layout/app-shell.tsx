"use client";

import { useState, useRef, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { Search, Bell, Activity, X, BookOpen, Trophy, Zap, CheckCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

const notifications = [
  { id: 1, type: "achievement", icon: Trophy, color: "#FFB800", title: "Path Created!", desc: "Your adaptive learning journey has begun.", time: "Just now", read: false },
  { id: 2, type: "lesson", icon: BookOpen, color: "#00D1FF", title: "New Lesson Available", desc: "SQL JOINs is ready for you.", time: "2m ago", read: false },
  { id: 3, type: "streak", icon: Zap, color: "#00F5A0", title: "Streak Active!", desc: "Keep going to maintain your daily streak.", time: "1h ago", read: true },
  { id: 4, type: "complete", icon: CheckCircle, color: "#7C3AED", title: "Onboarding Complete", desc: "All systems calibrated for your learning style.", time: "Today", read: true },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifList, setNotifList] = useState(notifications);
  const notifRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const unreadCount = notifList.filter(n => !n.read).length;

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSearch = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      if (q.includes("sql") || q.includes("learn") || q.includes("lesson")) router.push("/learn");
      else if (q.includes("lab") || q.includes("code")) router.push("/labs/code");
      else if (q.includes("career") || q.includes("job")) router.push("/career");
      else if (q.includes("graph") || q.includes("knowledge")) router.push("/graph");
      else if (q.includes("doubt") || q.includes("ask") || q.includes("question")) router.push("/doubt");
      else if (q.includes("setting")) router.push("/settings");
      else if (q.includes("analytic")) router.push("/dashboard");
      else if (q.includes("assess") || q.includes("quiz") || q.includes("test")) router.push("/assessment");
      else router.push("/dashboard");
      setSearchQuery("");
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8F9FA]">
      <Sidebar />
      <div className="flex-1 ml-[280px]">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                placeholder="Search anything..."
                className="w-full bg-slate-100/50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00B4D8]/20 focus:bg-white transition-all"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <Activity className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-xs font-bold text-slate-600">34 day streak</span>
            </div>
            
            {/* Notification Bell — Functional */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2.5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
              >
                <Bell className="w-4 h-4 text-slate-400" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#FF3366] border-2 border-white" />
                )}
              </button>
              
              <AnimatePresence>
                {showNotifs && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-12 w-80 glass-strong rounded-2xl border border-slate-900/10 shadow-2xl overflow-hidden z-50"
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-900/5">
                      <h3 className="text-xs font-bold text-slate-800/60 uppercase tracking-wider">Notifications</h3>
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] text-[#00B4D8] hover:text-[#00B4D8]/80">Mark all read</button>
                        )}
                        <button onClick={() => setShowNotifs(false)}>
                          <X className="w-3.5 h-3.5 text-slate-800/30 hover:text-slate-800/60" />
                        </button>
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {notifList.map(n => (
                        <div 
                          key={n.id} 
                          className={`flex items-start gap-3 px-4 py-3 hover:bg-slate-900/[0.03] transition-colors cursor-pointer border-b border-white/[0.03] ${!n.read ? 'bg-slate-900/[0.02]' : ''}`}
                          onClick={() => setNotifList(prev => prev.map(item => item.id === n.id ? { ...item, read: true } : item))}
                        >
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${n.color}15` }}>
                            <n.icon className="w-4 h-4" style={{ color: n.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-800/80">{n.title}</span>
                              {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#00B4D8]" />}
                            </div>
                            <p className="text-[10px] text-slate-800/40 mt-0.5">{n.desc}</p>
                            <span className="text-[9px] text-slate-800/20 mt-1">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
