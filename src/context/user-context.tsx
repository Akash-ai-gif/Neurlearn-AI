"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface UserProfile {
  user_id: string;
  name: string;
  email: string;
  career_goal: string;
  learning_dna?: Record<string, any>;
  accessibility?: Record<string, any>;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  signup: (name: string, email: string, password: string, career_goal: string) => Promise<UserProfile>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  login: async () => ({ user_id: "", name: "", email: "", career_goal: "" }),
  signup: async () => ({ user_id: "", name: "", email: "", career_goal: "" }),
  logout: () => {},
  refreshProfile: async () => {},
});

export const useUser = () => useContext(UserContext);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check localStorage for saved session
  useEffect(() => {
    const saved = localStorage.getItem("neurolearn_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        // Refresh from backend to get latest data
        fetchProfile(parsed.user_id).then((fresh) => {
          if (fresh) setUser(fresh);
        });
      } catch {
        localStorage.removeItem("neurolearn_user");
      }
    }
    setIsLoading(false);
  }, []);

  const fetchProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/profile/${userId}`);
      if (res.ok) {
        const data = await res.json();
        return {
          user_id: data.id,
          name: data.name,
          email: data.email,
          career_goal: data.career_goal,
          learning_dna: data.learning_dna,
          accessibility: data.accessibility,
        };
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    }
    return null;
  };

  const signup = async (name: string, email: string, password: string, career_goal: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, career_goal }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Signup failed");

    const profile: UserProfile = {
      user_id: data.user_id,
      name: data.name,
      email: data.email || email,
      career_goal: data.career_goal || career_goal,
    };
    setUser(profile);
    localStorage.setItem("neurolearn_user", JSON.stringify(profile));
    return profile;
  };

  const login = async (email: string, password: string): Promise<UserProfile> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Login failed");

    const profile: UserProfile = {
      user_id: data.user_id,
      name: data.name,
      email: data.email || email,
      career_goal: data.career_goal || "",
    };
    setUser(profile);
    localStorage.setItem("neurolearn_user", JSON.stringify(profile));
    return profile;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("neurolearn_user");
  };

  const refreshProfile = async () => {
    if (user?.user_id) {
      const fresh = await fetchProfile(user.user_id);
      if (fresh) {
        setUser(fresh);
        localStorage.setItem("neurolearn_user", JSON.stringify(fresh));
      }
    }
  };

  return (
    <UserContext.Provider value={{ user, isLoading, login, signup, logout, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}
