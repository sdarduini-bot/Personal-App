"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  Mail,
  Lock,
  KeyRound,
  Delete,
} from "lucide-react";
import { useTrainer } from "@/contexts/TrainerContext";

export default function LoginPage() {
  const router = useRouter();
  const { refreshTrainer } = useTrainer();

  const [mode, setMode] = useState<"email" | "pin">("email");

  // Campos E-mail + Senha
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Campos PIN
  const [pin, setPin] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Informe seu e-mail e senha.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Credenciais inválidas.");
        setLoading(false);
        return;
      }

      await refreshTrainer();
      router.push("/");
    } catch {
      setError("Falha de comunicação com o servidor.");
      setLoading(false);
    }
  };

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

      if (!res.ok) {
        setError(data.error || "PIN incorreto.");
        setPin("");
        setLoading(false);
        return;
      }

      await refreshTrainer();
      router.push("/");
    } catch {
      setError("Erro ao conectar com o servidor.");
      setPin("");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Luz ambiente de fundo (Aura Emerald) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 blur-[130px] rounded-full pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        {/* Logo */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-4">
          <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center">
            <Dumbbell className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Acesse sua Conta
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Painel exclusivo para o Personal Trainer
        </p>

        {/* Alternador de Modo: E-mail vs PIN */}
        <div className="mt-5 inline-flex p-1 rounded-xl bg-zinc-900 border border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setMode("email");
              setError("");
            }}
            className={`px-4 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "email"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            E-mail & Senha
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("pin");
              setError("");
            }}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
              mode === "pin"
                ? "bg-zinc-800 text-zinc-100 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN Rápido</span>
          </button>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-zinc-800/80 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {mode === "email" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {/* E-mail */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  E-mail
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@personal.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Senha */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Entrar no Painel</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-xs text-zinc-400 mb-4 text-center">
                Digite seu PIN mestre de 4 dígitos para liberação rápida.
              </p>

              {/* Bolinhas indicadoras */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        filled
                          ? "bg-emerald-400 scale-110 shadow-md shadow-emerald-400/50"
                          : "border-2 border-zinc-700 bg-zinc-900/50"
                      }`}
                    />
                  );
                })}
              </div>

              {/* Teclado numérico */}
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-[260px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigit(String(num))}
                    disabled={loading}
                    className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPin("")}
                  className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800 text-xs text-zinc-400 font-medium transition flex items-center justify-center active:scale-95"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handleDigit("0")}
                  disabled={loading}
                  className="h-14 rounded-2xl bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 text-xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => setPin((prev) => prev.slice(0, -1))}
                  className="h-14 rounded-2xl bg-zinc-950/40 hover:bg-zinc-800 text-zinc-300 transition flex items-center justify-center active:scale-95"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Rodapé informativo */}
          <div className="mt-6 pt-5 border-t border-zinc-800 text-center">
            <p className="text-xs text-zinc-400">
              Acesso exclusivo para treinadores convidados e administradores.
            </p>
          </div>
        </div>

        {/* Garantia */}
        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Ambiente seguro com criptografia SHA-256 / Scrypt</span>
        </div>
      </div>
    </div>
  );
}
