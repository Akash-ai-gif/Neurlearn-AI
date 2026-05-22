// ═══════════════════════════════════════════════════════════════
// NEUROLEARN — TypeScript Interfaces
// ═══════════════════════════════════════════════════════════════

// ─── Cognitive Engine ───
export type AgentPersona = 'professor' | 'socrates' | 'visualizer' | 'coach' | 'career_advisor' | 'lab_master' | 'assessor' | 'interview_coach' | 'translator';

export interface CognitiveState {
  engagement: number;    // 0-100
  confusion: number;     // 0-100
  flow: number;          // 0-100
  fatigue: number;       // 0-100
  frustration: number;   // 0-100
  confidence: number;    // 0-100
  timestamp: number;
}

export interface CognitiveSession {
  id: string;
  userId: string;
  skillId: string;
  states: CognitiveState[];
  avgEngagement: number;
  avgConfusion: number;
  avgFlow: number;
  avgFatigue: number;
  duration: number;        // seconds
  modalitySwitches: number;
  createdAt: string;
}

// ─── Multi-Agent System ───
export interface AgentConfig {
  persona: AgentPersona;
  name: string;
  icon: string;
  color: string;
  systemPrompt: string;
  triggerConditions: {
    minConfusion?: number;
    maxEngagement?: number;
    minFatigue?: number;
    context?: string[];
  };
}

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent?: AgentPersona;
  agentName?: string;
  timestamp: number;
  modality?: 'text' | 'voice' | 'image' | 'code';
}

// ─── Skills & Knowledge Graph ───
export type SkillStatus = 'locked' | 'available' | 'learning' | 'mastered';
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface SkillNode {
  id: string;
  name: string;
  domain: string;
  category: string;
  level: SkillLevel;
  prerequisites: string[];
  objectives: string[];
  estimatedHours: number;
  status: SkillStatus;
  score: number;          // 0-100
  timeSpent: number;      // minutes
  x?: number;
  y?: number;
}

export interface SkillLink {
  source: string;
  target: string;
  type: 'prerequisite' | 'related' | 'cross-domain';
}

export interface SkillGraph {
  nodes: SkillNode[];
  links: SkillLink[];
}

// ─── Learning Path ───
export interface LearningPath {
  id: string;
  userId: string;
  careerGoal: string;
  nodes: PathNode[];
  currentNodeIndex: number;
  completionPercent: number;
  createdAt: string;
}

export interface PathNode {
  id: string;
  skillId: string;
  order: number;
  status: SkillStatus;
  unlockedAt?: string;
  completedAt?: string;
  adaptations: PathAdaptation[];
}

export interface PathAdaptation {
  type: 'remedial' | 'simplify' | 'practice' | 'targeted' | 'walkthrough' | 'switch_modality' | 'skip_ahead';
  reason: string;
  timestamp: string;
}

// ─── Assessment ───
export type AssessmentType = 'mcq' | 'practical_project' | 'scenario' | 'code_quality' | 'spoken' | 'problem_solving' | 'peer_review';

export interface Assessment {
  id: string;
  userId: string;
  skillId: string;
  type: AssessmentType;
  questions: AssessmentQuestion[];
  score: number;
  aiEvaluation: AIEvaluation;
  createdAt: string;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'mcq' | 'code' | 'text' | 'spoken';
  options?: string[];
  correctAnswer?: number | string;
  explanation: string;
  userAnswer?: string | number;
  isCorrect?: boolean;
  skillId: string;
}

export interface AIEvaluation {
  overallScore: number;
  criteria: EvaluationCriterion[];
  strengths: string[];
  improvements: string[];
  feedback: string;
}

export interface EvaluationCriterion {
  name: string;
  weight: number;
  score: number;
  feedback: string;
}

// ─── Credentials ───
export interface Credential {
  id: string;
  userId: string;
  skillId: string;
  skillName: string;
  level: SkillLevel;
  score: number;
  evidence: CredentialEvidence[];
  aiFeedback: string;
  verificationCode: string;
  issuedAt: string;
}

export interface CredentialEvidence {
  type: 'project' | 'assessment' | 'lab';
  title: string;
  description: string;
  link?: string;
}

// ─── Career ───
export interface CareerRecommendation {
  id: string;
  title: string;
  matchPercent: number;
  icon: string;
  skillGap: SkillGap[];
  estimatedTime: string;
  openJobs: number;
  salaryRange: string;
  description: string;
}

export interface SkillGap {
  skillName: string;
  currentLevel: number;
  requiredLevel: number;
  priority: 'high' | 'medium' | 'low';
}

// ─── User Profile ───
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  language: string;
  careerGoal: string;
  learningDNA: LearningDNA;
  accessibility: AccessibilitySettings;
  createdAt: string;
}

export interface LearningDNA {
  visual: number;      // 0-100 preference
  auditory: number;
  kinesthetic: number;
  readingWriting: number;
  peakHours: string[];
  optimalSessionLength: number;
  learningSpeed: 'slow' | 'moderate' | 'fast';
  preferredModality: 'text' | 'video' | 'interactive' | 'voice';
}

export interface AccessibilitySettings {
  dyslexiaMode: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  fontSize: 'normal' | 'large' | 'extra-large';
  colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia';
}

// ─── Doubt Solver ───
export interface Doubt {
  id: string;
  userId: string;
  inputType: 'text' | 'voice' | 'image' | 'screenshot' | 'code';
  content: string;
  contextSkill: string;
  aiResponse: string;
  relatedConcepts: string[];
  practiceProblems: string[];
  resolved: boolean;
  createdAt: string;
}

// ─── Lab Types ───
export interface LabSession {
  id: string;
  labType: 'code' | 'cyber' | 'communication' | 'healthcare' | 'vocational' | 'data' | 'marketing';
  challenge: LabChallenge;
  submission?: string;
  aiReview?: string;
  score?: number;
  startedAt: string;
  completedAt?: string;
}

export interface LabChallenge {
  id: string;
  title: string;
  description: string;
  difficulty: SkillLevel;
  timeLimit?: number;
  starterCode?: string;
  testCases?: TestCase[];
  hints: string[];
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

// ─── Modalities ───
export type ContentModality = 'text' | 'voice' | 'video' | 'diagram' | 'code' | 'interactive' | 'language' | 'quiz' | 'project';

export interface ContentBlock {
  id: string;
  modality: ContentModality;
  content: string;
  metadata?: Record<string, unknown>;
}
