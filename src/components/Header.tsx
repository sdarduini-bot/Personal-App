"use client";

import React from "react";
import Link from "next/link";
import { Dumbbell, Lock, Settings } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-800/80 px-4 py-3 md:px-8">
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Lado Esquerdo: Mobile Logo ou Título da Página */}
        <div className="flex items-center gap-3">
          <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-sm shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="text-base md:text-xl font-bold text-zinc-100 tracking-tight">
              {title || "Pedro Personal"}
            </h1>
            {subtitle ? (
              <p className="text-xs text-zinc-400">{subtitle}</p>
            ) : (
              <p className="text-[11px] text-emerald-400 font-medium md:hidden">
                Gestão do Treinador
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações rápidas */}
        <div className="flex items-center gap-2">
          <Link
            href="/configuracoes"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={handleLock}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-800 transition text-xs font-medium"
            title="Bloquear aplicativo"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bloquear</span>
          </button>
        </div>
      </div>
    </header>
  );
}
