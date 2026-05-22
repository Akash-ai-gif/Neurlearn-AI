const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const UserService = {
  async signup(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async login(data: any) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getProfile(userId: string) {
    const response = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
    return response.json();
  },

  async getCareerRecommendations(userId: string) {
    const response = await fetch(`${API_BASE_URL}/career/recommendations/${userId}`);
    return response.json();
  }
};
