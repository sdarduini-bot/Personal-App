"use client";

import React, { useState } from "react";
import { Lock, Delete, Sparkles, Dumbbell } from "lucide-react";

interface PinModalProps {
  onSuccess: () => void;
}

export default function PinModal({ onSuccess }: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError("");
      // Se atingir 4 dígitos, tenta autenticar automaticamente
      if (nextPin.length === 4) {
        attemptLogin(nextPin);
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

  const attemptLogin = async (pinToTry: string) => {
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
      setError("Erro ao conectar");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/95 backdrop-blur-md p-4">
      <div className="w-full max-w-xs flex flex-col items-center text-center">
        {/* Logo / Ícone */}
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-xl shadow-emerald-500/20 mb-4 flex items-center justify-center">
          <div className="w-full h-full bg-zinc-900 rounded-[22px] flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-emerald-400 animate-pulse-subtle" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Pedro Personal</h1>
        <p className="text-xs text-zinc-400 mt-1 mb-6">
          Acesso exclusivo do Personal Trainer. Digite seu PIN de 4 dígitos.
        </p>

        {/* Indicadores de PIN (Bolinhas) */}
        <div className="flex items-center justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const filled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  filled
                    ? "bg-emerald-400 scale-110 shadow-lg shadow-emerald-400/50"
                    : "border-2 border-zinc-700 bg-zinc-900/50"
                }`}
              />
            );
          })}
        </div>

        {/* Mensagem de Erro */}
        {error && (
          <div className="text-rose-400 text-xs font-medium mb-3 bg-rose-950/40 border border-rose-800/50 px-3 py-1.5 rounded-lg animate-shake">
            {error}
          </div>
        )}

        {/* Teclado Numérico Estilo App */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[280px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleDigit(String(num))}
              disabled={loading}
              className="h-16 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-500/20 border border-zinc-800 text-2xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-16 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 text-xs text-zinc-400 font-medium transition flex items-center justify-center active:scale-95"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={() => handleDigit("0")}
            disabled={loading}
            className="h-16 rounded-2xl bg-zinc-900/80 hover:bg-zinc-800 active:bg-emerald-500/20 border border-zinc-800 text-2xl font-semibold text-zinc-100 transition flex items-center justify-center shadow-sm select-none active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-16 rounded-2xl bg-zinc-900/40 hover:bg-zinc-800/60 text-zinc-300 transition flex items-center justify-center active:scale-95"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-8 text-[11px] text-zinc-400">
          PIN padrão inicial: <span className="font-mono text-emerald-400 font-bold">1234</span>
        </div>
      </div>
    </div>
  );
}
