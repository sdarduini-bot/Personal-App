"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Wallet,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Plus,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  X,
  Trash2,
  Search,
  Copy,
  QrCode,
  ExternalLink,
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  buildWhatsAppLink,
} from "@/lib/formatters";
import { fetchWithCache, clearCache } from "@/lib/cache";

interface PaymentItem {
  id: string;
  studentId: string;
  amount: number;
  referenceMonth: string;
  dueDate: string;
  paidAt: string | null;
  status: string;
  calculatedStatus: string;
  paymentMethod: string | null;
  notes: string | null;
  student: {
    id: string;
    name: string;
    phone: string;
    monthlyFee: number;
    dueDay: number;
  };
}

interface FinancialSummary {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  totalOverdue: number;
}

function FinanceiroContent() {
  const searchParams = useSearchParams();

  // Mês de referência atual (ex: "09/2026")
  const now = new Date();
  const currentMonthInitial = `${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
  const [selectedMonth, setSelectedMonth] = useState(currentMonthInitial);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<FinancialSummary>({
    totalBilled: 0,
    totalPaid: 0,
    totalPending: 0,
    totalOverdue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [trainerPixKey, setTrainerPixKey] = useState("pedro@personalfit.com");

  // Lista de alunos para o modal de nova cobrança
  const [studentsList, setStudentsList] = useState<Array<{ id: string; name: string; monthlyFee: number; dueDay: number }>>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalForm, setModalForm] = useState({
    studentId: "",
    amount: "",
    dueDate: "",
    referenceMonth: selectedMonth,
    paymentMethod: "PIX",
    notes: "",
  });

  const fetchPayments = async () => {
    try {
      const query = new URLSearchParams();
      if (selectedMonth) query.set("month", selectedMonth);

      const url = `/api/payments?${query.toString()}`;
      await fetchWithCache<{ payments: PaymentItem[]; summary: FinancialSummary }>(url, (data) => {
        setPayments(data.payments || []);
        setSummary(data.summary || { totalBilled: 0, totalPaid: 0, totalPending: 0, totalOverdue: 0 });
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
        if (Array.isArray(data)) {
          setStudentsList(data);
          if (data.length > 0 && !modalForm.studentId) {
            setModalForm((prev) => ({
              ...prev,
              studentId: data[0].id,
              amount: String(data[0].monthlyFee),
              dueDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(data[0].dueDay).padStart(2, "0")}`,
            }));
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSettings = async () => {
    try {
      await fetchWithCache<{ pixKey?: string }>("/api/settings", (data) => {
        if (data?.pixKey) setTrainerPixKey(data.pixKey);
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchStudents();
    fetchSettings();
  }, [selectedMonth]);

  useEffect(() => {
    if (searchParams.get("novo") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Navegar meses
  const changeMonth = (direction: number) => {
    const [m, y] = selectedMonth.split("/").map(Number);
    let newDate = new Date(y, m - 1 + direction, 1);
    const newMonthStr = `${String(newDate.getMonth() + 1).padStart(2, "0")}/${newDate.getFullYear()}`;
    setSelectedMonth(newMonthStr);
  };

  // Alternar status do pagamento com 1 clique
  const handleTogglePayment = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/toggle`, { method: "POST" });
      if (res.ok) {
        clearCache("/api/payments");
        clearCache("/api/dashboard");
        await fetchPayments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Excluir cobrança
  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm("Deseja realmente remover esta cobrança?")) return;
    try {
      const res = await fetch(`/api/payments/${paymentId}`, { method: "DELETE" });
      if (res.ok) {
        clearCache("/api/payments");
        clearCache("/api/dashboard");
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Gerar mensalidades automáticas para o mês selecionado
  const handleAutoGenerateMonth = async () => {
    if (!confirm(`Gerar mensalidades de todos os alunos ativos para a referência ${selectedMonth}?`)) {
      return;
    }
    setGenerating(true);
    try {
      const res = await fetch("/api/payments/generate-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referenceMonth: selectedMonth }),
      });
      const data = await res.json();
      clearCache("/api/payments");
      clearCache("/api/dashboard");
      alert(data.message || "Processamento concluído!");
      fetchPayments();
    } catch (err) {
      alert("Erro ao gerar faturas");
    } finally {
      setGenerating(false);
    }
  };

  // Salvar cobrança manual
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalForm),
      });
      if (res.ok) {
        clearCache("/api/payments");
        clearCache("/api/dashboard");
        setIsModalOpen(false);
        fetchPayments();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Copiar chave PIX
  const handleCopyPix = (id: string) => {
    navigator.clipboard.writeText(trainerPixKey);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Contadores dinâmicos calculados client-side em 0ms
  const paidCount = payments.filter((p) => p.calculatedStatus === "PAID").length;
  const overdueCount = payments.filter((p) => p.calculatedStatus === "OVERDUE").length;
  const pendingCount = payments.filter((p) => p.calculatedStatus === "PENDING").length;

  const onTimePendingAmount = Math.max(0, summary.totalPending - summary.totalOverdue);

  // Filtro de busca client-side instantânea (0ms) combinando Status e Busca
  const filteredPayments = payments.filter((p) => {
    // Filtro por Situação selecionada nos KPIs
    if (statusFilter !== "ALL") {
      if (statusFilter === "PAID" && p.calculatedStatus !== "PAID") return false;
      if (statusFilter === "PENDING" && p.calculatedStatus !== "PENDING") return false;
      if (statusFilter === "OVERDUE" && p.calculatedStatus !== "OVERDUE") return false;
    }

    if (!search.trim()) return true;
    const query = search.toLowerCase();
    return (
      p.student.name.toLowerCase().includes(query) ||
      (p.notes && p.notes.toLowerCase().includes(query))
    );
  });

  // Cálculo da porcentagem de meta atingida
  const progressPercent =
    summary.totalBilled > 0
      ? Math.min(100, Math.round((summary.totalPaid / summary.totalBilled) * 100))
      : 0;

  // Proporções exatas para a micro-barra segmentada no rodapé dos KPIs
  const totalAmount = summary.totalBilled || 1;
  const paidPercent = Math.min(100, Math.round((summary.totalPaid / totalAmount) * 100));
  const overduePercent = Math.min(100, Math.round((summary.totalOverdue / totalAmount) * 100));
  const onTimePendingPercent = Math.max(0, 100 - paidPercent - overduePercent);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
      <Navigation />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header title="Financeiro" subtitle="Controle de mensalidades, recebimentos e PIX" />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
          {/* ========================================================= */}
          {/* 1. SELETOR DE MÊS & AÇÕES SUPERIORES                      */}
          {/* ========================================================= */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Navegador de Mês */}
            <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-1.5 rounded-2xl self-start">
              <button
                type="button"
                onClick={() => changeMonth(-1)}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                title="Mês Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-3 text-center min-w-[130px]">
                <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                  Referência
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono tracking-tight">
                  {selectedMonth}
                </span>
              </div>
              <button
                type="button"
                onClick={() => changeMonth(1)}
                className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                title="Próximo Mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setSelectedMonth(currentMonthInitial)}
                className="px-2.5 py-1 text-xs font-bold text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition"
              >
                Mês Atual
              </button>
            </div>

            {/* Ações Rápidas de Faturamento */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={generating}
                onClick={handleAutoGenerateMonth}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 transition active:scale-95 min-h-[44px]"
                title="Gera cobranças para todos os alunos ativos que ainda não têm fatura neste mês"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>{generating ? "Gerando..." : "Gerar Mensalidades"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setModalForm((prev) => ({ ...prev, referenceMonth: selectedMonth }));
                  setIsModalOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20 min-h-[44px]"
              >
                <Plus className="w-4 h-4" />
                <span>Nova Cobrança</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. COCKPIT MINIMALISTA DE KPIS DO MÊS (3 CARDS CLICÁVEIS) */}
          {/* ========================================================= */}
          <div className="rounded-3xl bg-zinc-900/80 border border-zinc-800 shadow-xl overflow-hidden backdrop-blur-sm transition">
            {/* Grid dos 3 KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-800">
              
              {/* KPI 1: RECEBIDO / REALIZADO */}
              <button
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === "PAID" ? "ALL" : "PAID"))}
                className={`p-4 sm:p-5 text-left transition relative group cursor-pointer ${
                  statusFilter === "PAID"
                    ? "bg-emerald-500/10 ring-2 ring-emerald-500/50 inset-0 z-10"
                    : "hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Recebido
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    {progressPercent}% da meta
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black text-zinc-100 font-mono tracking-tight">
                  {formatCurrency(summary.totalPaid)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>de {formatCurrency(summary.totalBilled)} previstos</span>
                  <span className={`font-semibold ${statusFilter === "PAID" ? "text-emerald-400" : "text-zinc-500"}`}>
                    {paidCount} {paidCount === 1 ? "pago" : "pagos"} {statusFilter === "PAID" && "✓"}
                  </span>
                </div>
              </button>

              {/* KPI 2: A RECEBER / NO PRAZO */}
              <button
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === "PENDING" ? "ALL" : "PENDING"))}
                className={`p-4 sm:p-5 text-left transition relative group cursor-pointer ${
                  statusFilter === "PENDING"
                    ? "bg-amber-500/10 ring-2 ring-amber-500/50 inset-0 z-10"
                    : "hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    A Receber (No Prazo)
                  </span>
                  <span className="text-[10px] font-semibold text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-800/60 border border-zinc-700/50">
                    {pendingCount} {pendingCount === 1 ? "fatura" : "faturas"}
                  </span>
                </div>

                <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono tracking-tight">
                  {formatCurrency(onTimePendingAmount)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>Vencendo até o fim do mês</span>
                  <span className={`font-semibold ${statusFilter === "PENDING" ? "text-amber-400" : "text-zinc-500"}`}>
                    {statusFilter === "PENDING" ? "Filtrando ✓" : "Clique p/ ver"}
                  </span>
                </div>
              </button>

              {/* KPI 3: EM ATRASO / INADIMPLENTE */}
              <button
                type="button"
                onClick={() => setStatusFilter((prev) => (prev === "OVERDUE" ? "ALL" : "OVERDUE"))}
                className={`p-4 sm:p-5 text-left transition relative group cursor-pointer ${
                  statusFilter === "OVERDUE"
                    ? "bg-rose-500/15 ring-2 ring-rose-500/50 inset-0 z-10"
                    : summary.totalOverdue > 0
                    ? "bg-rose-950/20 hover:bg-rose-950/30"
                    : "hover:bg-zinc-800/40"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className={`text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                    summary.totalOverdue > 0 ? "text-rose-400" : "text-zinc-400"
                  }`}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    Em Atraso
                  </span>
                  {summary.totalOverdue > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                      {overdueCount} {overdueCount === 1 ? "pendência" : "pendências"} ⚠️
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-emerald-400/80 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Zero atrasos
                    </span>
                  )}
                </div>

                <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight ${
                  summary.totalOverdue > 0 ? "text-rose-400" : "text-zinc-400"
                }`}>
                  {formatCurrency(summary.totalOverdue)}
                </div>

                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1">
                  <span>
                    {summary.totalOverdue > 0 ? "Ação imediata requerida" : "Tudo em dia!"}
                  </span>
                  <span className={`font-semibold ${summary.totalOverdue > 0 ? "text-rose-400" : "text-zinc-500"}`}>
                    {statusFilter === "OVERDUE" ? "Filtrando ✓" : (summary.totalOverdue > 0 ? "Cobrar no Whats" : "")}
                  </span>
                </div>
              </button>

            </div>

            {/* Micro-Barra Segmentada de Meta Proporcional (4px) */}
            <div className="w-full h-1 bg-zinc-950 flex overflow-hidden">
              <div
                style={{ width: `${paidPercent}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title={`Recebido: ${paidPercent}%`}
              />
              <div
                style={{ width: `${onTimePendingPercent}%` }}
                className="bg-amber-400/80 h-full transition-all duration-500"
                title={`A Receber (No Prazo): ${onTimePendingPercent}%`}
              />
              <div
                style={{ width: `${overduePercent}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title={`Em Atraso: ${overduePercent}%`}
              />
            </div>
          </div>

          {/* ========================================================= */}
          {/* 3. BUSCA INSTANTÂNEA & CONTROLE DE FILTRO ATIVO           */}
          {/* ========================================================= */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Campo de Busca por Aluno */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar aluno por nome ou observação..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Filtro Ativo & Contador de Resultados */}
            <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
              {statusFilter !== "ALL" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 animate-fade-in">
                  <span className="text-zinc-500">Filtrando:</span>
                  <span className={`font-bold ${
                    statusFilter === "PAID"
                      ? "text-emerald-400"
                      : statusFilter === "PENDING"
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}>
                    {statusFilter === "PAID" && "Pagos"}
                    {statusFilter === "PENDING" && "Pendentes no Prazo"}
                    {statusFilter === "OVERDUE" && "Em Atraso"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("ALL")}
                    className="p-1 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-100 ml-1 transition"
                    title="Ver todas as cobranças"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <span className="text-[11px] text-zinc-500 font-medium px-2 py-1 rounded-lg bg-zinc-900/60 border border-zinc-800/60">
                  Dica: Toque nos cards acima para filtrar
                </span>
              )}

              <span className="text-xs text-zinc-400 font-medium px-1">
                {filteredPayments.length} {filteredPayments.length === 1 ? "cobrança" : "cobranças"}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 5. LISTA DE COBRANÇAS                                     */}
          {/* ========================================================= */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs">Carregando cobranças...</span>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
              <Wallet className="w-12 h-12 mx-auto text-zinc-600" />
              <h3 className="text-base font-bold text-zinc-200">Nenhuma cobrança encontrada</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {search.trim()
                  ? `Nenhum aluno encontrado para "${search}".`
                  : "Clique em 'Gerar Mensalidades' para faturar os alunos deste mês ou lance uma cobrança avulsa."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p) => {
                const isPaid = p.status === "PAID";
                const isOverdue = p.calculatedStatus === "OVERDUE" && !isPaid;

                const cobrançaMsg =
                  `Olá, ${p.student.name.split(" ")[0]}! Tudo bem? ` +
                  `Passando para lembrar da mensalidade (${p.referenceMonth}) no valor de ${formatCurrency(p.amount)}, ` +
                  `com vencimento em ${formatDateShort(p.dueDate)}. ` +
                  `Chave PIX: ${trainerPixKey}. Qualquer dúvida, estou à disposição! 💪`;

                const waLink = buildWhatsAppLink(p.student.phone, cobrançaMsg);

                return (
                  <div
                    key={p.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isPaid
                        ? "bg-zinc-900/40 border-zinc-800/60 opacity-85"
                        : isOverdue
                        ? "bg-zinc-900/90 border-rose-900/40 shadow-sm"
                        : "bg-zinc-900/80 border-zinc-800 shadow-sm"
                    }`}
                  >
                    <div className="flex items-start sm:items-center gap-3.5">
                      {/* Status Icon */}
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : isOverdue
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {isPaid ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <AlertCircle className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/alunos/${p.student.id}`}
                            className="font-bold text-zinc-100 text-sm hover:text-emerald-400 transition"
                          >
                            {p.student.name}
                          </Link>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                              isPaid
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : isOverdue
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {isPaid ? "Pago" : isOverdue ? "Atrasado" : "Pendente"}
                          </span>

                          {p.paymentMethod && (
                            <span className="text-[10px] text-zinc-400 font-mono px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-800">
                              {p.paymentMethod}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 mt-1">
                          <span>
                            Vencimento: <strong className="text-zinc-300">{formatDateShort(p.dueDate)}</strong>
                          </span>
                          {p.paidAt && (
                            <span className="text-emerald-400 font-medium">
                              • Baixado em {formatDateShort(p.paidAt)}
                            </span>
                          )}
                          {p.notes && <span className="text-zinc-500">• {p.notes}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Valor e Ações Rápidas */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 self-stretch sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Valor</span>
                        <span className="text-base sm:text-lg font-black text-zinc-100 font-mono">
                          {formatCurrency(p.amount)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Botão Copiar PIX */}
                        <button
                          type="button"
                          onClick={() => handleCopyPix(p.id)}
                          className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition min-h-[40px]"
                          title="Copiar Chave PIX"
                        >
                          {copiedId === p.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] text-emerald-400 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span className="text-[11px] hidden sm:inline">PIX</span>
                            </>
                          )}
                        </button>

                        {/* Botão WhatsApp de Cobrança / Lembrete */}
                        {!isPaid && (
                          <a
                            href={waLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-emerald-600/20 text-emerald-400 border border-zinc-700/60 transition min-h-[40px] flex items-center justify-center"
                            title="Lembrar aluno no WhatsApp"
                          >
                            <MessageCircle className="w-4 h-4" />
                          </a>
                        )}

                        {/* Botão de Baixa / Alternar Status */}
                        <button
                          type="button"
                          disabled={actionLoadingId === p.id}
                          onClick={() => handleTogglePayment(p.id)}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 min-h-[40px] ${
                            isPaid
                              ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                              : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-600/20 font-black"
                          }`}
                          title="Clique para alternar o status do pagamento"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{isPaid ? "Recebido" : "Marcar Pago"}</span>
                        </button>

                        {/* Botão Excluir */}
                        <button
                          type="button"
                          onClick={() => handleDeletePayment(p.id)}
                          className="p-2.5 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition min-h-[40px] flex items-center justify-center"
                          title="Excluir cobrança"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. MODAL DE NOVA COBRANÇA AVULSA                          */}
          {/* ========================================================= */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 my-auto shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-zinc-100 text-base">Lançar Nova Cobrança</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreatePayment} className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 py-1">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Aluno *
                    </label>
                    <select
                      required
                      value={modalForm.studentId}
                      onChange={(e) => {
                        const st = studentsList.find((s) => s.id === e.target.value);
                        setModalForm({
                          ...modalForm,
                          studentId: e.target.value,
                          amount: st ? String(st.monthlyFee) : modalForm.amount,
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Selecione um aluno...</option>
                      {studentsList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} ({formatCurrency(st.monthlyFee)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Valor (R$) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={modalForm.amount}
                        onChange={(e) => setModalForm({ ...modalForm, amount: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Vencimento *
                      </label>
                      <input
                        type="date"
                        required
                        value={modalForm.dueDate}
                        onChange={(e) => setModalForm({ ...modalForm, dueDate: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Mês Ref. (MM/AAAA)
                      </label>
                      <input
                        type="text"
                        required
                        value={modalForm.referenceMonth}
                        onChange={(e) => setModalForm({ ...modalForm, referenceMonth: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">
                        Forma de Pgto
                      </label>
                      <select
                        value={modalForm.paymentMethod}
                        onChange={(e) => setModalForm({ ...modalForm, paymentMethod: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="PIX">PIX</option>
                        <option value="DINHEIRO">Dinheiro</option>
                        <option value="CARTAO">Cartão de Crédito/Débito</option>
                        <option value="TRANSFERENCIA">Transferência Bancária</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Observação / Detalhe
                    </label>
                    <input
                      type="text"
                      value={modalForm.notes}
                      onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                      placeholder="Ex: Mensalidade regular ou aula extra"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 shrink-0 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 min-h-[44px]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md transition min-h-[44px]"
                    >
                      Lançar Cobrança
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. BOTÃO FLUTUANTE (FAB) NO MOBILE                        */}
          {/* ========================================================= */}
          <button
            type="button"
            onClick={() => {
              setModalForm((prev) => ({ ...prev, referenceMonth: selectedMonth }));
              setIsModalOpen(true);
            }}
            className="fixed bottom-24 right-5 md:hidden z-40 w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition"
            title="Lançar Nova Cobrança"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </main>
      </div>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-zinc-400">Carregando financeiro...</div>}>
        <FinanceiroContent />
      </Suspense>
    </AuthGuard>
  );
}
