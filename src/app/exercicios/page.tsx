"use client";

import React, { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Dumbbell,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import { EXERCISE_CATEGORIES } from "@/lib/exercises-seed";

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  muscleGroup?: string | null;
  isCustom?: boolean;
}

export default function ExerciciosPage() {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  // Estado para edição de nome
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Estado para cadastro de novo
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Peitoral");
  const [newMuscle, setNewMuscle] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  const fetchExercises = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedCategory !== "Todos") query.set("category", selectedCategory);
      if (search.trim()) query.set("search", search.trim());

      const res = await fetch(`/api/exercises?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setExercises(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExercises();
    }, 150);
    return () => clearTimeout(timer);
  }, [selectedCategory, search]);

  const handleStartEdit = (ex: ExerciseItem) => {
    setEditingId(ex.id);
    setEditName(ex.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/exercises/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim() }),
      });

      if (res.ok) {
        setExercises((prev) =>
          prev.map((e) => (e.id === id ? { ...e, name: editName.trim() } : e))
        );
        setEditingId(null);
      } else {
        alert("Erro ao salvar nome do exercício");
      }
    } catch {
      alert("Erro de conexão ao salvar");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Deseja remover "${name}" da biblioteca?`)) return;
    try {
      const res = await fetch(`/api/exercises/${id}`, { method: "DELETE" });
      if (res.ok) {
        setExercises((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert("Erro ao excluir exercício");
      }
    } catch {
      alert("Erro de conexão");
    }
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setSavingNew(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          category: newCategory,
          muscleGroup: newMuscle.trim() || undefined,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setExercises((prev) => [created, ...prev]);
        setIsAddModalOpen(false);
        setNewName("");
        setNewMuscle("");
      } else {
        alert("Erro ao cadastrar exercício");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSavingNew(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
        <Navigation />

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <Header
            title="Catálogo de Exercícios"
            subtitle="Biblioteca completa com 120+ exercícios para prescrição de treinos"
          />

          <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* Barra Superior de Ações */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar exercício ou músculo (ex: supino, bíceps)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20 shrink-0 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Exercício</span>
              </button>
            </div>

            {/* Filtro por Categoria (Chips) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
              {EXERCISE_CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition min-h-[38px] ${
                      active
                        ? "bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-500/20"
                        : "bg-zinc-900/90 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Contador de Exercícios */}
            <div className="flex items-center justify-between text-xs text-zinc-400 px-1">
              <span>
                Mostrando <strong className="text-zinc-200">{exercises.length}</strong> exercícios
                {selectedCategory !== "Todos" ? ` em ${selectedCategory}` : ""}
              </span>
              <span className="text-[11px] text-zinc-500">
                Clique no ícone de lápis para editar o nome de qualquer exercício
              </span>
            </div>

            {/* Grade de Exercícios */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">Carregando catálogo...</span>
              </div>
            ) : exercises.length === 0 ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400">
                <Dumbbell className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
                <h3 className="text-base font-bold text-zinc-200">Nenhum exercício encontrado</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  Tente alterar os termos de busca ou selecione outra categoria.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {exercises.map((ex) => {
                  const isEditing = editingId === ex.id;

                  return (
                    <div
                      key={ex.id}
                      className="p-4 rounded-3xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700/80 transition space-y-3 flex flex-col justify-between"
                    >
                      {/* Modo de Edição Inline */}
                      {isEditing ? (
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-emerald-400 block">
                            Editar Nome do Exercício
                          </label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-zinc-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveEdit(ex.id);
                              if (e.key === "Escape") handleCancelEdit();
                            }}
                          />
                          <div className="flex items-center gap-2 justify-end pt-1">
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 text-xs text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSaveEdit(ex.id)}
                              disabled={savingEdit}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-lg flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{savingEdit ? "Salvando..." : "Salvar"}</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <h4 className="font-bold text-zinc-100 text-sm leading-snug">
                              {ex.name}
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/60">
                                {ex.category}
                              </span>
                              {ex.muscleGroup && (
                                <span className="text-[11px] text-zinc-500">
                                  • {ex.muscleGroup}
                                </span>
                              )}
                              {ex.isCustom && (
                                <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                                  <Sparkles className="w-3 h-3" />
                                  Personalizado
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Ações: Editar Nome e Excluir */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(ex)}
                              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-xl transition"
                              title="Editar nome deste exercício"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(ex.id, ex.name)}
                              className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-xl transition"
                              title="Excluir exercício"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </main>
        </div>

        {/* Modal de Cadastro de Novo Exercício */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-100 text-base">Novo Exercício</h3>
                    <p className="text-xs text-zinc-400">Adicionar à sua biblioteca pessoal</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateNew} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Nome do Exercício *
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Supino Inclinado com Pegada Neutra"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Grupo Muscular Principal *
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {EXERCISE_CATEGORIES.filter((c) => c !== "Todos").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-zinc-300 block mb-1.5">
                    Músculo ou Foco Específico (Opcional)
                  </label>
                  <input
                    type="text"
                    value={newMuscle}
                    onChange={(e) => setNewMuscle(e.target.value)}
                    placeholder="Ex: Peitoral Superior, Deltóide Posterior"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingNew}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
                  >
                    {savingNew ? "Salvando..." : "Cadastrar Exercício"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
