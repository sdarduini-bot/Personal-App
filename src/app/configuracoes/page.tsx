"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  Sparkles,
  Palette,
  Flame,
  Zap,
  Users,
  UserPlus,
  UserCheck,
  UserX,
  KeyRound,
  RefreshCw,
  Plus,
  X,
  Copy,
  Share2,
} from "lucide-react";

import { useTrainer } from "@/contexts/TrainerContext";

interface AdminTrainerItem {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    students: number;
    classes: number;
  };
}

function ConfiguracoesContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "acessos" ? "acessos" : "perfil";

  const { theme, setTheme } = useTheme();
  const { trainer, isAdmin, refreshTrainer } = useTrainer();

  const [activeTab, setActiveTab] = useState<"perfil" | "acessos">(initialTab);

  // Form Perfil
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

  // Gestão de Acessos (Admin)
  const [trainersList, setTrainersList] = useState<AdminTrainerItem[]>([]);
  const [loadingTrainers, setLoadingTrainers] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTrainerForm, setNewTrainerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [savingNewTrainer, setSavingNewTrainer] = useState(false);
  const [adminActionError, setAdminActionError] = useState("");
  const [adminActionSuccess, setAdminActionSuccess] = useState("");

  // Modal de Redefinir Senha
  const [resetModalTrainer, setResetModalTrainer] = useState<AdminTrainerItem | null>(null);
  const [resetPasswordVal, setResetPasswordVal] = useState("");
  const [savingReset, setSavingReset] = useState(false);

  // Modal de Link de Convite Gerado
  const [inviteResult, setInviteResult] = useState<{
    name: string;
    email: string;
    inviteUrl: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const fetchTrainers = async () => {
    if (!isAdmin) return;
    setLoadingTrainers(true);
    try {
      const res = await fetch("/api/admin/trainers");
      if (res.ok) {
        const data = await res.json();
        setTrainersList(data);
      }
    } catch (err) {
      console.error("Erro ao buscar treinadores:", err);
    } finally {
      setLoadingTrainers(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === "acessos") {
      fetchTrainers();
    }
  }, [isAdmin, activeTab]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    if (form.newPin) {
      if (form.newPin.length < 4) {
        setErrorMessage("A senha/PIN deve conter pelo menos 4 caracteres.");
        return;
      }
      if (form.newPin !== form.confirmPin) {
        setErrorMessage("A confirmação da nova senha/PIN não confere.");
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
        await refreshTrainer();
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

  const handleToggleTrainerActive = async (targetTrainer: AdminTrainerItem) => {
    setAdminActionError("");
    setAdminActionSuccess("");
    try {
      const res = await fetch("/api/admin/trainers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: targetTrainer.id,
          isActive: !targetTrainer.isActive,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminActionSuccess(
          `Acesso de ${targetTrainer.name} ${!targetTrainer.isActive ? "ativado" : "bloqueado"} com sucesso!`
        );
        fetchTrainers();
        setTimeout(() => setAdminActionSuccess(""), 4000);
      } else {
        setAdminActionError(data.error || "Erro ao alterar status.");
      }
    } catch {
      setAdminActionError("Erro de comunicação com o servidor.");
    }
  };

  const handleCreateTrainer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrainerForm.name.trim() || !newTrainerForm.email.trim()) {
      setAdminActionError("Informe o nome e o e-mail do treinador.");
      return;
    }

    setSavingNewTrainer(true);
    setAdminActionError("");
    setAdminActionSuccess("");

    try {
      const res = await fetch("/api/admin/trainers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrainerForm),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminActionSuccess(`Treinador "${newTrainerForm.name}" cadastrado com sucesso!`);
        setShowAddModal(false);
        if (data.inviteUrl) {
          setInviteResult({
            name: newTrainerForm.name,
            email: newTrainerForm.email,
            inviteUrl: data.inviteUrl,
          });
          setCopiedLink(false);
        }
        setNewTrainerForm({ name: "", email: "", phone: "", password: "" });
        fetchTrainers();
        setTimeout(() => setAdminActionSuccess(""), 4000);
      } else {
        setAdminActionError(data.error || "Erro ao cadastrar treinador.");
      }
    } catch {
      setAdminActionError("Falha de conexão com o servidor.");
    } finally {
      setSavingNewTrainer(false);
    }
  };

  const handleGetInviteLink = async (targetTrainer: AdminTrainerItem) => {
    setAdminActionError("");
    try {
      const res = await fetch("/api/admin/trainers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: targetTrainer.id,
          action: "get_invite_link",
        }),
      });
      const data = await res.json();
      if (res.ok && data.inviteUrl) {
        setInviteResult({
          name: targetTrainer.name,
          email: targetTrainer.email,
          inviteUrl: data.inviteUrl,
        });
        setCopiedLink(false);
      } else {
        setAdminActionError(data.error || "Erro ao gerar link de convite.");
      }
    } catch {
      setAdminActionError("Erro de comunicação com o servidor.");
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalTrainer || !resetPasswordVal.trim() || resetPasswordVal.length < 4) {
      setAdminActionError("A nova senha deve ter no mínimo 4 caracteres.");
      return;
    }

    setSavingReset(true);
    setAdminActionError("");
    setAdminActionSuccess("");

    try {
      const res = await fetch("/api/admin/trainers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trainerId: resetModalTrainer.id,
          newPassword: resetPasswordVal.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAdminActionSuccess(`Senha de ${resetModalTrainer.name} redefinida com sucesso!`);
        setResetModalTrainer(null);
        setResetPasswordVal("");
        setTimeout(() => setAdminActionSuccess(""), 4000);
      } else {
        setAdminActionError(data.error || "Erro ao redefinir senha.");
      }
    } catch {
      setAdminActionError("Erro de comunicação ao redefinir senha.");
    } finally {
      setSavingReset(false);
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
          <Header
            title="Configurações"
            subtitle={isAdmin ? "Gestão de Usuários, Perfil e Sistema" : "Perfil do Treinador e Visual"}
          />

          <main className="flex-1 p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6">
            {/* Mensagens de Sucesso / Erro Gerais */}
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

            {/* Alternador de Abas (se for Admin) */}
            {isAdmin && (
              <div className="flex p-1.5 rounded-2xl bg-zinc-900 border border-zinc-800">
                <button
                  type="button"
                  onClick={() => setActiveTab("perfil")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === "perfil"
                      ? "bg-zinc-800 text-zinc-100 shadow-sm"
                      : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Meu Perfil & Cores</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("acessos")}
                  className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    activeTab === "acessos"
                      ? "bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-sm"
                      : "text-amber-400/80 hover:text-amber-300"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Gestão de Acessos & Treinadores ({trainersList.length || 1})</span>
                </button>
              </div>
            )}

            {/* ABA 1: MEU PERFIL & VISUAL */}
            {activeTab === "perfil" && (
              <>
                {loading ? (
                  <div className="py-20 text-center text-zinc-500 text-xs">Carregando...</div>
                ) : (
                  <form onSubmit={handleSave} className="space-y-6">
                    {/* Seletor de Paleta */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                        <Palette className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="font-bold text-zinc-100 text-base">
                            Identidade Visual & Paleta de Cores
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Personalize a aparência do aplicativo para seu dispositivo.
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
                                    <span className="font-semibold text-xs text-zinc-200">
                                      {t.name}
                                    </span>
                                  </div>
                                  <Icon className="w-4 h-4 text-zinc-400" />
                                </div>
                                <p className="text-[11px] text-zinc-400 leading-relaxed">
                                  {t.description}
                                </p>
                              </div>

                              <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                                <span className="text-[10px] font-medium text-zinc-500">
                                  {isSelected ? "Ativo" : "Selecionar"}
                                </span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dados Pessoais */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                        <User className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="font-bold text-zinc-100 text-base">
                            Dados de Apresentação
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Exibidos no topo do aplicativo e na ficha de treino dos alunos.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            Nome
                          </label>
                          <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Pedro Personal"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            WhatsApp / Celular
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
                            Chave PIX (para cobranças)
                          </label>
                          <input
                            type="text"
                            value={form.pixKey}
                            onChange={(e) => setForm({ ...form, pixKey: e.target.value })}
                            placeholder="Seu e-mail, CPF ou celular"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            Especialidade / Bio
                          </label>
                          <input
                            type="text"
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Ex: Especialista em hipertrofia"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Segurança / Senha */}
                    <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-4">
                      <div className="flex items-center gap-2.5 pb-2 border-b border-zinc-800">
                        <Lock className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h3 className="font-bold text-zinc-100 text-base">
                            Segurança & Alteração de Senha/PIN
                          </h3>
                          <p className="text-xs text-zinc-400">
                            Altere a sua senha de acesso ou PIN mestre quando desejar.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            Nova Senha / PIN
                          </label>
                          <input
                            type="password"
                            value={form.newPin}
                            onChange={(e) => setForm({ ...form, newPin: e.target.value })}
                            placeholder="Deixe em branco se não quiser alterar"
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">
                            Confirmar Nova Senha / PIN
                          </label>
                          <input
                            type="password"
                            value={form.confirmPin}
                            onChange={(e) => setForm({ ...form, confirmPin: e.target.value })}
                            placeholder="Repita a nova senha"
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
              </>
            )}

            {/* ABA 2: GESTÃO DE ACESSOS (EXCLUSIVA ADMIN) */}
            {isAdmin && activeTab === "acessos" && (
              <div className="space-y-6">
                {adminActionSuccess && (
                  <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{adminActionSuccess}</span>
                  </div>
                )}

                {adminActionError && (
                  <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{adminActionError}</span>
                  </div>
                )}

                {/* Cabeçalho da Gestão com Botão de Novo Treinador */}
                <div className="bg-gradient-to-r from-amber-950/30 via-zinc-900/80 to-zinc-900/80 border border-amber-800/40 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-zinc-100 text-base">
                        Controle de Acessos & Treinadores
                      </h3>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1">
                      Gerencie quem tem autorização para utilizar o aplicativo e acompanhe a quantidade de alunos de cada um.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Cadastrar Novo Treinador</span>
                  </button>
                </div>

                {/* Lista de Treinadores */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-xs font-semibold text-zinc-400">
                      Treinadores Cadastrados ({trainersList.length})
                    </span>
                    <button
                      type="button"
                      onClick={fetchTrainers}
                      className="text-xs text-zinc-400 hover:text-zinc-200 flex items-center gap-1 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Atualizar</span>
                    </button>
                  </div>

                  {loadingTrainers ? (
                    <div className="py-12 text-center text-xs text-zinc-500">
                      Carregando treinadores...
                    </div>
                  ) : trainersList.length === 0 ? (
                    <div className="py-12 text-center text-xs text-zinc-500 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
                      Nenhum outro treinador cadastrado ainda.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {trainersList.map((t) => (
                        <div
                          key={t.id}
                          className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:border-zinc-700"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-sm text-zinc-100">{t.name}</h4>
                              {t.role === "ADMIN" ? (
                                <span className="px-2 py-0.5 rounded-md bg-amber-950/80 border border-amber-700/60 text-amber-400 text-[10px] font-bold">
                                  Administrador Mestre
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-[10px] font-semibold">
                                  Personal Trainer
                                </span>
                              )}

                              <span
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                  t.isActive
                                    ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                                    : "bg-rose-900/30 text-rose-400 border border-rose-800/40"
                                }`}
                              >
                                {t.isActive ? "Acesso Ativo" : "Bloqueado"}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-400 flex items-center gap-3">
                              <span>E-mail: <strong className="text-zinc-300">{t.email}</strong></span>
                              {t.phone && <span>Tel: {t.phone}</span>}
                            </p>

                            <p className="text-[11px] text-zinc-500 pt-0.5">
                              {t._count.students} alunos cadastrados • {t._count.classes} aulas agendadas
                            </p>
                          </div>

                          {/* Ações do Treinador */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center flex-wrap sm:flex-nowrap">
                            <button
                              type="button"
                              onClick={() => handleGetInviteLink(t)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-medium transition flex items-center gap-1.5"
                              title="Gerar / Copiar Link de Convite"
                            >
                              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Link de Convite</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setResetModalTrainer(t);
                                setResetPasswordVal("");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition flex items-center gap-1.5"
                              title="Redefinir senha de acesso"
                            >
                              <KeyRound className="w-3.5 h-3.5 text-zinc-400" />
                              <span>Redefinir Senha</span>
                            </button>

                            {t.role !== "ADMIN" && (
                              <button
                                type="button"
                                onClick={() => handleToggleTrainerActive(t)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                                  t.isActive
                                    ? "bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 text-rose-300"
                                    : "bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 text-emerald-300"
                                }`}
                              >
                                {t.isActive ? (
                                  <>
                                    <UserX className="w-3.5 h-3.5 text-rose-400" />
                                    <span>Bloquear</span>
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                                    <span>Ativar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* MODAL: CADASTRAR NOVO TREINADOR */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-zinc-100 text-base">Novo Treinador de Teste</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTrainer} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Carlos Eduardo"
                  value={newTrainerForm.name}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, name: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  E-mail de Login
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@email.com"
                  value={newTrainerForm.email}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, email: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  WhatsApp (opcional)
                </label>
                <input
                  type="tel"
                  placeholder="(11) 98888-7777"
                  value={newTrainerForm.phone}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, phone: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-zinc-300 block mb-1">
                  Senha Provisória (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Deixe em branco para convite por link (Recomendado)"
                  value={newTrainerForm.password}
                  onChange={(e) =>
                    setNewTrainerForm({ ...newTrainerForm, password: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
                <p className="text-[10px] text-zinc-500 mt-1">
                  Se em branco, um link de convite seguro (válido por 48h) será gerado para o treinador cadastrar a própria senha.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingNewTrainer}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingNewTrainer ? "Cadastrando..." : "Cadastrar Treinador"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REDEFINIR SENHA */}
      {resetModalTrainer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-zinc-100 text-sm">Redefinir Senha</h3>
              </div>
              <button
                type="button"
                onClick={() => setResetModalTrainer(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Defina a nova senha de acesso para{" "}
              <strong className="text-zinc-200">{resetModalTrainer.name}</strong>:
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5">
              <div>
                <input
                  type="text"
                  required
                  placeholder="Digite a nova senha"
                  value={resetPasswordVal}
                  onChange={(e) => setResetPasswordVal(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setResetModalTrainer(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingReset}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingReset ? "Salvando..." : "Salvar Nova Senha"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK DE CONVITE GERADO */}
      {inviteResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-zinc-100 text-base">Link de Convite Criado</h3>
              </div>
              <button
                type="button"
                onClick={() => setInviteResult(null)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-zinc-300 leading-relaxed">
                O link para <strong className="text-white">{inviteResult.name}</strong> ({inviteResult.email}) cadastrar a própria senha está pronto e é válido por <strong>48 horas</strong>:
              </p>

              <div className="p-3 bg-zinc-950 border border-zinc-800 rounded-xl">
                <p className="text-xs text-zinc-400 font-mono break-all select-all">
                  {inviteResult.inviteUrl}
                </p>
              </div>

              <p className="text-[11px] text-zinc-500">
                Se o serviço de e-mail estiver configurado, a mensagem já foi enviada. Você também pode enviar o link diretamente pelo WhatsApp agora:
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(inviteResult.inviteUrl);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2500);
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-semibold transition flex items-center justify-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-zinc-400" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Olá ${inviteResult.name}! Aqui está o seu link de acesso ao Personal App para você definir sua senha (válido por 48h):\n\n${inviteResult.inviteUrl}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar no WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </AuthGuard>
  );
}

export default function ConfiguracoesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950 flex items-center justify-center text-xs text-zinc-500">Carregando...</div>}>
      <ConfiguracoesContent />
    </Suspense>
  );
}
