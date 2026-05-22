"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain, Sparkles, Network, ArrowRight, Eye, Mic, Keyboard,
  BarChart3, Clock, Zap, BookOpen, Target, Award, Shield,
  Code, MessageSquare, TrendingUp, Users, Globe
} from "lucide-react";
import { useUser } from "@/context/user-context";

const features = [
  { icon: Brain, title: "AI Personal Mentor", desc: "Multi-agent system adapts to your cognitive state in real-time", color: "#00D1FF" },
  { icon: Network, title: "Adaptive Learning Path", desc: "Dynamic roadmaps that evolve based on 7 real-time signals", color: "#7C3AED" },
  { icon: Code, title: "Virtual Skill Labs", desc: "Browser-based IDE, cyber labs, and communication practice", color: "#00F5A0" },
  { icon: BarChart3, title: "AI Assessment Engine", desc: "Beyond MCQs — project-based, AI-evaluated real-skill testing", color: "#FFB800" },
  { icon: Target, title: "Career Mentor", desc: "Market-aware recommendations based on your strengths", color: "#FF3366" },
  { icon: Award, title: "Skill Passport", desc: "Verified credentials that employers trust", color: "#00D1FF" },
];

const streams = [
  { icon: Eye, label: "Eye Tracking", color: "#00D1FF" },
  { icon: Sparkles, label: "Face Analysis", color: "#7C3AED" },
  { icon: Mic, label: "Voice Prosody", color: "#00F5A0" },
  { icon: Keyboard, label: "Typing Patterns", color: "#FFB800" },
  { icon: BarChart3, label: "Answer Quality", color: "#FF3366" },
  { icon: Clock, label: "Temporal Data", color: "#00D1FF" },
];

const stats = [
  { value: "50+", label: "Languages" },
  { value: "10+", label: "Domains" },
  { value: "6", label: "AI Agents" },
  { value: "9", label: "Modalities" },
];

