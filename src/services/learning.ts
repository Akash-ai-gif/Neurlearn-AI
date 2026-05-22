import { CognitiveState, AgentMessage } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const LearningService = {
  async getLesson(skillId: string, userId: string, cognitiveState: CognitiveState) {
    const response = await fetch(`${API_BASE_URL}/learning/generate-lesson`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, user_id: userId, cognitive_state: cognitiveState }),
    });
    return response.json();
  },

  async sendMessage(messages: any[], cognitiveState: CognitiveState, skillId: string) {
    // In a real app, this would call the AI endpoint
    // For now, we simulate the adaptive response
    const response = await fetch(`${API_BASE_URL}/learning/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, cognitive_state: cognitiveState, skill_id: skillId }),
    });
    return response.json();
  },

  async saveCognitiveSession(sessionData: any) {
    const response = await fetch(`${API_BASE_URL}/learning/cognitive-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });
    return response.json();
  }
};
