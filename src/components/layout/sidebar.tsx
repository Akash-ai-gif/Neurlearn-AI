"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, BookOpen, FlaskConical, Network, Target, Award, BarChart3, Settings, LogOut, Brain, Zap, HelpCircle, Trophy, Eye, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/context/user-context";
import { useCognitiveFusion } from "@/context/cognitive-context";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/learn", icon: BookOpen, label: "Learn", badge: "AI" },
  { href: "/learn/visual", icon: Eye, label: "Visual Mode" },
  { href: "/journey", icon: Trophy, label: "My Journey" },
  { href: "/labs", icon: FlaskConical, label: "Skill Labs" },
  { href: "/graph", icon: Network, label: "Knowledge Graph" },
  { href: "/doubt", icon: MessageSquare, label: "AI Mentor", badge: "NEW" },
];

const careerLabels: Record<string, string> = {
  data_analyst: "Data Analyst Track",
  swe: "Software Engineer Track",
  digital_marketing: "Digital Marketing Track",
  uiux: "UI/UX Design Track",
};

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useUser();
  const { state, isTracking } = useCognitiveFusion();

  const userName = user?.name || "Guest";
  const userInitial = userName.charAt(0).toUpperCase();
  const careerTrack = careerLabels[user?.career_goal || ""] || "Learning Track";

  const handleLogout = () => {
    logout();
    router.push("/onboarding");
  };

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-slate-200 z-40 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div className="p-5 flex items-center gap-3">
        <motion.div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center" whileHover={{ scale: 1.1, rotate: 5 }}>
          <Brain className="w-6 h-6 text-slate-800" />
        </motion.div>
        <div>
          <div className="font-bold text-slate-900 text-base tracking-tight">NeuroLearn</div>
          <div className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-bold flex items-center gap-1">
            <Zap className="w-2.5 h-2.5 text-[#00B4D8]" /> Adaptive OS
          </div>
        </div>
      </div>
      <div className="mx-4 mb-4 p-3 rounded-xl bg-slate-900/[0.02] border border-slate-900/5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Cognitive Status</span>
          <span className={cn("w-2 h-2 rounded-full", isTracking ? "bg-[#10B981] animate-pulse" : "bg-slate-200")} />
        </div>
        <div className="space-y-1.5">
          {[
            { label: "Engagement", value: state.engagement, color: "#00D1FF" },
            { label: "Focus", value: state.focus, color: "#00F5A0" }
          ].map((m, i) => (
            <div key={i}>
              <div className="flex justify-between text-[10px] text-slate-500 font-medium mb-0.5"><span>{m.label}</span><span>{m.value}%</span></div>
              <div className="h-1 bg-slate-100 rounded-full overflow-hidden"><motion.div className="h-full" style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: `${m.value}%` }} transition={{ duration: 0.5 }} /></div>
            </div>
          ))}
        </div>
      </div>
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}>
              <motion.div className={cn("flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all relative group mx-2", isActive ? "bg-[#00B4D8]/10 text-[#00B4D8] font-bold" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50")} whileHover={{ x: 4 }} whileTap={{ scale: 0.98 }}>
                {isActive && <motion.div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-full bg-[#00B4D8]" layoutId="activeNav" />}
                <item.icon className={cn("w-[20px] h-[20px]", isActive && "text-[#00B4D8]")} />
                <span className="font-medium tracking-tight">{item.label}</span>
                {item.badge && <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded-md bg-[#8B5CF6]/10 text-[#8B5CF6] font-bold uppercase tracking-tighter">{item.badge}</span>}
              </motion.div>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-100">
        <Link href="/settings"><div className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all"><Settings className="w-[20px] h-[20px]" /><span>Settings</span></div></Link>
        <div className="flex items-center gap-3 px-4 py-4 mt-2 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-[#00B4D8]/20">{userInitial}</div>
          <div className="flex-1 min-w-0"><div className="text-sm font-bold text-slate-900 truncate">{userName}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{careerTrack}</div></div>
          <LogOut className="w-4 h-4 text-slate-300 hover:text-red-500 transition-colors cursor-pointer" onClick={handleLogout} />
        </div>
      </div>
    </aside>
  );
}
