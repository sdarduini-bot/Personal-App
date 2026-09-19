"use client";

import React, { useState } from "react";
import { X, Copy, Check, ExternalLink, MessageCircle, Share2, Smartphone } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/formatters";

interface ShareWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout: {
    title: string;
    goal?: string | null;
    shareToken: string;
    student: {
      name: string;
      phone: string;
    };
    exercises?: Array<{
      name: string;
      sets: string;
      reps: string;
      load?: string | null;
    }>;
  };
}

export default function ShareWorkoutModal({
  isOpen,
  onClose,
  workout,
}: ShareWorkoutModalProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const publicUrl = `${origin}/treino/${workout.shareToken}`;

  // Montar texto amigável e bonito para o WhatsApp
  let exercisesSummary = "";
  if (workout.exercises && workout.exercises.length > 0) {
    exercisesSummary =
      "\n\n*Exercícios principais:*\n" +
      workout.exercises
        .map(
          (ex, idx) =>
            `${idx + 1}. *${ex.name}*: ${ex.sets} séries x ${ex.reps}${
              ex.load ? ` (${ex.load})` : ""
            }`
        )
        .join("\n");
  }

  const studentFirstName = workout.student.name.split(" ")[0];

  const fullMessage =
    `🏋️‍♂️ *SEU PLANO DE TREINO ESTÁ PRONTO!* 🏋️‍♂️\n\n` +
    `Olá, *${studentFirstName}*! Preparei seu treino com muito cuidado para buscarmos seus resultados:\n\n` +
    `📋 *${workout.title}*\n` +
    (workout.goal ? `🎯 *Foco:* ${workout.goal}\n` : "") +
    exercisesSummary +
    `\n\n📲 *Acesse sua ficha interativa no celular* (com cronômetro de descanso e marcação de séries):\n` +
    `${publicUrl}\n\n` +
    `Bora pra cima! Qualquer dúvida durante a execução me avise aqui. 💪🔥`;

  const waLink = buildWhatsAppLink(workout.student.phone, fullMessage);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(fullMessage);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-base">Enviar para o Aluno</h3>
              <p className="text-xs text-zinc-400">{workout.student.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Conteúdo Modal */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Card WhatsApp Principal */}
          <div className="bg-emerald-950/20 border border-emerald-800/30 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold">
              <MessageCircle className="w-5 h-5 text-emerald-400" />
              <span>Enviar Direto no WhatsApp</span>
            </div>
            <p className="text-xs text-zinc-300">
              Abre o WhatsApp do aluno com mensagem formatada e o link da ficha de treino pronta.
            </p>
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-zinc-950 font-bold text-sm rounded-xl transition shadow-lg shadow-emerald-600/20"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Abrir WhatsApp do Aluno</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>
          </div>

          {/* Link Público Exclusivo */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Smartphone className="w-4 h-4 text-emerald-400" />
              Link da Ficha Interativa (O aluno não precisa de login)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 font-mono focus:outline-none select-all truncate"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-xs font-medium text-zinc-200 rounded-xl transition flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Prévia da Mensagem */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400">
                Prévia do Texto para Compartilhar
              </label>
              <button
                type="button"
                onClick={handleCopyText}
                className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3 h-3" />
                    <span>Texto Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copiar Texto Completo</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-800/80 rounded-2xl p-3.5 text-xs text-zinc-300 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto leading-relaxed">
              {fullMessage}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 border-t border-zinc-800/80 bg-zinc-900/30 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 rounded-xl transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
