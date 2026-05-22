"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { Shield, Terminal, Flag, Lock, Unlock, AlertTriangle, CheckCircle, Play, Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";

const DEFAULT_CHALLENGES = [
  { id: 1, title: "Neural Security Audit", difficulty: "Medium", points: 150, desc: "Analyze the provided system logs to identify a potential intrusion pattern.", solved: false },
];

export default function CyberLabPage() {
  const [activeChallenges, setActiveChallenges] = useState(DEFAULT_CHALLENGES);
  const [selected, setSelected] = useState(DEFAULT_CHALLENGES[0]);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [solvedIds, setSolvedIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      const userDomain = user?.career_goal || "Cybersecurity";
      const res = await fetch(`${API_BASE_URL}/doubt/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `Generate 3 realistic CTF challenges for a ${userDomain}. 
          Return a JSON array of objects with: 
          - "id": (number)
          - "title": (string)
          - "difficulty": (string: Easy, Medium, Hard)
          - "points": (number)
          - "desc": (string, mission description)
          Return ONLY the JSON array.`,
          context_skill: null,
        }),
      });
      const data = await res.json();
      const rawResponse = data.response || "";
      const jsonMatch = rawResponse.match(/\[[\s\S]*\]/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setActiveChallenges(parsed);
          setSelected(parsed[0]);
        } catch (parseErr) {
          console.error("Cyber Lab JSON Parse Error:", parseErr);
          setActiveChallenges(DEFAULT_CHALLENGES);
        }
      } else {
        console.warn("No JSON array found in Cyber Lab response.");
        setActiveChallenges(DEFAULT_CHALLENGES);
      }
    } catch (e) {
      console.error("Failed to fetch challenges", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.career_goal) fetchChallenges();
  }, [user]);

  const submitFlag = () => {
    if (answer.toLowerCase().includes("flag") || answer.length > 5) {
      setResult("correct");
      setSolvedIds(prev => [...prev, selected.id]);
      // Refresh challenges after success
      setTimeout(fetchChallenges, 5000);
    } else {
      setResult("wrong");
    }
  };

  const totalPoints = solvedIds.reduce((sum, id) => sum + (activeChallenges.find(c => c.id === id)?.points || 0), 0);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-[#FF3366]" /> Cybersecurity Lab</h1>
            <p className="text-slate-800/40 text-sm mt-1">Capture The Flag challenges in a safe environment</p>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-2">
            <Flag className="w-4 h-4 text-[#FFB800]" />
            <span className="text-sm font-bold text-[#FFB800]">{totalPoints} pts</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <span className="text-xs text-slate-800/40 uppercase tracking-wider">Challenges</span>
            {isLoading ? (
              <div className="py-10 flex justify-center"><Loader2 className="w-5 h-5 text-[#FF3366] animate-spin" /></div>
            ) : (
              activeChallenges.map(c => (
                <div key={c.id} onClick={() => { setSelected(c); setResult(null); setAnswer(""); }} className={`glass p-4 cursor-pointer transition-all hover:bg-slate-900/[0.04] ${selected.id === c.id ? 'border-[#FF3366]/30 bg-[#FF3366]/5' : ''}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-slate-800/80">{c.title}</span>
                    {solvedIds.includes(c.id) ? <CheckCircle className="w-4 h-4 text-[#10B981]" /> : <Lock className="w-3 h-3 text-slate-800/20" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${c.difficulty === 'Easy' ? 'bg-[#10B981]/10 text-[#10B981]' : c.difficulty === 'Medium' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-[#FF3366]/10 text-[#FF3366]'}`}>{c.difficulty}</span>
                    <span className="text-[10px] text-slate-800/30">{c.points} pts</span>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="col-span-2 space-y-4">
            <div className="glass p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800/90">{selected.title}</h2>
                <span className={`text-xs px-2 py-1 rounded-lg ${selected.difficulty === 'Easy' ? 'bg-[#10B981]/10 text-[#10B981]' : selected.difficulty === 'Medium' ? 'bg-[#FFB800]/10 text-[#FFB800]' : 'bg-[#FF3366]/10 text-[#FF3366]'}`}>{selected.difficulty}</span>
              </div>
              <p className="text-sm text-slate-800/50">{selected.desc}</p>
              
              <div className="glass bg-black/20 p-4 rounded-xl font-mono text-sm text-[#00B4D8] space-y-1">
                <div className="text-slate-800/30 text-[10px] uppercase mb-2">Terminal</div>
                <div>$ nmap -sV target_host</div>
                <div className="text-slate-800/40">Scanning ports 1-1000...</div>
                <div className="text-[#10B981]">PORT   STATE  SERVICE</div>
                <div className="text-[#10B981]">22/tcp open   ssh</div>
                <div className="text-[#10B981]">80/tcp open   http</div>
                <div className="text-[#FFB800]">3306/tcp open  mysql</div>
              </div>

              <div className="flex items-center gap-3">
                <input value={answer} onChange={e => setAnswer(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitFlag()} placeholder="Enter flag: CTF{...}" className="flex-1 bg-slate-900/[0.03] border border-slate-900/5 rounded-xl px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-[#FF3366]/30" />
                <button onClick={submitFlag} className="btn-primary py-3 px-6 text-sm text-slate-800 flex items-center gap-2"><Flag className="w-4 h-4" /> Submit</button>
              </div>

              {result === "correct" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  <div><div className="text-sm font-bold text-[#10B981]">Flag Captured!</div><div className="text-[10px] text-slate-800/40">+{selected.points} points earned</div></div>
                </motion.div>
              )}
              {result === "wrong" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 rounded-xl bg-[#FF3366]/10 border border-[#FF3366]/20 flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FF3366]" />
                  <div><div className="text-sm font-bold text-[#FF3366]">Incorrect Flag</div><div className="text-[10px] text-slate-800/40">Keep investigating...</div></div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
