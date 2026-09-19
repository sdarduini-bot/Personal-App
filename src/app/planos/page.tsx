"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import ShareWorkoutModal from "@/components/ShareWorkoutModal";
import {
  Dumbbell,
  Plus,
  Users,
  Share2,
  ExternalLink,
  ChevronRight,
  Trash2,
  Clock,
  Flame,
  Search,
  Edit3,
  Copy,
} from "lucide-react";
import { formatDateShort } from "@/lib/formatters";
import { fetchWithCache, clearCache } from "@/lib/cache";

interface WorkoutPlanItem {
  id: string;
  studentId: string;
  title: string;
  goal: string | null;
  notes: string | null;
  shareToken: string;
  createdAt: string;
  student: {
    id: string;
    name: string;
    phone: string;
  };
  exercises: Array<{
    id: string;
    name: string;
    sets: string;
    reps: string;
    load: string | null;
    restSeconds: number;
    notes: string | null;
  }>;
}

function PlanosContent() {
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<WorkoutPlanItem[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Modal de compartilhamento
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutPlanItem | null>(null);

  const fetchPlans = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedStudentId !== "ALL") query.set("studentId", selectedStudentId);

      const url = `/api/workouts?${query.toString()}`;
      await fetchWithCache<WorkoutPlanItem[]>(url, (data) => {
        setPlans(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      await fetchWithCache<any[]>("/api/students", (data) => {
        if (Array.isArray(data)) setStudents(data);
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [selectedStudentId]);

  useEffect(() => {
    fetchStudents();
  }, []);

  const handleDeletePlan = async (id: string, title: string) => {
    if (!confirm(`Deseja realmente excluir o plano "${title}"?`)) return;
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      if (res.ok) {
        clearCache("/api/workouts");
        fetchPlans();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPlans = plans.filter((p) => {
    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(query) ||
      p.student.name.toLowerCase().includes(query) ||
      (p.goal && p.goal.toLowerCase().includes(query))
    );
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
      <Navigation />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header title="Planos de Treino" subtitle="Prescrição e envio de fichas para os alunos" />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Topo com Filtros e Botão Novo Treino */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              {/* Campo de Busca */}
              <div className="relative flex-1 min-w-[200px] max-w-xs">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar treino ou aluno..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Filtro por Aluno */}
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os alunos</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/planos/novo"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20 shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>Montar Novo Treino</span>
            </Link>
          </div>

          {/* Lista de Treinos */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs">Carregando planos de treino...</span>
            </div>
          ) : filteredPlans.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">
              <Dumbbell className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
              <h3 className="text-base font-bold text-zinc-200">Nenhum plano de treino encontrado</h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                Crie um plano com exercícios, séries e cargas para compartilhar com o aluno.
              </p>
              <Link
                href="/planos/novo"
                className="inline-block mt-4 px-4 py-2 bg-emerald-600 text-zinc-950 font-bold text-xs rounded-xl"
              >
                Criar Plano de Aula
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition space-y-4 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800/80">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Dumbbell className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-zinc-100 text-base">{plan.title}</h3>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-zinc-800 text-emerald-400 border border-zinc-700">
                            {plan.student.name}
                          </span>
                        </div>
                        {plan.goal && (
                          <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                            <Flame className="w-3.5 h-3.5 text-amber-400" />
                            {plan.goal}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Botões de Ação */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap justify-end">
                      <Link
                        href={`/planos/novo?edit=${plan.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs rounded-xl transition border border-zinc-700/60"
                        title="Editar este treino"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Editar</span>
                      </Link>

                      <Link
                        href={`/planos/novo?cloneFrom=${plan.id}`}
                        className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white font-medium text-xs rounded-xl transition border border-zinc-700/60"
                        title="Copiar treino para outro aluno ou usar como base"
                      >
                        <Copy className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Copiar p/ Outro</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => setSelectedWorkout(plan)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20 active:scale-95"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>Enviar</span>
                      </button>

                      <Link
                        href={`/treino/${plan.shareToken}`}
                        target="_blank"
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition"
                        title="Ver como o aluno visualiza"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDeletePlan(plan.id, plan.title)}
                        className="p-2 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition"
                        title="Excluir treino"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Lista de Exercícios */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {plan.exercises.map((ex, idx) => (
                      <div
                        key={ex.id}
                        className="p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-5 h-5 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[11px] shrink-0">
                            {idx + 1}
                          </span>
                          <span className="font-bold text-zinc-200 truncate">
                            {ex.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400 shrink-0">
                          <span>{ex.sets}x{ex.reps}</span>
                          {ex.load && <span className="text-emerald-400 font-semibold">{ex.load}</span>}
                          <span className="text-zinc-500">{ex.restSeconds}s</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {plan.notes && (
                    <p className="text-[11px] text-zinc-500 italic pt-1">
                      Instruções: {plan.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Modal de Compartilhamento WhatsApp e Link */}
          {selectedWorkout && (
            <ShareWorkoutModal
              isOpen={!!selectedWorkout}
              onClose={() => setSelectedWorkout(null)}
              workout={selectedWorkout}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-zinc-400">Carregando treinos...</div>}>
        <PlanosContent />
      </Suspense>
    </AuthGuard>
  );
}
