"use client";

import React from "react";
import PinModal from "./PinModal";
import { useTrainer } from "@/contexts/TrainerContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, loading, refreshTrainer } = useTrainer();

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">Carregando painel...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <PinModal onSuccess={refreshTrainer} />;
  }

  return <>{children}</>;
}
