"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Dumbbell, Lock, Settings, Sparkles, Smartphone } from "lucide-react";
import { useTrainer } from "@/contexts/TrainerContext";
import InstallAppGuideModal from "@/components/InstallAppGuideModal";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const { trainer, isAdmin, logout } = useTrainer();
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  return (
    <header
      style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.875rem)" }}
      className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 pb-3 md:px-8"
    >
      <div className="flex items-center justify-between max-w-6xl mx-auto">
        {/* Lado Esquerdo: Mobile Logo ou Título da Página */}
        <div className="flex items-center gap-3">
          <div className="md:hidden w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-sm shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-900 rounded-[10px] flex items-center justify-center">
              <Dumbbell className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-bold text-zinc-100 tracking-tight">
                {title || trainer?.name || "Personal Trainer"}
              </h1>
              {isAdmin && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-700/60 text-amber-400 text-[10px] font-semibold">
                  <span>Administrador</span>
                </span>
              )}
            </div>
            {subtitle ? (
              <p className="text-xs text-zinc-400">{subtitle}</p>
            ) : (
              <p className="text-[11px] text-emerald-400 font-medium md:hidden">
                {isAdmin ? "Painel de Controle Mestre" : "Painel do Treinador"}
              </p>
            )}
          </div>
        </div>

        {/* Lado Direito: Ações rápidas */}
        <div className="flex items-center gap-2">
          {/* Botão Como Instalar no Celular */}
          <button
            type="button"
            onClick={() => setShowInstallGuide(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 border border-emerald-800/60 transition text-xs font-semibold"
            title="Como instalar este app no seu celular"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Instalar App</span>
          </button>

          <Link
            href="/configuracoes"
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
            title="Configurações"
          >
            <Settings className="w-5 h-5" />
          </Link>

          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-rose-950/40 text-zinc-300 hover:text-rose-400 border border-zinc-800 transition text-xs font-medium"
            title="Encerrar sessão"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>

      {/* Modal com Guia Passo a Passo para iOS e Android */}
      <InstallAppGuideModal
        isOpen={showInstallGuide}
        onClose={() => setShowInstallGuide(false)}
      />
    </header>
  );
}
