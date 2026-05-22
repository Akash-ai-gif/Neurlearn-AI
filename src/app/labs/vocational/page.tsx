"use client";
import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { motion } from "framer-motion";
import { Wrench, CheckCircle, Circle, ArrowRight, Zap, AlertTriangle, Play, RotateCcw } from "lucide-react";

const modules = [
  {
    id: "electrical",
    title: "Electrical Wiring",
    icon: "⚡",
    steps: [
      { id: 1, text: "Turn off the main circuit breaker", safety: true },
      { id: 2, text: "Verify power is off using a voltage tester", safety: true },
      { id: 3, text: "Strip 1cm of insulation from wire ends", safety: false },
      { id: 4, text: "Connect wires: Black to brass, White to silver, Green to ground", safety: false },
      { id: 5, text: "Secure connections with wire nuts", safety: false },
      { id: 6, text: "Mount the outlet and install the cover plate", safety: false },
      { id: 7, text: "Turn on the breaker and test with voltage tester", safety: true },
    ],
  },
  {
    id: "plumbing",
    title: "Pipe Repair",
    icon: "🔧",
    steps: [
      { id: 1, text: "Shut off the water supply valve", safety: true },
      { id: 2, text: "Drain remaining water from the pipe", safety: false },
      { id: 3, text: "Cut out the damaged section using a pipe cutter", safety: false },
      { id: 4, text: "Clean and deburr the cut ends", safety: false },
      { id: 5, text: "Apply flux to joints and fit coupling", safety: false },
      { id: 6, text: "Solder the joint with torch (wear safety glasses)", safety: true },
      { id: 7, text: "Turn on water supply and check for leaks", safety: false },
    ],
  },
];

export default function VocationalLabPage() {
  const [selectedModule, setSelectedModule] = useState(modules[0]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  const toggleStep = (stepId: number) => {
    if (completedSteps.includes(stepId)) {
      setCompletedSteps(prev => prev.filter(s => s !== stepId));
    } else {
      setCompletedSteps(prev => [...prev, stepId]);
      if (currentStep < selectedModule.steps.length - 1) {
        setCurrentStep(c => c + 1);
      }
    }
  };

  const resetModule = () => {
    setCompletedSteps([]);
    setCurrentStep(0);
  };

  const progress = Math.round((completedSteps.length / selectedModule.steps.length) * 100);

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6 text-[#00B4D8]" /> Vocational Skills Lab</h1>
            <p className="text-slate-800/40 text-sm mt-1">Step-by-step guided procedures with safety protocols</p>
          </div>
          <button onClick={resetModule} className="btn-ghost py-2 px-4 text-xs flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Reset</button>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          <div className="space-y-3">
            <span className="text-xs text-slate-800/40 uppercase tracking-wider">Modules</span>
            {modules.map(m => (
              <div key={m.id} onClick={() => { setSelectedModule(m); resetModule(); }} className={`glass p-4 cursor-pointer transition-all hover:bg-slate-900/[0.04] ${selectedModule.id === m.id ? 'border-[#00B4D8]/30 bg-[#00B4D8]/5' : ''}`}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{m.icon}</span>
                  <span className="text-sm font-semibold text-slate-800/80">{m.title}</span>
                </div>
              </div>
            ))}

            <div className="glass p-4 space-y-2">
              <div className="text-[10px] text-slate-800/30 uppercase tracking-wider">Progress</div>
              <div className="text-2xl font-bold text-[#00B4D8]">{progress}%</div>
              <div className="h-2 bg-slate-900/5 rounded-full overflow-hidden">
                <motion.div className="h-full gradient-primary" animate={{ width: `${progress}%` }} />
              </div>
              <div className="text-[10px] text-slate-800/30">{completedSteps.length} of {selectedModule.steps.length} steps</div>
            </div>
          </div>

          <div className="col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-800/40 uppercase tracking-wider">{selectedModule.title} — Procedure</span>
            </div>
            {selectedModule.steps.map((step, idx) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => toggleStep(step.id)}
                className={`glass p-4 cursor-pointer transition-all flex items-start gap-4 ${
                  completedSteps.includes(step.id) ? 'bg-[#10B981]/5 border-[#10B981]/20' : 
                  idx === currentStep ? 'bg-[#00B4D8]/5 border-[#00B4D8]/20' : ''
                }`}
              >
                <div className="mt-0.5">
                  {completedSteps.includes(step.id) ? (
                    <CheckCircle className="w-5 h-5 text-[#10B981]" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-800/20" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-800/30 font-mono">Step {step.id}</span>
                    {step.safety && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#FFB800]/10 text-[#FFB800] flex items-center gap-1">
                        <AlertTriangle className="w-2.5 h-2.5" /> Safety Critical
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mt-1 ${completedSteps.includes(step.id) ? 'text-[#10B981]/80 line-through' : 'text-slate-800/70'}`}>{step.text}</p>
                </div>
              </motion.div>
            ))}

            {progress === 100 && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="glass p-6 text-center bg-[#10B981]/5 border-[#10B981]/20">
                <CheckCircle className="w-10 h-10 text-[#10B981] mx-auto mb-3" />
                <div className="text-lg font-bold text-[#10B981]">Module Complete!</div>
                <div className="text-xs text-slate-800/40 mt-1">All safety protocols followed correctly</div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
