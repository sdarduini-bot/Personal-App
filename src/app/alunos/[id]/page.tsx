"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import Navigation from "@/components/Navigation";
import Header from "@/components/Header";
import ShareWorkoutModal from "@/components/ShareWorkoutModal";
import {
  Users,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  Wallet,
  Dumbbell,
  Clock,
  Edit,
  Edit3,
  Trash2,
  Plus,
  MessageCircle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Share2,
  ExternalLink,
  Target,
  Check,
  Copy,
  X,
  Sparkles,
  CheckCheck,
  Zap,
  Package,
  Activity,
  Camera,
} from "lucide-react";
import {
  formatCurrency,
  formatDateShort,
  formatDateLong,
  buildWhatsAppLink,
  formatPhone,
} from "@/lib/formatters";
import { clearCache } from "@/lib/cache";
import AssessmentModal from "@/components/AssessmentModal";
import AssessmentHistoryChart from "@/components/AssessmentHistoryChart";
import { buildAssessmentWhatsAppText } from "@/lib/bodyComposition";
import AvatarUploadModal from "@/components/AvatarUploadModal";
import BeforeAfterSlider from "@/components/BeforeAfterSlider";

const FREQUENCY_PRESETS = [
  { freq: "1x/sem", fee: "180", name: "Presencial 1x/sem" },
  { freq: "2x/sem", fee: "280", name: "Presencial 2x/sem" },
  { freq: "3x/sem", fee: "380", name: "Presencial 3x/sem" },
  { freq: "4x/sem", fee: "480", name: "Presencial 4x/sem" },
  { freq: "Diário", fee: "600", name: "Personal Diário" },
  { freq: "Consultoria", fee: "180", name: "Consultoria VIP" },
];

const PLAN_PRESETS = [
  { name: "Presencial 3x/sem", fee: "380", label: "🏋️ Presencial 3x (R$ 380)" },
  { name: "Presencial 2x/sem", fee: "280", label: "⚡ Presencial 2x (R$ 280)" },
  { name: "Consultoria VIP", fee: "180", label: "📱 Consultoria (R$ 180)" },
  { name: "Personal Diário", fee: "600", label: "🔥 Diário (R$ 600)" },
];

interface StudentFull {
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
  avatarUrl?: string | null;
  stats: {
    totalPaid: number;
    totalPending: number;
    hasPendingPayment: boolean;
    completedClasses: number;
    scheduledClasses: number;
    totalWorkoutPlans: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    referenceMonth: string;
    dueDate: string;
    paidAt: string | null;
    status: string;
    paymentMethod: string | null;
    notes: string | null;
  }>;
  classes: Array<{
    id: string;
    title: string | null;
    date: string;
    startTime: string;
    endTime: string;
    location: string;
    status: string;
    notes: string | null;
  }>;
  workoutPlans: Array<{
    id: string;
    title: string;
    goal: string | null;
    notes: string | null;
    shareToken: string;
    createdAt: string;
    exercises: Array<{
      id: string;
      name: string;
      sets: string;
      reps: string;
      load: string | null;
      restSeconds: number;
      notes: string | null;
    }>;
  }>;
  gender?: string | null;
  assessments?: Array<{
    id: string;
    date: string;
    protocol: string;
    gender: string;
    age: number;
    weight: number;
    height: number;
    targetBodyFat: number;
    subscapular?: number | null;
    chest?: number | null;
    suprailiac?: number | null;
    thigh?: number | null;
    triceps?: number | null;
    midaxillary?: number | null;
    abdominal?: number | null;
    directBodyFat?: number | null;
    neck?: number | null;
    shoulders?: number | null;
    chestCirc?: number | null;
    waist?: number | null;
    abdomenCirc?: number | null;
    hip?: number | null;
    rightArmRelaxed?: number | null;
    leftArmRelaxed?: number | null;
    rightArmContracted?: number | null;
    leftArmContracted?: number | null;
    rightForearm?: number | null;
    leftForearm?: number | null;
    rightThigh?: number | null;
    leftThigh?: number | null;
    rightCalf?: number | null;
    leftCalf?: number | null;
    bodyFatPercent: number;
    fatMass: number;
    leanMass: number;
    idealWeight: number;
    excessWeight: number;
    imc?: number | null;
    rcq?: number | null;
    sumFolds?: number | null;
    bodyDensity?: number | null;
    notes?: string | null;
    photoToken?: string | null;
    photos?: Array<{
      id: string;
      type: string;
      url: string;
      thumbnailUrl?: string | null;
      notes?: string | null;
    }>;
    createdAt: string;
  }>;
}

