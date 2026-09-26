"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Dumbbell,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Clock,
  Sparkles,
  HelpCircle,
  Copy,
  Edit3,
  BookOpen,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { fetchWithCache, clearCache } from "@/lib/cache";
import ExercisePickerModal from "@/components/ExercisePickerModal";
import { type NoteBlock, parseNotes, serializeNotes, createNoteBlock } from "@/lib/workout-notes";

interface ExerciseRow {
  id: string;
  name: string;
  sets: string;
  reps: string;
  load: string;
  restSeconds: number;
  notes: string;
}

function NovoPlanoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStudentId = searchParams.get("studentId") || "";
  const editId = searchParams.get("edit");
  const cloneFromId = searchParams.get("cloneFrom");

  const isEditMode = Boolean(editId);
  const isCloneMode = Boolean(cloneFromId);

  const [students, setStudents] = useState<Array<{ id: string; name: string; goal: string }>>([]);
  const [studentId, setStudentId] = useState(preselectedStudentId);
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const initialBlock = createNoteBlock();
  const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>([initialBlock]);
  const [openBlockId, setOpenBlockId] = useState<string | null>(initialBlock.id);
  const [sourcePlanTitle, setSourcePlanTitle] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(Boolean(editId || cloneFromId));
  const [pickerExerciseIndex, setPickerExerciseIndex] = useState<number | null>(null);

  const [exercises, setExercises] = useState<ExerciseRow[]>([]);

  // Carregar dados de treino existente para Edição ou Clonagem
  useEffect(() => {
    const targetId = editId || cloneFromId;
    if (!targetId) return;

    async function loadWorkoutToEditOrClone() {
      try {
        const res = await fetch(`/api/workouts/${targetId}`);
        if (res.ok) {
          const data = await res.json();
          setSourcePlanTitle(data.title);

          if (isEditMode) {
            setStudentId(data.studentId);
            setTitle(data.title || "");
            setGoal(data.goal || "");
            const parsed = parseNotes(data.notes);
            const blocks = parsed.length > 0 ? parsed : [createNoteBlock()];
            setNoteBlocks(blocks);
            setOpenBlockId(blocks[0].id);
          } else if (isCloneMode) {
            if (preselectedStudentId) {
              setStudentId(preselectedStudentId);
            }
            setTitle(data.title ? `${data.title} (Cópia)` : "");
            setGoal(data.goal || "");
            const parsed = parseNotes(data.notes);
            const blocks = parsed.length > 0 ? parsed.map(b => ({ ...b, id: createNoteBlock().id })) : [createNoteBlock()];
            setNoteBlocks(blocks);
            setOpenBlockId(blocks[0].id);
          }

          if (Array.isArray(data.exercises) && data.exercises.length > 0) {
            setExercises(
              data.exercises.map((ex: any, idx: number) => ({
                id: `ex_${idx + 1}_${Date.now()}`,
                name: ex.name,
                sets: String(ex.sets || "3"),
                reps: String(ex.reps || "10-12"),
                load: ex.load || "",
                restSeconds: ex.restSeconds || 60,
                notes: ex.notes || "",
              }))
            );
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados do treino:", err);
      } finally {
        setLoadingExisting(false);
      }
    }
    loadWorkoutToEditOrClone();
  }, [editId, cloneFromId, isEditMode, isCloneMode, preselectedStudentId]);

  // Carregar lista de alunos
  useEffect(() => {
    async function loadStudents() {
      try {
        await fetchWithCache<any[]>("/api/students", (data) => {
          if (Array.isArray(data)) {
            setStudents(data);
            if (!studentId && !editId && data.length > 0) {
              setStudentId(data[0].id);
              if (!goal) setGoal(data[0].goal || "");
            } else if (studentId && !goal) {
              const found = data.find((s) => s.id === studentId);
              if (found) setGoal(found.goal || "");
            }
          }
        });
      } catch (err) {
        console.error(err);
      }
    }
    loadStudents();
  }, [studentId, editId, goal]);

  const addExercise = () => {
    setExercises([
      ...exercises,
      {
        id: `ex_${Date.now()}`,
        name: "",
        sets: "3",
        reps: "10-12",
        load: "",
        restSeconds: 60,
        notes: "",
      },
    ]);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, idx) => idx !== index));
  };

  const updateExercise = (index: number, field: keyof ExerciseRow, value: any) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], [field]: value };
    setExercises(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId) {
      alert("Selecione um aluno.");
      return;
    }
    if (!title.trim()) {
      alert("Dê um título ao plano (ex: Treino A - Superiores).");
      return;
    }
    if (exercises.length > 0 && exercises.some((ex) => !ex.name.trim())) {
      alert("Preencha o nome de todos os exercícios ou remova os vazios.");
      return;
    }

    setSaving(true);
    try {
      const endpoint = isEditMode && editId ? `/api/workouts/${editId}` : "/api/workouts";
      const method = isEditMode && editId ? "PUT" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          title,
          goal,
          notes: serializeNotes(noteBlocks),
          exercises,
        }),
      });

      if (res.ok) {
        clearCache("/api/workouts");
        clearCache("/api/dashboard");
        router.push("/planos");
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar plano");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
      <Navigation />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header
          title={isEditMode ? "Editar Plano de Treino" : isCloneMode ? "Copiar Treino p/ Novo Aluno" : "Novo Plano de Treino"}
          subtitle={
            isEditMode
              ? "Ajustar exercícios, séries, cargas e descanso da ficha existente"
              : isCloneMode
              ? "Personalizar cargas e repetições para o novo aluno com base em ficha existente"
              : "Prescrever exercícios com séries, cargas e descanso"
          }
        />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
          <Link
            href="/planos"
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para Planos</span>
          </Link>

          {/* Banner de Contexto: Edição ou Clonagem */}
          {isEditMode && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 animate-fade-in">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-amber-300 block">Modo de Edição de Treino</span>
                <p className="text-zinc-300 mt-0.5">
                  Você está alterando os exercícios, cargas ou orientações de uma ficha já existente.
                </p>
              </div>
            </div>
          )}

          {isCloneMode && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 animate-fade-in">
              <Copy className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-xs">
                <span className="font-bold text-emerald-300 block">
                  Criando Nova Ficha com Base em &quot;{sourcePlanTitle || "Treino Existente"}&quot;
                </span>
                <p className="text-zinc-300 mt-0.5">
                  Selecione o novo aluno e ajuste repetições/cargas conforme necessário. O treino original permanecerá intacto.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações Gerais do Treino */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-4">
              <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-emerald-400" />
                Dados do Treino
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Aluno Destinatário *
                  </label>
                  <select
                    required
                    value={studentId}
                    onChange={(e) => {
                      setStudentId(e.target.value);
                      const st = students.find((s) => s.id === e.target.value);
                      if (st && !goal) setGoal(st.goal);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">Selecione o aluno...</option>
                    {students.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.name} ({st.goal})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Título do Treino *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Treino A - Peito, Tríceps e Ombro"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1">
                    Objetivo do Treino
                  </label>
                  <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Ex: Hipertrofia com foco em carga progressiva"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Orientações por Dia/Bloco */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-4 sm:p-6 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-emerald-400" />
                    Orientações por Dia / Bloco
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Organize por dia ou treino — ex: &ldquo;Segunda — Empurrada&rdquo;, &ldquo;Treino A&rdquo;.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newBlock = createNoteBlock();
                    setNoteBlocks((prev) => [...prev, newBlock]);
                    setOpenBlockId(newBlock.id);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Novo Bloco</span>
                </button>
              </div>

              {noteBlocks.length === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    const newBlock = createNoteBlock();
                    setNoteBlocks([newBlock]);
                    setOpenBlockId(newBlock.id);
                  }}
                  className="w-full py-5 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/5 text-zinc-500 hover:text-emerald-400 text-xs font-semibold transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar primeiro bloco de orientações
                </button>
              ) : (
                <div className="space-y-2">
                  {noteBlocks.map((block) => {
                    const isOpen = openBlockId === block.id;
                    return (
                      <div key={block.id} className={`border rounded-2xl overflow-hidden transition-all ${isOpen ? "border-emerald-500/30 bg-zinc-950/60" : "border-zinc-800 bg-zinc-950/30"}`}>
                        {/* Cabeçalho clicável */}
                        <div className="flex items-center gap-2 px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => setOpenBlockId(isOpen ? null : block.id)}
                            className="flex items-center gap-2 flex-1 text-left min-w-0"
                          >
                            {isOpen
                              ? <ChevronDown className="w-4 h-4 text-emerald-400 shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-zinc-500 shrink-0" />
                            }
                            <input
                              type="text"
                              value={block.title}
                              onChange={(e) => {
                                e.stopPropagation();
                                setNoteBlocks((prev) =>
                                  prev.map((b) => b.id === block.id ? { ...b, title: e.target.value } : b)
                                );
                              }}
                              onClick={(e) => e.stopPropagation()}
                              placeholder="Ex: Segunda — Empurrada"
                              className={`flex-1 bg-transparent text-xs font-semibold focus:outline-none placeholder:text-zinc-600 min-w-0 ${isOpen ? "text-emerald-300" : "text-zinc-300"}`}
                            />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (noteBlocks.length === 1) {
                                setNoteBlocks([createNoteBlock()]);
                                return;
                              }
                              setNoteBlocks((prev) => prev.filter((b) => b.id !== block.id));
                              if (openBlockId === block.id) setOpenBlockId(null);
                            }}
                            className="text-zinc-600 hover:text-rose-400 p-1 transition shrink-0"
                            title="Remover bloco"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Corpo (visível quando aberto) */}
                        {isOpen && (
                          <div className="px-3 pb-3 border-t border-zinc-800/60">
                            <textarea
                              value={block.content}
                              onChange={(e) =>
                                setNoteBlocks((prev) =>
                                  prev.map((b) => b.id === block.id ? { ...b, content: e.target.value } : b)
                                )
                              }
                              placeholder={"Ex: Aquecimento: 5 min esteira + mobilidade\nForça: Supino 4x8-10\nWOD: 3 rounds — 15 cal bike, 12 dips, 10 push-up"}
                              rows={4}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed placeholder:text-zinc-600 mt-2.5"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Construtor Dinâmico de Exercícios */}
            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                    Lista de Exercícios
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Defina ordem, séries, repetições, carga e tempo de descanso.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addExercise}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Adicionar Exercício</span>
                </button>
              </div>

              {/* Lista interativa */}
              <div className="space-y-4">
                {exercises.map((ex, idx) => (
                  <div
                    key={ex.id}
                    className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/90 space-y-3 relative group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 font-mono">
                        Exercício #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExercise(idx)}
                        className="text-zinc-500 hover:text-rose-400 p-1 transition"
                        title="Remover exercício"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                      {/* Nome do exercício com botão da Biblioteca e digitação livre */}
                      <div className="sm:col-span-6">
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-semibold text-zinc-400">
                            Nome do Exercício *
                          </label>
                          <button
                            type="button"
                            onClick={() => setPickerExerciseIndex(idx)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition px-2 py-0.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20"
                            title="Buscar na biblioteca de 120+ exercícios"
                          >
                            <BookOpen className="w-3 h-3" />
                            <span>Biblioteca</span>
                          </button>
                        </div>
                        <input
                          type="text"
                          required
                          value={ex.name}
                          onChange={(e) => updateExercise(idx, "name", e.target.value)}
                          placeholder="Digite ou escolha da biblioteca..."
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Séries */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                          Séries
                        </label>
                        <input
                          type="text"
                          value={ex.sets}
                          onChange={(e) => updateExercise(idx, "sets", e.target.value)}
                          placeholder="Ex: 4"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Repetições */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                          Repetições
                        </label>
                        <input
                          type="text"
                          value={ex.reps}
                          onChange={(e) => updateExercise(idx, "reps", e.target.value)}
                          placeholder="Ex: 10-12"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {/* Carga */}
                      <div className="sm:col-span-2">
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                          Carga / Peso
                        </label>
                        <input
                          type="text"
                          value={ex.load}
                          onChange={(e) => updateExercise(idx, "load", e.target.value)}
                          placeholder="Ex: 20kg"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
                      {/* Tempo de Descanso */}
                      <div className="sm:col-span-4">
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-emerald-400" />
                          Descanso (segundos)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="15"
                            max="300"
                            step="15"
                            value={ex.restSeconds}
                            onChange={(e) => updateExercise(idx, "restSeconds", parseInt(e.target.value) || 60)}
                            className="w-28 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                          />
                          <span className="text-xs text-zinc-500">segundos</span>
                        </div>
                      </div>

                      {/* Instruções / Notas de execução */}
                      <div className="sm:col-span-8">
                        <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                          Dicas de Execução / Técnica
                        </label>
                        <input
                          type="text"
                          value={ex.notes}
                          onChange={(e) => updateExercise(idx, "notes", e.target.value)}
                          placeholder="Ex: Cadência controlada, foco na amplitude máxima"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {exercises.length === 0 && (
                <div className="py-6 text-center text-zinc-600 text-xs border-2 border-dashed border-zinc-800 rounded-2xl">
                  <Dumbbell className="w-6 h-6 mx-auto mb-2 text-zinc-700" />
                  Nenhum exercício adicionado — este plano é só de orientações.
                </div>
              )}

              <button
                type="button"
                onClick={addExercise}
                className="w-full py-3 rounded-2xl border-2 border-dashed border-zinc-800 hover:border-emerald-500/50 hover:bg-emerald-500/5 text-zinc-400 hover:text-emerald-400 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{exercises.length === 0 ? "Adicionar Exercício" : "Adicionar Mais um Exercício"}</span>
              </button>
            </div>

            {/* Modal de Escolha de Exercício da Biblioteca */}
            <ExercisePickerModal
              isOpen={pickerExerciseIndex !== null}
              onClose={() => setPickerExerciseIndex(null)}
              currentSelected={
                pickerExerciseIndex !== null ? exercises[pickerExerciseIndex]?.name : ""
              }
              onSelect={(chosenName) => {
                if (pickerExerciseIndex !== null) {
                  updateExercise(pickerExerciseIndex, "name", chosenName);
                }
              }}
            />

            {/* Botão de Salvar Treino */}
            <div className="flex items-center justify-end gap-3 pt-4">
              <Link
                href="/planos"
                className="px-5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-xs font-semibold text-zinc-300"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-600/20"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? "Salvando..."
                    : isEditMode
                    ? "Salvar Alterações do Treino"
                    : isCloneMode
                    ? "Salvar como Nova Ficha"
                    : "Salvar Plano de Treino"}
                </span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}

export default function NovoPlanoPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-zinc-400">Carregando formulário...</div>}>
        <NovoPlanoContent />
      </Suspense>
    </AuthGuard>
  );
}
