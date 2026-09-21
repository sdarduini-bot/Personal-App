"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Delete,
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  KeyRound,
} from "lucide-react";

interface PinModalProps {
  onSuccess: () => void;
}

export default function PinModal({ onSuccess }: PinModalProps) {
  const [mode, setMode] = useState<"pin" | "email">("pin");

  // PIN
  const [pin, setPin] = useState("");

  // E-mail
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
      if (nextPin.length === 4) {
        attemptPinLogin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const attemptPinLogin = async (pinToTry: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinToTry }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || "PIN incorreto");
        setPin("");
      }
    } catch {
      setError("Erro ao conectar ao servidor");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();
      if (res.ok) {
        onSuccess();
      } else {
        setError(data.error || "E-mail ou senha incorretos.");
      }
    } catch {
      setError("Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-xs flex flex-col items-center text-center my-auto">
        {/* Logo / Ícone */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-3 flex items-center justify-center">
          <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-emerald-400 animate-pulse-subtle" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-zinc-100 tracking-tight">Personal Trainer Pro</h1>
        <p className="text-xs text-zinc-400 mt-0.5 mb-4">
          Acesso exclusivo do Personal Trainer
        </p>

        {/* Alternador de Modo */}
        <div className="flex p-1 rounded-xl bg-zinc-900 border border-zinc-800 mb-4 w-full">
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setError("");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
              mode === "pin"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN Rápido</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setError("");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5 ${
              mode === "email"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>E-mail</span>
          </button>
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="w-full text-rose-400 text-xs font-medium mb-3 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-lg animate-shake">
            {error}
          </div>
        )}

        {mode === "pin" ? (
          <>
            {/* Indicadores de PIN (Bolinhas) */}
            <div className="flex items-center justify-center gap-3 mb-5">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                      filled
                        ? "bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50"
                        : "border-2 border-zinc-700 bg-zinc-900/50"
                    }`}
                  />
                );
              })}
            </div>

            {/* Teclado Numérico */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[260px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDigit(String(num))}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-500/20 border border-zinc-800 text-xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 text-xs text-zinc-400 font-medium transition flex items-center justify-center active:scale-95"
              >
                Limpar
              </button>
              <button
                type="button"
                onClick={() => handleDigit("0")}
                disabled={loading}
                className="h-14 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-500/20 border border-zinc-800 text-xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="h-14 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-300 transition flex items-center justify-center active:scale-95"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 text-[11px] text-zinc-400">
              PIN inicial: <span className="font-mono text-emerald-400 font-bold">1234</span>
            </div>
          </>
        ) : (
          <form onSubmit={handleEmailLogin} className="w-full space-y-3">
            <div>
              <input
                type="email"
                required
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-3.5 pr-10 py-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm shadow-md transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Rodapé informativo */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 w-full text-[11px] text-zinc-500">
          Acesso exclusivo para treinadores convidados.
        </div>
      </div>
    </div>
  );
}
