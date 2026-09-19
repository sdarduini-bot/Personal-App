"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  Wallet,
  ChevronRight,
  Dumbbell,
  X,
  Target,
  FileText,
  Check,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  MessageCircle,
  Zap,
  Package,
} from "lucide-react";
import { formatCurrency, formatDateShort, buildWhatsAppLink } from "@/lib/formatters";
import { fetchWithCache, clearCache } from "@/lib/cache";

interface StudentItem {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  birthDate: string | null;
  goal: string;
  planName: string | null;
  billingType?: "MONTHLY" | "PER_CLASS" | "PACKAGE";
  frequency?: string | null;
  pricePerSession?: number | null;
  paymentTiming?: "PRE_CLASS" | "POST_CLASS" | null;
  packageTotalClasses?: number | null;
  packageRemainingClasses?: number | null;
  monthlyFee: number;
  dueDay: number;
  startDate: string;
  status: string;
  notes: string | null;
  payments?: Array<{
    id: string;
    status: string;
    dueDate: string;
    amount: number;
  }>;
  _count: {
    classes: number;
    workoutPlans: number;
    payments: number;
  };
}

const FREQUENCY_PRESETS = [
  { freq: "1x/sem", fee: "180", name: "Presencial 1x/sem" },
  { freq: "2x/sem", fee: "280", name: "Presencial 2x/sem" },
  { freq: "3x/sem", fee: "380", name: "Presencial 3x/sem" },
  { freq: "4x/sem", fee: "480", name: "Presencial 4x/sem" },
  { freq: "Diário", fee: "600", name: "Personal Diário" },
  { freq: "Consultoria", fee: "180", name: "Consultoria VIP" },
];

