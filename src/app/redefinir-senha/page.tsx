"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Dumbbell,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useTrainer } from "@/contexts/TrainerContext";

function RedefinirSenhaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const { refreshTrainer } = useTrainer();

  const [checking, setChecking] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [trainerInfo, setTrainerInfo] = useState<{ name?: string; email?: string; type?: string }>({});

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setChecking(false);
      setTokenValid(false);
      setTokenError("Link incompleto ou inválido. Nenhum token foi detectado.");
      return;
    }

    const validate = async () => {
      try {
        const res = await fetch(`/api/auth/reset-password?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setTokenValid(true);
          setTrainerInfo({ name: data.name, email: data.email, type: data.type });
        } else {
          setTokenValid(false);
          setTokenError(data.error || "Este link de acesso expirou ou já foi utilizado.");
        }
      } catch {
        setTokenValid(false);
        setTokenError("Erro ao validar link de acesso. Verifique sua conexão.");
      } finally {
        setChecking(false);
      }
    };

    validate();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!password || password.length < 4) {
      setFormError("A senha deve ter no mínimo 4 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("A confirmação da senha não confere.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        await refreshTrainer();
        setTimeout(() => {
          router.push("/");
        }, 1500);
      } else {
        setFormError(data.error || "Erro ao atualizar senha.");
        setLoading(false);
      }
    } catch {
      setFormError("Falha de comunicação com o servidor.");
      setLoading(false);
    }
  };

  const isInvite = trainerInfo.type === "INVITE" || searchParams.get("type") === "invite";

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
          {isInvite ? "Bem-vindo ao Personal Pro" : "Redefinir Senha"}
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          {isInvite
            ? `Olá, ${trainerInfo.name || "Treinador"}! Cadastre sua senha pessoal para começar.`
            : `Defina sua nova senha de acesso para a conta ${trainerInfo.email || ""}.`}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-zinc-800/80 rounded-3xl sm:px-10">
          {checking ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-zinc-400">Validando link seguro...</span>
            </div>
          ) : !tokenValid ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-800/60 flex items-center justify-center mx-auto text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-zinc-100">Link Não Disponível</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">{tokenError}</p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link
                  href="/esqueci-senha"
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <span>Solicitar Novo Link de Acesso</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/login"
                  className="w-full py-2 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition flex items-center justify-center"
                >
                  Ir para Tela de Login
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center space-y-3 py-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-zinc-100">Senha Cadastrada!</h3>
              <p className="text-xs text-zinc-400">
                Sua credencial foi atualizada com sucesso. Entrando no painel...
              </p>
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mt-2" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nova Senha */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  {isInvite ? "Crie sua Senha de Acesso" : "Nova Senha"}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Mínimo 4 caracteres"
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

              {/* Confirmar Senha */}
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                  Confirmar a Senha
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Repita a mesma senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                    <span>{isInvite ? "Concluir Cadastro & Entrar" : "Salvar Nova Senha"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500/80" />
          <span>Criptografia Scrypt e link de sessão com assinatura digital</span>
        </div>
      </div>
    </div>
  );
}

export default function RedefinirSenhaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">Carregando...</div>}>
      <RedefinirSenhaContent />
    </Suspense>
  );
}
