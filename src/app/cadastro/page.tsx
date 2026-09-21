"use client";

import React from "react";
import Link from "next/link";
import {
  Dumbbell,
  ArrowRight,
  ShieldCheck,
  Lock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

export default function CadastroPage() {
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

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Acesso Fechado • Programa de Testes</span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-100">
          Personal Trainer Pro
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Plataforma de gestão de treinos, alunos e composição corporal com Pollock.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-zinc-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl border border-zinc-800/80 rounded-3xl sm:px-10 text-center space-y-5">
          <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 border border-zinc-700/80 flex items-center justify-center mx-auto text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-base font-bold text-zinc-100">
              Acesso Restrito aos Treinadores Convidados
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              As contas de acesso a este sistema são criadas e autorizadas diretamente pelo <strong>Administrador</strong> da plataforma.
            </p>
          </div>

          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-300 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Já recebeu suas credenciais?</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Se você é o Pedro ou um dos treinadores convidados, acesse utilizando seu e-mail e senha cadastrados ou o PIN de acesso.
            </p>
          </div>

          <Link
            href="/login"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-[0.98] text-zinc-950 font-bold text-sm shadow-lg shadow-emerald-500/25 transition flex items-center justify-center gap-2"
          >
            <span>Fazer Login no Painel</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="pt-2 text-[11px] text-zinc-500">
            Dúvidas ou solicitações de acesso devem ser tratadas diretamente com o Administrador.
          </div>
        </div>
      </div>
    </div>
  );
}
