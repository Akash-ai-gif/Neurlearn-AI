-- NeuroLearn — Migration: Add Learner Journey table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS learner_journey (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,  -- 'lesson_started', 'lesson_completed', 'quiz_passed', 'skill_unlocked'
    skill_id TEXT,
    skill_name TEXT,
    score INTEGER DEFAULT 0,
    time_spent_minutes INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE learner_journey ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own journey" ON learner_journey FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journey" ON learner_journey FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Index for fast user queries
CREATE INDEX IF NOT EXISTS idx_learner_journey_user_id ON learner_journey(user_id);
CREATE INDEX IF NOT EXISTS idx_learner_journey_created_at ON learner_journey(created_at DESC);
