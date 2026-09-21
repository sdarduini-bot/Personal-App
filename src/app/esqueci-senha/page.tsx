"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Dumbbell,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  ShieldCheck,
  CheckCircle2,
  Smartphone,
  ExternalLink,
  MessageCircle,
} from "lucide-react";
import { formatPhone } from "@/lib/formatters";

interface ResetResult {
  trainerName: string;
  email: string;
  hasWhatsApp: boolean;
  phone: string;
  maskedPhone: string;
  resetUrl: string;
}

export default function EsqueciSenhaPage() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResetResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [error, setError] = useState("");

  const handleInputChange = (val: string) => {
    // Se começar com número ou parênteses, formata como celular
    if (/^[\d(]/.test(val)) {
      setIdentifier(formatPhone(val));
    } else {
      setIdentifier(val);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Informe seu e-mail ou WhatsApp cadastrado.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setResult(data);
      } else {
        setError(
          data.error ||
            "Não localizamos sua conta. Verifique o e-mail ou WhatsApp informado."
        );
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
          Informe seu e-mail ou WhatsApp para receber o link de acesso imediato.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-zinc-800/80 rounded-3xl sm:px-10">
          {result ? (
            <div className="space-y-4 py-1">
              <div className="w-14 h-14 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-400">
                {result.hasWhatsApp ? (
                  <MessageCircle className="w-7 h-7" />
                ) : (
                  <CheckCircle2 className="w-7 h-7" />
                )}
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-zinc-100">
                  Conta Localizada com Sucesso!
                </h3>
                <p className="text-xs text-zinc-300">
                  Olá, <strong>{result.trainerName}</strong>!
                </p>
                {result.hasWhatsApp && (
                  <p className="text-xs text-emerald-400 font-medium">
                    WhatsApp vinculado: {result.maskedPhone}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-zinc-800">
                {/* 1. Botão Principal: Abrir no WhatsApp */}
                {result.hasWhatsApp && (
                  <a
                    href={(() => {
                      const msg = encodeURIComponent(
                        `Olá ${result.trainerName}! Aqui está o seu link seguro para redefinir sua senha no Trainer Pro (válido por 1 hora):\n\n${result.resetUrl}\n\nSe você não solicitou, desconsidere esta mensagem.`
                      );
                      return `https://api.whatsapp.com/send?phone=${result.phone}&text=${msg}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Abrir Link no WhatsApp</span>
                  </a>
                )}

                {/* 2. Botão Secundário: Redefinir Agora no Navegador */}
                <Link
                  href={result.resetUrl}
                  className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4 text-zinc-400" />
                  <span>Redefinir Senha Agora</span>
                </Link>

                {/* 3. Copiar Link */}
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.resetUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-medium transition flex items-center justify-center gap-2 border border-zinc-800"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400">Link Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-zinc-400" />
                      <span>Copiar Link de Recuperação</span>
                    </>
                  )}
                </button>
              </div>

              <div className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-3 text-left space-y-1">
                <p className="text-[11px] text-zinc-400">
                  • O link é exclusivo para você e expira em <strong>1 hora</strong>.
                </p>
                <p className="text-[11px] text-zinc-400">
                  • Ao salvar sua nova senha, seu acesso é liberado imediatamente.
                </p>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para o Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Seu E-mail ou WhatsApp Cadastrado
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="ex: pedro@personal.com ou (11) 99999-8888"
                    value={identifier}
                    onChange={(e) => handleInputChange(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-zinc-950/70 border border-zinc-800 rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
                <p className="text-[11px] text-zinc-500 mt-1.5">
                  Localizamos seu cadastro por e-mail ou pelo celular informado no convite.
                </p>
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
                    <Share2 className="w-4 h-4" />
                    <span>Recuperar Senha no WhatsApp</span>
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
          <span>Recuperação segura com link temporário de uso único</span>
        </div>
      </div>
    </div>
  );
}
