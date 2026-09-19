"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  Wallet,
  Dumbbell,
  Settings,
  Lock,
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Início", href: "/", icon: Home },
  { name: "Alunos", href: "/alunos", icon: Users },
  { name: "Agenda", href: "/agenda", icon: Calendar },
  { name: "Financeiro", href: "/financeiro", icon: Wallet },
  { name: "Planos", href: "/planos", icon: Dumbbell },
];

export default function Navigation() {
  const pathname = usePathname();

  const handleLock = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <>
      {/* 1. SIDEBAR DESKTOP (md e acima) */}
      <aside className="hidden md:flex flex-col w-64 border-r border-zinc-800/80 bg-zinc-950 p-4 fixed top-0 bottom-0 left-0 z-40">
        {/* Header da Sidebar */}
        <div className="flex items-center gap-3 px-3 py-4 mb-4 border-b border-zinc-800/60">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20">
            <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm text-zinc-100 tracking-tight">Pedro Personal</h2>
            <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Painel do Treinador
            </span>
          </div>
        </div>

        {/* Links de navegação */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                  isActive
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400" : "text-zinc-400"}`} />
                <span>{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé da Sidebar Desktop */}
        <div className="pt-4 border-t border-zinc-800/60 space-y-1">
          <Link
            href="/configuracoes"
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
              pathname === "/configuracoes"
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
            }`}
          >
            <Settings className="w-4 h-4 text-zinc-400" />
            <span>Configurações</span>
          </Link>

          <button
            type="button"
            onClick={handleLock}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-950/30 transition text-left"
          >
            <Lock className="w-4 h-4 text-rose-400" />
            <span>Bloquear App</span>
          </button>
        </div>
      </aside>

      {/* 2. BOTTOM NAVIGATION BAR MOBILE (fixo na base no celular com safe-area) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/90 px-1 pt-1.5 pb-[max(0.6rem,env(safe-area-inset-bottom))] shadow-2xl">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-1.5 px-2.5 rounded-xl transition duration-150 active:scale-90 min-w-[54px] min-h-[44px] ${
                  isActive ? "text-emerald-400 font-semibold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {isActive && (
                  <span className="absolute -top-1.5 w-6 h-1 bg-emerald-400 rounded-full shadow-sm shadow-emerald-400" />
                )}
                <Icon className={`w-5 h-5 ${isActive ? "text-emerald-400 scale-105" : "text-zinc-400"}`} />
                <span className="text-[10px] mt-1 tracking-tight font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