export default function StudentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const studentId = params.id as string;

  const [student, setStudent] = useState<StudentFull | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"dados" | "financeiro" | "agenda" | "treinos" | "avaliacoes">("dados");

  // Modal de avaliação física
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [selectedAssessmentToEdit, setSelectedAssessmentToEdit] = useState<any | null>(null);

  // Modais de fotos e evolução
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isBeforeAfterOpen, setIsBeforeAfterOpen] = useState(false);

  // Modal de compartilhamento de treino
  const [selectedWorkout, setSelectedWorkout] = useState<any | null>(null);

  // Modal de edição de aluno e plano
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [trainerPixKey, setTrainerPixKey] = useState("pedro.personal@email.com");
  const [copiedPix, setCopiedPix] = useState(false);
  const [editForm, setEditForm] = useState({
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
    packageRemainingClasses: "10",
    packageTotalValue: "800",
    status: "ACTIVE",
    notes: "",
    gender: "MALE",
  });

  // Modal nova cobrança
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    dueDate: "",
    referenceMonth: "",
    notes: "",
  });

  // Modal agendar aula
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classForm, setClassForm] = useState({
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "08:00",
    endTime: "09:00",
    location: "ACADEMIA",
    notes: "",
  });

  const fetchStudent = async () => {
    try {
      const res = await fetch(`/api/students/${studentId}/full`);
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
        setPaymentForm((prev) => ({
          ...prev,
          amount: String(data.monthlyFee),
          referenceMonth: `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`,
          dueDate: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(data.dueDay).padStart(2, "0")}`,
        }));
      } else {
        router.push("/alunos");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.pixKey) setTrainerPixKey(data.pixKey);
      })
      .catch(() => {});
  }, [studentId]);

  const openEditModal = () => {
    if (!student) return;
    setEditForm({
      name: student.name || "",
      phone: formatPhone(student.phone || ""),
      email: student.email || "",
      birthDate: student.birthDate ? student.birthDate.split("T")[0] : "",
      gender: student.gender || "MALE",
      goal: student.goal || "Hipertrofia",
      billingType: (student.billingType as any) || "MONTHLY",
      frequency: student.frequency || "3x/sem",
      planName: student.planName || "Presencial 3x/sem",
      monthlyFee: String(student.monthlyFee ?? 380),
      dueDay: String(student.dueDay ?? 10),
      pricePerSession: String(student.pricePerSession ?? 90),
      paymentTiming: (student.paymentTiming as any) || "POST_CLASS",
      packageTotalClasses: String(student.packageTotalClasses ?? 10),
      packageRemainingClasses: String(student.packageRemainingClasses ?? student.packageTotalClasses ?? 10),
      packageTotalValue: String(student.monthlyFee ?? 800),
      status: student.status || "ACTIVE",
      notes: student.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      alert("Nome e telefone são obrigatórios.");
      return;
    }
    setEditSaving(true);
    try {
      const payload = {
        ...editForm,
        monthlyFee:
          editForm.billingType === "PER_CLASS"
            ? 0
            : editForm.billingType === "PACKAGE"
            ? parseFloat(editForm.packageTotalValue) || 0
            : parseFloat(editForm.monthlyFee) || 0,
        pricePerSession: parseFloat(editForm.pricePerSession) || 0,
        dueDay: parseInt(editForm.dueDay) || 10,
        packageTotalClasses:
          editForm.billingType === "PACKAGE"
            ? parseInt(editForm.packageTotalClasses) || 10
            : null,
        packageRemainingClasses:
          editForm.billingType === "PACKAGE"
            ? parseInt(editForm.packageRemainingClasses) || parseInt(editForm.packageTotalClasses) || 10
            : null,
      };

      const res = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        clearCache("/api/students");
        clearCache("/api/dashboard");
        clearCache("/api/payments");
        await fetchStudent();
        setIsEditModalOpen(false);
      } else {
        const data = await res.json();
        alert(data.error || "Erro ao atualizar dados do aluno.");
      }
    } catch (err) {
      console.error("Erro ao salvar edição:", err);
      alert("Falha ao se conectar com o servidor.");
    } finally {
      setEditSaving(false);
    }
  };

  const handleCopyPix = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Alternar pagamento com 1 clique
  const handleTogglePayment = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/toggle`, { method: "POST" });
      if (res.ok) {
        clearCache("/api/students");
        clearCache("/api/dashboard");
        clearCache("/api/payments");
        fetchStudent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Alternar status da aula
  const handleClassStatus = async (classId: string, currentStatus: string) => {
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
        fetchStudent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Criar nova cobrança para o aluno
  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          ...paymentForm,
        }),
      });
      if (res.ok) {
        clearCache("/api/students");
        clearCache("/api/dashboard");
        clearCache("/api/payments");
        setIsPaymentModalOpen(false);
        fetchStudent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Agendar nova aula
  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          ...classForm,
        }),
      });
      if (res.ok) {
        clearCache("/api/classes");
        clearCache("/api/dashboard");
        setIsClassModalOpen(false);
        fetchStudent();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Excluir avaliação física
  const handleDeleteAssessment = async (assessmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta avaliação física? Esta ação não pode ser desfeita.")) {
      return;
    }
    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, { method: "DELETE" });
      if (res.ok) {
        clearCache("/api/students");
        fetchStudent();
      } else {
        alert("Erro ao excluir avaliação.");
      }
    } catch (err) {
      console.error(err);
      alert("Falha de conexão ao excluir avaliação.");
    }
  };

  // Compartilhar avaliação via WhatsApp
  const handleShareAssessmentWhatsApp = (assessment: any) => {
    if (!student) return;
    const sorted = [...(student.assessments || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const currentIndex = sorted.findIndex((a) => a.id === assessment.id);
    const prev = currentIndex > 0 ? sorted[currentIndex - 1] : null;

    const message = buildAssessmentWhatsAppText(
      student.name,
      assessment.date,
      assessment,
      assessment.weight,
      prev,
      "Pedro Personal"
    );

    const link = buildWhatsAppLink(student.phone, message);
    window.open(link, "_blank");
  };

  // Solicitar fotos da avaliação ao aluno via WhatsApp (Link Mágico)
  const handleRequestPhotosWhatsApp = (assessment: any) => {
    if (!student) return;
    const token = assessment.photoToken;
    if (!token) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const linkFotos = `${origin}/fotos/${token}`;
    const msg = `Olá ${student.name.split(" ")[0]}! 📸\n\nAqui está seu link seguro para enviar as fotos da avaliação física de ${formatDateShort(assessment.date)}:\n\n👉 ${linkFotos}\n\nLembre-se de apoiar o celular na altura da cintura e manter boa iluminação! Suas fotos ficam salvas de forma 100% privada.`;
    const link = buildWhatsAppLink(student.phone, msg);
    window.open(link, "_blank");
  };

  // Excluir aluno
  const handleDeleteStudent = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${student?.name}? Isso removerá histórico e treinos.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      if (res.ok) {
        clearCache("/api/students");
        clearCache("/api/dashboard");
        clearCache("/api/payments");
        router.push("/alunos");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex pb-20 md:pb-8">
        <Navigation />

        <div className="flex-1 md:pl-64 flex flex-col min-w-0">
          <Header title="Perfil do Aluno" subtitle={student?.name} />

          <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6">
            {/* Botão Voltar */}
            <Link
              href="/alunos"
              className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-emerald-400 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar para Lista de Alunos</span>
            </Link>

            {loading || !student ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
                <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                <span className="text-xs">Carregando dados do aluno...</span>
              </div>
            ) : (
              <>
                {/* 1. BANNER PRINCIPAL DO ALUNO */}
                <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start sm:items-center gap-4">
                    <div className="relative group shrink-0">
                      <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-500/20 overflow-hidden">
                        <div className="w-full h-full bg-zinc-900 rounded-[22px] flex items-center justify-center text-xl font-bold text-emerald-400 overflow-hidden">
                          {student.avatarUrl ? (
                            <img
                              src={student.avatarUrl}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            student.name.charAt(0).toUpperCase()
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAvatarModalOpen(true)}
                        className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-md transition active:scale-95"
                        title="Alterar foto do aluno"
                      >
                        <Camera className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-bold text-zinc-100 tracking-tight">
                          {student.name}
                        </h2>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                            student.status === "ACTIVE"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : "bg-zinc-800 text-zinc-400 border border-zinc-700"
                          }`}
                        >
                          {student.status === "ACTIVE" ? "Ativo" : "Inativo"}
                        </span>
                        <button
                          type="button"
                          onClick={openEditModal}
                          className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-emerald-400 border border-zinc-700/80 text-xs font-semibold transition active:scale-95 shadow-sm ml-auto sm:ml-2"
                        >
                          <Edit className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Editar Aluno & Plano</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-zinc-400">
                        <a
                          href={buildWhatsAppLink(student.phone, `Olá ${student.name.split(" ")[0]}!`)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-emerald-400 hover:underline font-medium"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>{formatPhone(student.phone)}</span>
                        </a>
                        {student.email && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <Mail className="w-3.5 h-3.5" />
                            {student.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Números rápidos do aluno */}
                  <div className="flex items-center gap-3 self-stretch md:self-auto justify-between sm:justify-start">
                    <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center flex-1 sm:flex-initial">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Mensalidade</span>
                      <span className="text-sm font-black text-emerald-400 font-mono">
                        {formatCurrency(student.monthlyFee)}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center flex-1 sm:flex-initial">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Aulas Feitas</span>
                      <span className="text-sm font-black text-zinc-200 font-mono">
                        {student.stats.completedClasses}
                      </span>
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center flex-1 sm:flex-initial">
                      <span className="text-[10px] text-zinc-500 block uppercase font-bold">Treinos Ativos</span>
                      <span className="text-sm font-black text-zinc-200 font-mono">
                        {student.stats.totalWorkoutPlans}
                      </span>
                    </div>
                    {student.assessments && student.assessments.length > 0 && (
                      <div className="px-4 py-2.5 rounded-2xl bg-zinc-950 border border-zinc-800 text-center flex-1 sm:flex-initial">
                        <span className="text-[10px] text-zinc-500 block uppercase font-bold">Gordura Atual</span>
                        <span className="text-sm font-black text-emerald-400 font-mono">
                          {student.assessments[0].bodyFatPercent.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. ABAS DE NAVEGAÇÃO INTERNA */}
                <div className="flex border-b border-zinc-800 overflow-x-auto scrollbar-none">
                  {[
                    { id: "dados", label: "Dados e Anamnese", icon: Users },
                    {
                      id: "avaliacoes",
                      label: "Composição & Avaliações",
                      icon: Activity,
                      badge: student.assessments && student.assessments.length > 0 ? student.assessments.length : null,
                    },
                    { id: "financeiro", label: "Situação Financeira", icon: Wallet },
                    { id: "agenda", label: "Agenda de Aulas", icon: Calendar },
                    { id: "treinos", label: "Planos de Treino", icon: Dumbbell },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 text-xs md:text-sm font-semibold border-b-2 transition shrink-0 ${
                          isActive
                            ? "border-emerald-500 text-emerald-400 bg-emerald-500/5"
                            : "border-transparent text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                        {tab.badge != null && (
                          <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400 font-mono">
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* 3. CONTEÚDO DAS ABAS */}

                {/* ABA 1: DADOS E ANAMNESE */}
                {activeTab === "dados" && (
                  <div className="space-y-6">
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">Objetivo Principal</span>
                        <p className="text-sm font-bold text-zinc-200 mt-1">{student.goal}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">Plano Contratado</span>
                        <p className="text-sm font-bold text-zinc-200 mt-1">
                          {student.billingType === "PER_CLASS"
                            ? `Avulso (${formatCurrency(student.pricePerSession ?? 90)}/treino)`
                            : student.billingType === "PACKAGE"
                            ? `${student.planName || "Pacote"} (${student.packageTotalClasses ?? 10} aulas)`
                            : student.planName || "Presencial 3x/sem"}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">
                          {student.billingType === "PER_CLASS" ? "Forma de Cobrança" : "Dia de Vencimento"}
                        </span>
                        <p className="text-sm font-bold text-zinc-200 mt-1">
                          {student.billingType === "PER_CLASS"
                            ? student.paymentTiming === "PRE_CLASS"
                              ? "Antes do Treino (Pré-pago)"
                              : "Após o Treino (Pós-pago)"
                            : `Dia ${student.dueDay} de cada mês`}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">Data de Início</span>
                        <p className="text-sm font-bold text-zinc-200 mt-1">{formatDateLong(student.startDate)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">Data de Nascimento</span>
                        <p className="text-sm font-bold text-zinc-200 mt-1">{formatDateShort(student.birthDate) || "Não informada"}</p>
                      </div>
                      <div>
                        <span className="text-xs text-zinc-500 uppercase font-semibold block">Total Pago até Hoje</span>
                        <p className="text-sm font-bold text-emerald-400 font-mono mt-1">{formatCurrency(student.stats.totalPaid)}</p>
                      </div>
                    </div>

                    {/* Observações / Anamnese */}
                    <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6">
                      <h3 className="text-sm font-bold text-zinc-200 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        Observações, Lesões e Restrições
                      </h3>
                      {student.notes ? (
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {student.notes}
                        </p>
                      ) : (
                        <p className="text-xs text-zinc-500 italic">Nenhuma observação registrada.</p>
                      )}
                    </div>

                    {/* Ações do Aluno */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={openEditModal}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition active:scale-95 shadow-md shadow-emerald-600/20"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Editar Aluno & Plano Financeiro</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDeleteStudent}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 text-xs font-semibold transition"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Excluir Aluno</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ABA 2: FINANCEIRO */}
                {activeTab === "financeiro" && (
                  <div className="space-y-5">
                    {/* Resumo do Contrato & Chave PIX */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Card do Plano Contratado */}
                      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between gap-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                              {student.billingType === "PER_CLASS"
                                ? "Modelo Avulso"
                                : student.billingType === "PACKAGE"
                                ? "Pacote de Aulas"
                                : "Plano Ativo"}
                            </span>
                            <h4 className="text-base font-bold text-zinc-100 mt-0.5">
                              {student.billingType === "PER_CLASS"
                                ? "Treino Avulso / Por Aula"
                                : student.planName || "Plano Personal"}
                            </h4>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {student.billingType === "PER_CLASS"
                                ? student.paymentTiming === "PRE_CLASS"
                                  ? "⚡ Cobrança antecipada (confirmação)"
                                  : "⚡ Cobrança após o treino realizado"
                                : student.billingType === "PACKAGE"
                                ? `📦 Saldo: ${student.packageRemainingClasses ?? 0} de ${student.packageTotalClasses ?? 10} aulas`
                                : `🗓️ Frequência: ${student.frequency || "3x/sem"}`}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={openEditModal}
                            className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-emerald-400 text-xs font-semibold border border-zinc-700/60 transition flex items-center gap-1.5"
                          >
                            <Edit className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Alterar Plano</span>
                          </button>
                        </div>

                        <div className="flex items-center gap-4 pt-2 border-t border-zinc-800/80">
                          {student.billingType === "PER_CLASS" ? (
                            <>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Por Treino</span>
                                <span className="text-lg font-black text-amber-400 font-mono">
                                  {formatCurrency(student.pricePerSession || 90)}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Cobrança</span>
                                <span className="text-sm font-bold text-zinc-200">
                                  {student.paymentTiming === "PRE_CLASS" ? "Pré-treino" : "Pós-treino"}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Pago</span>
                                <span className="text-sm font-bold font-mono text-emerald-400">
                                  {formatCurrency(student.stats.totalPaid)}
                                </span>
                              </div>
                            </>
                          ) : student.billingType === "PACKAGE" ? (
                            <>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Valor Pacote</span>
                                <span className="text-lg font-black text-cyan-400 font-mono">
                                  {formatCurrency(student.monthlyFee)}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Aulas Restantes</span>
                                <span className="text-sm font-bold text-cyan-300">
                                  {student.packageRemainingClasses ?? 0} de {student.packageTotalClasses ?? 10}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Pendente</span>
                                <span className={`text-sm font-bold font-mono ${student.stats.totalPending > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                                  {formatCurrency(student.stats.totalPending)}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Valor Mensal</span>
                                <span className="text-lg font-black text-emerald-400 font-mono">
                                  {formatCurrency(student.monthlyFee)}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Vencimento</span>
                                <span className="text-sm font-bold text-zinc-200">
                                  Todo dia {student.dueDay}
                                </span>
                              </div>
                              <div className="border-l border-zinc-800 pl-4">
                                <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Pendente</span>
                                <span className={`text-sm font-bold font-mono ${student.stats.totalPending > 0 ? "text-amber-400" : "text-zinc-400"}`}>
                                  {formatCurrency(student.stats.totalPending)}
                                </span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Card da Chave PIX do Personal */}
                      <div className="p-5 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between gap-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block">
                            Chave PIX Cadastrada
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <code className="text-xs font-mono font-bold text-zinc-200 bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 truncate max-w-full">
                              {trainerPixKey || "Não configurada"}
                            </code>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80">
                          <button
                            type="button"
                            onClick={() => handleCopyPix(trainerPixKey)}
                            className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700/60 transition flex items-center justify-center gap-1.5 active:scale-95"
                          >
                            {copiedPix ? (
                              <>
                                <CheckCheck className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Chave PIX Copiada!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-zinc-400" />
                                <span>Copiar Chave PIX</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Cabeçalho da lista */}
                    <div className="flex items-center justify-between pt-2">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">
                          {student.billingType === "PER_CLASS"
                            ? "Histórico de Treinos e Cobranças"
                            : student.billingType === "PACKAGE"
                            ? "Faturas do Pacote"
                            : "Histórico de Mensalidades"}
                        </h3>
                        <p className="text-xs text-zinc-400">
                          {student.billingType === "PER_CLASS"
                            ? "Controle de pagamentos por treino realizado ou agendado."
                            : "Controle de mensalidades geradas, cobrança e status."}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition active:scale-95 shadow-md shadow-emerald-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nova Cobrança</span>
                      </button>
                    </div>

                    {student.payments.length === 0 ? (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
                        <Wallet className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-300">Nenhum pagamento registrado.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {student.payments.map((p) => {
                          const isPaid = p.status === "PAID";
                          const isOverdue = !isPaid && new Date(p.dueDate + "T23:59:59") < new Date();

                          const whatsappMessage =
                            student.billingType === "PER_CLASS"
                              ? `Olá ${student.name.split(" ")[0]}! Segue a cobrança do seu treino (${p.referenceMonth}) no valor de ${formatCurrency(p.amount)}. Minha chave PIX é: ${trainerPixKey}. Assim que realizar o pagamento, me avise por aqui! Obrigado!`
                              : student.billingType === "PACKAGE"
                              ? `Olá ${student.name.split(" ")[0]}! Segue a cobrança do seu pacote de treinos no valor de ${formatCurrency(p.amount)}. Vencimento: ${formatDateShort(p.dueDate)}. Minha chave PIX é: ${trainerPixKey}. Qualquer dúvida estou à disposição!`
                              : `Olá ${student.name.split(" ")[0]}! Segue a cobrança da sua mensalidade (${p.referenceMonth}) no valor de ${formatCurrency(p.amount)}. Vencimento: ${formatDateShort(p.dueDate)}. Minha chave PIX é: ${trainerPixKey}. Assim que realizar o pagamento, me avise por aqui! Abraço!`;

                          return (
                            <div
                              key={p.id}
                              className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-zinc-700"
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`w-11 h-11 rounded-2xl flex items-center justify-center font-mono text-xs font-bold shrink-0 ${
                                    isPaid
                                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                      : isOverdue
                                      ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                      : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  }`}
                                >
                                  {p.referenceMonth}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-black text-zinc-100 font-mono">
                                      {formatCurrency(p.amount)}
                                    </span>
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                        isPaid
                                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                          : isOverdue
                                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                      }`}
                                    >
                                      {isPaid ? "Pago" : isOverdue ? "Atrasado" : "Pendente"}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-zinc-400 mt-0.5">
                                    Vencimento: {formatDateShort(p.dueDate)}
                                    {p.paidAt && ` • Pago em ${formatDateShort(p.paidAt)}`}
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                                {!isPaid && (
                                  <a
                                    href={buildWhatsAppLink(student.phone, whatsappMessage)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                                    title="Enviar lembrete amigável via WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>Cobrar WhatsApp</span>
                                  </a>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleTogglePayment(p.id)}
                                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                                    isPaid
                                      ? "bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 hover:bg-zinc-800"
                                      : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950 shadow-sm"
                                  }`}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isPaid ? "Recebido (clique p/ desfazer)" : "Marcar como Pago"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 3: AGENDA DE AULAS */}
                {activeTab === "agenda" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">Aulas do Aluno</h3>
                        <p className="text-xs text-zinc-400">
                          Horários agendados e histórico de presenças.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsClassModalOpen(true)}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Agendar Aula</span>
                      </button>
                    </div>

                    {student.classes.length === 0 ? (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
                        <Calendar className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-300">Nenhuma aula agendada para este aluno.</p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {student.classes.map((cls) => {
                          const isCompleted = cls.status === "COMPLETED";
                          return (
                            <div
                              key={cls.id}
                              className={`p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                                isCompleted
                                  ? "bg-zinc-900/40 border-zinc-800/60 opacity-75"
                                  : "bg-zinc-900/80 border-zinc-800"
                              }`}
                            >
                              <div className="flex items-center gap-3.5">
                                <div className="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-center font-mono">
                                  <div className="text-xs font-bold text-emerald-400">{cls.startTime}</div>
                                  <div className="text-[10px] text-zinc-500">{formatDateShort(cls.date)}</div>
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-zinc-200 text-sm">
                                      {cls.title || "Aula de Personal"}
                                    </span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                                      {cls.location}
                                    </span>
                                  </div>
                                  {cls.notes && (
                                    <p className="text-xs text-zinc-400 mt-0.5">{cls.notes}</p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleClassStatus(cls.id, cls.status)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-end sm:self-center active:scale-95 ${
                                  isCompleted
                                    ? "bg-zinc-800 text-zinc-400"
                                    : "bg-emerald-600 hover:bg-emerald-500 text-zinc-950"
                                }`}
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>{isCompleted ? "Concluída" : "Marcar Concluída"}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 4: PLANOS DE TREINO */}
                {activeTab === "treinos" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100">Fichas e Planos de Treino</h3>
                        <p className="text-xs text-zinc-400">
                          Treinos montados para {student.name}.
                        </p>
                      </div>
                      <Link
                        href={`/planos/novo?studentId=${student.id}`}
                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs transition shadow-md shadow-emerald-600/20"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Criar Novo Treino</span>
                      </Link>
                    </div>

                    {student.workoutPlans.length === 0 ? (
                      <div className="bg-zinc-900/40 border border-zinc-800 rounded-3xl p-8 text-center text-zinc-400">
                        <Dumbbell className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
                        <p className="text-sm font-medium text-zinc-300">Nenhum treino montado ainda.</p>
                        <Link
                          href={`/planos/novo?studentId=${student.id}`}
                          className="inline-block mt-3 px-4 py-2 bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl"
                        >
                          Montar Primeiro Treino
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {student.workoutPlans.map((plan) => (
                          <div
                            key={plan.id}
                            className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-5 space-y-4"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
                              <div>
                                <h4 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                                  <Dumbbell className="w-4 h-4 text-emerald-400" />
                                  {plan.title}
                                </h4>
                                {plan.goal && (
                                  <p className="text-xs text-emerald-400/90 mt-0.5 font-medium">
                                    Objetivo: {plan.goal}
                                  </p>
                                )}
                              </div>

                              <div className="flex items-center gap-2 flex-wrap justify-end">
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
                                  onClick={() =>
                                    setSelectedWorkout({
                                      ...plan,
                                      student: {
                                        name: student.name,
                                        phone: student.phone,
                                      },
                                    })
                                  }
                                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs rounded-xl transition shadow-md shadow-emerald-600/20"
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
                              </div>
                            </div>

                            {/* Tabela de exercícios */}
                            <div className="space-y-2">
                              {plan.exercises.map((ex, idx) => (
                                <div
                                  key={ex.id}
                                  className="p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="w-5 h-5 rounded-lg bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-[11px]">
                                      {idx + 1}
                                    </span>
                                    <div>
                                      <span className="font-bold text-zinc-200 block sm:inline">
                                        {ex.name}
                                      </span>
                                      {ex.notes && (
                                        <span className="text-[11px] text-zinc-500 block sm:ml-2 sm:inline">
                                          ({ex.notes})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
                                    <span>
                                      <strong className="text-zinc-200">{ex.sets}</strong> séries x{" "}
                                      <strong className="text-zinc-200">{ex.reps}</strong>
                                    </span>
                                    {ex.load && (
                                      <span className="text-emerald-400 font-semibold">
                                        {ex.load}
                                      </span>
                                    )}
                                    <span className="text-zinc-500">
                                      Descanso: {ex.restSeconds}s
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ABA 5: AVALIAÇÕES FÍSICAS E COMPOSIÇÃO CORPORAL */}
                {activeTab === "avaliacoes" && (
                  <div className="space-y-6">
                    {/* Topo da Aba com Ações */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 p-5 rounded-3xl border border-zinc-800">
                      <div>
                        <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-emerald-400" />
                          Composição Corporal & Avaliações
                        </h3>
                        <p className="text-xs text-zinc-400 mt-0.5">
                          Acompanhamento de dobras cutâneas, perimetria, % de gordura e metas.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 flex-wrap">
                        {student.assessments && student.assessments.some((a) => a.photos && a.photos.length > 0) && (
                          <button
                            type="button"
                            onClick={() => setIsBeforeAfterOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs transition border border-zinc-700/80 active:scale-95 shadow-sm"
                          >
                            <Sparkles className="w-4 h-4" />
                            <span>Antes & Depois</span>
                          </button>
                        )}
                        {student.assessments && student.assessments.length > 0 && student.assessments[0].photoToken && (
                          <button
                            type="button"
                            onClick={() => handleRequestPhotosWhatsApp(student.assessments![0])}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition border border-zinc-700/80 active:scale-95 shadow-sm"
                            title="Enviar link seguro para o aluno mandar fotos"
                          >
                            <Camera className="w-4 h-4 text-emerald-400" />
                            <span>Pedir Fotos (WhatsApp)</span>
                          </button>
                        )}
                        {student.assessments && student.assessments.length > 0 && (
                          <button
                            type="button"
                            onClick={() => handleShareAssessmentWhatsApp(student.assessments![0])}
                            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs transition border border-zinc-700/80 active:scale-95"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssessmentToEdit(null);
                            setIsAssessmentModalOpen(true);
                          }}
                          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-black text-xs transition shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Nova Avaliação</span>
                        </button>
                      </div>
                    </div>

                    {/* Conteúdo: Se não houver avaliações */}
                    {(!student.assessments || student.assessments.length === 0) ? (
                      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-12 text-center flex flex-col items-center justify-center space-y-4">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Activity className="w-8 h-8" />
                        </div>
                        <div className="max-w-md">
                          <h4 className="text-base font-bold text-zinc-200">
                            Nenhuma avaliação física cadastrada
                          </h4>
                          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                            Comece a registrar as medidas e dobras cutâneas de {student.name}. Os resultados de % de gordura, massas magra e gorda são calculados instantaneamente!
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedAssessmentToEdit(null);
                            setIsAssessmentModalOpen(true);
                          }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition active:scale-95"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>Fazer 1ª Avaliação Física</span>
                        </button>
                      </div>
                    ) : (
                      /* Se houver avaliações */
                      <div className="space-y-6">
                        {/* 1. GRÁFICO HISTÓRICO E EVOLUTIVO */}
                        <AssessmentHistoryChart
                          assessments={student.assessments}
                          targetBodyFat={student.assessments[0]?.targetBodyFat}
                        />

                        {/* 2. CARD DETALHADO DA ÚLTIMA AVALIAÇÃO */}
                        {(() => {
                          const latest = student.assessments[0];
                          const protocolLabels: Record<string, string> = {
                            POLLOCK_7: "Pollock (7 dobras)",
                            POLLOCK_3: "Pollock (3 dobras)",
                            GUEDES_3: "Guedes (3 dobras)",
                            BIOIMPEDANCE: "Bioimpedância Direta",
                            WELTMAN: "Weltman (Obesos)",
                          };

                          return (
                            <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 space-y-5">
                              {/* Topo da Última Avaliação */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">
                                    <Activity className="w-5 h-5" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-sm font-bold text-zinc-200">
                                        Última Avaliação: {formatDateLong(latest.date)}
                                      </h4>
                                      <span className="text-[10px] font-semibold bg-zinc-800 text-emerald-400 px-2 py-0.5 rounded-md">
                                        {protocolLabels[latest.protocol] || latest.protocol}
                                      </span>
                                    </div>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                      Idade informada: {latest.age} anos • Sexo:{" "}
                                      {latest.gender === "MALE" ? "Masculino" : "Feminino"}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    onClick={() => handleShareAssessmentWhatsApp(latest)}
                                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 transition"
                                    title="Enviar no WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedAssessmentToEdit(latest);
                                      setIsAssessmentModalOpen(true);
                                    }}
                                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-zinc-100 transition"
                                    title="Editar Avaliação"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteAssessment(latest.id)}
                                    className="p-2 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition"
                                    title="Excluir Avaliação"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Grade de Resultados Físicos */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    % Gordura
                                  </span>
                                  <span className="text-lg font-black text-emerald-400 font-mono mt-0.5 block">
                                    {latest.bodyFatPercent.toFixed(2)}%
                                  </span>
                                </div>

                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    Meta Gordura
                                  </span>
                                  <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">
                                    {latest.targetBodyFat.toFixed(2)}%
                                  </span>
                                </div>

                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    Peso Magro
                                  </span>
                                  <span className="text-lg font-black text-cyan-400 font-mono mt-0.5 block">
                                    {latest.leanMass.toFixed(2)} kg
                                  </span>
                                </div>

                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    Peso Gordo
                                  </span>
                                  <span className="text-lg font-black text-amber-400 font-mono mt-0.5 block">
                                    {latest.fatMass.toFixed(2)} kg
                                  </span>
                                </div>

                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    Peso Ideal
                                  </span>
                                  <span className="text-lg font-black text-zinc-200 font-mono mt-0.5 block">
                                    {latest.idealWeight.toFixed(2)} kg
                                  </span>
                                </div>

                                <div className="bg-zinc-950/70 p-3 rounded-2xl border border-zinc-800/80">
                                  <span className="text-[10px] text-zinc-500 block uppercase font-bold">
                                    IMC
                                  </span>
                                  <span className="text-lg font-black text-zinc-200 font-mono mt-0.5 block">
                                    {latest.imc ? latest.imc.toFixed(2) : "--"}
                                  </span>
                                </div>
                              </div>

                              {/* Dobras Cutâneas (mm) */}
                              <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                                <span className="text-xs font-bold text-zinc-300 block mb-2.5">
                                  Dobras Cutâneas (mm)
                                </span>
                                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
                                  {[
                                    { label: "Subescapular", val: latest.subscapular },
                                    { label: "Peitoral", val: latest.chest },
                                    { label: "Supra-ilíaca", val: latest.suprailiac },
                                    { label: "Coxa", val: latest.thigh },
                                    { label: "Tricipital", val: latest.triceps },
                                    { label: "Axilar-média", val: latest.midaxillary },
                                    { label: "Abdominal", val: latest.abdominal },
                                  ].map((d) => (
                                    <div
                                      key={d.label}
                                      className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center"
                                    >
                                      <span className="text-[10px] text-zinc-500 block truncate">
                                        {d.label}
                                      </span>
                                      <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">
                                        {d.val != null ? `${d.val.toFixed(1)} mm` : "--"}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Perimetria Corporal (se preenchida) */}
                              {(latest.waist || latest.abdomenCirc || latest.hip || latest.chestCirc || latest.rightArmRelaxed) && (
                                <div className="bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/80">
                                  <span className="text-xs font-bold text-zinc-300 block mb-2.5">
                                    Perimetria Corporal (cm)
                                  </span>
                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                                    {[
                                      { label: "Abdômen", val: latest.abdomenCirc },
                                      { label: "Cintura", val: latest.waist },
                                      { label: "Quadril", val: latest.hip },
                                      { label: "Tórax", val: latest.chestCirc },
                                      { label: "Braço D (rel)", val: latest.rightArmRelaxed },
                                      { label: "Braço E (rel)", val: latest.leftArmRelaxed },
                                      { label: "Coxa D", val: latest.rightThigh },
                                      { label: "Coxa E", val: latest.leftThigh },
                                      { label: "Panturrilha D", val: latest.rightCalf },
                                      { label: "Panturrilha E", val: latest.leftCalf },
                                    ]
                                      .filter((c) => c.val != null)
                                      .map((c) => (
                                        <div
                                          key={c.label}
                                          className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-center"
                                        >
                                          <span className="text-[10px] text-zinc-500 block truncate">
                                            {c.label}
                                          </span>
                                          <span className="text-xs font-bold text-cyan-400 font-mono mt-0.5 block">
                                            {c.val?.toFixed(1)} cm
                                          </span>
                                        </div>
                                      ))}
                                  </div>
                                </div>
                              )}

                              {latest.notes && (
                                <div className="text-xs text-zinc-400 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                                  <strong className="text-zinc-300">Notas: </strong>
                                  {latest.notes}
                                </div>
                              )}

                              {/* Fotos da Avaliação (se houver) */}
                              {latest.photos && latest.photos.length > 0 && (
                                <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                                      <Camera className="w-3.5 h-3.5 text-emerald-400" />
                                      Fotos de Acompanhamento ({latest.photos.length})
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => setIsBeforeAfterOpen(true)}
                                      className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      <span>Comparar com Anteriores</span>
                                    </button>
                                  </div>

                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {latest.photos.map((p) => (
                                      <div
                                        key={p.id || p.url}
                                        className="relative aspect-[3/4] rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950 group cursor-pointer"
                                        onClick={() => setIsBeforeAfterOpen(true)}
                                      >
                                        <img
                                          src={p.url}
                                          alt={p.type}
                                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                          loading="lazy"
                                        />
                                        <span className="absolute bottom-1.5 left-1.5 bg-black/80 backdrop-blur-sm text-[10px] font-bold text-zinc-200 px-2 py-0.5 rounded-md border border-zinc-700/50">
                                          {p.type === "FRONT"
                                            ? "Frente"
                                            : p.type === "BACK"
                                            ? "Costas"
                                            : p.type === "RIGHT_SIDE"
                                            ? "Perfil D."
                                            : "Perfil E."}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        {/* 3. HISTÓRICO DE TODAS AS AVALIAÇÕES */}
                        {student.assessments.length > 1 && (
                          <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6">
                            <h4 className="text-sm font-bold text-zinc-200 mb-4 flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-emerald-400" />
                              Histórico Completo de Avaliações ({student.assessments.length})
                            </h4>

                            <div className="space-y-2.5">
                              {student.assessments.map((item, idx) => (
                                <div
                                  key={item.id}
                                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center font-mono font-bold text-zinc-400">
                                      #{student.assessments!.length - idx}
                                    </div>
                                    <div>
                                      <span className="font-bold text-zinc-200 flex items-center gap-2">
                                        <span>{formatDateLong(item.date)}</span>
                                        {item.photos && item.photos.length > 0 && (
                                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                                            <Camera className="w-3 h-3" />
                                            {item.photos.length} fotos
                                          </span>
                                        )}
                                      </span>
                                      <span className="text-[11px] text-zinc-500">
                                        Peso: {item.weight.toFixed(1)} kg • Altura: {item.height.toFixed(2)} m
                                      </span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4">
                                    <div className="text-right">
                                      <span className="text-xs font-black text-emerald-400 font-mono block">
                                        {item.bodyFatPercent.toFixed(1)}% Gordura
                                      </span>
                                      <span className="text-[10px] text-zinc-500">
                                        Massa Magra: {item.leanMass.toFixed(1)} kg
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => handleShareAssessmentWhatsApp(item)}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 transition"
                                        title="WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedAssessmentToEdit(item);
                                          setIsAssessmentModalOpen(true);
                                        }}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition"
                                        title="Editar"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteAssessment(item.id)}
                                        className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition"
                                        title="Excluir"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* MODAL NOVA COBRANÇA */}
            {isPaymentModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
                    <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                      <Wallet className="w-5 h-5 text-emerald-400" />
                      Lançar Cobrança para {student?.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsPaymentModalOpen(false)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreatePayment} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-5 space-y-3 overflow-y-auto flex-1 overscroll-contain">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Valor (R$)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={paymentForm.amount}
                          onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Data de Vencimento
                        </label>
                        <input
                          type="date"
                          required
                          value={paymentForm.dueDate}
                          onChange={(e) => setPaymentForm({ ...paymentForm, dueDate: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Mês de Referência (MM/AAAA)
                        </label>
                        <input
                          type="text"
                          required
                          value={paymentForm.referenceMonth}
                          onChange={(e) => setPaymentForm({ ...paymentForm, referenceMonth: e.target.value })}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-zinc-800 bg-zinc-900 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPaymentModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 min-h-[40px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md transition min-h-[40px]"
                      >
                        Salvar Cobrança
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL AGENDAR AULA */}
            {isClassModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 shrink-0 bg-zinc-900">
                    <h3 className="font-bold text-zinc-100 text-base flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-emerald-400" />
                      Agendar Aula com {student?.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setIsClassModalOpen(false)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateClass} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-5 space-y-3 overflow-y-auto flex-1 overscroll-contain">
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Título / Foco da Aula
                        </label>
                        <input
                          type="text"
                          value={classForm.title}
                          onChange={(e) => setClassForm({ ...classForm, title: e.target.value })}
                          placeholder="Ex: Treino de Força / Hipertrofia"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">Data</label>
                          <input
                            type="date"
                            required
                            value={classForm.date}
                            onChange={(e) => setClassForm({ ...classForm, date: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">Local</label>
                          <select
                            value={classForm.location}
                            onChange={(e) => setClassForm({ ...classForm, location: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 min-h-[44px]"
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
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">Horário Início</label>
                          <input
                            type="time"
                            required
                            value={classForm.startTime}
                            onChange={(e) => setClassForm({ ...classForm, startTime: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">Horário Fim</label>
                          <input
                            type="time"
                            required
                            value={classForm.endTime}
                            onChange={(e) => setClassForm({ ...classForm, endTime: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500 min-h-[44px]"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-zinc-800 bg-zinc-900 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsClassModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300 min-h-[40px]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-zinc-950 font-bold text-xs shadow-md transition min-h-[40px]"
                      >
                        Confirmar Horário
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL EDITAR ALUNO & PLANO */}
            {/* MODAL EDITAR ALUNO & PLANO */}
            {isEditModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-hidden">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                  {/* Topo Fixo do Modal */}
                  <div className="flex items-center justify-between px-5 py-4 sm:px-6 border-b border-zinc-800 shrink-0 bg-zinc-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                        <Edit className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-zinc-100 text-base leading-tight">Editar Aluno & Plano</h3>
                        <p className="text-[11px] text-zinc-400">Atualize dados cadastrais, objetivo e contrato financeiro.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition shrink-0"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Formulário com rolagem interna independente */}
                  <form onSubmit={handleUpdateStudent} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
                      {/* Status */}
                      <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-950/60 border border-zinc-800">
                        <div>
                          <span className="text-xs font-semibold text-zinc-200 block">Status da Matrícula</span>
                          <span className="text-[11px] text-zinc-400">Define se o aluno está ativo ou inativo.</span>
                        </div>
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                          className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                        >
                          <option value="ACTIVE">🟢 Ativo</option>
                          <option value="INACTIVE">⚪ Inativo</option>
                        </select>
                      </div>

                      {/* Dados Básicos */}
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs font-semibold text-zinc-300 block mb-1">Nome Completo *</label>
                          <input
                            type="text"
                            required
                            value={editForm.name}
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300 block mb-1">WhatsApp / Celular *</label>
                            <input
                              type="tel"
                              required
                              value={editForm.phone}
                              onChange={(e) => setEditForm({ ...editForm, phone: formatPhone(e.target.value) })}
                              placeholder="(11) 98765-4321"
                              maxLength={15}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-300 block mb-1">E-mail</label>
                            <input
                              type="email"
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              placeholder="aluno@exemplo.com"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-semibold text-zinc-300 block mb-1">Data de Nascimento</label>
                            <input
                              type="date"
                              value={editForm.birthDate}
                              onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-semibold text-zinc-300 block mb-1">Objetivo</label>
                            <select
                              value={editForm.goal}
                              onChange={(e) => setEditForm({ ...editForm, goal: e.target.value })}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-base sm:text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-emerald-500"
                            >
                              <option value="Hipertrofia">Hipertrofia</option>
                              <option value="Emagrecimento">Emagrecimento</option>
                              <option value="Condicionamento">Condicionamento Físico</option>
                              <option value="Reabilitação">Reabilitação / Postura</option>
                              <option value="Saúde & Bem-Estar">Saúde & Bem-Estar</option>
                              <option value="Performance Desportiva">Performance Desportiva</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Plano & Integração Financeira */}
                      <div className="p-4 rounded-2xl bg-zinc-950/80 border border-zinc-800 space-y-3.5">
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
                              setEditForm((prev) => ({
                                ...prev,
                                billingType: "MONTHLY",
                                planName: prev.planName && prev.planName !== "Treino Avulso" ? prev.planName : "Presencial 3x/sem",
                              }))
                            }
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              editForm.billingType === "MONTHLY"
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
                              setEditForm((prev) => ({
                                ...prev,
                                billingType: "PER_CLASS",
                                planName: "Treino Avulso",
                              }))
                            }
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              editForm.billingType === "PER_CLASS"
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
                              setEditForm((prev) => ({
                                ...prev,
                                billingType: "PACKAGE",
                                planName: `Pacote ${prev.packageTotalClasses || 10} Aulas`,
                              }))
                            }
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                              editForm.billingType === "PACKAGE"
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
                        {editForm.billingType === "MONTHLY" && (
                          <div className="space-y-3 pt-1">
                            <div>
                              <span className="text-[11px] text-zinc-400 block mb-1.5 font-medium">
                                Frequência Semanal Sugerida:
                              </span>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                                {FREQUENCY_PRESETS.map((preset) => {
                                  const isSelected = editForm.frequency === preset.freq;
                                  return (
                                    <button
                                      key={preset.freq}
                                      type="button"
                                      onClick={() =>
                                        setEditForm((prev) => ({
                                          ...prev,
                                          frequency: preset.freq,
                                          planName: preset.name,
                                          monthlyFee: preset.fee,
                                        }))
                                      }
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

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Nome do Plano</label>
                                <input
                                  type="text"
                                  value={editForm.planName}
                                  onChange={(e) => setEditForm({ ...editForm, planName: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Valor Mensal (R$)</label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.monthlyFee}
                                  onChange={(e) => setEditForm({ ...editForm, monthlyFee: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">Dia Vencimento</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="31"
                                  value={editForm.dueDay}
                                  onChange={(e) => setEditForm({ ...editForm, dueDay: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-100 font-mono focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 2. AVULSO / POR TREINO */}
                        {editForm.billingType === "PER_CLASS" && (
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                  Valor por Treino (R$) *
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.pricePerSession}
                                  onChange={(e) => setEditForm({ ...editForm, pricePerSession: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-amber-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                  Momento do Pagamento
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, paymentTiming: "POST_CLASS" })}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center min-h-[44px] flex items-center justify-center ${
                                      editForm.paymentTiming === "POST_CLASS"
                                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                    }`}
                                  >
                                    Após Treino
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditForm({ ...editForm, paymentTiming: "PRE_CLASS" })}
                                    className={`py-2 px-2.5 rounded-xl text-xs font-semibold border transition text-center min-h-[44px] flex items-center justify-center ${
                                      editForm.paymentTiming === "PRE_CLASS"
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
                        {editForm.billingType === "PACKAGE" && (
                          <div className="space-y-3 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                  Total de Aulas
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={editForm.packageTotalClasses}
                                  onChange={(e) =>
                                    setEditForm({
                                      ...editForm,
                                      packageTotalClasses: e.target.value,
                                      planName: `Pacote ${e.target.value || 10} Aulas`,
                                    })
                                  }
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                  Aulas Restantes
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={editForm.packageRemainingClasses}
                                  onChange={(e) => setEditForm({ ...editForm, packageRemainingClasses: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                                  Valor do Pacote (R$)
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.packageTotalValue}
                                  onChange={(e) => setEditForm({ ...editForm, packageTotalValue: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
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
                                  value={editForm.dueDay}
                                  onChange={(e) => setEditForm({ ...editForm, dueDay: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs min-h-[44px] text-zinc-100 focus:outline-none focus:border-cyan-500 font-mono"
                                />
                              </div>
                            </div>

                            {editForm.packageTotalClasses && editForm.packageTotalValue && (
                              <div className="text-[11px] text-cyan-400 font-mono">
                                ≈ {formatCurrency((parseFloat(editForm.packageTotalValue) || 0) / (parseInt(editForm.packageTotalClasses) || 1))} por aula
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Observações / Anamnese */}
                      <div>
                        <label className="text-xs font-semibold text-zinc-300 block mb-1">
                          Observações, Lesões e Restrições
                        </label>
                        <textarea
                          rows={3}
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="Histórico de lesões, problemas articulares, cirurgias ou preferências de treino..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 resize-none leading-relaxed"
                        />
                      </div>
                    </div>

                    {/* Rodapé Fixo do Modal */}
                    <div className="flex items-center justify-end gap-2 px-5 py-3.5 sm:px-6 border-t border-zinc-800 bg-zinc-900 shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(false)}
                        className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        disabled={editSaving}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-zinc-950 font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        {editSaving ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-zinc-950 border-t-transparent rounded-full animate-spin" />
                            <span>Salvando...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Salvar Alterações</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* MODAL COMPARTILHAR TREINO */}
            {selectedWorkout && (
              <ShareWorkoutModal
                isOpen={!!selectedWorkout}
                onClose={() => setSelectedWorkout(null)}
                workout={selectedWorkout}
              />
            )}

            {/* MODAL DE COMPOSIÇÃO CORPORAL & AVALIAÇÃO FÍSICA */}
            {student && (
              <AssessmentModal
                isOpen={isAssessmentModalOpen}
                onClose={() => {
                  setIsAssessmentModalOpen(false);
                  setSelectedAssessmentToEdit(null);
                }}
                onSuccess={() => {
                  clearCache("/api/students");
                  fetchStudent();
                }}
                studentId={studentId}
                studentName={student.name}
                studentBirthDate={student.birthDate}
                studentGender={student.gender}
                latestAssessment={student.assessments && student.assessments.length > 0 ? student.assessments[0] : null}
                assessmentToEdit={selectedAssessmentToEdit}
              />
            )}

            {/* MODAL DE FOTO DE IDENTIFICAÇÃO (AVATAR) */}
            {student && (
              <AvatarUploadModal
                isOpen={isAvatarModalOpen}
                onClose={() => setIsAvatarModalOpen(false)}
                onSuccess={(newAvatarUrl) => {
                  setStudent((prev) =>
                    prev ? { ...prev, avatarUrl: newAvatarUrl } : null
                  );
                  clearCache("/api/students");
                }}
                studentId={studentId}
                studentName={student.name}
                currentAvatarUrl={student.avatarUrl}
              />
            )}

            {/* MODAL / VISUALIZADOR ANTES E DEPOIS */}
            {isBeforeAfterOpen && student && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
                <div className="w-full max-w-3xl max-h-[95vh] overflow-y-auto">
                  <BeforeAfterSlider
                    studentName={student.name}
                    assessments={student.assessments || []}
                    onClose={() => setIsBeforeAfterOpen(false)}
                  />
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
