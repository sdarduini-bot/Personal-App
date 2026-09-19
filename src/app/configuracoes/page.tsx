"use client";

import React, { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import { useTheme, AppTheme } from "@/components/ThemeProvider";
import {
  Settings,
  User,
  Phone,
  QrCode,
  Lock,
  Save,
  Check,
  ShieldCheck,
  Dumbbell,
  Sparkles,
  Palette,
  Flame,
  Zap,
} from "lucide-react";

export default function ConfiguracoesPage() {
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    pixKey: "",
    bio: "",
    newPin: "",
    confirmPin: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setForm((prev) => ({
          ...prev,
          name: data.name || "",
          phone: data.phone || "",
          pixKey: data.pixKey || "",
          bio: data.bio || "",
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (form.newPin) {
      if (form.newPin.length < 4) {
        setErrorMessage("O PIN deve conter pelo menos 4 dígitos.");
        return;
      }
      if (form.newPin !== form.confirmPin) {
        setErrorMessage("A confirmação do novo PIN não confere.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          themePreference: theme,
        }),
      });

      if (res.ok) {
        setSuccessMessage("Configurações atualizadas com sucesso!");
        setForm((prev) => ({ ...prev, newPin: "", confirmPin: "" }));
        setTimeout(() => setSuccessMessage(""), 4000);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || "Erro ao salvar.");
      }
    } catch {
      setErrorMessage("Erro ao conectar ao servidor.");
    } finally {
      setSaving(false);
    }
  };

  const themesList: Array<{
    id: AppTheme;
    name: string;
    description: string;
    accentColor: string;
    secondaryColor: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      id: "emerald",
      name: "Emerald Health",
      description: "Verde Esmeralda e Grafite. Vitalidade, saúde e equilíbrio esportivo.",
      accentColor: "#10b981",
      secondaryColor: "#34d399",
      icon: Sparkles,
    },
    {
      id: "cyan",
      name: "Cyber Athletic",
      description: "Ciano Elétrico e Slate. Alta precisão, foco e tecnologia esportiva.",
      accentColor: "#06b6d4",
      secondaryColor: "#22d3ee",
      icon: Zap,
    },
    {
      id: "solar",
      name: "Solar Volt",
      description: "Laranja Vulcânico e Ônix. Intensidade, energia e queima calórica.",
      accentColor: "#f97316",
      secondaryColor: "#fb923c",
      icon: Flame,
    },
  ];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-20 md:pb-8">
        <Navigation />

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <Header title="Configurações" subtitle="Perfil do Treinador, Paleta de Cores e Segurança" />

          <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6">
            {successMessage && (
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center text-zinc-500 text-xs">Carregando...</div>
            ) : (
              <form onSubmit={handleSave} className="space-y-6">
                {/* 1. SELETOR DE PALETAS DE CORES (BRAINSTORMING) */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                    <Palette className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100 text-base">
                        Identidade Visual & Paleta de Cores
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Escolha a paleta do aplicativo. A alteração é instantânea no seu celular e nas fichas dos alunos.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {themesList.map((t) => {
                      const isSelected = theme === t.id;
                      const Icon = t.icon;

                      return (
                        <div
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`p-4 rounded-2xl border transition cursor-pointer flex flex-col justify-between gap-3 ${
                            isSelected
                              ? "bg-zinc-950 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500"
                              : "bg-zinc-950/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-950"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-4 h-4 rounded-full shadow-sm"
                                  style={{ backgroundColor: t.accentColor }}
                                />
                                <div
                                  className="w-3 h-3 rounded-full opacity-80"
                                  style={{ backgroundColor: t.secondaryColor }}
                                />
                              </div>
                              {isSelected && (
                                <span className="w-5 h-5 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center text-[10px] font-bold">
                                  ✓
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-sm text-zinc-100 flex items-center gap-1.5">
                              <Icon className="w-4 h-4 text-emerald-400" />
                              {t.name}
                            </h4>

                            <p className="text-[11px] text-zinc-400 leading-relaxed">
                              {t.description}
                            </p>
                          </div>

                          <div className="pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[10px] font-semibold text-zinc-500">
                            <span>{isSelected ? "Ativo" : "Clique para ativar"}</span>
                            <span
                              className="font-mono text-[9px] px-1.5 py-0.5 rounded uppercase"
                              style={{ color: t.accentColor }}
                            >
                              {t.id}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. PERFIL DO PERSONAL TRAINER */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                    <User className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-zinc-100 text-base">
                      Perfil do Personal Trainer
                    </h3>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Seu Nome Profissional
                    </label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ex: Pedro Personal Trainer"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Seu WhatsApp de Contato
                      </label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="(11) 99999-8888"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Chave PIX (Para Cobranças)
                      </label>
                      <input
                        type="text"
                        value={form.pixKey}
                        onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                        placeholder="Ex: pedro@pix.com.br ou CPF"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Bio / CREF / Especialidades
                    </label>
                    <textarea
                      rows={2}
                      value={form.bio}
                      onChange={(e) => setForm({ ...form, bio: e.target.value })}
                      placeholder="Ex: CREF 123456-G/SP. Especialista em hipertrofia e emagrecimento."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* 3. SEGURANÇA E PIN MESTRE */}
                <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                    <Lock className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h3 className="font-bold text-zinc-100 text-base">
                        Segurança & PIN de Acesso
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Código de desbloqueio para acesso exclusivo no celular.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Novo PIN Mestre (4 a 6 dígitos)
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={form.newPin}
                        onChange={(e) => setForm({ ...form, newPin: e.target.value })}
                        placeholder="Deixe em branco se não quiser alterar"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Confirmar Novo PIN
                      </label>
                      <input
                        type="password"
                        maxLength={6}
                        value={form.confirmPin}
                        onChange={(e) => setForm({ ...form, confirmPin: e.target.value })}
                        placeholder="Repita o novo PIN"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-lg shadow-emerald-600/20"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
                  </button>
                </div>
              </form>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
