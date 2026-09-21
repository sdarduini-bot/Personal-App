"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export interface TrainerUser {
  id: string;
  name: string;
  email: string;
  role?: string;
  isActive?: boolean;
  phone?: string | null;
  pixKey?: string | null;
  bio?: string | null;
  themePreference?: string;
}

interface TrainerContextType {
  trainer: TrainerUser | null;
  loading: boolean;
  authenticated: boolean;
  isAdmin: boolean;
  refreshTrainer: () => Promise<void>;
  logout: () => Promise<void>;
}

const TrainerContext = createContext<TrainerContextType>({
  trainer: null,
  loading: true,
  authenticated: false,
  isAdmin: false,
  refreshTrainer: async () => {},
  logout: async () => {},
});

export function TrainerProvider({ children }: { children: React.ReactNode }) {
  const [trainer, setTrainer] = useState<TrainerUser | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("trainer_session_cache");
        if (cached) return JSON.parse(cached);
      } catch {}
    }
    return null;
  });

  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      try {
        return Boolean(localStorage.getItem("trainer_session_cache"));
      } catch {}
    }
    return false;
  });

  const [loading, setLoading] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      // Se já temos cache, não bloqueamos a interface
      return !Boolean(localStorage.getItem("trainer_session_cache"));
    }
    return true;
  });

  const fetchTrainer = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      if (data.authenticated && data.trainer) {
        setTrainer(data.trainer);
        setAuthenticated(true);
        try {
          localStorage.setItem("trainer_session_cache", JSON.stringify(data.trainer));
        } catch {}
      } else {
        setTrainer(null);
        setAuthenticated(false);
        try {
          localStorage.removeItem("trainer_session_cache");
        } catch {}
      }
    } catch {
      // Se falhar rede temporariamente mas já temos cache, mantemos
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainer();
  }, []);

  const logout = async () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("trainer_session_cache");
        sessionStorage.clear();
      }
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // prosseguir com logout local
    } finally {
      setTrainer(null);
      setAuthenticated(false);
      window.location.replace("/login");
    }
  };

  const isAdmin = trainer?.role === "ADMIN";

  return (
    <TrainerContext.Provider
      value={{
        trainer,
        loading,
        authenticated,
        isAdmin,
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
