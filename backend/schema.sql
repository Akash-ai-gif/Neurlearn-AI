-- ═══════════════════════════════════════════════════
-- NEUROLEARN — Supabase Database Schema
-- ═══════════════════════════════════════════════════

-- Users (Simplified for Demo/Hackathon)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    language TEXT DEFAULT 'en',
    career_goal TEXT,
    learning_dna JSONB DEFAULT '{}',
    accessibility JSONB DEFAULT '{"dyslexia_mode": false, "high_contrast": false, "reduce_motion": false, "font_size": "normal"}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Skill definitions
CREATE TABLE IF NOT EXISTS skills (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT,
    level TEXT DEFAULT 'beginner',
    prerequisites TEXT[] DEFAULT '{}',
    objectives TEXT[] DEFAULT '{}',
    estimated_hours FLOAT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User skill progress
CREATE TABLE IF NOT EXISTS user_skills (
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'locked',
    time_spent INTEGER DEFAULT 0,
    last_session TIMESTAMPTZ,
    PRIMARY KEY (user_id, skill_id)
);

-- Learning paths
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    career_goal TEXT NOT NULL,
    nodes JSONB NOT NULL,
    current_node_index INTEGER DEFAULT 0,
    completion_percent FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cognitive sessions
CREATE TABLE IF NOT EXISTS cognitive_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    engagement_avg FLOAT,
    confusion_avg FLOAT,
    flow_avg FLOAT,
    fatigue_avg FLOAT,
    frustration_avg FLOAT,
    duration INTEGER,
    modality_switches INTEGER DEFAULT 0,
    agent_switches INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments
CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    type TEXT NOT NULL,
    questions JSONB,
    answers JSONB,
    score INTEGER,
    ai_evaluation JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Credentials
CREATE TABLE IF NOT EXISTS credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id TEXT REFERENCES skills(id),
    skill_name TEXT NOT NULL,
    level TEXT NOT NULL,
    score INTEGER NOT NULL,
    evidence JSONB DEFAULT '[]',
    ai_feedback TEXT,
    verification_code TEXT UNIQUE,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages (tutor + doubt solver)
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    skill_id TEXT,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    agent_type TEXT,
    modality TEXT DEFAULT 'text',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Doubts
CREATE TABLE IF NOT EXISTS doubts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    input_type TEXT NOT NULL,
    content TEXT NOT NULL,
    context_skill TEXT,
    ai_response TEXT,
    related_concepts TEXT[] DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Career recommendations
CREATE TABLE IF NOT EXISTS career_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL,
    market_data JSONB,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lab sessions
CREATE TABLE IF NOT EXISTS lab_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    lab_type TEXT NOT NULL,
    challenge JSONB,
    submission TEXT,
    ai_review TEXT,
    score INTEGER,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- ═══ Indexes ═══
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_cognitive_sessions_user ON cognitive_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_user ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_credentials_user ON credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_doubts_user ON doubts(user_id);

-- ═══ Row Level Security ═══
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE cognitive_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can view own skills" ON user_skills FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own paths" ON learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own sessions" ON cognitive_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own assessments" ON assessments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view own credentials" ON credentials FOR SELECT USING (auth.uid() = user_id);
