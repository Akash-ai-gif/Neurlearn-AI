"use client";
import { useState, useRef, useCallback, useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Code2, RotateCcw, Copy, Check, ChevronDown,
  Terminal, Sparkles, Loader2, Download, Maximize2,
  Send, BookOpen
} from "lucide-react";
import { useUser } from "@/context/user-context";
import { useVoice } from "@/hooks/use-voice";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const LANGUAGES = [
  { id: "python", label: "Python", icon: "🐍", ext: ".py", template: '# Python Code\nprint("Hello, World!")\n\n# Write your code here\nfor i in range(5):\n    print(f"Count: {i}")' },
  { id: "javascript", label: "JavaScript", icon: "⚡", ext: ".js", template: '// JavaScript Code\nconsole.log("Hello, World!");\n\n// Write your code here\nconst numbers = [1, 2, 3, 4, 5];\nnumbers.forEach(n => console.log(`Square: ${n * n}`));' },
  { id: "html", label: "HTML/CSS", icon: "🌐", ext: ".html", template: '<!DOCTYPE html>\n<html>\n<head>\n  <style>\n    body { font-family: sans-serif; text-align: center; padding: 40px; }\n    h1 { color: #00D1FF; }\n  </style>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n  <p>Edit this HTML</p>\n</body>\n</html>' },
  { id: "sql", label: "SQL", icon: "🗄️", ext: ".sql", template: '-- SQL Query\nSELECT * FROM users\nWHERE age > 18\nORDER BY name ASC\nLIMIT 10;' },
  { id: "java", label: "Java", icon: "☕", ext: ".java", template: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n        \n        for (int i = 0; i < 5; i++) {\n            System.out.println("Count: " + i);\n        }\n    }\n}' },
  { id: "cpp", label: "C++", icon: "⚙️", ext: ".cpp", template: '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    \n    for (int i = 0; i < 5; i++) {\n        cout << "Count: " << i << endl;\n    }\n    return 0;\n}' },
  { id: "typescript", label: "TypeScript", icon: "📘", ext: ".ts", template: '// TypeScript Code\ninterface User {\n  name: string;\n  age: number;\n}\n\nconst greet = (user: User): string => {\n  return `Hello, ${user.name}! You are ${user.age}.`;\n};\n\nconsole.log(greet({ name: "Alice", age: 25 }));' },
  { id: "rust", label: "Rust", icon: "🦀", ext: ".rs", template: 'fn main() {\n    println!("Hello, World!");\n    \n    let numbers = vec![1, 2, 3, 4, 5];\n    for n in &numbers {\n        println!("Square: {}", n * n);\n    }\n}' },
];

// Simple JS/Python interpreter for in-browser execution
function executeCode(code: string, lang: string): string {
  if (lang === "javascript" || lang === "typescript") {
    try {
      const logs: string[] = [];
      const mockConsole = { log: (...args: any[]) => logs.push(args.map(String).join(" ")), error: (...args: any[]) => logs.push("ERROR: " + args.map(String).join(" ")), warn: (...args: any[]) => logs.push("WARN: " + args.map(String).join(" ")) };
      const fn = new Function("console", code);
      fn(mockConsole);
      return logs.length > 0 ? logs.join("\n") : "(No output)";
    } catch (e: any) {
      return `❌ Error: ${e.message}`;
    }
  }
  if (lang === "html") {
    return "[HTML Preview rendered below]";
  }
  if (lang === "python") {
    // Simple Python-like interpreter for basic operations
    try {
      const lines = code.split("\n").filter(l => l.trim() && !l.trim().startsWith("#"));
      const output: string[] = [];
      const vars: Record<string, any> = {};
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("print(")) {
          const inner = trimmed.slice(6, -1);
          // Handle f-strings and basic expressions
          let result = inner;
          if (inner.startsWith('"') || inner.startsWith("'")) {
            result = inner.slice(1, -1);
          } else if (inner.startsWith('f"') || inner.startsWith("f'")) {
            result = inner.slice(2, -1).replace(/\{([^}]+)\}/g, (_, expr) => {
              try { return String(eval(expr)); } catch { return `{${expr}}`; }
            });
          }
          output.push(result);
        }
      }
      return output.length > 0 ? output.join("\n") : "(Executed — use print() to see output)";
    } catch (e: any) {
      return `❌ ${e.message}`;
    }
  }
  return `⚠️ ${lang.toUpperCase()} execution requires a server runtime.\nOutput shown is for preview only.\n\n(JavaScript and basic Python run natively in browser)`;
}

