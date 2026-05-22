"use client";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { Code, MessageSquare, BarChart3, Shield, Heart, Wrench, ArrowRight, Sparkles, Lock, Zap } from "lucide-react";
import Link from "next/link";
import { useUser } from "@/context/user-context";
import { cn } from "@/lib/utils";

const labs = [
  { id: "code", title: "Code Lab", desc: "Browser-based IDE with AI code reviewer, debugging assistant, and auto-generated challenges", icon: Code, color: "#00D1FF", tags: ["Python", "JavaScript", "SQL", "Java"], href: "/labs/code",
    domains: ["Software Engineer", "Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "Game Developer", "Blockchain Developer", "QA / Testing Engineer", "DevOps Engineer", "Cloud Engineer", "ML / AI Engineer", "Data Engineer", "Database Administrator"] },
  { id: "communication", title: "Communication Lab", desc: "AI interview bot, pronunciation feedback, body language analysis, and presentation practice", icon: MessageSquare, color: "#7C3AED", tags: ["Interview", "Presentation", "Discussion"], href: "/labs/communication",
    domains: ["Digital Marketing", "Product Manager", "Business Analyst", "Technical Writer", "UI/UX Designer", "Graphic Designer", "Software Engineer", "Full Stack Developer", "Data Analyst", "Data Scientist"] },
  { id: "data", title: "Data Analytics Lab", desc: "Real datasets, in-browser Python/SQL, auto-graded analysis, and dashboard builder", icon: BarChart3, color: "#00F5A0", tags: ["Python", "SQL", "Visualization"], href: "/labs/data",
    domains: ["Data Analyst", "Data Scientist", "ML / AI Engineer", "Data Engineer", "Business Analyst", "Database Administrator"] },
  { id: "cyber", title: "Cybersecurity Lab", desc: "Safe virtual hacking environments, CTF challenges, and incident response drills", icon: Shield, color: "#FF3366", tags: ["Network", "Web Security", "Forensics"], href: "/labs/cyber",
    domains: ["Cybersecurity Analyst", "Ethical Hacker", "Network Engineer", "Cloud Engineer", "DevOps Engineer"] },
  { id: "healthcare", title: "Healthcare Lab", desc: "Virtual patient scenarios, decision trees, emergency response, and medical history taking", icon: Heart, color: "#FFB800", tags: ["Diagnosis", "Triage", "Pharmacology"], href: "/labs/healthcare",
    domains: ["Healthcare"] },
  { id: "vocational", title: "Vocational Skills Lab", desc: "AR-based repair training, machine operation guides, and safety protocol training", icon: Wrench, color: "#00D1FF", tags: ["Electrical", "Plumbing", "Automotive"], href: "/labs/vocational",
    domains: ["Vocational"] },
];

export default function LabsPage() {
  const { user } = useUser();
  const userDomain = user?.career_goal || "";

  // Filter: show labs whose domains list includes the user's career goal
  const matchedLabs = labs.filter(l => l.domains.some(d => userDomain.toLowerCase().includes(d.toLowerCase()) || d.toLowerCase().includes(userDomain.toLowerCase())));
  // If nothing matched, show Code Lab + Communication Lab as sensible defaults
  const visibleLabs = matchedLabs.length > 0 ? matchedLabs : labs.slice(0, 2);
  const lockedLabs = labs.filter(l => !visibleLabs.includes(l));

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-black flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#00B4D8]/10"><Zap className="w-5 h-5 text-[#00B4D8]" /></div>
            Simulation Labs
          </h1>
          <p className="text-slate-400 text-sm mt-2 ml-12">
            Hands-on practice environments tailored for <span className="font-bold text-[#00B4D8]">{userDomain || "your domain"}</span>
          </p>
        </motion.div>

        {/* Active Labs */}
        <div>
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-[#00B4D8]" /> Your Domain Labs
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleLabs.map((lab, i) => (
              <Link key={lab.id} href={lab.href}>
                <motion.div className="p-6 rounded-3xl bg-white border border-slate-100 group cursor-pointer flex flex-col h-full hover:border-transparent hover:shadow-2xl transition-all relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -5 }}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5" style={{ background: lab.color }} />
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `${lab.color}15`, border: `1px solid ${lab.color}20` }}>
                      <lab.icon className="w-7 h-7" style={{ color: lab.color }} />
                    </div>
                    <div className="px-2 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-[9px] font-black text-emerald-500 uppercase tracking-widest">Active</div>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mb-2 group-hover:text-[#00B4D8] transition-colors">{lab.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-5 flex-1">{lab.desc}</p>
                  <div className="flex flex-wrap gap-1.5 mb-5">
                    {lab.tags.map(t => (
                      <span key={t} className="px-2 py-0.5 rounded-lg bg-slate-50 text-[10px] text-slate-500 border border-slate-100 font-medium">{t}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold transition-colors" style={{ color: lab.color }}>
                    Enter Simulation <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>

        {/* Locked Labs */}
        {lockedLabs.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock className="w-3 h-3" /> Other Domains
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lockedLabs.map((lab, i) => (
                <div key={lab.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-100 opacity-50 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-100">
                    <lab.icon className="w-5 h-5 text-slate-300" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-400">{lab.title}</div>
                    <div className="text-[10px] text-slate-300">Switch domain to unlock</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
