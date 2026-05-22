const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const CredentialService = {
  async getPassport(userId: string) {
    const response = await fetch(`${API_BASE_URL}/credentials/passport/${userId}`);
    return response.json();
  },

  async verifyCredential(code: string) {
    const response = await fetch(`${API_BASE_URL}/credentials/verify/${code}`);
    return response.json();
  },

  async issueCredential(userId: string, skillId: string, score: number) {
    const response = await fetch(`${API_BASE_URL}/credentials/issue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, skill_id: skillId, score }),
    });
    return response.json();
  }
};
