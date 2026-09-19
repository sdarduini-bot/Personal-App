"use client";

import React, { useState, useEffect } from "react";
import { X, Search, Dumbbell, Plus, Check } from "lucide-react";
import { EXERCISE_CATEGORIES } from "@/lib/exercises-seed";

interface ExerciseItem {
  id: string;
  name: string;
  category: string;
  muscleGroup?: string | null;
  isCustom?: boolean;
}

interface ExercisePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exerciseName: string) => void;
  currentSelected?: string;
}

export default function ExercisePickerModal({
  isOpen,
  onClose,
  onSelect,
  currentSelected = "",
}: ExercisePickerModalProps) {
  const [exercises, setExercises] = useState<ExerciseItem[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");
  const [loading, setLoading] = useState(false);
  const [isCreatingCustom, setIsCreatingCustom] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Peitoral");
  const [savingCustom, setSavingCustom] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    async function loadExercises() {
      setLoading(true);
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
        console.error("Erro ao carregar exercícios:", err);
      } finally {
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadExercises();
    }, 150);

    return () => clearTimeout(timer);
  }, [isOpen, selectedCategory, search]);

  if (!isOpen) return null;

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    setSavingCustom(true);
    try {
      const res = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: customName.trim(),
          category: customCategory,
        }),
      });

      if (res.ok) {
        const created = await res.json();
        onSelect(created.name);
        onClose();
      } else {
        alert("Erro ao cadastrar exercício");
      }
    } catch {
      alert("Erro de conexão ao salvar exercício");
    } finally {
      setSavingCustom(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-zinc-100 text-sm sm:text-base">
                Biblioteca de Exercícios
              </h3>
              <p className="text-xs text-zinc-400">
                Selecione um exercício por grupo muscular ou busque pelo nome
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Busca e Botão Criar */}
        <div className="p-4 border-b border-zinc-800/80 space-y-3 bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por exercício ou músculo (ex: supino, bíceps)..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCreatingCustom(!isCreatingCustom)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition shrink-0"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Personalizado</span>
            </button>
          </div>

          {/* Form inline de criação de exercício customizado */}
          {isCreatingCustom && (
            <form
              onSubmit={handleCreateCustom}
              className="p-3 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-2.5 animate-fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400">
                  Cadastrar Exercício Novo
                </span>
                <button
                  type="button"
                  onClick={() => setIsCreatingCustom(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs"
                >
                  Cancelar
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-7">
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Nome do exercício..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="sm:col-span-5 flex gap-2">
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                  >
                    {EXERCISE_CATEGORIES.filter((c) => c !== "Todos").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    disabled={savingCustom}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition shrink-0"
                  >
                    {savingCustom ? "..." : "Adicionar"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Categorias (Chips deslizáveis) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {EXERCISE_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-emerald-500 text-zinc-950 font-bold shadow-sm shadow-emerald-500/20"
                      : "bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Exercícios com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Carregando exercícios...
            </div>
          ) : exercises.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <p className="text-zinc-400 text-xs font-semibold">
                Nenhum exercício encontrado para "{search}".
              </p>
              <button
                type="button"
                onClick={() => {
                  setCustomName(search);
                  setIsCreatingCustom(true);
                }}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar "{search}" agora</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {exercises.map((ex) => {
                const isSelected =
                  currentSelected &&
                  currentSelected.toLowerCase() === ex.name.toLowerCase();

                return (
                  <button
                    key={ex.id}
                    type="button"
                    onClick={() => {
                      onSelect(ex.name);
                      onClose();
                    }}
                    className={`p-3 rounded-2xl border text-left transition flex items-center justify-between gap-2.5 group ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/30"
                        : "bg-zinc-950/70 border-zinc-800/80 hover:border-emerald-500/30 hover:bg-zinc-800/40"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-zinc-200 group-hover:text-emerald-400 transition truncate">
                          {ex.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-400 border border-zinc-800">
                          {ex.category}
                        </span>
                        {ex.muscleGroup && (
                          <span className="text-[10px] text-zinc-500 truncate">
                            {ex.muscleGroup}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-500 group-hover:bg-emerald-500 group-hover:text-zinc-950 transition shrink-0">
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
