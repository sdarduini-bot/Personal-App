"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Users,
  Calendar,
  Wallet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Plus,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  MapPin,
  Dumbbell,
  DollarSign,
  Sparkles,
} from "lucide-react";
import { formatCurrency, formatDateShort, buildWhatsAppLink } from "@/lib/formatters";
import { fetchWithCache, clearCache } from "@/lib/cache";

interface DashboardData {
  todayStr: string;
  currentMonthRef: string;
  metrics: {
    totalStudents: number;
    todayClassesCount: number;
    todayCompletedCount: number;
    monthRevenuePaid: number;
    monthRevenuePending: number;
    overdueCount: number;
  };
  todayClasses: Array<{
    id: string;
    title: string | null;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    notes: string | null;
    student: {
      id: string;
      name: string;
      phone: string;
      avatarUrl: string | null;
    };
  }>;
  overdueAlerts: Array<{
    id: string;
    studentName: string;
    studentPhone: string;
    amount: number;
    dueDate: string;
    status: string;
    referenceMonth: string;
  }>;
  recentStudents: Array<{
    id: string;
    name: string;
    goal: string;
    phone: string;
    planName: string | null;
    monthlyFee: number;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setError(null);
      await fetchWithCache<DashboardData>("/api/dashboard", (json) => {
        setData(json);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados do painel.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Marcar pagamento como pago com 1 clique direto no alerta do dashboard
  const handleTogglePayment = async (paymentId: string) => {
    setActionLoadingId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/toggle`, {
        method: "POST",
      });
      if (res.ok) {
        clearCache("/api/dashboard");
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Alternar status da aula (ex: agendada -> concluída)
  const handleClassStatus = async (classId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
    setActionLoadingId(classId);
    try {
      const res = await fetch(`/api/classes/${classId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        clearCache("/api/dashboard");
        await fetchDashboard();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
        <Navigation />

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <Header
            title="Painel Geral"
            subtitle={`Hoje: ${data ? formatDateShort(data.todayStr) : "Carregando..."}`}
          />

          <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
            {loading && !data ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">Atualizando dados do painel...</span>
              </div>
            ) : data ? (
              <>
                {/* 1. CARDS DE NÚMEROS RÁPIDOS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  {/* Total de Alunos */}
                  <Link
                    href="/alunos"
                    className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/40 transition group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Total Alunos</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shrink-0">
                        <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-100 tracking-tight">
                      {data.metrics.totalStudents}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                      <span>Alunos ativos</span>
                    </p>
                  </Link>

                  {/* Aulas Hoje */}
                  <Link
                    href="/agenda"
                    className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/40 transition group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Aulas Hoje</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition shrink-0">
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-xl sm:text-2xl md:text-3xl font-black text-zinc-100 tracking-tight">
                      {data.metrics.todayClassesCount}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">
                      <span className="text-emerald-400 font-bold">{data.metrics.todayCompletedCount}</span> concluídas
                    </p>
                  </Link>

                  {/* Receita Recebida no Mês */}
                  <Link
                    href="/financeiro"
                    className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 hover:border-emerald-500/40 transition group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] sm:text-xs font-medium text-zinc-400">Recebido</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition shrink-0">
                        <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-black text-emerald-400 tracking-tight truncate">
                      {formatCurrency(data.metrics.monthRevenuePaid)}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-1">
                      Confirmados ({data.currentMonthRef})
                    </p>
                  </Link>

                  {/* Pendente no Mês */}
                  <Link
                    href="/financeiro"
                    className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-zinc-900/70 border border-zinc-800/80 hover:border-amber-500/40 transition group relative overflow-hidden active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] sm:text-xs font-medium text-zinc-400">A Receber</span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition shrink-0">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                    </div>
                    <div className="text-lg sm:text-xl md:text-2xl font-black text-amber-400 tracking-tight truncate">
                      {formatCurrency(data.metrics.monthRevenuePending)}
                    </div>
                    <p className="text-[10px] sm:text-[11px] text-amber-400/90 mt-1">
                      {data.metrics.overdueCount > 0 ? `${data.metrics.overdueCount} em atraso` : "Em dia"}
                    </p>
                  </Link>
                </div>

                {/* 2. BARRA DE ATALHOS RÁPIDOS (Grid 2x2 ergonômico no celular) */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                  <Link
                    href="/alunos?novo=true"
                    className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 shrink-0" />
                    <span className="truncate">Novo Aluno</span>
                  </Link>
                  <Link
                    href="/agenda?nova=true"
                    className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-200 border border-zinc-800 text-xs font-semibold transition min-h-[44px]"
                  >
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Agendar Aula</span>
                  </Link>
                  <Link
                    href="/planos/novo"
                    className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-200 border border-zinc-800 text-xs font-semibold transition min-h-[44px]"
                  >
                    <Dumbbell className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Criar Treino</span>
                  </Link>
                  <Link
                    href="/financeiro?novo=true"
                    className="flex items-center justify-center sm:justify-start gap-2 px-3.5 py-3 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-95 text-zinc-200 border border-zinc-800 text-xs font-semibold transition min-h-[44px]"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="truncate">Lançar Cobrança</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 3. AULAS DO DIA (2 Colunas no Desktop) */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-400" />
                        <h2 className="text-base md:text-lg font-bold text-zinc-100">
                          Próximas Aulas de Hoje
                        </h2>
                      </div>
                      <Link
                        href="/agenda"
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        Ver agenda completa <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {data.todayClasses.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-8 text-center text-zinc-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-300">Nenhuma aula agendada para hoje.</p>
                        <p className="text-xs text-zinc-500 mt-1">Aproveite para planejar novos treinos!</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.todayClasses.map((cls) => {
                          const isCompleted = cls.status === "COMPLETED";
                          const waMessage = `Olá, ${cls.student.name.split(" ")[0]}! Confirmando nossa aula hoje às ${cls.startTime}. Te vejo lá! 💪`;
                          const waUrl = buildWhatsAppLink(cls.student.phone, waMessage);

                          return (
                            <div
                              key={cls.id}
                              className={`p-4 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isCompleted
                                  ? "bg-zinc-900/30 border-zinc-800/50 opacity-75"
                                  : "bg-zinc-900/80 border-zinc-800 hover:border-zinc-700"
                              }`}
                            >
                              <div className="flex items-start sm:items-center gap-3.5">
                                {/* Horário Badge */}
                                <div className="px-3 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-center shrink-0">
                                  <div className="text-sm font-black text-emerald-400 font-mono">
                                    {cls.startTime}
                                  </div>
                                  <div className="text-[10px] text-zinc-500 font-mono">
                                    {cls.endTime}
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center gap-2">
                                    <Link
                                      href={`/alunos/${cls.student.id}`}
                                      className="font-bold text-zinc-100 text-sm hover:text-emerald-400 transition"
                                    >
                                      {cls.student.name}
                                    </Link>
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                                      <MapPin className="w-2.5 h-2.5" />
                                      {cls.location}
                                    </span>
                                  </div>

                                  {cls.title && (
                                    <p className="text-xs text-zinc-400 mt-0.5">{cls.title}</p>
                                  )}
                                  {cls.notes && (
                                    <p className="text-[11px] text-zinc-500 mt-0.5 italic">
                                      Obs: {cls.notes}
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Ações da aula */}
                              <div className="flex items-center gap-2 self-end sm:self-center">
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-emerald-600/20 text-emerald-400 border border-zinc-700/60 transition"
                                  title="Avisar no WhatsApp"
                                >
                                  <MessageCircle className="w-4 h-4" />
                                </a>

                                <button
                                  type="button"
                                  disabled={actionLoadingId === cls.id}
                                  onClick={() => handleClassStatus(cls.id, cls.status)}
                                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 active:scale-95 ${
                                    isCompleted
                                      ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold"
                                  }`}
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{isCompleted ? "Feita" : "Concluir"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* 4. ALERTAS FINANCEIROS / PENDÊNCIAS (1 Coluna no Desktop) */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-400" />
                        <h2 className="text-base md:text-lg font-bold text-zinc-100">
                          Alertas de Pagamento
                        </h2>
                      </div>
                      <Link
                        href="/financeiro"
                        className="text-xs text-amber-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        Ver todos <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    {data.overdueAlerts.length === 0 ? (
                      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 text-center text-zinc-400">
                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                        <p className="text-sm font-semibold text-zinc-200">
                          Tudo em dia!
                        </p>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Nenhum pagamento em atraso no momento.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {data.overdueAlerts.slice(0, 5).map((alert) => (
                          <div
                            key={alert.id}
                            className="p-3.5 rounded-2xl bg-zinc-900/90 border border-amber-900/30 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-100 text-xs truncate">
                                {alert.studentName}
                              </div>
                              <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 mt-0.5">
                                <span className="text-amber-400 font-bold">
                                  {formatCurrency(alert.amount)}
                                </span>
                                <span>•</span>
                                <span className="text-rose-400">
                                  Venceu {formatDateShort(alert.dueDate)}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={actionLoadingId === alert.id}
                              onClick={() => handleTogglePayment(alert.id)}
                              className="px-2.5 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-zinc-950 border border-emerald-500/30 text-[11px] font-bold transition shrink-0 active:scale-95"
                            >
                              Receber
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Alunos Recentes */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                          Alunos Ativos
                        </h3>
                        <Link href="/alunos" className="text-xs text-emerald-400 hover:underline">
                          Gerenciar
                        </Link>
                      </div>
                      <div className="space-y-2">
                        {data.recentStudents.map((s) => (
                          <Link
                            key={s.id}
                            href={`/alunos/${s.id}`}
                            className="p-3 rounded-2xl bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/60 transition flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-xs font-semibold text-zinc-200 group-hover:text-emerald-400 transition">
                                {s.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">{s.goal}</p>
                            </div>
                            <span className="text-xs font-bold text-zinc-300 font-mono">
                              {formatCurrency(s.monthlyFee)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : error ? (
              <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-10 text-center text-zinc-400 space-y-3">
                <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                <h3 className="text-base font-bold text-zinc-200">{error}</h3>
                <button
                  type="button"
                  onClick={fetchDashboard}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition"
                >
                  Tentar Novamente
                </button>
              </div>
            ) : null}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
