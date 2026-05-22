"use client";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import * as d3 from "d3";
import { motion, AnimatePresence } from "framer-motion";
import { Network, Search, Filter, Info, Loader2, RefreshCw, Book, Home, Plus, ChevronRight, ChevronLeft, Brain, Target, Zap, Activity, BarChart2 } from "lucide-react";
import { useUser } from "@/context/user-context";
import { CognitiveRadar } from "@/components/cognitive/radar-chart";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export default function KnowledgeGraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [graphData, setGraphData] = useState<{ nodes: any[], links: any[] }>({ nodes: [], links: [] });
  const [graphStats, setGraphStats] = useState({ total: 0, completed: 0, available: 0 });
  const { user } = useUser();

  const fetchAndRender = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/learning/path/${user.user_id}`);
      const pathData = await res.json();
      
      let rawNodes = pathData.nodes || [];
      if (typeof rawNodes === 'string') {
        try { rawNodes = JSON.parse(rawNodes); } catch (e) {}
      }
      
      let finalNodes = [];
      if (Array.isArray(rawNodes)) {
        finalNodes = rawNodes;
      } else if (rawNodes && typeof rawNodes === "object") {
        finalNodes = Array.isArray(rawNodes.nodes) ? rawNodes.nodes : (Array.isArray(rawNodes.skills) ? rawNodes.skills : []);
      }

      const nodes = finalNodes.map((n: any, i: number) => ({
        id: n.id || `node-${i}-${Math.random()}`, 
        name: n.skill || n.name || n.title || `Skill Module ${i+1}`, 
        type: i % 3 === 0 ? "core" : i % 3 === 1 ? "concept" : "lab",
        status: n.status || "locked", 
        score: n.score || 0,
        explanation: n.explanation || n.description || "This module explores the core principles and applications of the selected skill, integrating theory with practical exercises.",
      }));

      const links: any[] = [];
      nodes.forEach((n: any, i: number) => {
        if (i > 0) links.push({ source: nodes[i-1].id, target: n.id, label: "PREREQ" });
        if (i > 2) links.push({ source: nodes[i-3].id, target: n.id, label: "EXTENDS" });
      });

      setGraphStats({
        total: nodes.length,
        completed: nodes.filter((n: any) => n.status === "completed").length,
        available: nodes.filter((n: any) => n.status === "available").length,
      });
      setGraphData({ nodes, links });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      fetchAndRender();
    }
  }, [user]);

  // Handle container resize and initial render
  useEffect(() => {
    if (graphData.nodes.length === 0) return;

    // Use a small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      renderGraph(graphData);
    }, 100);

    const handleResize = () => {
      renderGraph(graphData);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [graphData]);

  const renderGraph = (data: any) => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const container = svgRef.current.parentElement;
    if (!container) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const simulation = d3.forceSimulation(data.nodes)
      .force("link", d3.forceLink(data.links).id((d: any) => d.id).distance(140))
      .force("charge", d3.forceManyBody().strength(-600))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(35));

    // Define gradients for neon glow
    const defs = svg.append("defs");
    ["#00D1FF", "#00F5A0", "#FF3366"].forEach((color, i) => {
      const filter = defs.append("filter").attr("id", `glow-${i}`).attr("x", "-50%").attr("y", "-50%").attr("width", "200%").attr("height", "200%");
      filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
      const merge = filter.append("feMerge");
      merge.append("feMergeNode").attr("in", "coloredBlur");
      merge.append("feMergeNode").attr("in", "SourceGraphic");
    });

    const linkGroup = svg.append("g").attr("class", "links");
    const nodeGroup = svg.append("g").attr("class", "nodes");
    const labelGroup = svg.append("g").attr("class", "labels");

    const link = linkGroup.selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke", "rgba(15, 23, 42, 0.05)")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", (d: any) => d.label === "EXTENDS" ? "4 4" : "none");

    const edgeLabels = labelGroup.selectAll(".edge-label")
      .data(data.links)
      .join("text")
      .attr("class", "edge-label")
      .text((d: any) => d.label)
      .attr("fill", "rgba(15, 23, 42, 0.2)")
      .attr("font-size", "8px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle");

    const node = nodeGroup.selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", 14)
      .attr("fill", (d: any) => {
        if (d.type === "core") return "#00D1FF";
        if (d.type === "concept") return "#7C3AED";
        return "#00F5A0";
      })
      .attr("stroke", "rgba(15, 23, 42, 0.2)")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .style("filter", (d: any, i) => `url(#glow-${i % 3})`)
      .on("click", (event, d) => setSelectedNode(d))
      .call(d3.drag<any, any>()
        .on("start", (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on("drag", (event, d) => {
          d.fx = event.x; d.fy = event.y;
        })
        .on("end", (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        }));

    const nodeLabels = labelGroup.selectAll(".node-label")
      .data(data.nodes)
      .join("text")
      .attr("class", "node-label")
      .text((d: any) => d.name)
      .attr("fill", "rgba(15, 23, 42, 0.6)")
      .attr("font-size", "10px")
      .attr("font-weight", "500")
      .attr("dx", 20)
      .attr("dy", 4)
      .style("pointer-events", "none");

    simulation.on("tick", () => {
      link.attr("x1", (d: any) => d.source.x).attr("y1", (d: any) => d.source.y).attr("x2", (d: any) => d.target.x).attr("y2", (d: any) => d.target.y);
      edgeLabels.attr("x", (d: any) => (d.source.x + d.target.x) / 2).attr("y", (d: any) => (d.source.y + d.target.y) / 2);
      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);
      nodeLabels.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });
  };

  return (
    <AppShell>
      <div className="h-[calc(100vh-140px)] flex flex-col bg-[#FDFBF7] rounded-3xl border border-slate-900/5 overflow-hidden text-slate-800 relative">
        {/* Cinematic Sub-Header */}
        <div className="h-16 border-b border-slate-900/5 px-8 flex items-center justify-between glass-strong">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(0,209,255,0.3)]">
                <Network className="w-6 h-6 text-slate-800" />
              </div>
              <div>
                <span className="font-bold tracking-tight text-lg block">Cognitive Skill Map</span>
                <span className="text-[10px] text-[#00B4D8] uppercase tracking-widest block font-medium">Neural Architecture v2.4</span>
              </div>
            </div>
            <div className="h-6 w-[1px] bg-slate-900/10" />
            <div className="flex items-center gap-6 text-[10px] font-bold uppercase tracking-widest text-slate-800/40">
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#00B4D8] shadow-[0_0_8px_#00D1FF]" /> Core Skill</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#8B5CF6] shadow-[0_0_8px_#7C3AED]" /> Theoretical</div>
              <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-[0_0_8px_#00F5A0]" /> Lab Module</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={fetchAndRender} className="p-2.5 hover:bg-slate-900/5 rounded-xl transition-all border border-slate-900/5 group">
              <RefreshCw className="w-4 h-4 text-slate-800/40 group-hover:text-[#00B4D8] transition-colors" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Graph Canvas */}
          <div className="flex-1 relative bg-[#FDFBF7]">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#FDFBF7]/60 backdrop-blur-sm z-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-10 h-10 text-[#00B4D8] animate-spin" />
                  <span className="text-xs font-medium text-slate-800/30 uppercase tracking-[0.2em]">Synchronizing DNA...</span>
                </div>
              </div>
            )}
            
            <svg ref={svgRef} className="w-full h-full relative z-10" />
            
            {/* Bottom Floating Navigation */}
            <div className="absolute bottom-8 left-8 flex items-center gap-6 glass p-3 rounded-2xl border border-slate-900/10 shadow-2xl z-20">
              <div className="flex items-center gap-3 pr-6 border-r border-slate-900/10">
                <div className="w-8 h-8 rounded-lg bg-slate-900/5 flex items-center justify-center">
                   <ChevronLeft className="w-4 h-4 text-slate-800/40" />
                </div>
                <div className="text-[10px] font-bold text-slate-800/60 uppercase tracking-widest px-2">Timeline Explorer</div>
                <div className="w-8 h-8 rounded-lg bg-slate-900/5 flex items-center justify-center">
                   <ChevronRight className="w-4 h-4 text-slate-800/40" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className="text-[10px] text-slate-800/30">CURRENT STATE: <span className="text-[#10B981] font-bold uppercase">Optimized</span></div>
              </div>
            </div>
          </div>

          {/* Right Intelligence Panel */}
          <div className="w-80 glass-strong border-l border-slate-900/5 p-6 flex flex-col gap-8 overflow-y-auto z-30 relative">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#00B4D8]" />
                <h2 className="font-bold text-slate-900 tracking-tight text-xs uppercase">Cognitive Definition</h2>
              </div>
              <p className="text-[11px] text-slate-800/40 leading-relaxed italic">
                This graph defines your unique **Cognitive Skill Topography**. Each node represents a neural synapse in your learning journey, explaining how base concepts extend into advanced modules.
              </p>
            </div>

            {/* Neural Mastery Map Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Network className="w-5 h-5 text-[#00F5A0]" />
                <h2 className="font-bold text-slate-900 tracking-tight text-xs uppercase">Neural Mastery Map</h2>
              </div>
              <div className="p-4 rounded-3xl bg-white border border-slate-100 shadow-sm relative overflow-hidden h-[220px]">
                {/* Background Neural Grid */}
                <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
                     style={{ backgroundImage: 'radial-gradient(circle, #00B4D8 1px, transparent 1px)', backgroundSize: '15px 15px' }} />
                
                {/* Simulated Neural Clusters */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {[
                    { label: "Skill", x: "20%", y: "30%", color: "#00D1FF", val: graphStats.total > 0 ? Math.round((graphStats.completed / graphStats.total) * 100) : 0 },
                    { label: "Potential", x: "80%", y: "30%", color: "#FF3366", val: Math.min(100, 60 + (graphStats.completed * 5)) },
                    { label: "Performance", x: "50%", y: "50%", color: "#00F5A0", val: 78 },
                    { label: "Creativity", x: "30%", y: "80%", color: "#7C3AED", val: 85 },
                    { label: "Adaptability", x: "70%", y: "80%", color: "#FFB800", val: 92 },
                  ].map((m, i) => (
                    <motion.div
                      key={i}
                      className="absolute group cursor-help"
                      style={{ left: m.x, top: m.y }}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.1 }}
                    >
                      {/* Synapse Link Lines (SVG) */}
                      {i > 0 && (
                        <svg className="absolute top-1/2 left-1/2 -z-10 w-[100px] h-[100px] pointer-events-none overflow-visible opacity-10">
                           <line x1="0" y1="0" x2="-20" y2="-20" stroke={m.color} strokeWidth="1" strokeDasharray="2 2" />
                        </svg>
                      )}
                      
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-[8px] font-black text-white shadow-lg transition-transform group-hover:scale-110"
                          style={{ background: m.color, boxShadow: `0 0 15px ${m.color}60` }}
                        >
                          {m.val}%
                        </div>
                        <div className="absolute top-full mt-1 left-1/2 -translate-x-1/2 text-[7px] font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
                          {m.label}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#00B4D8]/5 border border-[#00B4D8]/10">
                <h4 className="text-[10px] font-black text-[#00B4D8] uppercase mb-2">Neural Analysis</h4>
                <p className="text-[10px] text-slate-500 leading-relaxed italic">
                  "Your **Neural Potential** is surging. Each synapse represents a core competency being validated by the AI."
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[9px] font-bold text-slate-800/20 uppercase tracking-[0.2em]">Analytical Tools</h3>
              {[
                { label: "Predictive Pathing", icon: Target, desc: "AI forecasts next 3 mastery nodes." },
                { label: "Complexity Analysis", icon: Activity, desc: "Identify high-friction learning zones." },
                { label: "Burst Mode", icon: Zap, desc: "Focus high-energy nodes for rapid growth." }
              ].map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-900/[0.02] border border-slate-900/5 hover:border-[#00B4D8]/30 transition-all cursor-pointer group">
                  <div className="flex items-center gap-3 mb-1.5">
                    <item.icon className="w-4 h-4 text-slate-800/40 group-hover:text-[#00B4D8] transition-colors" />
                    <h4 className="text-[11px] font-bold text-slate-800/80">{item.label}</h4>
                  </div>
                  <p className="text-[10px] text-slate-800/30 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {selectedNode ? (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} key={selectedNode.id} 
                            className="pt-6 border-t border-slate-900/10 space-y-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center font-bold text-xl shadow-lg">
                      {selectedNode.name?.[0] || "?"}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800">{selectedNode.name || "Unknown Skill"}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-[#00B4D8] uppercase font-bold px-1.5 py-0.5 bg-[#00B4D8]/10 rounded border border-[#00B4D8]/20">
                          {selectedNode.type}
                        </span>
                        <span className="text-[9px] text-slate-800/30">{selectedNode.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[9px] font-bold text-slate-800/20 uppercase tracking-widest">Analytical Overview</h4>
                    <p className="text-xs text-slate-800/60 leading-relaxed">
                      {selectedNode.explanation}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900/[0.03] border border-slate-900/5 space-y-3">
                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest">
                      <span className="text-slate-800/20 text-[8px]">Mastery Density</span>
                      <span className="text-[#10B981]">{selectedNode.score}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-900/5 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${selectedNode.score}%` }} 
                                  className="h-full bg-gradient-to-r from-[#00D1FF] to-[#00F5A0] rounded-full" />
                    </div>
                    <button className="w-full gradient-primary py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest mt-2 hover:scale-[1.02] active:scale-[0.98] transition-all">
                      Engage Module
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-t border-slate-900/5 mt-auto">
                  <div className="w-12 h-12 rounded-full border border-slate-900/10 flex items-center justify-center mb-3">
                    <Info className="w-5 h-5 text-slate-800/10" />
                  </div>
                  <p className="text-[10px] text-slate-800/20 italic font-medium leading-relaxed uppercase tracking-tighter">
                    Select a neural node to<br/>analyze cognitive metadata
                  </p>
                </div>
              )}
            </AnimatePresence>

            <div className="mt-auto pt-6 border-t border-slate-900/10">
               <div className="flex items-center justify-between text-[10px] font-bold">
                 <span className="text-slate-800/20 uppercase tracking-widest">Synapse Status</span>
                 <span className="text-[#10B981] uppercase tracking-tighter flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                    ACTIVE
                 </span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