export default function CodeLabPage() {
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].template);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [aiReview, setAiReview] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [challenge, setChallenge] = useState("");
  const [challengeLoading, setChallengeLoading] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useUser();
  const {
    voiceState, isMuted, transcript, isSupported,
    speak, stopSpeaking, toggleMute,
    startListening, stopListening,
  } = useVoice();

  const switchLang = (newLang: typeof LANGUAGES[0]) => {
    setLang(newLang);
    setCode(newLang.template);
    setOutput("");
    setAiReview("");
    setShowLangMenu(false);
    setShowPreview(false);
    // Generate new challenge for new language
    generateChallenge();
  };

  // Effect to generate initial challenge
  useEffect(() => {
    if (user?.career_goal) {
      generateChallenge();
    }
  }, [user]);

  const runCode = useCallback(() => {
    setIsRunning(true);
    setOutput("");
    setTimeout(() => {
      const result = executeCode(code, lang.id);
      setOutput(result);
      setIsRunning(false);
      if (lang.id === "html") setShowPreview(true);
      // Automatically refresh challenge after running code to provide continuous simulation
      if (!result.startsWith("❌")) {
        generateChallenge();
      }
    }, 300);
  }, [code, lang, user]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const requestAIReview = async () => {
    if (!code.trim()) return;
    setReviewLoading(true);
    setAiReview("");
    try {
      const res = await fetch(`${API}/learning/code-review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language: lang.id, task: challenge || "General code review", user_id: user?.user_id || "guest" }),
      });
      const data = await res.json();
      const reviewText = typeof data === "string" ? data : data.review || data.response || JSON.stringify(data);
      setAiReview(reviewText);
      speak(`Code analysis complete. Here is my review: ${reviewText}`);
    } catch {
      setAiReview("AI review temporarily unavailable. Try again!");
    } finally {
      setReviewLoading(false);
    }
  };

  const generateChallenge = async () => {
    setChallengeLoading(true);
    try {
      const userDomain = user?.career_goal || "General Programming";
      const res = await fetch(`${API}/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `Generate a highly specific, practical coding simulation task for a ${userDomain} using ${lang.label}. 
          The task should be a real-world scenario they might face in their career. 
          Provide ONLY the task description (2-4 sentences). Do NOT include code, hints, or markdown. 
          Make it slightly different from previous ones if possible.`,
          context_skill: null,
        }),
      });
      const data = await res.json();
      setChallenge(data.response);
    } catch {
      setChallenge(`[Default Task] Implement a basic service module for a ${user?.career_goal || "developer"} profile using ${lang.label}.`);
    } finally {
      setChallengeLoading(false);
    }
  };

  const generateCodeFromPrompt = async () => {
    if (!aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch(`${API}/doubt/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.user_id || "guest",
          input_type: "text",
          content: `Write the following code in ${lang.label}: "${aiPrompt}". Return ONLY the code, no explanation, no markdown fences.`,
          context_skill: null,
        }),
      });
      const data = await res.json();
      const newCode = data.response.replace(/```[a-z]*\n/g, "").replace(/```/g, "").trim();
      setCode(newCode);
      setAiPrompt("");
    } catch (e) {
      console.error("Gen error:", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      setCode(code.substring(0, start) + "  " + code.substring(end));
      setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 2; }, 0);
    }
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      runCode();
    }
  };

  const lineCount = code.split("\n").length;

  return (
    <div className="flex min-h-screen bg-[#FDFBF7]">
      <Sidebar />
      <div className="flex-1 ml-[260px] flex flex-col">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b border-slate-900/5 flex items-center gap-3">
          <Code2 className="w-5 h-5 text-[#00B4D8]" />
          <h1 className="text-sm font-bold">Code Lab</h1>

          {/* Language selector */}
          <div className="relative ml-4">
            <button onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/[0.03] border border-slate-900/10 text-xs hover:bg-slate-900/[0.06] transition-all">
              <span>{lang.icon}</span>
              <span className="font-medium">{lang.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-800/30" />
            </button>
            <AnimatePresence>
              {showLangMenu && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 left-0 w-48 glass-strong rounded-xl border border-slate-900/10 overflow-hidden z-50 py-1">
                  {LANGUAGES.map(l => (
                    <button key={l.id} onClick={() => switchLang(l)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-slate-900/5 transition-all ${lang.id === l.id ? "text-[#00B4D8]" : "text-slate-800/60"}`}>
                      <span>{l.icon}</span> {l.label}
                      {lang.id === l.id && <Check className="w-3 h-3 ml-auto" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex-1" />

          <button onClick={copyCode} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-800/40 hover:text-slate-800/70 border border-slate-900/5 hover:bg-slate-900/[0.03] transition-all">
            {copied ? <><Check className="w-3 h-3 text-[#10B981]" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
          </button>
          <button onClick={() => { setCode(lang.template); setOutput(""); setAiReview(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-800/40 hover:text-slate-800/70 border border-slate-900/5 hover:bg-slate-900/[0.03] transition-all">
            <RotateCcw className="w-3 h-3" /> Reset
          </button>
          <button onClick={requestAIReview} disabled={reviewLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#8B5CF6] border border-[#8B5CF6]/20 hover:bg-[#8B5CF6]/10 transition-all disabled:opacity-40">
            {reviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} AI Review
          </button>
          <button onClick={runCode} disabled={isRunning}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-slate-800 gradient-primary hover:opacity-90 transition-all disabled:opacity-50">
            {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? "Running..." : "Run"} <span className="text-slate-800/40 text-[10px] ml-1">Ctrl+↵</span>
          </button>
        </div>

        {/* Challenge bar */}
        {challenge && (
          <div className="px-4 py-2 border-b border-slate-900/5 bg-[#8B5CF6]/5 flex items-start gap-2">
            <BookOpen className="w-4 h-4 text-[#8B5CF6] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-800/60 flex-1 leading-relaxed">{challenge}</p>
            <button onClick={() => setChallenge("")} className="text-[10px] text-slate-800/20 hover:text-slate-800/40 shrink-0">✕</button>
          </div>
        )}

        {/* Main IDE area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col border-r border-slate-900/5 min-w-0">
            <div className="flex-1 flex overflow-hidden">
              {/* Line numbers */}
              <div className="w-12 bg-white border-r border-slate-900/5 overflow-hidden py-3 select-none shrink-0">
                {Array.from({ length: lineCount }, (_, i) => (
                  <div key={i} className="text-right pr-3 text-[11px] text-slate-800/15 leading-[20px] font-mono">{i + 1}</div>
                ))}
              </div>
              {/* Editor */}
              <textarea
                ref={textareaRef}
                value={code}
                onChange={e => setCode(e.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                className="flex-1 bg-slate-900 p-3 text-[13px] font-mono text-[#C9D1D9] leading-[20px] resize-none focus:outline-none overflow-auto"
                style={{ tabSize: 2 }}
              />
            </div>
            {/* Generate challenge button */}
            {/* AI Generation Prompt */}
            <div className="px-3 py-2 border-t border-slate-900/5 bg-white flex flex-col gap-2">
              {transcript && (
                <div className="text-[10px] text-[#00B4D8] italic animate-pulse">🎙 {transcript}...</div>
              )}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#00B4D8]" />
                  <input
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && generateCodeFromPrompt()}
                    placeholder={voiceState === "listening" ? "Listening..." : "Describe code... (e.g. 'Fibonacci')"}
                    className="w-full bg-slate-900/[0.03] border border-slate-900/10 rounded-lg pl-8 pr-3 py-1.5 text-[11px] text-slate-800/80 placeholder:text-slate-800/20 focus:outline-none focus:border-[#00B4D8]/30 transition-all"
                  />
                </div>
                {isSupported && (
                  <button
                    onClick={() => voiceState === "listening" ? stopListening() : startListening(text => { setAiPrompt(text); })}
                    className={`p-1.5 rounded-lg transition-all ${voiceState === "listening" ? "bg-[#FF3366] text-slate-800 animate-pulse" : "bg-slate-900/[0.03] text-slate-800/40 hover:text-slate-800/70 border border-slate-900/10"}`}
                  >
                    {voiceState === "listening" ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                  </button>
                )}
                <button onClick={() => toggleMute()}
                  className={`p-1.5 rounded-lg transition-all ${isMuted ? "text-slate-800/20" : "text-[#00B4D8] bg-[#00B4D8]/10"}`}
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button onClick={generateCodeFromPrompt} disabled={!aiPrompt.trim() || isGenerating}
                  className="px-3 py-1.5 rounded-lg bg-[#00B4D8]/10 text-[#00B4D8] text-[11px] font-medium hover:bg-[#00B4D8]/20 transition-all disabled:opacity-30">
                  {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Generate"}
                </button>
              </div>
            </div>

            {/* Status bar */}
            <div className="px-3 py-1.5 border-t border-slate-900/5 bg-white flex items-center gap-4 text-[10px] text-slate-800/20">
              <div className="flex items-center gap-1.5"><Terminal className="w-3 h-3" /> Ready</div>
              <div className="flex items-center gap-1.5"><Code2 className="w-3 h-3" /> {lang.label}</div>
              <div className="ml-auto flex items-center gap-3">
                <span>Ln {code.split("\n", (textareaRef.current?.selectionStart || 0)).length}, Col {(textareaRef.current?.selectionStart || 0) - code.lastIndexOf("\n", (textareaRef.current?.selectionStart || 0) - 1)}</span>
                <span>UTF-8</span>
                <span className="text-[#10B981]">● Connected</span>
              </div>
            </div>
          </div>

          {/* Output / Preview / AI Review panel */}
          <div className="w-[400px] flex flex-col shrink-0">
            {/* Output header */}
            <div className="px-4 py-2.5 border-b border-slate-900/5 flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-[#10B981]" />
              <span className="text-[10px] text-slate-800/30 uppercase tracking-widest font-semibold">Output</span>
            </div>

            {/* Output area */}
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Terminal output */}
              {output && !showPreview && (
                <pre className="p-4 text-xs font-mono text-slate-800 leading-relaxed whitespace-pre-wrap">{output}</pre>
              )}

              {/* HTML preview */}
              {showPreview && lang.id === "html" && (
                <iframe srcDoc={code} className="w-full h-full bg-white border-0" title="HTML Preview" sandbox="allow-scripts" />
              )}

              {!output && !showPreview && (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-slate-800/15">
                  <Terminal className="w-6 h-6" />
                  <p className="text-[11px]">Click Run to execute your code</p>
                </div>
              )}
            </div>

            {/* AI Review */}
            {aiReview && (
              <div className="border-t border-slate-900/5 max-h-[200px] overflow-y-auto">
                <div className="px-4 py-2 border-b border-slate-900/5 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6]" />
                  <span className="text-[10px] text-slate-800/30 uppercase tracking-widest font-semibold">AI Review</span>
                </div>
                <div className="p-4 text-xs text-slate-800/60 leading-relaxed whitespace-pre-wrap">{aiReview}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
