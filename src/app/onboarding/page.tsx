"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Sparkles, Clock, Brain, Check, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/user-context";

const ALL_DOMAINS = [
  { id: "swe", label: "Software Engineer", icon: "💻", cat: "Tech" },
  { id: "frontend", label: "Frontend Developer", icon: "🎨", cat: "Tech" },
  { id: "backend", label: "Backend Developer", icon: "⚙️", cat: "Tech" },
  { id: "fullstack", label: "Full Stack Developer", icon: "🔗", cat: "Tech" },
  { id: "mobile_dev", label: "Mobile App Developer", icon: "📱", cat: "Tech" },
  { id: "data_analyst", label: "Data Analyst", icon: "📊", cat: "Data" },
  { id: "data_scientist", label: "Data Scientist", icon: "🧬", cat: "Data" },
  { id: "ml_engineer", label: "ML / AI Engineer", icon: "🤖", cat: "Data" },
  { id: "data_engineer", label: "Data Engineer", icon: "🔧", cat: "Data" },
  { id: "cybersecurity", label: "Cybersecurity Analyst", icon: "🛡️", cat: "Security" },
  { id: "ethical_hacker", label: "Ethical Hacker", icon: "🕵️", cat: "Security" },
  { id: "cloud_engineer", label: "Cloud Engineer", icon: "☁️", cat: "Infra" },
  { id: "devops", label: "DevOps Engineer", icon: "🚀", cat: "Infra" },
  { id: "digital_marketing", label: "Digital Marketing", icon: "📣", cat: "Business" },
  { id: "product_manager", label: "Product Manager", icon: "📋", cat: "Business" },
  { id: "uiux", label: "UI/UX Designer", icon: "✏️", cat: "Design" },
  { id: "graphic_designer", label: "Graphic Designer", icon: "🖌️", cat: "Design" },
  { id: "game_dev", label: "Game Developer", icon: "🎮", cat: "Tech" },
  { id: "blockchain", label: "Blockchain Developer", icon: "⛓️", cat: "Tech" },
  { id: "qa_engineer", label: "QA / Testing Engineer", icon: "🧪", cat: "Tech" },
  { id: "database_admin", label: "Database Administrator", icon: "🗄️", cat: "Infra" },
  { id: "network_engineer", label: "Network Engineer", icon: "🌐", cat: "Infra" },
  { id: "technical_writer", label: "Technical Writer", icon: "📝", cat: "Business" },
  { id: "business_analyst", label: "Business Analyst", icon: "📈", cat: "Business" },
];