function AlunosContent() {
  const searchParams = useSearchParams();
  const [students, setStudents] = useState<StudentItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);

  // Modal de novo aluno
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formSaving, setFormSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    birthDate: "",
    goal: "Hipertrofia",
    billingType: "MONTHLY" as "MONTHLY" | "PER_CLASS" | "PACKAGE",
    frequency: "3x/sem",
    planName: "Presencial 3x/sem",
    monthlyFee: "380",
    dueDay: "10",
    pricePerSession: "90",
    paymentTiming: "POST_CLASS" as "PRE_CLASS" | "POST_CLASS",
    packageTotalClasses: "10",
    packageTotalValue: "800",
    startDate: new Date().toISOString().split("T")[0],
    notes: "",
    createInitialPayment: true,
  });

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const fetchStudents = async () => {
    try {
      const query = new URLSearchParams();
      if (search.trim()) query.set("search", search.trim());
      if (statusFilter !== "ALL") query.set("status", statusFilter);

      const url = `/api/students?${query.toString()}`;
      await fetchWithCache<StudentItem[]>(url, (data) => {
        setStudents(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [statusFilter]);

  // Se a URL tiver ?novo=true, abre o modal
  useEffect(() => {
    if (searchParams.get("novo") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert("Por favor preencha nome e telefone.");
      return;
    }

    setFormSaving(true);
    try {
      const payload = {
        ...formData,
        monthlyFee:
          formData.billingType === "PER_CLASS"
            ? 0
            : formData.billingType === "PACKAGE"
            ? parseFloat(formData.packageTotalValue) || 0
            : parseFloat(formData.monthlyFee) || 0,
        pricePerSession: parseFloat(formData.pricePerSession) || 0,
        dueDay: parseInt(formData.dueDay) || 10,
        packageTotalClasses:
          formData.billingType === "PACKAGE"
            ? parseInt(formData.packageTotalClasses) || 10
            : null,
      };

      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearCache("/api/students");
        clearCache("/api/payments");
        clearCache("/api/dashboard");
        setIsModalOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          birthDate: "",
          goal: "Hipertrofia",
          billingType: "MONTHLY",
          frequency: "3x/sem",
          planName: "Presencial 3x/sem",
          monthlyFee: "380",
          dueDay: "10",
          pricePerSession: "90",
          paymentTiming: "POST_CLASS",
          packageTotalClasses: "10",
          packageTotalValue: "800",
          startDate: new Date().toISOString().split("T")[0],
          notes: "",
          createInitialPayment: true,
        });
        fetchStudents();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar aluno");
      }
    } catch {
      alert("Erro ao conectar ao servidor");
    } finally {
      setFormSaving(false);
    }
  };

  const applyFrequencyPreset = (preset: typeof FREQUENCY_PRESETS[0]) => {
    setFormData((prev) => ({
      ...prev,
      frequency: preset.freq,
      planName: preset.name,
      monthlyFee: preset.fee,
    }));
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
      <Navigation />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header title="Alunos" subtitle="Gestão de alunos, planos contratados e fichas" />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
          {/* Topo com Busca e Botão Novo Aluno */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onBlur={fetchStudents}
                placeholder="Buscar aluno por nome..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500"
              />
            </form>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <div className="flex rounded-xl bg-zinc-900 border border-zinc-800 p-1">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "ALL" ? "bg-zinc-800 text-zinc-100 font-bold" : "text-zinc-400"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "ACTIVE" ? "bg-emerald-500/20 text-emerald-400 font-bold" : "text-zinc-400"
                  }`}
                >
                  Ativos
                </button>
                <button
                  onClick={() => setStatusFilter("INACTIVE")}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                    statusFilter === "INACTIVE" ? "bg-zinc-800 text-zinc-100 font-bold" : "text-zinc-400"
                  }`}
                >
                  Inativos
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="hidden sm:flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Aluno</span>
              </button>
            </div>
          </div>

          {/* Lista de Alunos com Status Financeiro Integrado */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs">Carregando lista de alunos...</span>
            </div>
          ) : students.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
              <Users className="w-12 h-12 mx-auto text-zinc-600" />
              <h3 className="text-base font-bold text-zinc-200">Nenhum aluno encontrado</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {search ? "Tente buscar por outro termo ou limpe o filtro." : "Comece cadastrando seu primeiro aluno."}
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="mt-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md transition"
              >
                Cadastrar Novo Aluno
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => {
                const currentMonthPayment = student.payments?.[0];
                const isPaid = currentMonthPayment?.status === "PAID";
                const isOverdue =
                  currentMonthPayment &&
                  currentMonthPayment.status !== "PAID" &&
                  currentMonthPayment.dueDate < todayStr;
                const isPending = currentMonthPayment?.status === "PENDING" && !isOverdue;

                return (
                  <Link
                    key={student.id}
                    href={`/alunos/${student.id}`}
                    className="p-5 rounded-3xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-emerald-500/30 transition flex flex-col justify-between group shadow-sm relative overflow-hidden"
                  >
                    <div>
                      {/* Topo do Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 font-bold text-lg group-hover:border-emerald-500/50 group-hover:text-emerald-400 transition shrink-0">
                            {student.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="font-bold text-zinc-100 text-sm group-hover:text-emerald-400 transition">
                              {student.name}
                            </h3>
                            <p className="text-[11px] text-zinc-400 flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-zinc-500" />
                              {student.phone}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            student.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {student.status === "ACTIVE" ? "Ativo" : "Inativo"}
                        </span>
                      </div>

                      {/* Tags de Objetivo e Plano */}
                      <div className="mt-4 pt-3 border-t border-zinc-800/60 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1.5">
                          <Target className="w-3 h-3 text-emerald-400" />
                          {student.goal}
                        </span>

                        {student.billingType === "PER_CLASS" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            Avulso • {student.paymentTiming === "PRE_CLASS" ? "Pré-treino" : "Pós-treino"}
                          </span>
                        ) : student.billingType === "PACKAGE" ? (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {student.planName || `Pacote ${student.packageTotalClasses || 10} aulas`}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-emerald-400" />
                            {student.frequency || student.planName || "Mensal"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rodapé do Card com Situação Financeira Integrada */}
                    <div className="mt-5 pt-3 border-t border-zinc-800/60 flex items-center justify-between">
                      <div>
                        {student.billingType === "PER_CLASS" ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-amber-400 font-mono">
                                {formatCurrency(student.pricePerSession || 90)}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium">/ treino</span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Zap className="w-3 h-3" />
                                {student.paymentTiming === "PRE_CLASS" ? "Paga antes de treinar" : "Paga após o treino"}
                              </span>
                            </div>
                          </>
                        ) : student.billingType === "PACKAGE" ? (
                          <>
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-black text-cyan-400 font-mono">
                                {formatCurrency(student.monthlyFee)}
                              </span>
                              <span className="text-[10px] text-zinc-500 font-medium">(pacote)</span>
                            </div>
                            <div className="mt-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                <Package className="w-3 h-3" />
                                {student.packageRemainingClasses ?? student.packageTotalClasses ?? 10} aulas restantes
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-emerald-400 font-mono">
                                {formatCurrency(student.monthlyFee)}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                (dia {student.dueDay})
                              </span>
                            </div>

                            {/* Badge Financeira do Mês Atual */}
                            <div className="mt-1 flex items-center gap-1">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Mensalidade Paga
                                </span>
                              ) : isOverdue ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
                                  <AlertCircle className="w-3 h-3" />
                                  Atrasado ({formatDateShort(currentMonthPayment.dueDate)})
                                </span>
                              ) : isPending ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <Clock className="w-3 h-3" />
                                  Vence {formatDateShort(currentMonthPayment.dueDate)}
                                </span>
                              ) : (
                                <span className="text-[10px] text-zinc-500">
                                  Sem cobrança no mês
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span title="Aulas" className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                          {student._count.classes}
                        </span>
                        <span title="Treinos" className="flex items-center gap-1">
                          <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                          {student._count.workoutPlans}
                        </span>
                        <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-emerald-400 transition" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* MODAL DE NOVO ALUNO COM CHIPS DE PLANOS                   */}
          {/* ========================================================= */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 shrink-0 bg-zinc-900">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-zinc-100 text-base">Cadastrar Novo Aluno</h3>
                  </div>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateStudent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                  <div className="p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                  {/* Dados Básicos */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Mariana Silva"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Telefone / WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="(11) 98765-4321"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        E-mail
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="aluno@email.com"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Objetivo Principal
                      </label>
                      <input
                        type="text"
                        value={formData.goal}
                        onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                        placeholder="Ex: Emagrecimento, Hipertrofia..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Data de Nascimento
                      </label>
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* ========================================================= */}
                  {/* SEÇÃO DO PLANO FINANCEIRO COM CONTROLE SEGMENTADO FLEXÍVEL */}
                  {/* ========================================================= */}
                  <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800/90 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5" />
                        Modelo de Cobrança & Plano
                      </span>
                      <span className="text-[10px] text-zinc-500">Selecione o formato:</span>
                    </div>

                    {/* Segmented Control 3 Formatos */}
                    <div className="grid grid-cols-3 gap-1.5 p-1 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            billingType: "MONTHLY",
                            planName: prev.planName && prev.planName !== "Treino Avulso" ? prev.planName : "Presencial 3x/sem",
                          }))
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          formData.billingType === "MONTHLY"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Mensal</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            billingType: "PER_CLASS",
                            planName: "Treino Avulso",
                          }))
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          formData.billingType === "PER_CLASS"
                            ? "bg-amber-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>P/ Treino</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            billingType: "PACKAGE",
                            planName: `Pacote ${prev.packageTotalClasses || 10} Aulas`,
                          }))
                        }
                        className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          formData.billingType === "PACKAGE"
                            ? "bg-cyan-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Package className="w-3.5 h-3.5" />
                        <span>Pacote</span>
                      </button>
                    </div>

                    {/* CONTEÚDO CONDICIONAL DO TIPO DE PLANO */}

                    {/* 1. MENSALIDADE COM CHIPS DE FREQUÊNCIA */}
                    {formData.billingType === "MONTHLY" && (
                      <div className="space-y-3 pt-1">
                        <div>
                          <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                            Frequência Semanal Sugerida:
                          </span>
                          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                            {FREQUENCY_PRESETS.map((preset) => {
                              const isSelected = formData.frequency === preset.freq;
                              return (
                                <button
                                  key={preset.freq}
                                  type="button"
                                  onClick={() => applyFrequencyPreset(preset)}
                                  className={`px-2 py-1.5 rounded-xl text-xs font-semibold transition border text-center ${
                                    isSelected
                                      ? "bg-emerald-500 text-zinc-950 font-bold border-emerald-400 shadow-sm"
                                      : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:border-zinc-700"
                                  }`}
                                >
                                  {preset.freq}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Nome do Plano
                            </label>
                            <input
                              type="text"
                              value={formData.planName}
                              onChange={(e) => setFormData({ ...formData, planName: e.target.value })}
                              placeholder="Ex: Presencial 3x/sem"
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Valor Mensal (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.monthlyFee}
                              onChange={(e) => setFormData({ ...formData, monthlyFee: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Dia Vencimento
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formData.dueDay}
                              onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 2. AVULSO / POR TREINO */}
                    {formData.billingType === "PER_CLASS" && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Valor por Treino (R$) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.pricePerSession}
                              onChange={(e) => setFormData({ ...formData, pricePerSession: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Momento do Pagamento
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentTiming: "POST_CLASS" })}
                                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center min-h-[44px] flex items-center justify-center ${
                                  formData.paymentTiming === "POST_CLASS"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                Após Treino
                              </button>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, paymentTiming: "PRE_CLASS" })}
                                className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center min-h-[44px] flex items-center justify-center ${
                                  formData.paymentTiming === "PRE_CLASS"
                                    ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                    : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                }`}
                              >
                                Antes do Treino
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-300 flex items-center gap-2">
                          <Zap className="w-4 h-4 shrink-0 text-amber-400" />
                          <span>
                            Este aluno não receberá faturas mensais automáticas. As cobranças ocorrem por treino realizado ou agendado.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 3. PACOTE DE AULAS */}
                    {formData.billingType === "PACKAGE" && (
                      <div className="space-y-3 pt-1">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Total de Aulas
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={formData.packageTotalClasses}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  packageTotalClasses: e.target.value,
                                  planName: `Pacote ${e.target.value || 10} Aulas`,
                                })
                              }
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Valor do Pacote (R$)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={formData.packageTotalValue}
                              onChange={(e) => setFormData({ ...formData, packageTotalValue: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                              Dia Vencimento
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              value={formData.dueDay}
                              onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                            />
                          </div>
                        </div>

                        {formData.packageTotalClasses && formData.packageTotalValue && (
                          <div className="text-[11px] text-cyan-400 font-mono">
                            ≈ {formatCurrency((parseFloat(formData.packageTotalValue) || 0) / (parseInt(formData.packageTotalClasses) || 1))} por aula
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Observações / Anamnese / Lesões
                    </label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: Histórico de lesão no joelho, restrições médicas, metas específicas..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-base sm:text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Switch para gerar cobrança inicial no Financeiro */}
                  <label className="flex items-center gap-3 p-3.5 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer hover:border-zinc-700 transition">
                    <input
                      type="checkbox"
                      checked={formData.createInitialPayment}
                      onChange={(e) => setFormData({ ...formData, createInitialPayment: e.target.checked })}
                      className="w-5 h-5 accent-emerald-500 rounded"
                    />
                    <div>
                      <span className="text-xs font-bold text-zinc-200 block">
                        {formData.billingType === "PER_CLASS"
                          ? "Lançar cobrança do 1º treino avulso agora"
                          : formData.billingType === "PACKAGE"
                          ? "Lançar fatura do pacote agora no Financeiro"
                          : "Lançar 1ª mensalidade agora no Financeiro"}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        {formData.billingType === "PER_CLASS"
                          ? `Gera cobrança avulsa de ${formatCurrency(parseFloat(formData.pricePerSession) || 0)}.`
                          : formData.billingType === "PACKAGE"
                          ? `Gera fatura do pacote no valor de ${formatCurrency(parseFloat(formData.packageTotalValue) || 0)}.`
                          : `Gera automaticamente uma fatura de ${formatCurrency(parseFloat(formData.monthlyFee) || 0)} para o mês atual.`}
                      </span>
                    </div>
                  </label>
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-zinc-900 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 min-h-[44px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={formSaving}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md transition min-h-[44px]"
                  >
                    {formSaving ? "Cadastrando..." : "Cadastrar Aluno"}
                  </button>
                </div>
              </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* BOTÃO FLUTUANTE (FAB) NO MOBILE                            */}
          {/* ========================================================= */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="fixed bottom-24 right-5 md:hidden z-40 w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition"
            title="Cadastrar Novo Aluno"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </main>
      </div>
    </div>
  );
}

export default function AlunosPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-zinc-400">Carregando alunos...</div>}>
        <AlunosContent />
      </Suspense>
    </AuthGuard>
  );
}
