import { CognitiveState, AgentPersona, AgentConfig } from '@/types';

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    persona: 'professor',
    name: 'Professor',
    icon: '🎓',
    color: '#00D1FF',
    systemPrompt: `You are Professor, a patient and clear teacher. You explain concepts using structured, step-by-step explanations with examples. Use analogies from everyday life. When the learner is confused, break things down into smaller pieces. Format responses with markdown headers, bullet points, and code blocks when relevant.`,
    triggerConditions: { minConfusion: 40 },
  },
  {
    persona: 'socrates',
    name: 'Socrates',
    icon: '🤔',
    color: '#7C3AED',
    systemPrompt: `You are Socrates, a guide who teaches through questions. Never give direct answers. Instead, ask thought-provoking questions that lead the learner to discover the answer themselves. Use the Socratic method. Start with what they know and guide them to new understanding.`,
    triggerConditions: {},
  },
  {
    persona: 'visualizer',
    name: 'Visualizer',
    icon: '🎨',
    color: '#00F5A0',
    systemPrompt: `You are Visualizer. You explain concepts using visual diagrams, Mermaid.js charts, ASCII art, tables, and spatial metaphors. Always include at least one visual representation. Use mermaid code blocks for flowcharts and diagrams. Make abstract concepts concrete through visual thinking.`,
    triggerConditions: {},
  },
  {
    persona: 'coach',
    name: 'Coach',
    icon: '💪',
    color: '#FFB800',
    systemPrompt: `You are Coach, a motivational learning partner. You celebrate small wins, encourage persistence, and help learners see their progress. When they're struggling, remind them how far they've come. Use encouraging language and growth mindset principles. Include progress metaphors.`,
    triggerConditions: { maxEngagement: 30 },
  },
  {
    persona: 'career_advisor',
    name: 'Career Advisor',
    icon: '🧭',
    color: '#FF3366',
    systemPrompt: `You are Career Advisor. You help learners understand how their skills connect to real career opportunities. Provide industry context, job market insights, and practical advice on building a career portfolio. Be specific about job roles, salaries, and growth paths.`,
    triggerConditions: { context: ['career', 'job', 'salary'] },
  },
  {
    persona: 'interview_coach',
    name: 'Interview Coach',
    icon: '🗣️',
    color: '#00D1FF',
    systemPrompt: `You are Interview Coach. You simulate real job interviews, provide feedback on answers, and teach interview techniques. Ask realistic interview questions, evaluate responses, and suggest improvements. Cover behavioral, technical, and situational questions.`,
    triggerConditions: { context: ['interview', 'hiring'] },
  },
];

export class AgentOrchestrator {
  static selectAgent(state: CognitiveState, context?: string): AgentPersona {
    // High fatigue → Visualizer for easier consumption
    if (state.fatigue > 60) return 'visualizer';
    // High confusion → Professor for clear explanations
    if (state.confusion > 60) return 'professor';
    // Low engagement → Coach to re-engage
    if (state.engagement < 30) return 'coach';
    // High frustration → Professor for step-by-step
    if (state.frustration > 50) return 'professor';
    // In flow state → Socrates for deeper thinking
    if (state.flow > 70 && state.engagement > 60) return 'socrates';
    // Context-based selection
    if (context?.includes('visual') || context?.includes('diagram')) return 'visualizer';
    if (context?.includes('career') || context?.includes('job')) return 'career_advisor';
    if (context?.includes('interview')) return 'interview_coach';
    // Default: cycle between professor and socrates
    return state.confidence > 60 ? 'socrates' : 'professor';
  }

  static getAgentConfig(persona: AgentPersona): AgentConfig {
    return AGENT_CONFIGS.find(a => a.persona === persona) || AGENT_CONFIGS[0];
  }

  static getOrbState(state: CognitiveState): 'explaining' | 'thinking' | 'encouraging' | 'alerting' | 'celebrating' {
    if (state.confusion > 60) return 'alerting';
    if (state.fatigue > 70) return 'encouraging';
    if (state.flow > 70) return 'celebrating';
    if (state.engagement > 60) return 'explaining';
    return 'thinking';
  }

  static getAdaptationSuggestion(state: CognitiveState): string | null {
    if (state.confusion > 70) return 'Switch to visual explanation mode';
    if (state.fatigue > 75) return 'Suggest a 5-minute break';
    if (state.engagement < 25) return 'Switch to interactive exercise';
    if (state.frustration > 60) return 'Simplify content and add encouragement';
    if (state.flow > 80) return 'Increase challenge level';
    return null;
  }
}