const CATEGORIES = ["All", "Tech", "Data", "Security", "Infra", "Design", "Business"];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "", email: "", career_goal: "", level: "beginner", availability: "30", style: "visual"
  });
  const [searchQ, setSearchQ] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { signup } = useUser();

  const next = () => setStep(s => s + 1);
  const back = () => setStep(s => s - 1);

  const filteredDomains = ALL_DOMAINS.filter(d => {
    const matchCat = activeCat === "All" || d.cat === activeCat;
    const matchSearch = !searchQ || d.label.toLowerCase().includes(searchQ.toLowerCase());
    return matchCat && matchSearch;
  });

  const completeOnboarding = async () => {
    setIsLoading(true);
    setError("");
    try {
      const email = formData.email || `${formData.name.toLowerCase().replace(/\s+/g, '.')}@neurolearn.ai`;
      await signup(formData.name, email, "password", formData.career_goal);
      router.push("/dashboard");
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full gradient-mesh opacity-30 pointer-events-none" />
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#00B4D8]/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[#8B5CF6]/10 rounded-full blur-[120px]" />

      <motion.div className="glass-strong w-full max-w-xl p-8 md:p-12 space-y-8 relative z-10" layout>
        <AnimatePresence mode="wait">
          {/* Step 1: Name */}
          {step === 1 && (
            <motion.div key="1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] text-[#00B4D8] font-bold uppercase tracking-widest">Step 01/05</div>
                <h1 className="text-3xl font-bold">What should we call you?</h1>
                <p className="text-slate-800/40 text-sm">Your learning journey is unique. Let&apos;s personalize it.</p>
              </div>
              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} autoFocus placeholder="Enter your name" className="w-full bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-6 py-4 text-lg text-slate-800 focus:outline-none focus:border-[#00B4D8]/50 transition-all placeholder:text-slate-800/10" />
              <button onClick={next} disabled={!formData.name} className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-slate-800 font-semibold group">Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
            </motion.div>
          )}

          {/* Step 2: Email */}
          {step === 2 && (
            <motion.div key="2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] text-[#00B4D8] font-bold uppercase tracking-widest">Step 02/05</div>
                <h1 className="text-3xl font-bold">Your Email</h1>
                <p className="text-slate-800/40 text-sm">We&apos;ll use this to save your progress across devices.</p>
              </div>
              <input value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} type="email" placeholder="you@example.com" className="w-full bg-slate-900/[0.03] border border-slate-900/10 rounded-xl px-6 py-4 text-lg text-slate-800 focus:outline-none focus:border-[#00B4D8]/50 transition-all placeholder:text-slate-800/10" />
              <button onClick={next} disabled={!formData.email} className="w-full btn-primary py-4 flex items-center justify-center gap-2 text-slate-800 font-semibold group">Continue <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></button>
              <button onClick={back} className="w-full text-center text-xs text-slate-800/20 hover:text-slate-800/40 transition-colors">Go Back</button>
            </motion.div>
          )}

          {/* Step 3: Career Goal — ALL DOMAINS with search & filter */}
          {step === 3 && (
            <motion.div key="3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
              <div className="space-y-2">
                <div className="text-[10px] text-[#00B4D8] font-bold uppercase tracking-widest">Step 03/05</div>
                <h1 className="text-3xl font-bold">Your Career Goal?</h1>
                <p className="text-slate-800/40 text-sm">Pick any domain — we&apos;ll generate a custom AI path for it.</p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-800/20" />
                <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search domains..." className="w-full bg-slate-900/[0.03] border border-slate-900/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:border-[#00B4D8]/30 placeholder:text-slate-800/15" />
              </div>

              {/* Category pills */}
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map(cat => (
                  <button key={cat} onClick={() => setActiveCat(cat)} className={`px-3 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider transition-all ${activeCat === cat ? "bg-[#00B4D8]/10 text-[#00B4D8] border border-[#00B4D8]/20" : "text-slate-800/30 border border-slate-900/5 hover:bg-slate-900/[0.03]"}`}>{cat}</button>
                ))}
              </div>

              {/* Domain grid — scrollable */}
              <div className="grid gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {filteredDomains.map(goal => (
                  <button key={goal.id} onClick={() => { setFormData({ ...formData, career_goal: goal.label }); next(); }}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${formData.career_goal === goal.id ? "bg-[#00B4D8]/10 border-[#00B4D8]/30 text-[#00B4D8]" : "bg-slate-900/[0.02] border-slate-900/5 text-slate-800/60 hover:bg-slate-900/[0.04] hover:border-slate-900/10"}`}>
                    <span className="text-xl w-8 text-center">{goal.icon}</span>
                    <span className="font-medium text-sm flex-1">{goal.label}</span>
                    <span className="text-[9px] text-slate-800/20 uppercase">{goal.cat}</span>
                    {formData.career_goal === goal.id && <Check className="w-4 h-4" />}
                  </button>
                ))}
                {filteredDomains.length === 0 && (
                  <p className="text-center text-slate-800/20 text-sm py-6">No domains match your search</p>
                )}
              </div>
              <button onClick={back} className="w-full text-center text-xs text-slate-800/20 hover:text-slate-800/40 transition-colors">Go Back</button>
            </motion.div>
          )}

          {/* Step 4: Learning Preferences */}
          {step === 4 && (
            <motion.div key="4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              <div className="space-y-2">
                <div className="text-[10px] text-[#00B4D8] font-bold uppercase tracking-widest">Step 04/05</div>
                <h1 className="text-3xl font-bold">Learning Preferences</h1>
                <p className="text-slate-800/40 text-sm">How do you learn best? Our AI tutor will adapt.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-800/30 uppercase font-bold tracking-widest flex items-center gap-1"><Clock className="w-3 h-3" /> Daily Commitment</label>
                  <div className="flex gap-2">
                    {["15", "30", "45", "60"].map(mins => (
                      <button key={mins} onClick={() => setFormData({ ...formData, availability: mins })} className={`flex-1 py-3 rounded-lg text-xs font-medium border transition-all ${formData.availability === mins ? "bg-[#00B4D8]/10 border-[#00B4D8]/30 text-[#00B4D8]" : "bg-slate-900/[0.02] border-slate-900/5 text-slate-800/40 hover:bg-slate-900/[0.04]"}`}>{mins}m</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-slate-800/30 uppercase font-bold tracking-widest flex items-center gap-1"><Brain className="w-3 h-3" /> Cognitive Style</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "visual", label: "Visual" },
                      { id: "auditory", label: "Auditory" },
                      { id: "reading", label: "Reading" },
                      { id: "hands_on", label: "Hands-on" },
                    ].map(style => (
                      <button key={style.id} onClick={() => setFormData({ ...formData, style: style.id })} className={`py-3 rounded-lg text-xs font-medium border transition-all ${formData.style === style.id ? "bg-[#00B4D8]/10 border-[#00B4D8]/30 text-[#00B4D8]" : "bg-slate-900/[0.02] border-slate-900/5 text-slate-800/40 hover:bg-slate-900/[0.04]"}`}>{style.label}</button>
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={next} className="w-full btn-primary py-4 text-slate-800 font-semibold">Generate My Path</button>
              <button onClick={back} className="w-full text-center text-xs text-slate-800/20 hover:text-slate-800/40 transition-colors">Go Back</button>
            </motion.div>
          )}

          {/* Step 5: Launch */}
          {step === 5 && (
            <motion.div key="5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 py-4">
              <div className="relative mx-auto w-24 h-24">
                <motion.div className="absolute inset-0 rounded-full border-2 border-[#00B4D8] opacity-20" animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }} transition={{ duration: 2, repeat: Infinity }} />
                <div className="relative w-full h-full rounded-full gradient-primary flex items-center justify-center text-slate-800 shadow-2xl glow-cyan">
                  {isLoading ? <Loader2 className="w-10 h-10 animate-spin" /> : <Sparkles className="w-10 h-10" />}
                </div>
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold">Welcome, {formData.name}!</h1>
                <p className="text-slate-800/40 text-sm">We&apos;ve mapped your cognitive profile and will generate an adaptive learning path.</p>
              </div>
              {error && (
                <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3">{error}</div>
              )}
              <div className="glass p-4 text-left space-y-3">
                <div className="flex items-center gap-3 text-xs text-slate-800/60"><Check className="w-4 h-4 text-[#10B981]" /> 4-Stream Cognitive Fusion Enabled</div>
                <div className="flex items-center gap-3 text-xs text-slate-800/60"><Check className="w-4 h-4 text-[#10B981]" /> Multi-Agent AI Tutors Assigned</div>
                <div className="flex items-center gap-3 text-xs text-slate-800/60"><Check className="w-4 h-4 text-[#10B981]" /> Domain: {formData.career_goal}</div>
              </div>
              <button onClick={completeOnboarding} disabled={isLoading} className="w-full btn-primary py-4 text-slate-800 font-bold text-lg flex items-center justify-center gap-2">
                {isLoading ? "Creating Your Account..." : "Enter NeuroLearn"} <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
