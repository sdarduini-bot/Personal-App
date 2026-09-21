"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTrainer } from "@/contexts/TrainerContext";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { authenticated, loading } = useTrainer();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !authenticated) {
      router.replace("/login");
    }
  }, [loading, authenticated, router]);

  if (loading || !authenticated) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-zinc-400">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
        <span className="text-xs">
          {loading ? "Carregando painel..." : "Redirecionando para o login..."}
        </span>
      </div>
    );
  }

  return <>{children}</>;
}
