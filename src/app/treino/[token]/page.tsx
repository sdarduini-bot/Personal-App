"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RestTimer from "@/components/RestTimer";
import confetti from "canvas-confetti";
import {
  Dumbbell,
  CheckCircle2,
  Clock,
  Flame,
  MessageCircle,
  Sparkles,
  Trophy,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Zap,
} from "lucide-react";
import { buildWhatsAppLink } from "@/lib/formatters";

interface PublicWorkoutData {
  plan: {
    id: string;
    title: string;
    goal: string | null;
    notes: string | null;
    student: {
      id: string;
      name: string;
      goal: string;
    };
    exercises: Array<{
      id: string;
      order: number;
      name: string;
      sets: string;
      reps: string;
      load: string | null;
      restSeconds: number;
      notes: string | null;
    }>;
  };
  trainer: {
    name: string;
    phone: string | null;
    bio: string | null;
  };
}

export default function PublicWorkoutPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PublicWorkoutData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Estado para armazenar séries concluídas pelo aluno no celular:
  // { [exerciseId]: number } -> quantas séries foram feitas
  const [completedSets, setCompletedSets] = useState<Record<string, number>>({});
  const [activeTimerSeconds, setActiveTimerSeconds] = useState<number | null>(null);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [workoutFinished, setWorkoutFinished] = useState(false);

  useEffect(() => {
    async function fetchPublicWorkout() {
      try {
        const res = await fetch(`/api/public/workout/${token}`);
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else {
          setError("Plano de treino não encontrado ou link expirado.");
        }
      } catch {
        setError("Erro ao carregar treino. Verifique sua conexão.");
      } finally {
        setLoading(false);
      }
    }
    fetchPublicWorkout();
  }, [token]);

  // Alternar conclusão de uma série específica
  const handleToggleSet = (exerciseId: string, setIndex: number, restSecs: number) => {
    const currentCompleted = completedSets[exerciseId] || 0;
    const newCount = setIndex + 1 === currentCompleted ? setIndex : setIndex + 1;

    setCompletedSets((prev) => ({
      ...prev,
      [exerciseId]: newCount,
    }));

    // Se acabou de marcar uma nova série, dispara o descanso se o timer estiver configurado
    if (newCount > currentCompleted) {
      setActiveTimerSeconds(restSecs);
      setShowTimerModal(true);
    }
  };

  // Disparar descanso manualmente
  const handleStartRest = (secs: number) => {
    setActiveTimerSeconds(secs);
    setShowTimerModal(true);
  };

  // Calcular progresso geral do treino
  let totalSetsTarget = 0;
  let totalSetsDone = 0;

  if (data?.plan?.exercises) {
    data.plan.exercises.forEach((ex) => {
      const setsCount = parseInt(ex.sets) || 3;
      totalSetsTarget += setsCount;
      totalSetsDone += Math.min(completedSets[ex.id] || 0, setsCount);
    });
  }

  const progressPercent = totalSetsTarget > 0 ? Math.round((totalSetsDone / totalSetsTarget) * 100) : 0;

  // Finalizar treino com confetes
  const handleFinishWorkout = () => {
    setWorkoutFinished(true);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#10b981", "#34d399", "#4ade80", "#22c55e", "#ffffff"],
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-zinc-400">
        <div className="w-10 h-10 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <span className="text-sm font-semibold">Carregando seu plano de treino...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-4">
          <Dumbbell className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-zinc-200">Ops! Treino não disponível</h2>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm">{error}</p>
      </div>
    );
  }

  const studentFirstName = data.plan.student.name.split(" ")[0];

  const waTrainerLink = data.trainer.phone
    ? buildWhatsAppLink(
        data.trainer.phone,
        `Olá, Pedro! Estou fazendo o treino "${data.plan.title}" e tenho uma dúvida.`
      )
    : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-24 selection:bg-emerald-500/30">
      {/* 1. HEADER DO TREINO DO ALUNO */}
      <header
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 0.875rem)" }}
        className="sticky top-0 z-30 bg-zinc-950/90 backdrop-blur-xl border-b border-zinc-800/80 px-4 pb-3"
      >
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20">
              <div className="w-full h-full bg-zinc-900 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Dumbbell className="w-5 h-5" />
              </div>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 font-bold tracking-wider uppercase block">
                {data.trainer.name}
              </span>
              <h1 className="text-xs font-bold text-zinc-200">Ficha de Treino Personalizada</h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveTimerSeconds(60);
              setShowTimerModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-emerald-400 transition active:scale-95"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Descanso</span>
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-5">
        {/* BANNER DO TREINO */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Treino de Hoje
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              Aluno(a): <strong className="text-zinc-200">{studentFirstName}</strong>
            </span>
          </div>

          <h2 className="text-xl font-black text-zinc-100 tracking-tight leading-snug">
            {data.plan.title}
          </h2>

          {data.plan.goal && (
            <p className="text-xs text-zinc-300 flex items-center gap-1.5 font-medium">
              <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{data.plan.goal}</span>
            </p>
          )}

          {data.plan.notes && (
            <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800/80 text-[11px] text-zinc-400 leading-relaxed">
              <strong className="text-zinc-300 block mb-0.5">Orientações do Personal:</strong>
              {data.plan.notes}
            </div>
          )}

          {/* BARRA DE PROGRESSO DO TREINO */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span className="text-zinc-400">Progresso do Treino</span>
              <span className="text-emerald-400 font-mono">{progressPercent}% Concluído</span>
            </div>
            <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* MENSAGEM DE PARABÉNS SE FINALIZADO */}
        {workoutFinished && (
          <div className="p-5 rounded-3xl bg-emerald-950/30 border border-emerald-800/50 text-center space-y-2 animate-fade-in shadow-xl shadow-emerald-900/20">
            <Trophy className="w-10 h-10 text-emerald-400 mx-auto animate-bounce" />
            <h3 className="text-base font-black text-emerald-300 tracking-tight">
              Treino Concluído com Sucesso!
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Excelente trabalho, {studentFirstName}! Mais um treino pago na conta do seu resultado. Descanse e hidrate-se bem! 💪🔥
            </p>
          </div>
        )}

        {/* LISTA DE EXERCÍCIOS INTERATIVOS */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              Exercícios ({data.plan.exercises.length})
            </span>
            <span className="text-[11px] text-zinc-500">Marque as séries realizadas</span>
          </div>

          {data.plan.exercises.map((ex, idx) => {
            const setsCount = parseInt(ex.sets) || 3;
            const doneCount = completedSets[ex.id] || 0;
            const isAllDone = doneCount >= setsCount;

            return (
              <div
                key={ex.id}
                className={`p-4 rounded-3xl border transition-all ${
                  isAllDone
                    ? "bg-zinc-900/40 border-emerald-500/30 shadow-sm"
                    : "bg-zinc-900/90 border-zinc-800/90 shadow-md"
                }`}
              >
                {/* Header do Exercício */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2.5">
                    <span className="w-6 h-6 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-100 leading-snug">
                        {ex.name}
                      </h4>
                      {ex.notes && (
                        <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          {ex.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleStartRest(ex.restSeconds)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs font-mono hover:text-emerald-400 hover:border-emerald-500/40 transition shrink-0 min-h-[38px]"
                    title="Iniciar cronômetro para este exercício"
                  >
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{ex.restSeconds}s</span>
                  </button>
                </div>

                {/* Métricas do Exercício (Séries x Repetições e Carga) */}
                <div className="flex items-center gap-2 mb-3 px-1 text-xs">
                  <span className="px-2.5 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 font-mono text-zinc-300">
                    <strong className="text-emerald-400">{ex.sets}</strong> séries de{" "}
                    <strong className="text-emerald-400">{ex.reps}</strong> reps
                  </span>

                  {ex.load && (
                    <span className="px-2.5 py-1.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 font-mono text-emerald-300 font-bold">
                      {ex.load}
                    </span>
                  )}
                </div>

                {/* Botões de Checkbox de Séries */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-800/60">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mr-1">
                    Séries:
                  </span>
                  {Array.from({ length: setsCount }).map((_, sIdx) => {
                    const isCompleted = doneCount > sIdx;
                    return (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => handleToggleSet(ex.id, sIdx, ex.restSeconds)}
                        className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold font-mono transition flex items-center justify-center gap-1.5 active:scale-95 ${
                          isCompleted
                            ? "bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-black"
                            : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        {isCompleted && <CheckCircle2 className="w-4 h-4 fill-current" />}
                        <span>Série {sIdx + 1}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* BOTÃO CONCLUIR TREINO */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleFinishWorkout}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 active:scale-[0.98] text-zinc-950 font-black text-sm transition shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5 fill-current" />
            <span>Concluir Treino de Hoje!</span>
          </button>
        </div>

        {/* CONTATO DIRETO COM O PERSONAL */}
        {waTrainerLink && (
          <div className="pt-2 text-center">
            <a
              href={waTrainerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-emerald-400 transition"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Dúvida na execução? Falar com {data.trainer.name.split(" ")[0]}</span>
            </a>
          </div>
        )}
      </main>

      {/* MODAL DO CRONÔMETRO DE DESCANSO */}
      {showTimerModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-5 shadow-2xl space-y-4">
            <RestTimer
              initialSeconds={activeTimerSeconds || 60}
              autoStart={true}
              onFinished={() => {}}
            />

            <button
              type="button"
              onClick={() => setShowTimerModal(false)}
              className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-200 transition"
            >
              Fechar Cronômetro
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
