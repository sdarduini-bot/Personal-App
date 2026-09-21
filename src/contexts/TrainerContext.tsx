"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  pixKey?: string | null;
  bio?: string | null;
  themePreference?: string;
  subscriptionStatus: "TRIAL" | "ACTIVE" | "PAST_DUE" | "CANCELLED";
  trialEndsAt?: string | null;
  trialDaysRemaining?: number | null;
}

interface TrainerContextType {
  trainer: TrainerUser | null;
  loading: boolean;
  authenticated: boolean;
  refreshTrainer: () => Promise<void>;
  logout: () => Promise<void>;
}

const TrainerContext = createContext<TrainerContextType>({
  trainer: null,
  loading: true,
  authenticated: false,
  refreshTrainer: async () => {},
  logout: async () => {},
});

export function TrainerProvider({ children }: { children: React.ReactNode }) {
  const [trainer, setTrainer] = useState<TrainerUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const fetchTrainer = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.authenticated && data.trainer) {
        setTrainer(data.trainer);
        setAuthenticated(true);
      } else {
        setTrainer(null);
        setAuthenticated(false);
      }
    } catch {
      setTrainer(null);
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainer();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setTrainer(null);
      setAuthenticated(false);
      window.location.href = "/login";
    } catch {
      window.location.href = "/login";
    }
  };

  return (
    <TrainerContext.Provider
      value={{
        trainer,
        loading,
        authenticated,
        refreshTrainer: fetchTrainer,
        logout,
      }}
    >
      {children}
    </TrainerContext.Provider>
  );
}

export function useTrainer() {
  return useContext(TrainerContext);
}
