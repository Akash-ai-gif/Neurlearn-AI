"use client";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Target, CheckCircle2, AlertCircle, ArrowRight, Brain, Clock, Star, Trophy, Loader2 } from "lucide-react";
import { useUser } from "@/context/user-context";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function AssessmentPage() {
  const [step, setStep] = useState<"intro" | "quiz" | "results">("intro");
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [results, setResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/assessment/questions/sql_basics`);
        const data = await res.json();
        setQuestions(data.questions);
      } catch (e) {
        console.error(e);
      }
    };
    fetchQuestions();
  }, []);

  const handleAnswer = (idx: number) => {
    const newAnswers = [...answers];
    newAnswers[currentIdx] = idx;
    setAnswers(newAnswers);
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const submitAssessment = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/assessment/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.user_id, skill_id: "sql_basics", answers }),
      });
      const data = await res.json();
      setResults(data);
      setStep("results");
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div key="intro" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center space-y-6 py-12">
              <div className="w-20 h-20 rounded-3xl gradient-primary mx-auto flex items-center justify-center text-slate-800 text-3xl font-bold shadow-2xl glow-cyan">SQL</div>
              <h1 className="text-3xl font-bold">SQL Basics Assessment</h1>
              <p className="text-slate-800/40 max-w-md mx-auto">Test your knowledge of queries, joins, and database design. AI will evaluate your reasoning and speed.</p>
              <div className="flex justify-center gap-8 py-4">
                <div className="text-center"><div className="text-xl font-bold text-slate-800/80">{questions.length}</div><div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Questions</div></div>
                <div className="text-center"><div className="text-xl font-bold text-slate-800/80">15m</div><div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Time Limit</div></div>
                <div className="text-center"><div className="text-xl font-bold text-slate-800/80">Skill</div><div className="text-[10px] text-slate-800/30 uppercase tracking-widest">Level 2</div></div>
              </div>
              <button onClick={() => setStep("quiz")} className="btn-primary py-3 px-8 text-sm text-slate-800">Start Assessment</button>
            </motion.div>
          )}

          {step === "quiz" && (
            <motion.div key="quiz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
              <div className="flex items-center justify-between">
                <div className="text-[10px] text-slate-800/30 uppercase tracking-widest font-bold">Question {currentIdx + 1} of {questions.length}</div>
                <div className="flex items-center gap-1.5 text-xs text-slate-800/40"><Clock className="w-3 h-3" /> 14:22</div>
              </div>
              <div className="h-1.5 bg-slate-900/5 rounded-full overflow-hidden"><motion.div className="h-full gradient-primary" initial={{ width: 0 }} animate={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }} /></div>
              
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-800/90 leading-relaxed">{questions[currentIdx]?.text}</h2>
                <div className="grid gap-3">
                  {questions[currentIdx]?.options.map((opt: string, i: number) => (
                    <button key={i} onClick={() => handleAnswer(i)} className={`w-full text-left p-5 rounded-2xl border transition-all text-sm ${answers[currentIdx] === i ? 'bg-[#00B4D8]/10 border-[#00B4D8]/30 text-[#00B4D8]' : 'bg-slate-900/[0.02] border-slate-900/5 text-slate-800/60 hover:bg-slate-900/[0.04]'}`}>
                      <div className="flex items-center justify-between">
                        {opt}
                        {answers[currentIdx] === i && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-8">
                <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(currentIdx - 1)} className="text-xs text-slate-800/30 hover:text-slate-800/60 transition-colors">Previous</button>
                {currentIdx === questions.length - 1 ? (
                  <button onClick={submitAssessment} disabled={isLoading} className="btn-primary py-2 px-6 text-xs text-slate-800 flex items-center gap-2">
                    {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trophy className="w-3.5 h-3.5" />} Submit Final
                  </button>
                ) : (
                  <button onClick={() => setCurrentIdx(currentIdx + 1)} className="flex items-center gap-1.5 text-xs text-[#00B4D8] font-medium">Next Question <ArrowRight className="w-3.5 h-3.5" /></button>
                )}
              </div>
            </motion.div>
          )}

          {step === "results" && results && (
            <motion.div key="results" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-[#10B981]/10 mx-auto flex items-center justify-center text-[#10B981] shadow-2xl"><Trophy className="w-8 h-8" /></div>
                <h1 className="text-2xl font-bold">Assessment Complete!</h1>
                <div className="text-4xl font-black gradient-text inline-block">{results.score}%</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass p-5 text-center">
                  <div className="text-2xl font-bold text-[#00B4D8]">{results.correct}/{results.total_questions}</div>
                  <div className="text-[10px] text-slate-800/30 uppercase tracking-widest mt-1">Correct Answers</div>
                </div>
                <div className="glass p-5 text-center">
                  <div className="text-2xl font-bold text-[#8B5CF6]">Mastery</div>
                  <div className="text-[10px] text-slate-800/30 uppercase tracking-widest mt-1">Status</div>
                </div>
              </div>

              <div className="glass p-6 space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2"><Brain className="w-4 h-4 text-[#8B5CF6]" /> AI Evaluation</h3>
                <p className="text-xs text-slate-800/50 leading-relaxed">{results.ai_evaluation.feedback}</p>
                <div className="space-y-3 pt-2">
                  {results.ai_evaluation.criteria.map((c: any) => (
                    <div key={c.name} className="space-y-1.5">
                      <div className="flex justify-between text-[10px]"><span className="text-slate-800/40">{c.name}</span><span className="text-slate-800/60">{c.score}%</span></div>
                      <div className="h-1 bg-slate-900/5 rounded-full overflow-hidden"><div className="h-full gradient-primary" style={{ width: `${c.score}%` }} /></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep("intro")} className="flex-1 btn-ghost py-3 text-xs">Retake Test</button>
                <button className="flex-1 btn-primary py-3 text-xs text-slate-800">View Verified Badge</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
