"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ArrowLeft,
  Mail,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Informe seu e-mail de acesso.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        setSubmitted(true);
      } else {
        setError(data.error || "Erro ao solicitar recuperação.");
      }
    } catch {
      setError("Falha de conexão com o servidor. Tente novamente.");
    } finally {
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
          Recuperar sua Senha
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Informe seu e-mail para receber um link seguro de redefinição de acesso.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-zinc-800/80 rounded-3xl sm:px-10">
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-zinc-100">E-mail Enviado!</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Se o e-mail <strong>{email}</strong> estiver cadastrado em nossa base, enviamos um link seguro de recuperação.
                </p>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-left space-y-1">
                <p className="text-[11px] text-zinc-400">
                  • O link possui validade de <strong>1 hora</strong>.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • Caso não localize na Caixa de Entrada, verifique sua pasta de <strong>Spam</strong> ou <strong>Lixo Eletrônico</strong>.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  href="/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Voltar para o Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Seu E-mail Cadastrado
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

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Enviar Link de Recuperação</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-4 border-t border-zinc-800 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Lembrou sua senha? Fazer Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Processo seguro com link temporário de uso único</span>
        </div>
      </div>
    </div>
  );
}
