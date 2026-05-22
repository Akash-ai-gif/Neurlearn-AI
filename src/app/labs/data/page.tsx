"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { BarChart3, Play, Database, FileSpreadsheet, Loader2, RotateCcw, Sparkles, Download } from "lucide-react";
import { useUser } from "@/context/user-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const DEFAULT_CHALLENGE = {
  title: "Data Analysis Challenge",
  difficulty: "Intermediate",
  description: "Analyze the dataset to extract key insights. Write SQL queries to find patterns and trends.",
  starterCode: `-- Explore the data\nSELECT * FROM employees LIMIT 10;`,
};

export default function DataLabPage() {
  const [currentChallenge, setCurrentChallenge] = useState(DEFAULT_CHALLENGE);
  const [code, setCode] = useState(DEFAULT_CHALLENGE.starterCode);
  const [output, setOutput] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);
  const { user } = useUser();

  const fetchChallenge = async () => {
    setChallengeLoading(true);
    try {
      const userDomain = user?.career_goal || "Data Analyst";
      const res = await fetch(`${API_BASE_URL}/doubt/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `Generate a realistic data analysis / SQL challenge for a ${userDomain}. 
          Return a JSON object with: 
          - "title": (string)
          - "difficulty": (string)
          - "description": (string)
          - "starterCode": (string, SQL starter code)
          Return ONLY the JSON.`,
          context_skill: null,
        }),
      });
      const data = await res.json();
      const rawResponse = data.response || "";
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          setCurrentChallenge(parsed);
          setCode(parsed.starterCode);
        } catch (parseErr) {
          console.error("Data Lab JSON Parse Error:", parseErr);
          setCurrentChallenge(DEFAULT_CHALLENGE);
        }
      } else {
        console.warn("No JSON found in Data Lab AI response.");
        setCurrentChallenge(DEFAULT_CHALLENGE);
      }
    } catch (e) {
      console.error("Failed to fetch challenge", e);
    } finally {
      setChallengeLoading(false);
    }
  };

  useEffect(() => {
    if (user?.career_goal) fetchChallenge();
  }, [user]);

  const runCode = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/learning/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: "sql", code }),
      });
      const data = await res.json();
      setOutput(data);
      if (data.data && data.data.length > 0) {
        // Refresh challenge after success
        setTimeout(fetchChallenge, 5000);
      }
    } catch (e) {
      setOutput({ error: "Failed to connect to execution engine." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#10B981]" /> 
            {challengeLoading ? "Generating Challenge..." : currentChallenge.title}
          </h1>
          <p className="text-slate-800/40 text-sm mt-1">
            {challengeLoading ? "Tailoring a data scenario for your domain..." : currentChallenge.description}
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-800/40 uppercase tracking-wider flex items-center gap-1"><Database className="w-3 h-3" /> SQL Editor</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setCode(currentChallenge.starterCode)} className="p-1.5 rounded-lg hover:bg-slate-900/[0.04]"><RotateCcw className="w-3.5 h-3.5 text-slate-800/30" /></button>
                <button onClick={runCode} disabled={isLoading || challengeLoading} className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1 text-slate-800">
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />} Run Query
                </button>
              </div>
            </div>
            <textarea value={code} onChange={e => setCode(e.target.value)} className="w-full h-[300px] bg-slate-900 p-4 text-sm font-mono text-[#00B4D8] resize-none focus:outline-none rounded-xl" spellCheck={false} />
          </div>

          <div className="space-y-4">
            <span className="text-xs text-slate-800/40 uppercase tracking-wider flex items-center gap-1"><FileSpreadsheet className="w-3 h-3" /> Results</span>
            <div className="glass p-4 h-[300px] overflow-auto">
              {output?.error ? (
                <div className="text-xs font-mono text-[#FF3366]">{output.error}</div>
              ) : output?.data ? (
                <div>
                  <div className="text-[10px] text-slate-800/30 mb-2">{output.row_count} rows returned</div>
                  <table className="w-full text-xs font-mono text-slate-800 text-left border-collapse">
                    <thead><tr>{output.columns.map((c: string) => <th key={c} className="border-b border-slate-900/10 pb-1 pr-4 text-slate-800/50">{c}</th>)}</tr></thead>
                    <tbody>{output.data.map((row: any, i: number) => <tr key={i} className="hover:bg-slate-900/[0.02]">{output.columns.map((c: string) => <td key={c} className="pt-1 pr-4">{row[c]}</td>)}</tr>)}</tbody>
                  </table>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-800/20 text-xs">Run a query to see results</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
