"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Check,
  Activity,
  Calculator,
  ChevronDown,
  ChevronUp,
  Info,
  Sparkles,
  User,
  Calendar,
  Layers,
} from "lucide-react";
import {
  calculateBodyComposition,
  calculateAgeFromBirthDate,
  ProtocolType,
  GenderType,
  AssessmentInput,
} from "@/lib/bodyComposition";

interface AssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
  studentName: string;
  studentBirthDate?: string | null;
  studentGender?: string | null;
  latestAssessment?: any | null;
  assessmentToEdit?: any | null;
}

const PROTOCOLS: Array<{ id: ProtocolType; label: string }> = [
  { id: "POLLOCK_7", label: "Pollock(7 dobras)" },
  { id: "POLLOCK_3", label: "Pollock(3 dobras)" },
  { id: "GUEDES_3", label: "Guedes(3 dobras)" },
  { id: "BIOIMPEDANCE", label: "Bioimpedância" },
  { id: "WELTMAN", label: "Weltman(Obesos)" },
];

export default function AssessmentModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  studentName,
  studentBirthDate,
  studentGender,
  latestAssessment,
  assessmentToEdit,
}: AssessmentModalProps) {
  const [protocol, setProtocol] = useState<ProtocolType>("POLLOCK_7");
  const [gender, setGender] = useState<GenderType>(
    (studentGender as GenderType) || "FEMALE"
  );
  const [age, setAge] = useState<string>("24");
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );

  // Medidas Básicas
  const [weight, setWeight] = useState<string>("54.40");
  const [height, setHeight] = useState<string>("1.60");
  const [targetBodyFat, setTargetBodyFat] = useState<string>("19.00");

  // Dobras Cutâneas (mm)
  const [subscapular, setSubscapular] = useState<string>("");
  const [chest, setChest] = useState<string>("");
  const [suprailiac, setSuprailiac] = useState<string>("");
  const [thigh, setThigh] = useState<string>("");
  const [triceps, setTriceps] = useState<string>("");
  const [midaxillary, setMidaxillary] = useState<string>("");
  const [abdominal, setAbdominal] = useState<string>("");

  // Bioimpedância
  const [directBodyFat, setDirectBodyFat] = useState<string>("");

  // Circunferências (cm)
  const [showCircumferences, setShowCircumferences] = useState(false);
  const [neck, setNeck] = useState<string>("");
  const [shoulders, setShoulders] = useState<string>("");
  const [chestCirc, setChestCirc] = useState<string>("");
  const [waist, setWaist] = useState<string>("");
  const [abdomenCirc, setAbdomenCirc] = useState<string>("");
  const [hip, setHip] = useState<string>("");
  const [rightArmRelaxed, setRightArmRelaxed] = useState<string>("");
  const [leftArmRelaxed, setLeftArmRelaxed] = useState<string>("");
  const [rightArmContracted, setRightArmContracted] = useState<string>("");
  const [leftArmContracted, setLeftArmContracted] = useState<string>("");
  const [rightForearm, setRightForearm] = useState<string>("");
  const [leftForearm, setLeftForearm] = useState<string>("");
  const [rightThigh, setRightThigh] = useState<string>("");
  const [leftThigh, setLeftThigh] = useState<string>("");
  const [rightCalf, setRightCalf] = useState<string>("");
  const [leftCalf, setLeftCalf] = useState<string>("");

  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  // Inicializar dados ao abrir o modal
  useEffect(() => {
    if (!isOpen) return;

    if (assessmentToEdit) {
      setProtocol(assessmentToEdit.protocol || "POLLOCK_7");
      setGender(assessmentToEdit.gender || "MALE");
      setAge(String(assessmentToEdit.age || 25));
      setDate(assessmentToEdit.date || new Date().toISOString().split("T")[0]);
      setWeight(String(assessmentToEdit.weight || ""));
      setHeight(String(assessmentToEdit.height || ""));
      setTargetBodyFat(String(assessmentToEdit.targetBodyFat || "15.00"));

      setSubscapular(assessmentToEdit.subscapular != null ? String(assessmentToEdit.subscapular) : "");
      setChest(assessmentToEdit.chest != null ? String(assessmentToEdit.chest) : "");
      setSuprailiac(assessmentToEdit.suprailiac != null ? String(assessmentToEdit.suprailiac) : "");
      setThigh(assessmentToEdit.thigh != null ? String(assessmentToEdit.thigh) : "");
      setTriceps(assessmentToEdit.triceps != null ? String(assessmentToEdit.triceps) : "");
      setMidaxillary(assessmentToEdit.midaxillary != null ? String(assessmentToEdit.midaxillary) : "");
      setAbdominal(assessmentToEdit.abdominal != null ? String(assessmentToEdit.abdominal) : "");
      setDirectBodyFat(assessmentToEdit.directBodyFat != null ? String(assessmentToEdit.directBodyFat) : "");

      setNeck(assessmentToEdit.neck != null ? String(assessmentToEdit.neck) : "");
      setShoulders(assessmentToEdit.shoulders != null ? String(assessmentToEdit.shoulders) : "");
      setChestCirc(assessmentToEdit.chestCirc != null ? String(assessmentToEdit.chestCirc) : "");
      setWaist(assessmentToEdit.waist != null ? String(assessmentToEdit.waist) : "");
      setAbdomenCirc(assessmentToEdit.abdomenCirc != null ? String(assessmentToEdit.abdomenCirc) : "");
      setHip(assessmentToEdit.hip != null ? String(assessmentToEdit.hip) : "");
      setRightArmRelaxed(assessmentToEdit.rightArmRelaxed != null ? String(assessmentToEdit.rightArmRelaxed) : "");
      setLeftArmRelaxed(assessmentToEdit.leftArmRelaxed != null ? String(assessmentToEdit.leftArmRelaxed) : "");
      setRightArmContracted(assessmentToEdit.rightArmContracted != null ? String(assessmentToEdit.rightArmContracted) : "");
      setLeftArmContracted(assessmentToEdit.leftArmContracted != null ? String(assessmentToEdit.leftArmContracted) : "");
      setRightForearm(assessmentToEdit.rightForearm != null ? String(assessmentToEdit.rightForearm) : "");
      setLeftForearm(assessmentToEdit.leftForearm != null ? String(assessmentToEdit.leftForearm) : "");
      setRightThigh(assessmentToEdit.rightThigh != null ? String(assessmentToEdit.rightThigh) : "");
      setLeftThigh(assessmentToEdit.leftThigh != null ? String(assessmentToEdit.leftThigh) : "");
      setRightCalf(assessmentToEdit.rightCalf != null ? String(assessmentToEdit.rightCalf) : "");
      setLeftCalf(assessmentToEdit.leftCalf != null ? String(assessmentToEdit.leftCalf) : "");
      setNotes(assessmentToEdit.notes || "");
    } else {
      // Nova Avaliação
      const initialAge = calculateAgeFromBirthDate(studentBirthDate);
      setAge(String(initialAge));
      setGender((studentGender as GenderType) || "FEMALE");
      setDate(new Date().toISOString().split("T")[0]);

      if (latestAssessment) {
        // Pré-preencher com base na última como ponto de partida inteligente
        setWeight(String(latestAssessment.weight || ""));
        setHeight(String(latestAssessment.height || ""));
        setTargetBodyFat(String(latestAssessment.targetBodyFat || "19.00"));
        setProtocol(latestAssessment.protocol || "POLLOCK_7");
      } else {
        setWeight("");
        setHeight("");
        setTargetBodyFat("19.00");
        setProtocol("POLLOCK_7");
      }

      setSubscapular("");
      setChest("");
      setSuprailiac("");
      setThigh("");
      setTriceps("");
      setMidaxillary("");
      setAbdominal("");
      setDirectBodyFat("");
      setNeck("");
      setShoulders("");
      setChestCirc("");
      setWaist("");
      setAbdomenCirc("");
      setHip("");
      setRightArmRelaxed("");
      setLeftArmRelaxed("");
      setRightArmContracted("");
      setLeftArmContracted("");
      setRightForearm("");
      setLeftForearm("");
      setRightThigh("");
      setLeftThigh("");
      setRightCalf("");
      setLeftCalf("");
      setNotes("");
    }
  }, [isOpen, assessmentToEdit, latestAssessment, studentBirthDate, studentGender]);

  // Cálculos em tempo real
  const currentResults = useMemo(() => {
    const input: AssessmentInput = {
      protocol,
      gender,
      age: parseFloat(age) || 25,
      weight: parseFloat(weight) || 0,
      height: parseFloat(height) || 1.7,
      targetBodyFat: parseFloat(targetBodyFat) || 15,
      subscapular: parseFloat(subscapular) || 0,
      chest: parseFloat(chest) || 0,
      suprailiac: parseFloat(suprailiac) || 0,
      thigh: parseFloat(thigh) || 0,
      triceps: parseFloat(triceps) || 0,
      midaxillary: parseFloat(midaxillary) || 0,
      abdominal: parseFloat(abdominal) || 0,
      directBodyFat: parseFloat(directBodyFat) || 0,
      waist: parseFloat(waist) || 0,
      abdomenCirc: parseFloat(abdomenCirc) || 0,
      hip: parseFloat(hip) || 0,
    };
    return calculateBodyComposition(input);
  }, [
    protocol,
    gender,
    age,
    weight,
    height,
    targetBodyFat,
    subscapular,
    chest,
    suprailiac,
    thigh,
    triceps,
    midaxillary,
    abdominal,
    directBodyFat,
    waist,
    abdomenCirc,
    hip,
  ]);

  if (!isOpen) return null;

  // Determinar quais dobras são prioritárias no protocolo ativo
  const isFoldActive = (foldName: string) => {
    if (protocol === "POLLOCK_7") return true;
    if (protocol === "POLLOCK_3") {
      return gender === "MALE"
        ? ["chest", "abdominal", "thigh"].includes(foldName)
        : ["triceps", "suprailiac", "thigh"].includes(foldName);
    }
    if (protocol === "GUEDES_3") {
      return gender === "MALE"
        ? ["triceps", "abdominal", "suprailiac"].includes(foldName)
        : ["thigh", "suprailiac", "subscapular"].includes(foldName);
    }
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight || !height) {
      alert("Por favor, preencha o peso e a altura.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        date,
        protocol,
        gender,
        age: parseInt(age) || 25,
        weight: parseFloat(weight),
        height: parseFloat(height),
        targetBodyFat: parseFloat(targetBodyFat) || 15,
        subscapular: subscapular ? parseFloat(subscapular) : null,
        chest: chest ? parseFloat(chest) : null,
        suprailiac: suprailiac ? parseFloat(suprailiac) : null,
        thigh: thigh ? parseFloat(thigh) : null,
        triceps: triceps ? parseFloat(triceps) : null,
        midaxillary: midaxillary ? parseFloat(midaxillary) : null,
        abdominal: abdominal ? parseFloat(abdominal) : null,
        directBodyFat: directBodyFat ? parseFloat(directBodyFat) : null,
        neck: neck ? parseFloat(neck) : null,
        shoulders: shoulders ? parseFloat(shoulders) : null,
        chestCirc: chestCirc ? parseFloat(chestCirc) : null,
        waist: waist ? parseFloat(waist) : null,
        abdomenCirc: abdomenCirc ? parseFloat(abdomenCirc) : null,
        hip: hip ? parseFloat(hip) : null,
        rightArmRelaxed: rightArmRelaxed ? parseFloat(rightArmRelaxed) : null,
        leftArmRelaxed: leftArmRelaxed ? parseFloat(leftArmRelaxed) : null,
        rightArmContracted: rightArmContracted ? parseFloat(rightArmContracted) : null,
        leftArmContracted: leftArmContracted ? parseFloat(leftArmContracted) : null,
        rightForearm: rightForearm ? parseFloat(rightForearm) : null,
        leftForearm: leftForearm ? parseFloat(leftForearm) : null,
        rightThigh: rightThigh ? parseFloat(rightThigh) : null,
        leftThigh: leftThigh ? parseFloat(leftThigh) : null,
        rightCalf: rightCalf ? parseFloat(rightCalf) : null,
        leftCalf: leftCalf ? parseFloat(leftCalf) : null,
        notes,
      };

      const url = assessmentToEdit
        ? `/api/assessments/${assessmentToEdit.id}`
        : `/api/students/${studentId}/assessments`;
      const method = assessmentToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        alert(err.error || "Erro ao salvar avaliação física.");
      }
    } catch (error) {
      console.error(error);
      alert("Falha de conexão ao salvar avaliação.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* CABEÇALHO SUPERIOR (PADRÃO PRINT) */}
        <div className="bg-emerald-600 px-6 py-4 flex items-center justify-between text-zinc-950">
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-emerald-700/30 text-zinc-950 transition active:scale-95"
            title="Voltar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-sm font-black tracking-wider uppercase">
              COMPOSIÇÃO CORPORAL
            </h2>
            <span className="text-[11px] font-semibold opacity-90 block">
              {studentName}
            </span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="p-1 rounded-full hover:bg-emerald-700/30 text-zinc-950 transition active:scale-95 disabled:opacity-50"
            title="Salvar Avaliação"
          >
            <Check className="w-6 h-6 stroke-[2.5]" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* SELETOR DE PROTOCOLO (SEGUINDO O TOPO DO PRINT) */}
          <div className="bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3">
              Protocolo de Avaliação
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {PROTOCOLS.map((p) => {
                const isSelected = protocol === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProtocol(p.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition text-left ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-300"
                        : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center border transition ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-500 text-zinc-950"
                          : "border-zinc-700"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DADOS DE CONTEXTO DO ALUNO (SEXO, IDADE, DATA) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Sexo Biológico (p/ fórmula)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setGender("MALE")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                    gender === "MALE"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  Masculino
                </button>
                <button
                  type="button"
                  onClick={() => setGender("FEMALE")}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold border transition ${
                    gender === "FEMALE"
                      ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                      : "bg-zinc-950 border-zinc-800 text-zinc-400"
                  }`}
                >
                  Feminino
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Idade (anos)
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-semibold text-zinc-400 block mb-1">
                Data da Avaliação
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-100 font-mono focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* SEÇÃO 1: MEDIDAS (CONFORME PRINT) */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
            <div className="border-b border-zinc-800 pb-2 mb-3 flex items-center justify-between">
              <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                MEDIDAS
              </span>
              <span className="text-[11px] font-semibold text-cyan-400">
                Última
              </span>
            </div>

            <div className="space-y-3">
              {/* Peso */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-300 w-28">Peso:</span>
                <div className="flex items-center gap-1.5 flex-1 max-w-[150px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400 font-medium">kg</span>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {latestAssessment?.weight ? `${latestAssessment.weight.toFixed(2)} kg` : "--"}
                  </span>
                </div>
              </div>

              {/* Altura */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-300 w-28">Altura:</span>
                <div className="flex items-center gap-1.5 flex-1 max-w-[150px]">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="1,60"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400 font-medium">m</span>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {latestAssessment?.height ? `${latestAssessment.height.toFixed(2)} m` : "--"}
                  </span>
                </div>
              </div>

              {/* Meta Gordura */}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-300 w-28">Meta Gordura:</span>
                <div className="flex items-center gap-1.5 flex-1 max-w-[150px]">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="19,00"
                    value={targetBodyFat}
                    onChange={(e) => setTargetBodyFat(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400 font-medium">%</span>
                </div>
                <div className="w-20 text-right">
                  <span className="text-xs font-mono text-cyan-400 font-semibold">
                    {latestAssessment?.targetBodyFat
                      ? `${latestAssessment.targetBodyFat.toFixed(2)} %`
                      : "--"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: DOBRAS CUTÂNEAS (EM MM) (CONFORME PRINT) */}
          {protocol !== "BIOIMPEDANCE" && protocol !== "WELTMAN" && (
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
              <div className="border-b border-zinc-800 pb-2 mb-3 flex items-center justify-between">
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                  DOBRAS CUTÂNEAS (EM MM)
                </span>
                <span className="text-[11px] font-semibold text-cyan-400">
                  Última
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    name: "subscapular",
                    label: "Subescapular:",
                    val: subscapular,
                    setter: setSubscapular,
                    last: latestAssessment?.subscapular,
                  },
                  {
                    name: "chest",
                    label: "Peitoral:",
                    val: chest,
                    setter: setChest,
                    last: latestAssessment?.chest,
                  },
                  {
                    name: "suprailiac",
                    label: "Supra-ilíaca:",
                    val: suprailiac,
                    setter: setSuprailiac,
                    last: latestAssessment?.suprailiac,
                  },
                  {
                    name: "thigh",
                    label: "Coxa:",
                    val: thigh,
                    setter: setThigh,
                    last: latestAssessment?.thigh,
                  },
                  {
                    name: "triceps",
                    label: "Tricipital:",
                    val: triceps,
                    setter: setTriceps,
                    last: latestAssessment?.triceps,
                  },
                  {
                    name: "midaxillary",
                    label: "Axilar-média:",
                    val: midaxillary,
                    setter: setMidaxillary,
                    last: latestAssessment?.midaxillary,
                  },
                  {
                    name: "abdominal",
                    label: "Abdominal:",
                    val: abdominal,
                    setter: setAbdominal,
                    last: latestAssessment?.abdominal,
                  },
                ].map((f) => {
                  const active = isFoldActive(f.name);
                  return (
                    <div
                      key={f.name}
                      className={`flex items-center justify-between gap-3 p-1 rounded-lg ${
                        active ? "bg-emerald-500/5" : "opacity-80"
                      }`}
                    >
                      <div className="flex items-center gap-1.5 w-32">
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        )}
                        <span
                          className={`text-xs ${
                            active
                              ? "font-bold text-zinc-200"
                              : "font-normal text-zinc-400"
                          }`}
                        >
                          {f.label}
                        </span>
                      </div>

                      <div className="flex-1 max-w-[130px]">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="0,00"
                          value={f.val}
                          onChange={(e) => f.setter(e.target.value)}
                          className={`w-full bg-zinc-900 border rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right outline-none transition ${
                            active
                              ? "border-emerald-500/50 focus:border-emerald-500"
                              : "border-zinc-800 focus:border-zinc-700"
                          }`}
                        />
                      </div>

                      <div className="w-20 text-right">
                        <span className="text-xs font-mono text-cyan-400 font-medium">
                          {f.last != null ? f.last.toFixed(2) : "0,00"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SEÇÃO BIOIMPEDÂNCIA */}
          {protocol === "BIOIMPEDANCE" && (
            <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
              <span className="text-xs font-black text-zinc-300 uppercase tracking-wider block mb-3">
                Bioimpedância Direta
              </span>
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-zinc-300">
                  % Gordura Aferido no Aparelho:
                </span>
                <div className="flex items-center gap-1.5 max-w-[150px]">
                  <input
                    type="number"
                    step="0.1"
                    placeholder="25,0"
                    value={directBodyFat}
                    onChange={(e) => setDirectBodyFat(e.target.value)}
                    className="w-full bg-zinc-900 border border-emerald-500/50 rounded-lg px-2.5 py-1 text-xs text-emerald-400 font-mono font-bold text-right outline-none focus:border-emerald-500"
                  />
                  <span className="text-xs text-zinc-400 font-medium">%</span>
                </div>
              </div>
            </div>
          )}

          {/* SEÇÃO RETRÁTIL: MEDIDAS CIRCUNFERENCIAIS / PERIMETRIA (EM CM) */}
          <div className="bg-zinc-950/40 border border-zinc-800/80 rounded-2xl p-4">
            <button
              type="button"
              onClick={() => setShowCircumferences(!showCircumferences)}
              className="w-full flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                  MEDIDAS CIRCUNFERENCIAIS (PERIMETRIA EM CM)
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-full font-semibold">
                  {protocol === "WELTMAN" ? "Necessário para Weltman" : "Opcional"}
                </span>
              </div>
              {showCircumferences ? (
                <ChevronUp className="w-4 h-4 text-zinc-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-400" />
              )}
            </button>

            {showCircumferences && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-zinc-800/80">
                {[
                  { label: "Abdômen (Umbilical):", val: abdomenCirc, setter: setAbdomenCirc, unit: "cm" },
                  { label: "Cintura (Menor curvatura):", val: waist, setter: setWaist, unit: "cm" },
                  { label: "Quadril (Maior glúteo):", val: hip, setter: setHip, unit: "cm" },
                  { label: "Tórax / Peitoral:", val: chestCirc, setter: setChestCirc, unit: "cm" },
                  { label: "Braço Direito Relaxado:", val: rightArmRelaxed, setter: setRightArmRelaxed, unit: "cm" },
                  { label: "Braço Esquerdo Relaxado:", val: leftArmRelaxed, setter: setLeftArmRelaxed, unit: "cm" },
                  { label: "Braço Direito Contraído:", val: rightArmContracted, setter: setRightArmContracted, unit: "cm" },
                  { label: "Braço Esquerdo Contraído:", val: leftArmContracted, setter: setLeftArmContracted, unit: "cm" },
                  { label: "Coxa Direita:", val: rightThigh, setter: setRightThigh, unit: "cm" },
                  { label: "Coxa Esquerda:", val: leftThigh, setter: setLeftThigh, unit: "cm" },
                  { label: "Panturrilha Direita:", val: rightCalf, setter: setRightCalf, unit: "cm" },
                  { label: "Panturrilha Esquerda:", val: leftCalf, setter: setLeftCalf, unit: "cm" },
                  { label: "Pescoço:", val: neck, setter: setNeck, unit: "cm" },
                  { label: "Ombros:", val: shoulders, setter: setShoulders, unit: "cm" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-medium text-zinc-400">
                      {item.label}
                    </span>
                    <div className="flex items-center gap-1 max-w-[100px]">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="0,0"
                        value={item.val}
                        onChange={(e) => item.setter(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-xs text-zinc-200 font-mono text-right outline-none focus:border-emerald-500"
                      />
                      <span className="text-[10px] text-zinc-500">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SEÇÃO 3: RESULTADOS CALCULADOS AO VIVO (CONFORME PRINT) */}
          <div className="bg-zinc-950 border border-emerald-500/30 rounded-2xl p-4 shadow-lg shadow-emerald-950/20">
            <div className="border-b border-zinc-800/80 pb-2 mb-3 flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                RESULTADOS (CÁLCULO AUTOMÁTICO)
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {currentResults.sumFolds ? `Soma: ${currentResults.sumFolds} mm` : ""}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {/* Gordura Ideal */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Gordura Ideal:
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {currentResults.targetBodyFat.toFixed(2)}%
                </span>
              </div>

              {/* Gordura Atual */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Gordura Atual:
                </span>
                <span className="text-sm font-black text-emerald-400 font-mono">
                  {currentResults.bodyFatPercent.toFixed(2)}%
                </span>
              </div>

              {/* Peso Magro */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Peso Magro:
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {currentResults.leanMass.toFixed(2)} kg
                </span>
              </div>

              {/* Peso Gordo */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Peso Gordo:
                </span>
                <span className="text-sm font-black text-amber-400 font-mono">
                  {currentResults.fatMass.toFixed(2)} kg
                </span>
              </div>

              {/* Peso Ideal */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  Peso Ideal:
                </span>
                <span className="text-sm font-black text-cyan-400 font-mono">
                  {currentResults.idealWeight.toFixed(2)} kg
                </span>
              </div>

              {/* IMC */}
              <div className="bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/60">
                <span className="text-[10px] text-zinc-400 block font-medium">
                  IMC:
                </span>
                <span className="text-sm font-black text-zinc-200 font-mono">
                  {currentResults.imc.toFixed(2)}
                </span>
                <span className="text-[9px] text-zinc-500 block truncate">
                  {currentResults.imcClassification}
                </span>
              </div>
            </div>
          </div>

          {/* OBSERVAÇÕES */}
          <div>
            <label className="text-xs font-semibold text-zinc-400 block mb-1">
              Observações / Notas da Avaliação
            </label>
            <textarea
              rows={2}
              placeholder="Ex: Aluno em fase de cutting, redução de dobras abdominais..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 outline-none focus:border-emerald-500"
            />
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-zinc-200 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-black shadow-lg shadow-emerald-500/20 transition active:scale-95 disabled:opacity-50"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{saving ? "Salvando..." : "Salvar Avaliação"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