export default function LandingPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, router]);

  if (isLoading) return null;

  return (
    <div className="min-h-screen">
      {/* ═══ Navigation ═══ */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-slate-800" />
            </div>
            <span className="text-lg font-bold">NeuroLearn</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-slate-800/60 hover:text-slate-800 transition-colors">Features</a>
            <a href="#engine" className="text-sm text-slate-800/60 hover:text-slate-800 transition-colors">How It Works</a>
            <a href="#domains" className="text-sm text-slate-800/60 hover:text-slate-800 transition-colors">Domains</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/onboarding" className="btn-ghost text-sm py-2 px-5">Sign In</Link>
            <Link href="/onboarding" className="btn-primary text-sm py-2 px-5 flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══ Hero Section ═══ */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Animated background orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            className="absolute w-[600px] h-[600px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,209,255,0.08) 0%, transparent 70%)", top: "10%", left: "10%" }}
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[500px] h-[500px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)", top: "20%", right: "10%" }}
            animate={{ x: [0, -25, 0], y: [0, 25, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="absolute w-[400px] h-[400px] rounded-full"
            style={{ background: "radial-gradient(circle, rgba(0,245,160,0.05) 0%, transparent 70%)", bottom: "10%", left: "40%" }}
            animate={{ x: [0, 20, 0], y: [0, -30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div
            className="text-center max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-4 h-4 text-[#00B4D8]" />
              <span className="text-xs font-medium text-slate-800/70">Powered by 6-Stream Cognitive Fusion AI</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
              <span className="block">The AI Tutor That</span>
              <span className="gradient-text">Sees How You Learn</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-800/50 max-w-2xl mx-auto mb-10 leading-relaxed">
              NeuroLearn detects your engagement, confusion, and flow in real-time through your webcam — 
              then adapts its teaching style, content, and pace to match exactly how YOUR brain works.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/onboarding" className="btn-primary text-base py-3 px-8 flex items-center gap-2 text-slate-800">
                <Zap className="w-5 h-5" /> Start Learning Free
              </Link>
              <Link href="/dashboard" className="btn-ghost text-base py-3 px-8 flex items-center gap-2">
                <BookOpen className="w-5 h-5" /> Explore Platform
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mt-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            {stats.map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold gradient-text">{s.value}</div>
                <div className="text-sm text-slate-800/40 mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ 6-Stream Engine ═══ */}
      <section id="engine" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              6-Stream <span className="gradient-text">Cognitive Fusion</span>
            </h2>
            <p className="text-slate-800/50 max-w-xl mx-auto">
              Our AI processes 6 real-time data streams to understand exactly how you&apos;re learning
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {streams.map((stream, i) => (
              <motion.div
                key={i}
                className="glass glass-hover p-6 text-center cursor-pointer group"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <div
                  className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                  style={{ background: `${stream.color}15`, boxShadow: `0 0 20px ${stream.color}20` }}
                >
                  <stream.icon className="w-6 h-6" style={{ color: stream.color }} />
                </div>
                <div className="text-sm font-medium text-slate-800/80">{stream.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Fusion diagram */}
          <motion.div
            className="mt-12 glass-glow p-8 max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="text-sm text-slate-800/40 uppercase tracking-widest mb-3">Cognitive State Estimator</div>
            <div className="flex items-center justify-center gap-6 flex-wrap">
              {['Engagement', 'Confusion', 'Flow', 'Fatigue'].map((label, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    i === 0 ? 'bg-[#00B4D8]' : i === 1 ? 'bg-[#FF3366]' : i === 2 ? 'bg-[#10B981]' : 'bg-[#FFB800]'
                  } animate-pulse`} />
                  <span className="text-sm text-slate-800/60">{label}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-slate-800/30">↓ Drives Every Feature Below ↓</div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Features Grid ═══ */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              <span className="gradient-text">6 Platforms</span> in One
            </h2>
            <p className="text-slate-800/50 max-w-xl mx-auto">
              Everything you need to go from zero to career-ready
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="glass glass-hover p-8 group cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div
                  className="w-14 h-14 rounded-2xl mb-5 flex items-center justify-center transition-all group-hover:scale-110"
                  style={{ background: `${f.color}12`, border: `1px solid ${f.color}25` }}
                >
                  <f.icon className="w-7 h-7" style={{ color: f.color }} />
                </div>
                <h3 className="text-xl font-bold mb-2 text-slate-800/90 group-hover:text-slate-800 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-800/45 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Domains ═══ */}
      <section id="domains" className="py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-12">
            Learn <span className="gradient-text">Anything</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {['💻 Coding', '📊 Data Analytics', '🤖 AI/ML', '📱 Digital Marketing', '🗣️ Communication',
              '🔒 Cybersecurity', '🚀 Entrepreneurship', '🏥 Healthcare', '🔧 Vocational Skills', '🎯 Interview Prep'
            ].map((domain, i) => (
              <motion.div
                key={i}
                className="glass glass-hover px-5 py-3 text-sm font-medium text-slate-800/70 cursor-pointer"
                whileHover={{ scale: 1.05, y: -3 }}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                {domain}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="glass-glow p-12 text-center relative overflow-hidden"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="absolute inset-0 gradient-primary opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Learn at the <span className="gradient-text">Speed of Thought?</span>
              </h2>
              <p className="text-slate-800/50 mb-8 max-w-lg mx-auto">
                Join thousands of learners using AI-powered adaptive education. 
                Quality education for everyone, everywhere.
              </p>
              <Link href="/onboarding" className="btn-primary text-base py-3 px-10 inline-flex items-center gap-2 text-slate-800">
                <Brain className="w-5 h-5" /> Start Your Journey <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ Footer ═══ */}
      <footer className="py-8 px-6 border-t border-slate-900/5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#00B4D8]" />
            <span className="font-semibold">NeuroLearn</span>
            <span className="text-slate-800/30 text-sm">© 2026</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-800/40">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Privacy</span>
            <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> 50+ Languages</span>
            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> Open for All</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
