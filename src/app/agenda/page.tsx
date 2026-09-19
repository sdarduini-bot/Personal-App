"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Users,
  Repeat,
  X,
  Trash2,
  Sparkles,
  Coffee,
  Dumbbell,
  ExternalLink,
  AlertTriangle,
  GripVertical,
  Move,
  ArrowRight,
  Check,
  Share2,
} from "lucide-react";
import ShareWorkoutModal from "@/components/ShareWorkoutModal";
import {
  formatDateShort,
  formatDayOfWeek,
  buildWhatsAppLink,
} from "@/lib/formatters";
import { fetchWithCache, clearCache } from "@/lib/cache";
import { addDays, subDays, startOfWeek, endOfWeek, format, parseISO, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ClassItem {
  id: string;
  studentId: string;
  title: string | null;
  date: string;
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
}

function parseMinutes(timeStr: string): number {
  if (!timeStr || !timeStr.includes(":")) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function generateTimelineSlots(resolution: "15" | "30" | "60", startHour = 6, endHour = 22): string[] {
  const slots: string[] = [];
  const step = Number(resolution);
  const startMins = startHour * 60;
  const endMins = endHour * 60;
  for (let m = startMins; m <= endMins; m += step) {
    slots.push(formatMinutes(m));
  }
  return slots;
}

const TIMELINE_HOURS = [
  "06:00",
  "07:00",
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
  "20:00",
  "21:00",
];

function AgendaContent() {
  const searchParams = useSearchParams();

  // Data selecionada (padrão hoje: 2026-09-19)
  const [selectedDate, setSelectedDate] = useState("2026-09-19");
  const [viewMode, setViewMode] = useState<"dia" | "semana" | "lista">("dia");
  const [dayDisplayMode, setDayDisplayMode] = useState<"grade" | "lista">("grade");
  const [timelineResolution, setTimelineResolution] = useState<"15" | "30" | "60">("60");
  const [selectedStudentId, setSelectedStudentId] = useState<string>("ALL");
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Drag & Drop e Agenda Inteligente
  const [draggedClass, setDraggedClass] = useState<ClassItem | null>(null);
  const [selectedForMove, setSelectedForMove] = useState<ClassItem | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const touchTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);

  // Modal de Reagendamento / Confirmação pós-arraste
  const [isConfirmMoveModalOpen, setIsConfirmMoveModalOpen] = useState(false);
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moveModalData, setMoveModalData] = useState<{
    classItem: ClassItem;
    newDate: string;
    newStartTime: string;
    newEndTime: string;
    location: string;
    notes: string;
    allowOverlap: boolean;
  } | null>(null);

  // Toast WhatsApp pós-reagendamento
  const [lastMovedClass, setLastMovedClass] = useState<{
    studentName: string;
    phone: string;
    date: string;
    startTime: string;
    endTime: string;
  } | null>(null);

  // Estados para Compartilhamento de Mensagem / Treino via WhatsApp
  const [sharingClass, setSharingClass] = useState<ClassItem | null>(null);
  const [studentPlansForShare, setStudentPlansForShare] = useState<any[]>([]);
  const [loadingStudentPlans, setLoadingStudentPlans] = useState(false);
  const [activeShareWorkout, setActiveShareWorkout] = useState<any | null>(null);

  const handleOpenShareOptions = async (cls: ClassItem) => {
    setSharingClass(cls);
    setLoadingStudentPlans(true);
    try {
      const res = await fetch(`/api/workouts?studentId=${cls.studentId}`);
      if (res.ok) {
        const data = await res.json();
        setStudentPlansForShare(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao carregar treinos do aluno para compartilhamento:", err);
    } finally {
      setLoadingStudentPlans(false);
    }
  };

  // Lista de alunos para os selects
  const [students, setStudents] = useState<Array<{ id: string; name: string }>>([]);

  // Modal de agendamento novo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({
    studentId: "",
    title: "",
    date: "2026-09-19",
    startTime: "08:00",
    endTime: "09:00",
    location: "ACADEMIA",
    recurringWeeks: "1",
    notes: "",
    allowOverlap: false,
  });

  // Fichas de treino inteligentes para seleção no modal de agendamento
  const [studentWorkouts, setStudentWorkouts] = useState<Array<{ id: string; title: string; exercisesCount?: number }>>([]);
  const [loadingWorkouts, setLoadingWorkouts] = useState(false);
  const [allLibraryPlans, setAllLibraryPlans] = useState<Array<{ id: string; title: string; student: { name: string } }>>([]);

  const fetchClasses = async () => {
    try {
      const query = new URLSearchParams();

      if (viewMode === "dia") {
        query.set("date", selectedDate);
      } else if (viewMode === "semana") {
        const curr = parseISO(selectedDate);
        const start = format(startOfWeek(curr, { weekStartsOn: 1 }), "yyyy-MM-dd");
        const end = format(endOfWeek(curr, { weekStartsOn: 1 }), "yyyy-MM-dd");
        query.set("startDate", start);
        query.set("endDate", end);
      } else {
        query.set("startDate", selectedDate);
        const curr = parseISO(selectedDate);
        query.set("endDate", format(addDays(curr, 30), "yyyy-MM-dd"));
      }

      if (selectedStudentId !== "ALL") {
        query.set("studentId", selectedStudentId);
      }

      const url = `/api/classes?${query.toString()}`;
      await fetchWithCache<ClassItem[]>(url, (data) => {
        setClasses(Array.isArray(data) ? data : []);
        setLoading(false);
      });
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      await fetchWithCache<Array<{ id: string; name: string }>>("/api/students", (data) => {
        if (Array.isArray(data)) {
          setStudents(data);
          if (data.length > 0 && !modalForm.studentId) {
            setModalForm((prev) => ({ ...prev, studentId: data[0].id }));
          }
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [selectedDate, viewMode, selectedStudentId]);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    if (searchParams.get("nova") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  // Carregar treinos do aluno selecionado dinamicamente para seleção rápida
  useEffect(() => {
    if (!modalForm.studentId) {
      setStudentWorkouts([]);
      return;
    }

    let isMounted = true;
    setLoadingWorkouts(true);

    fetchWithCache<any[]>(`/api/workouts?studentId=${modalForm.studentId}`, (data) => {
      if (!isMounted) return;
      if (Array.isArray(data)) {
        setStudentWorkouts(
          data.map((w) => ({
            id: w.id,
            title: w.title,
            exercisesCount: w.exercises?.length || 0,
          }))
        );

        // Se o aluno não tiver fichas, carregamos modelos do sistema para sugestão rápida
        if (data.length === 0) {
          fetchWithCache<any[]>("/api/workouts", (all) => {
            if (!isMounted) return;
            if (Array.isArray(all)) {
              setAllLibraryPlans(all.slice(0, 8));
            }
          }).catch(() => {});
        }
      }
      setLoadingWorkouts(false);
    }).catch(() => {
      if (isMounted) setLoadingWorkouts(false);
    });

    return () => {
      isMounted = false;
    };
  }, [modalForm.studentId]);

  const changeDate = (days: number) => {
    const curr = parseISO(selectedDate);
    const next = days > 0 ? addDays(curr, days) : subDays(curr, Math.abs(days));
    setSelectedDate(format(next, "yyyy-MM-dd"));
  };

  // Alternar status da aula com 1 clique
  const handleToggleStatus = async (classId: string, currentStatus: string) => {
    const nextStatus = currentStatus === "COMPLETED" ? "SCHEDULED" : "COMPLETED";
    try {
      const res = await fetch(`/api/classes/${classId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        clearCache("/api/classes");
        clearCache("/api/dashboard");
        fetchClasses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir aula
  const handleDeleteClass = async (classId: string) => {
    if (!confirm("Deseja realmente desmarcar esta aula?")) return;
    try {
      const res = await fetch(`/api/classes/${classId}`, { method: "DELETE" });
      if (res.ok) {
        clearCache("/api/classes");
        clearCache("/api/dashboard");
        fetchClasses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Criar aula / recorrência
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    const conflict = checkConflict(modalForm.date, modalForm.startTime, modalForm.endTime);
    if (conflict.hasConflict && !modalForm.allowOverlap) {
      setModalError(
        `Choque de horário com ${conflict.studentName} (${conflict.timeRange}). Marque a opção "Permitir Treino em Conjunto" se for uma sessão simultânea.`
      );
      return;
    }

    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(modalForm),
      });

      if (res.ok) {
        clearCache("/api/classes");
        clearCache("/api/dashboard");
        setIsModalOpen(false);
        setModalForm((prev) => ({ ...prev, allowOverlap: false }));
        fetchClasses();
      } else {
        const err = await res.json();
        setModalError(err.error || "Erro ao agendar aula.");
      }
    } catch (err) {
      console.error(err);
      setModalError("Erro de conexão ao salvar agendamento.");
    }
  };

  // Encaixar aluno em horário livre
  const openModalWithTime = (startTime: string, maxEndTime?: string) => {
    const startMins = parseMinutes(startTime);
    const endMins = maxEndTime
      ? Math.min(startMins + 60, parseMinutes(maxEndTime))
      : startMins + 60;

    setModalError(null);
    setModalForm((prev) => ({
      ...prev,
      date: selectedDate,
      startTime: startTime,
      endTime: formatMinutes(endMins),
      allowOverlap: false,
    }));
    setIsModalOpen(true);
  };

  // Validador local de choque de horários (0ms)
  const checkConflict = (date: string, startTime: string, endTime: string, excludeClassId?: string) => {
    const startM = parseMinutes(startTime);
    const endM = parseMinutes(endTime);

    const conflicting = classes.find((c) => {
      if (excludeClassId && c.id === excludeClassId) return false;
      if (c.date !== date) return false;
      if (c.status === "CANCELED") return false;

      const cStartM = parseMinutes(c.startTime);
      const cEndM = parseMinutes(c.endTime);

      return startM < cEndM && endM > cStartM;
    });

    if (conflicting) {
      return {
        hasConflict: true,
        studentName: conflicting.student.name,
        timeRange: `${conflicting.startTime} às ${conflicting.endTime}`,
        conflictingClass: conflicting,
      };
    }

    return { hasConflict: false };
  };

  // Disparar abertura do modal de confirmação ao soltar ou tocar no slot
  const handleDropOnSlot = (slotTime: string, targetClass?: ClassItem) => {
    const cls = targetClass || draggedClass || selectedForMove;
    if (!cls) return;

    const durationMins = parseMinutes(cls.endTime) - parseMinutes(cls.startTime) || 60;
    const newStartMins = parseMinutes(slotTime);
    const newEndTime = formatMinutes(newStartMins + durationMins);

    setMoveError(null);
    setMoveModalData({
      classItem: cls,
      newDate: selectedDate,
      newStartTime: slotTime,
      newEndTime: newEndTime,
      location: cls.location || "ACADEMIA",
      notes: cls.notes || "",
      allowOverlap: false,
    });
    setIsConfirmMoveModalOpen(true);
    setDraggedClass(null);
    setSelectedForMove(null);
    setDragOverSlot(null);
  };

  // Abertura manual para remarcação sem drag (botão Remarcar)
  const openMoveModal = (cls: ClassItem) => {
    setMoveError(null);
    setMoveModalData({
      classItem: cls,
      newDate: cls.date,
      newStartTime: cls.startTime,
      newEndTime: cls.endTime,
      location: cls.location || "ACADEMIA",
      notes: cls.notes || "",
      allowOverlap: false,
    });
    setIsConfirmMoveModalOpen(true);
  };

  // Touch Long-Press Support para Celulares (ativa o modo de mover com vibração)
  const handleTouchStart = (cls: ClassItem, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };

    touchTimerRef.current = setTimeout(() => {
      setSelectedForMove(cls);
      setDraggedClass(cls);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 250);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartPos.current) {
      const touch = e.touches[0];
      const dx = Math.abs(touch.clientX - touchStartPos.current.x);
      const dy = Math.abs(touch.clientY - touchStartPos.current.y);
      if (dx > 10 || dy > 10) {
        if (touchTimerRef.current) {
          clearTimeout(touchTimerRef.current);
          touchTimerRef.current = null;
        }
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // Salvar Reagendamento com Proteção Anti-Conflito
  const handleSaveMove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moveModalData) return;

    const conflict = checkConflict(
      moveModalData.newDate,
      moveModalData.newStartTime,
      moveModalData.newEndTime,
      moveModalData.classItem.id
    );

    if (conflict.hasConflict && !moveModalData.allowOverlap) {
      setMoveError(
        `Choque de horário com ${conflict.studentName} (${conflict.timeRange}). Ative "Permitir treino simultâneo" para confirmar.`
      );
      return;
    }

    setMoveSaving(true);
    setMoveError(null);
    try {
      const res = await fetch(`/api/classes/${moveModalData.classItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: moveModalData.newDate,
          startTime: moveModalData.newStartTime,
          endTime: moveModalData.newEndTime,
          location: moveModalData.location,
          notes: moveModalData.notes,
          allowOverlap: moveModalData.allowOverlap,
        }),
      });

      if (res.ok) {
        clearCache("/api/classes");
        clearCache("/api/dashboard");
        setIsConfirmMoveModalOpen(false);
        setLastMovedClass({
          studentName: moveModalData.classItem.student.name,
          phone: moveModalData.classItem.student.phone,
          date: moveModalData.newDate,
          startTime: moveModalData.newStartTime,
          endTime: moveModalData.newEndTime,
        });
        fetchClasses();
        setTimeout(() => setLastMovedClass(null), 10000);
      } else {
        const err = await res.json();
        setMoveError(err.error || "Erro ao reagendar aula.");
      }
    } catch {
      setMoveError("Erro de conexão ao salvar reagendamento.");
    } finally {
      setMoveSaving(false);
    }
  };

  // Calcular dias da semana atual para a Fita de Dias (Day Ribbon)
  const currentParsedDate = parseISO(selectedDate);
  const weekStart = startOfWeek(currentParsedDate, { weekStartsOn: 1 }); // Seg a Dom
  const weekDays = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i));

  // Ordenar aulas cronologicamente
  const sortedClasses = [...classes].sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Aula Hero (próxima aula não concluída, ou a primeira do dia)
  const heroClass = sortedClasses.find((c) => c.status !== "COMPLETED") || (sortedClasses.length > 0 ? sortedClasses[0] : null);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-32 md:pb-12">
      <Navigation />

      <div className="flex-1 md:pl-64 flex flex-col min-w-0">
        <Header title="Agenda de Aulas" subtitle="Planejamento e horários de atendimento" />

        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-6xl mx-auto w-full space-y-5 sm:space-y-6">
          {/* ========================================================= */}
          {/* 1. FITA SUPERIOR DE DIAS (DAY RIBBON)                     */}
          {/* ========================================================= */}
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-3.5 sm:p-4 space-y-3 shadow-sm">
            {/* Navegação de Mês & Ações Rápidas */}
            <div className="flex items-center justify-between gap-2 px-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => changeDate(-7)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
                  title="Semana Anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs sm:text-sm font-bold text-zinc-200 capitalize">
                  {format(currentParsedDate, "MMMM yyyy", { locale: ptBR })}
                </span>
                <button
                  type="button"
                  onClick={() => changeDate(7)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition"
                  title="Próxima Semana"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDate("2026-09-19")}
                  className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-emerald-400 transition"
                >
                  Hoje
                </button>

                {/* Alternador de Visões */}
                <div className="hidden sm:flex rounded-xl bg-zinc-950 border border-zinc-800 p-0.5">
                  {[
                    { id: "dia", label: "Dia" },
                    { id: "semana", label: "Semana" },
                    { id: "lista", label: "Lista" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setViewMode(mode.id as any)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                        viewMode === mode.id
                          ? "bg-zinc-800 text-zinc-100 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setModalForm((prev) => ({ ...prev, date: selectedDate }));
                    setIsModalOpen(true);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova Aula</span>
                </button>
              </div>
            </div>

            {/* Grid dos 7 Dias da Semana (Tátil e Fluido no Celular) */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
              {weekDays.map((dayDate) => {
                const dayStr = format(dayDate, "yyyy-MM-dd");
                const isSelected = dayStr === selectedDate;
                const isCurrentToday = dayStr === "2026-09-19";

                return (
                  <button
                    key={dayStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dayStr);
                      if (viewMode !== "dia") setViewMode("dia");
                    }}
                    className={`p-2 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95 relative ${
                      isSelected
                        ? "bg-emerald-500 text-zinc-950 font-black shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/60 scale-[1.03]"
                        : isCurrentToday
                        ? "bg-zinc-800/80 border border-emerald-500/40 text-zinc-100 hover:bg-zinc-800"
                        : "bg-zinc-950/60 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60"
                    }`}
                  >
                    <span
                      className={`text-[9px] sm:text-[11px] font-bold uppercase tracking-wider block ${
                        isSelected ? "text-zinc-950" : "text-zinc-400"
                      }`}
                    >
                      {format(dayDate, "EEE", { locale: ptBR })}
                    </span>
                    <span className="text-sm sm:text-lg font-black font-mono mt-0.5 block leading-none">
                      {format(dayDate, "dd")}
                    </span>

                    {/* Indicador de Hoje */}
                    {isCurrentToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Barra de Filtro de Alunos */}
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 flex items-center gap-1.5 font-medium">
                <Users className="w-3.5 h-3.5 text-zinc-500" />
                Filtrar:
              </span>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">Todos os alunos</option>
                {students.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Alternador Mobile (Dia / Semana / Lista) */}
            <div className="flex sm:hidden rounded-xl bg-zinc-900 border border-zinc-800 p-0.5">
              {[
                { id: "dia", label: "Dia" },
                { id: "semana", label: "Sem." },
                { id: "lista", label: "Lista" },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as any)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition ${
                    viewMode === mode.id
                      ? "bg-zinc-800 text-zinc-100 font-bold"
                      : "text-zinc-400"
                  }`}
                >
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 2. CARD HERO: PRÓXIMA AULA / EM ANDAMENTO                 */}
          {/* ========================================================= */}
          {viewMode === "dia" && heroClass && (
            <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 border border-emerald-500/30 shadow-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {heroClass.status === "COMPLETED" ? "Último Atendimento" : "Próximo Atendimento"}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                  {heroClass.startTime} às {heroClass.endTime}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div>
                  <Link
                    href={`/alunos/${heroClass.student.id}`}
                    className="text-lg font-black text-zinc-100 hover:text-emerald-400 transition tracking-tight flex items-center gap-2"
                  >
                    <span>{heroClass.student.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-zinc-500" />
                  </Link>

                  <div className="flex items-center gap-3 text-xs text-zinc-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                      {heroClass.location}
                    </span>
                    {heroClass.title && (
                      <span className="text-zinc-300 font-medium">
                        • {heroClass.title}
                      </span>
                    )}
                  </div>
                </div>

                {/* Atalhos Rápidos da Hero Class */}
                <div className="flex items-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-800">
                  <button
                    type="button"
                    onClick={() => handleOpenShareOptions(heroClass)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-emerald-600/20 text-emerald-400 border border-zinc-700/60 text-xs font-semibold transition min-h-[40px]"
                    title="Enviar aviso ou ficha de treino no WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp / Treino</span>
                  </button>

                  <Link
                    href={`/planos?studentId=${heroClass.studentId}`}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/60 text-xs font-semibold transition min-h-[40px]"
                  >
                    <Dumbbell className="w-4 h-4 text-emerald-400" />
                    <span>Ver Treino</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleToggleStatus(heroClass.id, heroClass.status)}
                    className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition min-h-[40px] active:scale-95 ${
                      heroClass.status === "COMPLETED"
                        ? "bg-zinc-800 text-zinc-400"
                        : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-600/20"
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{heroClass.status === "COMPLETED" ? "Concluída" : "Concluir"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. VISUALIZAÇÃO DIA (TIMELINE INTELIGENTE COM DRAG & DROP) */}
          {/* ========================================================= */}
          {viewMode === "dia" && (
            <div className="space-y-3.5">
              {/* Topo com Alternador Grade c/ Arraste vs Lista & Granularidade */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-zinc-900/90 p-3 rounded-2xl border border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    Aulas do Dia ({sortedClasses.length})
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono">
                    • {formatDateShort(selectedDate)}
                  </span>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  {/* Seletor de Granularidade de Minutos (apenas no modo grade) */}
                  {dayDisplayMode === "grade" && (
                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-[11px]">
                      <span className="text-zinc-500 font-semibold px-1.5 hidden md:inline">Grade:</span>
                      <button
                        type="button"
                        onClick={() => setTimelineResolution("60")}
                        className={`px-2 py-0.5 rounded-lg font-bold transition ${
                          timelineResolution === "60"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Blocos de 1 hora com sub-alvos de 15 minutos"
                      >
                        1h
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineResolution("30")}
                        className={`px-2 py-0.5 rounded-lg font-bold transition ${
                          timelineResolution === "30"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Linhas a cada 30 minutos"
                      >
                        30m
                      </button>
                      <button
                        type="button"
                        onClick={() => setTimelineResolution("15")}
                        className={`px-2 py-0.5 rounded-lg font-bold transition ${
                          timelineResolution === "15"
                            ? "bg-emerald-500 text-zinc-950 shadow-sm"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                        title="Linhas detalhadas a cada 15 minutos"
                      >
                        15m
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setDayDisplayMode("grade")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        dayDisplayMode === "grade"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Move className="w-3.5 h-3.5" />
                      <span>Grade</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDayDisplayMode("lista")}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        dayDisplayMode === "lista"
                          ? "bg-emerald-500 text-zinc-950 shadow-sm"
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Lista</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Banner Fixo / Notificador de Modo Mover Ativo */}
              {(selectedForMove || draggedClass) && (
                <div className="sticky top-20 z-30 p-3.5 rounded-2xl bg-emerald-500 text-zinc-950 font-bold shadow-xl flex items-center justify-between gap-3 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Move className="w-5 h-5 shrink-0 animate-bounce" />
                    <div className="truncate">
                      <span className="text-xs sm:text-sm block truncate">
                        Movendo aula de {(selectedForMove || draggedClass)?.student.name}
                      </span>
                      <span className="text-[11px] font-normal text-zinc-900 block truncate">
                        Toque ou solte no novo horário abaixo (inclusive nos botões :00, :15, :30 ou :45)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedForMove(null);
                      setDraggedClass(null);
                      setDragOverSlot(null);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-900 transition shrink-0"
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {/* Dica da Agenda Inteligente */}
              {!selectedForMove && !draggedClass && (
                <div className="p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between gap-3 text-xs text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Move className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong className="text-zinc-200">Agenda Inteligente:</strong> Arraste ou clique em <strong>Mover</strong> no aluno. Toque no horário ou nos botões de <strong>15 minutos</strong> (:00, :15, :30, :45) para reagendar sem choque.
                    </span>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                  <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="text-xs">Buscando aulas do dia...</span>
                </div>
              ) : dayDisplayMode === "grade" ? (
                /* ========================================================= */
                /* GRADE HORÁRIA INTELIGENTE COM SLOTS E DRAG & DROP          */
                /* ========================================================= */
                <div className="space-y-2.5">
                  {generateTimelineSlots(timelineResolution, 6, 21).map((slotTime) => {
                    const slotMins = parseMinutes(slotTime);
                    const stepMins = Number(timelineResolution);

                    // Filtrar aulas pertencentes a esta fatia (apenas onde ela inicia, evitando duplicação)
                    const classesInSlot = sortedClasses.filter((c) => {
                      const startM = parseMinutes(c.startTime);
                      return startM >= slotMins && startM < slotMins + stepMins;
                    });

                    const isOccupied = classesInSlot.length > 0;
                    const activeMover = selectedForMove || draggedClass;
                    const isDragTarget = dragOverSlot === slotTime;

                    // Conflito para o slot principal
                    const willConflict = activeMover
                      ? checkConflict(
                          selectedDate,
                          slotTime,
                          formatMinutes(
                            slotMins +
                              (parseMinutes(activeMover.endTime) - parseMinutes(activeMover.startTime) || 60)
                          ),
                          activeMover.id
                        ).hasConflict
                      : false;

                    return (
                      <div
                        key={slotTime}
                        onDragOver={(e) => {
                          e.preventDefault();
                          if (dragOverSlot !== slotTime) setDragOverSlot(slotTime);
                        }}
                        onDragLeave={() => {
                          if (dragOverSlot === slotTime) setDragOverSlot(null);
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          handleDropOnSlot(slotTime);
                        }}
                        className={`p-3 rounded-2xl border transition-all duration-150 flex flex-col sm:flex-row items-stretch sm:items-start gap-3 ${
                          isDragTarget
                            ? willConflict
                              ? "bg-rose-500/15 border-rose-500 ring-2 ring-rose-500/40"
                              : "bg-emerald-500/15 border-emerald-400 ring-2 ring-emerald-400/40 scale-[1.01]"
                            : isOccupied
                            ? "bg-zinc-900/90 border-zinc-800"
                            : "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/80 border-dashed"
                        }`}
                      >
                        {/* Marcador de Hora */}
                        <div className="flex sm:flex-col items-center justify-between sm:justify-center w-full sm:w-16 shrink-0 py-2 px-3 sm:px-0 rounded-xl bg-zinc-950/80 border border-zinc-800/80 font-mono text-center">
                          <span className="text-xs font-black text-zinc-200">{slotTime}</span>
                          <span className="text-[10px] text-zinc-500">
                            {isOccupied ? `${classesInSlot.length} aula${classesInSlot.length > 1 ? "s" : ""}` : "livre"}
                          </span>
                        </div>

                        {/* Conteúdo do Slot */}
                        <div className="flex-1 min-w-0 space-y-2.5">
                          {isOccupied ? (
                            <div className="space-y-2">
                              {/* Destaque de Treino em Conjunto (quando houver 2+ alunos no mesmo horário) */}
                              {classesInSlot.length > 1 && (
                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold w-fit shadow-sm">
                                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                                  <span>Treino em Conjunto ({classesInSlot.length} alunos simultâneos)</span>
                                </div>
                              )}

                              {classesInSlot.map((cls) => {
                                const isCompleted = cls.status === "COMPLETED";
                                const isSelectedThis = selectedForMove?.id === cls.id || draggedClass?.id === cls.id;
                                const waMessage = `Olá, ${cls.student.name.split(" ")[0]}! Confirmando nossa aula hoje às ${cls.startTime}. Nos vemos lá! 💪`;
                                const waLink = buildWhatsAppLink(cls.student.phone, waMessage);

                                return (
                                  <div
                                    key={cls.id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                      setDraggedClass(cls);
                                      setSelectedForMove(cls);
                                      e.dataTransfer.setData("text/plain", cls.id);
                                    }}
                                    onDragEnd={() => {
                                      setDraggedClass(null);
                                      setDragOverSlot(null);
                                    }}
                                    onTouchStart={(e) => handleTouchStart(cls, e)}
                                    onTouchMove={handleTouchMove}
                                    onTouchEnd={handleTouchEnd}
                                    className={`p-3 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-grab active:cursor-grabbing select-none ${
                                      isCompleted
                                        ? "bg-zinc-900/60 border-zinc-800/70 opacity-85"
                                        : "bg-zinc-900 border-zinc-700/80 hover:border-emerald-500/40 shadow-sm"
                                    } ${
                                      isSelectedThis
                                        ? "opacity-50 scale-95 border-dashed border-emerald-400 ring-2 ring-emerald-400/30"
                                        : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedForMove?.id === cls.id) {
                                            setSelectedForMove(null);
                                          } else {
                                            setSelectedForMove(cls);
                                          }
                                        }}
                                        className={`p-1.5 rounded-xl border transition shrink-0 ${
                                          isSelectedThis
                                            ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                                            : "text-zinc-500 hover:text-zinc-200 bg-zinc-950/60 border-zinc-800"
                                        }`}
                                        title="Clique para selecionar e mover este aluno para outro horário"
                                      >
                                        <GripVertical className="w-4 h-4" />
                                      </button>

                                      <div className="w-10 h-10 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-200 shrink-0">
                                        {cls.student.name.charAt(0).toUpperCase()}
                                      </div>

                                      <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                          <Link
                                            href={`/alunos/${cls.student.id}`}
                                            draggable={false}
                                            onClick={(e) => e.stopPropagation()}
                                            className="font-bold text-zinc-100 text-sm hover:text-emerald-400 transition truncate"
                                          >
                                            {cls.student.name}
                                          </Link>
                                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-950 text-zinc-400 border border-zinc-800 flex items-center gap-1">
                                            <MapPin className="w-2.5 h-2.5" />
                                            {cls.location}
                                          </span>
                                          <span className="text-[11px] font-mono text-emerald-400 font-bold">
                                            {cls.startTime} - {cls.endTime}
                                          </span>
                                        </div>
                                        {cls.title && (
                                          <p className="text-xs text-zinc-400 mt-0.5 truncate">{cls.title}</p>
                                        )}
                                      </div>
                                    </div>

                                    {/* Ações do Card */}
                                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                      {/* Botão Mover / Selecionar */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (selectedForMove?.id === cls.id) {
                                            setSelectedForMove(null);
                                          } else {
                                            setSelectedForMove(cls);
                                          }
                                        }}
                                        className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                                          isSelectedThis
                                            ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                                            : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 border-zinc-700/60"
                                        }`}
                                        title="Clique para mover de horário"
                                      >
                                        <Move className="w-3.5 h-3.5" />
                                        <span>{isSelectedThis ? "Cancelar" : "Mover"}</span>
                                      </button>

                                      {/* Editar Horário Manualmente */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openMoveModal(cls);
                                        }}
                                        className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 border border-zinc-700/60 transition"
                                        title="Editar horário e dados da aula"
                                      >
                                        <Clock className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenShareOptions(cls);
                                        }}
                                        className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-600/20 text-emerald-400 border border-zinc-700/60 transition"
                                        title="Enviar aviso de horário ou ficha de treino no WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleToggleStatus(cls.id, cls.status)}
                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 active:scale-95 ${
                                          isCompleted
                                            ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                            : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-600/20"
                                        }`}
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>{isCompleted ? "Concluída" : "Concluir"}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => handleDeleteClass(cls.id)}
                                        className="p-2 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition"
                                        title="Desmarcar aula"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}

                              {/* Atalho Limpo para Adicionar Aluno em Treino Conjunto */}
                              <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                                {activeMover ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDropOnSlot(slotTime)}
                                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md"
                                  >
                                    <Users className="w-3.5 h-3.5" />
                                    <span>Adicionar a este horário como Treino em Conjunto</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openModalWithTime(slotTime)}
                                    className="text-xs text-zinc-500 hover:text-indigo-400 font-semibold transition flex items-center gap-1.5 py-1"
                                  >
                                    <Users className="w-3.5 h-3.5 text-zinc-500" />
                                    <span>+ Adicionar aluno para Treino em Conjunto</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between py-1">
                              {isDragTarget ? (
                                <div
                                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                                    willConflict
                                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                                      : "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                                  }`}
                                >
                                  {willConflict ? (
                                    <>
                                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                                      <span>Aviso: Soltar aqui causará choque de horário com outra aula</span>
                                    </>
                                  ) : (
                                    <>
                                      <ArrowRight className="w-4 h-4 text-emerald-400" />
                                      <span>Solte ou toque aqui para mover para as {slotTime}</span>
                                    </>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-xs text-zinc-600 italic">Horário disponível</span>
                                  {activeMover ? (
                                    <button
                                      type="button"
                                      onClick={() => handleDropOnSlot(slotTime)}
                                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                                    >
                                      <Move className="w-3.5 h-3.5" />
                                      <span>Mover aluno para cá ({slotTime})</span>
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => openModalWithTime(slotTime)}
                                      className="px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-emerald-600/20 hover:text-emerald-400 text-zinc-400 text-xs font-semibold border border-zinc-800 transition flex items-center gap-1"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Agendar às {slotTime}</span>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* ========================================================= */
                /* LISTA SEQUENCIAL TRADICIONAL COM SUPORTE A REMARCAR        */
                /* ========================================================= */
                sortedClasses.length === 0 ? (
                  <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-12 text-center text-zinc-400 space-y-3">
                    <CalendarIcon className="w-12 h-12 mx-auto text-zinc-600" />
                    <h3 className="text-base font-bold text-zinc-200">
                      Nenhuma aula agendada para este dia
                    </h3>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                      Aproveite para encaixar novos atendimentos ou registrar horários de descanso.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setModalForm((prev) => ({ ...prev, date: selectedDate }));
                        setIsModalOpen(true);
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Agendar Aula Neste Dia</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sortedClasses.map((cls, idx) => {
                      const isCompleted = cls.status === "COMPLETED";
                      const waMessage = `Olá, ${cls.student.name.split(" ")[0]}! Confirmando nossa aula dia ${formatDateShort(cls.date)} às ${cls.startTime}. Nos vemos lá! 💪`;
                      const waLink = buildWhatsAppLink(cls.student.phone, waMessage);

                      const nextCls = sortedClasses[idx + 1];
                      const hasGap =
                        nextCls &&
                        parseMinutes(nextCls.startTime) - parseMinutes(cls.endTime) >= 60;

                      return (
                        <React.Fragment key={cls.id}>
                          <div
                            draggable={true}
                            onDragStart={(e) => {
                              setDraggedClass(cls);
                              setSelectedForMove(cls);
                              e.dataTransfer.setData("text/plain", cls.id);
                            }}
                            onDragEnd={() => {
                              setDraggedClass(null);
                              setDragOverSlot(null);
                            }}
                            onTouchStart={(e) => handleTouchStart(cls, e)}
                            onTouchMove={handleTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className={`p-4 sm:p-5 rounded-3xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none ${
                              isCompleted
                                ? "bg-zinc-900/40 border-zinc-800/60 opacity-80"
                                : "bg-zinc-900/90 border-zinc-800 shadow-sm hover:border-zinc-700"
                            } ${
                              selectedForMove?.id === cls.id
                                ? "ring-2 ring-emerald-400 border-emerald-500"
                                : ""
                            }`}
                          >
                            <div className="flex items-start sm:items-center gap-4 min-w-0">
                              <button
                                type="button"
                                onClick={() => {
                                  if (selectedForMove?.id === cls.id) {
                                    setSelectedForMove(null);
                                  } else {
                                    setSelectedForMove(cls);
                                    setDayDisplayMode("grade");
                                  }
                                }}
                                className={`p-1.5 rounded-xl border transition shrink-0 hidden sm:flex items-center justify-center ${
                                  selectedForMove?.id === cls.id
                                    ? "bg-emerald-500 text-zinc-950 border-emerald-400"
                                    : "text-zinc-500 hover:text-zinc-200 bg-zinc-950 border-zinc-800"
                                }`}
                                title="Selecionar para mover na grade"
                              >
                                <GripVertical className="w-4 h-4" />
                              </button>

                              <div className="px-3.5 py-2 rounded-2xl bg-zinc-950 border border-zinc-800 text-center font-mono shrink-0">
                                <div className="text-base font-black text-emerald-400">
                                  {cls.startTime}
                                </div>
                                <div className="text-[11px] text-zinc-500">
                                  até {cls.endTime}
                                </div>
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Link
                                    href={`/alunos/${cls.student.id}`}
                                    draggable={false}
                                    onClick={(e) => e.stopPropagation()}
                                    className="font-bold text-zinc-100 text-sm hover:text-emerald-400 transition truncate"
                                  >
                                    {cls.student.name}
                                  </Link>
                                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 flex items-center gap-1">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {cls.location}
                                  </span>
                                </div>

                                {cls.title && (
                                  <p className="text-xs text-zinc-300 mt-1 font-medium truncate">{cls.title}</p>
                                )}
                                {cls.notes && (
                                  <p className="text-[11px] text-zinc-500 mt-0.5 italic truncate">
                                    Obs: {cls.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center border-t sm:border-t-0 pt-3 sm:pt-0 border-zinc-800 w-full sm:w-auto justify-end shrink-0">
                              <button
                                type="button"
                                onClick={() => openMoveModal(cls)}
                                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-xs font-semibold border border-zinc-700/60 transition flex items-center gap-1.5 min-h-[40px]"
                              >
                                <Move className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Remarcar</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenShareOptions(cls);
                                }}
                                className="p-2.5 rounded-xl bg-zinc-800/80 hover:bg-emerald-600/20 text-emerald-400 border border-zinc-700/60 transition min-h-[40px] flex items-center justify-center"
                                title="Enviar aviso de horário ou ficha de treino no WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStatus(cls.id, cls.status)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 min-h-[40px] ${
                                  isCompleted
                                    ? "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold shadow-md shadow-emerald-600/20"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isCompleted ? "Concluída" : "Concluir"}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteClass(cls.id)}
                                className="p-2.5 text-zinc-500 hover:text-rose-400 rounded-xl hover:bg-zinc-800 transition min-h-[40px] flex items-center justify-center"
                                title="Desmarcar aula"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {hasGap && (
                            <div className="flex items-center gap-3 py-1.5 px-2">
                              <div className="flex-1 h-px border-t border-dashed border-zinc-800" />
                              <button
                                type="button"
                                onClick={() => openModalWithTime(cls.endTime, nextCls.startTime)}
                                className="px-3.5 py-1.5 rounded-full bg-zinc-900/90 hover:bg-emerald-500/10 hover:border-emerald-500/40 border border-zinc-800 text-[11px] font-semibold text-zinc-400 hover:text-emerald-400 transition flex items-center gap-1.5 active:scale-95 shadow-sm"
                              >
                                <Coffee className="w-3.5 h-3.5 text-amber-400" />
                                <span>
                                  Horário Livre: {cls.endTime} às {nextCls.startTime}
                                </span>
                                <span className="text-emerald-400 font-bold ml-1">
                                  + Encaixar Aluno
                                </span>
                              </button>
                              <div className="flex-1 h-px border-t border-dashed border-zinc-800" />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                )
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. VISUALIZAÇÃO SEMANAL (7 COLUNAS)                       */}
          {/* ========================================================= */}
          {viewMode === "semana" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {weekDays.map((dayDate) => {
                  const dayStr = format(dayDate, "yyyy-MM-dd");
                  const dayClasses = classes.filter((c) => c.date === dayStr);
                  const isSelected = dayStr === selectedDate;
                  const isCurrentToday = dayStr === "2026-09-19";

                  return (
                    <div
                      key={dayStr}
                      onClick={() => {
                        setSelectedDate(dayStr);
                        setViewMode("dia");
                      }}
                      className={`p-3.5 rounded-3xl border transition cursor-pointer flex flex-col justify-between min-h-[160px] ${
                        isSelected
                          ? "bg-zinc-900 border-emerald-500/50 shadow-md shadow-emerald-500/10"
                          : isCurrentToday
                          ? "bg-zinc-900/80 border-zinc-700"
                          : "bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-900/70"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-zinc-400 uppercase">
                            {format(dayDate, "EEE", { locale: ptBR })}
                          </span>
                          {isCurrentToday && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                              Hoje
                            </span>
                          )}
                        </div>
                        <span className="text-base font-black text-zinc-100 font-mono">
                          {format(dayDate, "dd/MM")}
                        </span>
                      </div>

                      <div className="my-2 space-y-1.5 flex-1">
                        {dayClasses.map((c) => (
                          <div
                            key={c.id}
                            className="p-1.5 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[10px]"
                          >
                            <span className="font-bold text-emerald-400 font-mono block">
                              {c.startTime}
                            </span>
                            <span className="text-zinc-200 truncate block font-medium">
                              {c.student.name.split(" ")[0]}
                            </span>
                          </div>
                        ))}
                      </div>

                      <span className="text-[10px] text-zinc-500 font-medium">
                        {dayClasses.length} {dayClasses.length === 1 ? "aula" : "aulas"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. VISUALIZAÇÃO LISTA COMPACTA                            */}
          {/* ========================================================= */}
          {viewMode === "lista" && (
            <div className="space-y-3">
              {classes.length === 0 ? (
                <div className="p-8 text-center text-zinc-500">
                  Nenhuma aula encontrada nos próximos dias.
                </div>
              ) : (
                classes.map((cls) => (
                  <div
                    key={cls.id}
                    className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 rounded-xl bg-zinc-950 text-center font-mono text-xs">
                        <div className="font-bold text-emerald-400">{cls.startTime}</div>
                        <div className="text-[10px] text-zinc-500">{formatDateShort(cls.date)}</div>
                      </div>
                      <div>
                        <div className="font-bold text-zinc-200 text-sm">{cls.student.name}</div>
                        <div className="text-xs text-zinc-400">
                          {cls.title || "Treino"} • {cls.location}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(cls.id, cls.status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold min-h-[40px] ${
                        cls.status === "COMPLETED" ? "bg-zinc-800 text-zinc-400" : "bg-emerald-600 text-zinc-950"
                      }`}
                    >
                      {cls.status === "COMPLETED" ? "Concluída" : "Concluir"}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ========================================================= */}
          {/* 6. MODAL ERGONÔMICO PARA AGENDAR AULA                    */}
          {/* ========================================================= */}
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 my-auto shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-emerald-400" />
                    <h3 className="font-bold text-zinc-100 text-base">Agendar Nova Aula</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateClass} className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-3.5 overflow-y-auto pr-1 flex-1 py-1">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Aluno *
                    </label>
                    <select
                      required
                      value={modalForm.studentId}
                      onChange={(e) => setModalForm({ ...modalForm, studentId: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Selecione o aluno...</option>
                      {students.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Fichas de Treino do Aluno ou Sugestões Inteligentes */}
                  {modalForm.studentId && (
                    <div className="space-y-2 p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800">
                      {loadingWorkouts ? (
                        <div className="flex items-center gap-2 text-xs text-zinc-400 py-1">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Buscando fichas de treino do aluno...</span>
                        </div>
                      ) : studentWorkouts.length > 0 ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1.5">
                              <Dumbbell className="w-3.5 h-3.5" />
                              Fichas Cadastradas (Clique 1x para escolher)
                            </span>
                            <Link
                              href={`/planos/novo?studentId=${modalForm.studentId}`}
                              target="_blank"
                              className="text-[11px] text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition"
                              title="Montar nova ficha para este aluno"
                            >
                              <span>+ Nova Ficha</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {studentWorkouts.map((w) => {
                              const isSelected = modalForm.title === w.title;
                              return (
                                <button
                                  key={w.id}
                                  type="button"
                                  onClick={() => setModalForm((prev) => ({ ...prev, title: w.title }))}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                                    isSelected
                                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20"
                                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border-zinc-700/70 hover:border-zinc-600"
                                  }`}
                                >
                                  <span>🏋️ {w.title}</span>
                                  {w.exercisesCount ? (
                                    <span
                                      className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                                        isSelected
                                          ? "bg-emerald-600 text-zinc-950 font-bold"
                                          : "bg-zinc-800 text-zinc-400"
                                      }`}
                                    >
                                      {w.exercisesCount} ex.
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              Aluno sem ficha cadastrada. Sugestões:
                            </span>
                            <Link
                              href={`/planos/novo?studentId=${modalForm.studentId}`}
                              target="_blank"
                              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                            >
                              <span>+ Montar Ficha</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              "Avaliação Física / Anamnese",
                              "Adaptação / Treino Geral",
                              "Membros Inferiores & Glúteo",
                              "Membros Superiores & Costas",
                              "Treino Livre / Aeróbico",
                            ].map((preset) => {
                              const isSelected = modalForm.title === preset;
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setModalForm((prev) => ({ ...prev, title: preset }))}
                                  className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition border ${
                                    isSelected
                                      ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-bold"
                                      : "bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border-zinc-800"
                                  }`}
                                >
                                  {preset}
                                </button>
                              );
                            })}
                          </div>
                          {allLibraryPlans.length > 0 && (
                            <div className="pt-2 border-t border-zinc-800/80 space-y-1">
                              <label className="text-[10px] text-zinc-500 uppercase font-bold block">
                                Ou selecionar modelo de outro aluno:
                              </label>
                              <select
                                onChange={(e) => {
                                  const planId = e.target.value;
                                  if (!planId) return;
                                  const found = allLibraryPlans.find((p) => p.id === planId);
                                  if (found) {
                                    setModalForm((prev) => ({ ...prev, title: found.title }));
                                  }
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
                                defaultValue=""
                              >
                                <option value="">Copiar título de outra ficha existente...</option>
                                {allLibraryPlans.map((lib) => (
                                  <option key={lib.id} value={lib.id}>
                                    {lib.title} (Aluno: {lib.student.name})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Título / Foco da Aula
                    </label>
                    <input
                      type="text"
                      value={modalForm.title}
                      onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                      placeholder="Ex: Treino de Inferiores / Glúteo"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Data *</label>
                      <input
                        type="date"
                        required
                        value={modalForm.date}
                        onChange={(e) => setModalForm({ ...modalForm, date: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Local</label>
                      <select
                        value={modalForm.location}
                        onChange={(e) => setModalForm({ ...modalForm, location: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ACADEMIA">Academia</option>
                        <option value="DOMICILIO">Domicílio</option>
                        <option value="ONLINE">Online</option>
                        <option value="PARQUE">Parque / Ar Livre</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Início *</label>
                      <input
                        type="time"
                        step="900"
                        required
                        value={modalForm.startTime}
                        onChange={(e) => setModalForm({ ...modalForm, startTime: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Fim *</label>
                      <input
                        type="time"
                        step="900"
                        required
                        value={modalForm.endTime}
                        onChange={(e) => setModalForm({ ...modalForm, endTime: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Atalhos Rápidos de 15 Minutos & Duração */}
                  <div className="space-y-2 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Variação de Minutos (Início)
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["00", "15", "30", "45"].map((min) => {
                          const currentH = modalForm.startTime.split(":")[0] || "08";
                          const newStart = `${currentH}:${min}`;
                          const isSelected = modalForm.startTime.endsWith(`:${min}`);
                          return (
                            <button
                              key={min}
                              type="button"
                              onClick={() => {
                                const dur = parseMinutes(modalForm.endTime) - parseMinutes(modalForm.startTime) || 60;
                                const newEnd = formatMinutes(parseMinutes(newStart) + dur);
                                setModalForm((prev) => ({ ...prev, startTime: newStart, endTime: newEnd }));
                              }}
                              className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                                isSelected
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-sm"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              :{min}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Duração da Aula
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: "30m", mins: 30 },
                          { label: "45m", mins: 45 },
                          { label: "1h", mins: 60 },
                          { label: "1h15", mins: 75 },
                          { label: "1h30", mins: 90 },
                        ].map((d) => {
                          const dur = parseMinutes(modalForm.endTime) - parseMinutes(modalForm.startTime);
                          const isSelected = dur === d.mins;
                          return (
                            <button
                              key={d.mins}
                              type="button"
                              onClick={() => {
                                const startM = parseMinutes(modalForm.startTime);
                                const newEnd = formatMinutes(startM + d.mins);
                                setModalForm((prev) => ({ ...prev, endTime: newEnd }));
                              }}
                              className={`py-1 rounded-lg text-[11px] font-bold border transition ${
                                isSelected
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {d.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Recorrência Semanal */}
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1 flex items-center gap-1.5">
                      <Repeat className="w-3.5 h-3.5 text-emerald-400" />
                      Repetir Semanalmente
                    </label>
                    <select
                      value={modalForm.recurringWeeks}
                      onChange={(e) => setModalForm({ ...modalForm, recurringWeeks: e.target.value })}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    >
                      <option value="1">Apenas nesta data (Aula única)</option>
                      <option value="4">Repetir por 4 semanas (1 mês)</option>
                      <option value="8">Repetir por 8 semanas (2 meses)</option>
                      <option value="12">Repetir por 12 semanas (3 meses)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">
                      Observações
                    </label>
                    <input
                      type="text"
                      value={modalForm.notes}
                      onChange={(e) => setModalForm({ ...modalForm, notes: e.target.value })}
                      placeholder="Ex: Trazer elásticos ou focar no aquecimento"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Feedback Dinâmico de Choque / Treino em Conjunto */}
                  {(() => {
                    const conflict = checkConflict(modalForm.date, modalForm.startTime, modalForm.endTime);
                    if (conflict.hasConflict) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <span className="font-bold text-amber-300 block">Atenção: Horário já ocupado</span>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                Já existe aula agendada com <strong className="text-white">{conflict.studentName}</strong> ({conflict.timeRange}).
                              </p>
                            </div>
                          </div>
                          <label className="flex items-center gap-2 pt-2 border-t border-amber-500/20 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={modalForm.allowOverlap}
                              onChange={(e) => setModalForm({ ...modalForm, allowOverlap: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-500 bg-zinc-950 border-zinc-700 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                            />
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Permitir Treino em Conjunto (Sessão Compartilhada / Dupla)</span>
                            </div>
                          </label>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Mensagem de Erro do Modal */}
                  {modalError && (
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-xs font-medium text-rose-300">{modalError}</span>
                    </div>
                  )}

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
                      Confirmar Agendamento
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 7. MODAL DE CONFIRMAÇÃO DE REAGENDAMENTO (DRAG & DROP)     */}
          {/* ========================================================= */}
          {isConfirmMoveModalOpen && moveModalData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/85 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 my-auto shadow-2xl max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <Move className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-sm sm:text-base">Confirmar Reagendamento</h3>
                      <p className="text-[11px] text-zinc-400">Verifique o novo horário e conflitos</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsConfirmMoveModalOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveMove} className="space-y-4 overflow-y-auto pr-1">
                  {/* Aluno em destaque */}
                  <div className="p-3 rounded-2xl bg-zinc-950/70 border border-zinc-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Aluno</span>
                      <span className="text-sm font-bold text-zinc-100">{moveModalData.classItem.student.name}</span>
                    </div>
                    {moveModalData.classItem.title && (
                      <span className="text-[11px] px-2.5 py-1 rounded-lg bg-zinc-800 text-zinc-300 font-medium">
                        {moveModalData.classItem.title}
                      </span>
                    )}
                  </div>

                  {/* Comparativo: De -> Para */}
                  <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Alteração de Horário</span>
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="bg-zinc-900 px-3 py-2 rounded-xl border border-zinc-800 text-center flex-1">
                        <span className="text-[10px] text-zinc-500 block">Antes</span>
                        <span className="font-bold text-zinc-400 line-through">
                          {formatDateShort(moveModalData.classItem.date)} às {moveModalData.classItem.startTime}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div className="bg-emerald-500/10 px-3 py-2 rounded-xl border border-emerald-500/20 text-center flex-1">
                        <span className="text-[10px] text-emerald-400/80 block font-bold">Novo</span>
                        <span className="font-bold text-emerald-300">
                          {formatDateShort(moveModalData.newDate)} às {moveModalData.newStartTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback Dinâmico de Conflito */}
                  {(() => {
                    const conflict = checkConflict(
                      moveModalData.newDate,
                      moveModalData.newStartTime,
                      moveModalData.newEndTime,
                      moveModalData.classItem.id
                    );

                    if (conflict.hasConflict) {
                      return (
                        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-2.5">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                            <div className="text-xs space-y-1">
                              <span className="font-bold text-rose-300 block">Atenção: Choque de Horário detectado!</span>
                              <p className="text-zinc-300 text-[11px] leading-relaxed">
                                Já existe uma aula agendada com <strong className="text-white">{conflict.studentName}</strong> das <strong className="text-white">{conflict.timeRange}</strong>.
                              </p>
                            </div>
                          </div>

                          <label className="flex items-center gap-2 pt-2 border-t border-rose-500/20 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={moveModalData.allowOverlap}
                              onChange={(e) => setMoveModalData({ ...moveModalData, allowOverlap: e.target.checked })}
                              className="w-4 h-4 rounded text-emerald-500 bg-zinc-950 border-zinc-700 focus:ring-emerald-500 focus:ring-offset-zinc-900"
                            />
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-200">
                              <Users className="w-3.5 h-3.5 text-indigo-400" />
                              <span>Confirmar como Treino em Conjunto (Sessão Compartilhada / Dupla)</span>
                            </div>
                          </label>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-xs font-medium text-emerald-300">
                          Horário 100% livre! Sem conflitos de agenda.
                        </span>
                      </div>
                    );
                  })()}

                  {/* Campos Editáveis: Data, Horários, Local, Notas */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Nova Data *</label>
                      <input
                        type="date"
                        required
                        value={moveModalData.newDate}
                        onChange={(e) => setMoveModalData({ ...moveModalData, newDate: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Local</label>
                      <select
                        value={moveModalData.location}
                        onChange={(e) => setMoveModalData({ ...moveModalData, location: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="ACADEMIA">Academia</option>
                        <option value="DOMICILIO">Domicílio</option>
                        <option value="ONLINE">Online</option>
                        <option value="PARQUE">Parque / Ar Livre</option>
                        <option value="OUTRO">Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Início *</label>
                      <input
                        type="time"
                        step="900"
                        required
                        value={moveModalData.newStartTime}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          const duration = parseMinutes(moveModalData.newEndTime) - parseMinutes(moveModalData.newStartTime) || 60;
                          const newEnd = formatMinutes(parseMinutes(newStart) + duration);
                          setMoveModalData({ ...moveModalData, newStartTime: newStart, newEndTime: newEnd });
                        }}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-zinc-300 block mb-1">Fim *</label>
                      <input
                        type="time"
                        step="900"
                        required
                        value={moveModalData.newEndTime}
                        onChange={(e) => setMoveModalData({ ...moveModalData, newEndTime: e.target.value })}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Atalhos Rápidos de 15 Minutos & Duração no Reagendamento */}
                  <div className="space-y-2 p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800/80">
                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Variação de Minutos (Início)
                      </label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["00", "15", "30", "45"].map((min) => {
                          const currentH = moveModalData.newStartTime.split(":")[0] || "08";
                          const newStart = `${currentH}:${min}`;
                          const isSelected = moveModalData.newStartTime.endsWith(`:${min}`);
                          return (
                            <button
                              key={min}
                              type="button"
                              onClick={() => {
                                const duration = parseMinutes(moveModalData.newEndTime) - parseMinutes(moveModalData.newStartTime) || 60;
                                const newEnd = formatMinutes(parseMinutes(newStart) + duration);
                                setMoveModalData({
                                  ...moveModalData,
                                  newStartTime: newStart,
                                  newEndTime: newEnd,
                                });
                              }}
                              className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition ${
                                isSelected
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-400 font-black shadow-sm"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              :{min}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                        Duração do Treino
                      </label>
                      <div className="grid grid-cols-5 gap-1">
                        {[
                          { label: "30m", mins: 30 },
                          { label: "45m", mins: 45 },
                          { label: "1h", mins: 60 },
                          { label: "1h15", mins: 75 },
                          { label: "1h30", mins: 90 },
                        ].map((dur) => {
                          const currentDur = parseMinutes(moveModalData.newEndTime) - parseMinutes(moveModalData.newStartTime);
                          const isSelected = currentDur === dur.mins;
                          return (
                            <button
                              key={dur.mins}
                              type="button"
                              onClick={() => {
                                const startM = parseMinutes(moveModalData.newStartTime);
                                const newEnd = formatMinutes(startM + dur.mins);
                                setMoveModalData({
                                  ...moveModalData,
                                  newEndTime: newEnd,
                                });
                              }}
                              className={`py-1 rounded-lg text-[11px] font-bold border transition text-center ${
                                isSelected
                                  ? "bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              }`}
                            >
                              {dur.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-zinc-300 block mb-1">Observações da Remarcação</label>
                    <input
                      type="text"
                      value={moveModalData.notes}
                      onChange={(e) => setMoveModalData({ ...moveModalData, notes: e.target.value })}
                      placeholder="Ex: Reagendado a pedido do aluno via WhatsApp"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {moveError && (
                    <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{moveError}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsConfirmMoveModalOpen(false)}
                      className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 min-h-[44px] transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={moveSaving}
                      className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md transition min-h-[44px] flex items-center gap-2 disabled:opacity-50"
                    >
                      {moveSaving ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 stroke-[2.5]" />
                          Confirmar Alteração
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 8. TOAST DE CONFIRMAÇÃO COM WHATSAPP (PÓS-REAGENDAMENTO)   */}
          {/* ========================================================= */}
          {lastMovedClass && (
            <aside
              aria-label="Notificação de reagendamento"
              className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 max-w-sm w-[calc(100%-2rem)] bg-zinc-900 border border-emerald-500/40 rounded-3xl p-4 shadow-2xl shadow-emerald-950/50 flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5 duration-200"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100">Aula Reagendada!</h4>
                    <p className="text-[11px] text-zinc-400">
                      {lastMovedClass.studentName} para {formatDateShort(lastMovedClass.date)} às {lastMovedClass.startTime}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLastMovedClass(null)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {lastMovedClass.phone && (
                <a
                  href={buildWhatsAppLink(
                    lastMovedClass.phone,
                    `Olá ${lastMovedClass.studentName.split(" ")[0]}! Sua aula foi reagendada para ${formatDateShort(
                      lastMovedClass.date
                    )} às ${lastMovedClass.startTime}. Qualquer dúvida me avise! 💪`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center justify-center gap-2 transition shadow-md"
                >
                  <MessageCircle className="w-4 h-4" />
                  Avisar {lastMovedClass.studentName.split(" ")[0]} no WhatsApp
                </a>
              )}
            </aside>
          )}

          {/* ========================================================= */}
          {/* 8.1 MODAL DE OPÇÕES DE ENVIO: HORÁRIO VS FICHA DE TREINO  */}
          {/* ========================================================= */}
          {sharingClass && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <MessageCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-zinc-100 text-base">
                        Enviar para o Aluno
                      </h3>
                      <p className="text-xs text-zinc-400">
                        {sharingClass.student.name} • {formatDateShort(sharingClass.date)} às {sharingClass.startTime}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSharingClass(null)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-xl transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Opções */}
                <div className="p-6 space-y-4 overflow-y-auto">
                  {/* Opção 1: Aviso de Horário */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                        1. Confirmar Horário da Aula
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 italic">
                      "Olá, {sharingClass.student.name.split(" ")[0]}! Confirmando nossa aula dia {formatDateShort(sharingClass.date)} às {sharingClass.startTime}. Nos vemos lá! 💪"
                    </p>
                    <a
                      href={buildWhatsAppLink(
                        sharingClass.student.phone,
                        `Olá, ${sharingClass.student.name.split(" ")[0]}! Confirmando nossa aula dia ${formatDateShort(sharingClass.date)} às ${sharingClass.startTime}. Nos vemos lá! 💪`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setSharingClass(null)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs border border-zinc-700/60 transition"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Enviar Confirmação de Horário</span>
                    </a>
                  </div>

                  {/* Opção 2: Ficha de Treino */}
                  <div className="p-4 rounded-2xl bg-zinc-950 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                          2. Enviar Ficha de Treino
                        </span>
                      </div>
                      {studentPlansForShare.length > 0 && (
                        <span className="text-[11px] font-bold text-zinc-400">
                          {studentPlansForShare.length} ficha(s)
                        </span>
                      )}
                    </div>

                    {loadingStudentPlans ? (
                      <div className="py-6 text-center text-xs text-zinc-500">
                        Buscando treinos prescritos do aluno...
                      </div>
                    ) : studentPlansForShare.length === 0 ? (
                      <div className="py-4 text-center space-y-2">
                        <p className="text-xs text-zinc-400">
                          Este aluno ainda não possui uma ficha de treino montada.
                        </p>
                        <Link
                          href={`/planos/novo?studentId=${sharingClass.studentId}`}
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Montar Treino Agora</span>
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        <p className="text-[11px] text-zinc-400">
                          Selecione o plano de treino para compartilhar:
                        </p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {studentPlansForShare.map((plan) => (
                            <div
                              key={plan.id}
                              className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 hover:border-emerald-500/40 transition"
                            >
                              <div className="min-w-0">
                                <h4 className="font-bold text-zinc-100 text-xs truncate">
                                  {plan.title}
                                </h4>
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  {plan.exercises?.length || 0} exercícios • {plan.goal || "Geral"}
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  const workoutToShare = {
                                    ...plan,
                                    student: {
                                      name: sharingClass.student.name,
                                      phone: sharingClass.student.phone,
                                    },
                                  };
                                  setActiveShareWorkout(workoutToShare);
                                  setSharingClass(null);
                                }}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs flex items-center gap-1 shrink-0 transition"
                              >
                                <Share2 className="w-3.5 h-3.5" />
                                <span>Enviar Treino</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal de Envio e Compartilhamento da Ficha */}
          {activeShareWorkout && (
            <ShareWorkoutModal
              isOpen={!!activeShareWorkout}
              onClose={() => setActiveShareWorkout(null)}
              workout={activeShareWorkout}
            />
          )}

          {/* ========================================================= */}
          {/* 9. BOTÃO FLUTUANTE (FAB) NO MOBILE                        */}
          {/* ========================================================= */}
          <button
            type="button"
            onClick={() => {
              setModalForm((prev) => ({ ...prev, date: selectedDate }));
              setIsModalOpen(true);
            }}
            className="fixed bottom-24 right-5 md:hidden z-40 w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-2xl shadow-emerald-500/40 active:scale-90 transition"
            title="Agendar Nova Aula"
          >
            <Plus className="w-7 h-7 stroke-[2.5]" />
          </button>
        </main>
      </div>
    </div>
  );
}

export default function AgendaPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<div className="p-8 text-zinc-400">Carregando agenda...</div>}>
        <AgendaContent />
      </Suspense>
    </AuthGuard>
  );
}
