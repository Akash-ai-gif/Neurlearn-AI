"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Stethoscope, ArrowRight, CheckCircle, XCircle, AlertTriangle, Brain, Activity } from "lucide-react";

const scenarios = [
  {
    id: 1,
    title: "Emergency Triage",
    patient: "45-year-old male, chest pain, shortness of breath, diaphoresis",
    vitals: { HR: "110 bpm", BP: "90/60 mmHg", SpO2: "92%", Temp: "37.2°C" },
    question: "What is your immediate priority?",
    options: [
      { text: "Administer aspirin and call cardiology", correct: true },
      { text: "Order a full blood panel", correct: false },
      { text: "Schedule an MRI for tomorrow", correct: false },
      { text: "Prescribe rest and follow-up in a week", correct: false },
    ],
  },
  {
    id: 2,
    title: "Pediatric Assessment",
    patient: "3-year-old child, high fever (39.5°C), rash on trunk, irritability",
    vitals: { HR: "140 bpm", BP: "85/55 mmHg", SpO2: "98%", Temp: "39.5°C" },
    question: "What condition should you rule out first?",
    options: [
      { text: "Meningitis", correct: true },
      { text: "Common cold", correct: false },
      { text: "Allergic reaction", correct: false },
      { text: "Teething complications", correct: false },
    ],
  },
];

export default function HealthcareLabPage() {
  const [currentScenario, setCurrentScenario] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const scenario = scenarios[currentScenario];

  const handleAnswer = (idx: number) => {
    setSelectedAnswer(idx);
    setShowResult(true);
    if (scenario.options[idx].correct) {
      setScore(s => s + 1);
    }
  };

  const nextScenario = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setCurrentScenario(c => Math.min(c + 1, scenarios.length - 1));
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Heart className="w-6 h-6 text-[#FFB800]" /> Healthcare Lab</h1>
            <p className="text-slate-800/40 text-sm mt-1">Virtual patient scenarios with clinical decision-making</p>
          </div>
          <div className="glass px-4 py-2 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-[#10B981]" />
            <span className="text-sm font-bold text-[#10B981]">{score}/{scenarios.length} correct</span>
          </div>
        </motion.div>

        <div className="glass p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800/90 flex items-center gap-2"><Brain className="w-5 h-5 text-[#8B5CF6]" /> {scenario.title}</h2>
            <span className="text-[10px] text-slate-800/30 uppercase tracking-wider">Case {currentScenario + 1} of {scenarios.length}</span>
          </div>

          <div className="glass bg-black/20 p-5 rounded-xl">
            <div className="text-[10px] text-[#FFB800] uppercase tracking-wider font-bold mb-2">Patient Presentation</div>
            <p className="text-sm text-slate-800/70">{scenario.patient}</p>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Object.entries(scenario.vitals).map(([key, val]) => (
              <div key={key} className="glass p-3 text-center">
                <div className="text-[10px] text-slate-800/30 uppercase">{key}</div>
                <div className="text-sm font-bold text-[#00B4D8] mt-1">{val}</div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-800/80 mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-[#00B4D8]" /> {scenario.question}</div>
            <div className="grid gap-3">
              {scenario.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => !showResult && handleAnswer(idx)}
                  disabled={showResult}
                  className={`w-full text-left p-4 rounded-xl border transition-all text-sm flex items-center justify-between ${
                    showResult && opt.correct ? 'bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]' :
                    showResult && selectedAnswer === idx && !opt.correct ? 'bg-[#FF3366]/10 border-[#FF3366]/30 text-[#FF3366]' :
                    selectedAnswer === idx ? 'bg-[#00B4D8]/10 border-[#00B4D8]/30 text-[#00B4D8]' :
                    'bg-slate-900/[0.02] border-slate-900/5 text-slate-800/60 hover:bg-slate-900/[0.04]'
                  }`}
                >
                  {opt.text}
                  {showResult && opt.correct && <CheckCircle className="w-4 h-4" />}
                  {showResult && selectedAnswer === idx && !opt.correct && <XCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>

          {showResult && currentScenario < scenarios.length - 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-end">
              <button onClick={nextScenario} className="btn-primary py-2 px-6 text-sm text-slate-800 flex items-center gap-2">Next Case <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
