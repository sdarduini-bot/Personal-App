"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type AppTheme = "emerald" | "cyan" | "solar";

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "emerald",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AppTheme>("emerald");

  useEffect(() => {
    // 1. Ler preferência salva no localStorage
    const saved = localStorage.getItem("pedro_pt_theme") as AppTheme;
    if (saved && ["emerald", "cyan", "solar"].includes(saved)) {
      setThemeState(saved);
      applyThemeClass(saved);
    } else {
      // 2. Buscar das configurações do servidor
      fetch("/api/settings")
        .then((res) => res.json())
        .then((data) => {
          if (data.themePreference && ["emerald", "cyan", "solar"].includes(data.themePreference)) {
            setThemeState(data.themePreference);
            applyThemeClass(data.themePreference);
          }
        })
        .catch(() => {});
    }
  }, []);

  const applyThemeClass = (newTheme: AppTheme) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("theme-emerald", "theme-cyan", "theme-solar");
    root.classList.add(`theme-${newTheme}`);
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem("pedro_pt_theme", newTheme);
    applyThemeClass(newTheme);

    // Persistir no backend
    fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: newTheme }),
    }).catch(console.error);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
