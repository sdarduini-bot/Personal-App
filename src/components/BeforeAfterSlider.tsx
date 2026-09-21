"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Calendar,
  Layers,
  Columns,
  Download,
  Share2,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
} from "lucide-react";

export interface PhotoData {
  id?: string;
  type: string;
  url: string;
}

export interface AssessmentDataForComparison {
  id: string;
  date: string;
  weight: number;
  bodyFatPercent: number;
  photos?: PhotoData[] | null;
}

interface BeforeAfterSliderProps {
  studentName: string;
  assessments: AssessmentDataForComparison[];
  onClose?: () => void;
}

export default function BeforeAfterSlider({
  studentName,
  assessments,
  onClose,
}: BeforeAfterSliderProps) {
  // Filtrar apenas avaliações que tenham pelo menos uma foto
  const validAssessments = assessments.filter(
    (a) => a.photos && a.photos.length > 0
  );

  // Ordenar da mais antiga para a mais recente
  const sorted = [...validAssessments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Seleções padrão: mais antiga como "Antes" e mais recente como "Depois"
  const [beforeId, setBeforeId] = useState<string>(
    sorted.length > 0 ? sorted[0].id : ""
  );
  const [afterId, setAfterId] = useState<string>(
    sorted.length > 1 ? sorted[sorted.length - 1].id : sorted[0]?.id || ""
  );

  const [selectedPose, setSelectedPose] = useState<string>("FRONT");
  const [viewMode, setViewMode] = useState<"slider" | "sideBySide">("slider");
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 a 100%
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const beforeAssessment = sorted.find((a) => a.id === beforeId);
  const afterAssessment = sorted.find((a) => a.id === afterId);

  const beforePhoto = beforeAssessment?.photos?.find(
    (p) => p.type === selectedPose
  );
  const afterPhoto = afterAssessment?.photos?.find(
    (p) => p.type === selectedPose
  );

  // Manipulação de arraste do slider
  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percent);
    },
    []
  );

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  useEffect(() => {
    const handleGlobalUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleGlobalUp);
    window.addEventListener("touchend", handleGlobalUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalUp);
      window.removeEventListener("touchend", handleGlobalUp);
    };
  }, []);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // Cálculo de variações de métricas
  const weightDiff =
    beforeAssessment && afterAssessment
      ? afterAssessment.weight - beforeAssessment.weight
      : 0;

  const bfDiff =
    beforeAssessment && afterAssessment
      ? afterAssessment.bodyFatPercent - beforeAssessment.bodyFatPercent
      : 0;

  // Gerar e baixar imagem combinada para redes sociais
  const handleExportCard = async () => {
    if (!beforePhoto?.url || !afterPhoto?.url) return;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1350; // Proporção 4:5 clássica do Instagram
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Fundo escuro elegante
      ctx.fillStyle = "#09090b";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Carregar imagens
      const loadImg = (url: string): Promise<HTMLImageElement> =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve(img);
          img.onerror = () => reject();
          img.src = url;
        });

      const [imgBefore, imgAfter] = await Promise.all([
        loadImg(beforePhoto.url),
        loadImg(afterPhoto.url),
      ]);

      // Desenhar fotos lado a lado
      const photoWidth = 510;
      const photoHeight = 900;
      const photoY = 220;

      // Foto Antes
      ctx.drawImage(imgBefore, 25, photoY, photoWidth, photoHeight);
      // Foto Depois
      ctx.drawImage(imgAfter, 545, photoY, photoWidth, photoHeight);

      // Faixa de cabeçalho
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 42px sans-serif";
      ctx.fillText("EVOLUÇÃO & RESULTADOS", 40, 90);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px sans-serif";
      ctx.fillText(studentName, 40, 145);

      ctx.fillStyle = "#a1a1aa";
      ctx.font = "26px sans-serif";
      ctx.fillText("Pedro Personal Trainer", 40, 185);

      // Etiquetas nas fotos
      ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
      ctx.fillRect(35, photoY + 20, 240, 50);
      ctx.fillRect(555, photoY + 20, 240, 50);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText(`ANTES (${formatDate(beforeAssessment?.date)})`, 45, photoY + 54);
      ctx.fillText(`DEPOIS (${formatDate(afterAssessment?.date)})`, 565, photoY + 54);

      // Rodapé com métricas
      ctx.fillStyle = "#18181b";
      ctx.fillRect(25, 1150, 1030, 160);

      ctx.fillStyle = "#10b981";
      ctx.font = "bold 36px sans-serif";
      const signWeight = weightDiff > 0 ? "+" : "";
      const signBf = bfDiff > 0 ? "+" : "";
      ctx.fillText(
        `Peso: ${signWeight}${weightDiff.toFixed(1)} kg  |  Gordura: ${signBf}${bfDiff.toFixed(1)}%`,
        60,
        1245
      );

      // Exportar download
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
      const link = document.createElement("a");
      link.download = `evolucao-${studentName.toLowerCase().replace(/\s+/g, "-")}.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      alert("Não foi possível gerar a imagem automaticamente. Verifique se as fotos estão acessíveis.");
    }
  };

  if (validAssessments.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center">
        <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <h4 className="text-base font-bold text-zinc-200">
          Nenhuma foto de avaliação cadastrada
        </h4>
        <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
          Adicione fotos nas avaliações físicas para ativar a ferramenta comparativa de evolução.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Cabeçalho do Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-lg font-black text-zinc-100 flex items-center gap-2">
                Comparador Antes & Depois
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Premium
                </span>
              </h3>
              <p className="text-xs text-zinc-400 mt-0.5">
                Compare visualmente a recomposição corporal e postura de {studentName}.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="bg-zinc-950 p-1 rounded-2xl border border-zinc-800 flex items-center gap-1">
            <button
              type="button"
              onClick={() => setViewMode("slider")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "slider"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Cortina</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("sideBySide")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                viewMode === "sideBySide"
                  ? "bg-emerald-500 text-zinc-950 shadow"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>Lado a Lado</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCard}
            disabled={!beforePhoto || !afterPhoto}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-emerald-400 font-bold text-xs transition border border-zinc-700 disabled:opacity-50 active:scale-95"
            title="Exportar imagem para WhatsApp / Instagram"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar Card</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Barra de Filtros: Poses e Datas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Seletor de Pose */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Ângulo / Pose
          </label>
          <div className="grid grid-cols-4 gap-1.5 bg-zinc-950 p-1.5 rounded-2xl border border-zinc-800">
            {[
              { id: "FRONT", label: "Frente" },
              { id: "BACK", label: "Costas" },
              { id: "RIGHT_SIDE", label: "Dir." },
              { id: "LEFT_SIDE", label: "Esq." },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPose(p.id)}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold transition ${
                  selectedPose === p.id
                    ? "bg-emerald-500 text-zinc-950 shadow"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Avaliação ANTES */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Foto Anterior (Antes)
          </label>
          <select
            value={beforeId}
            onChange={(e) => setBeforeId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {sorted.map((a) => (
              <option key={`before-${a.id}`} value={a.id}>
                {formatDate(a.date)} ({a.weight}kg | {a.bodyFatPercent.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Avaliação DEPOIS */}
        <div>
          <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
            Foto Recente (Depois)
          </label>
          <select
            value={afterId}
            onChange={(e) => setAfterId(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-3.5 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-emerald-500"
          >
            {sorted.map((a) => (
              <option key={`after-${a.id}`} value={a.id}>
                {formatDate(a.date)} ({a.weight}kg | {a.bodyFatPercent.toFixed(1)}%)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Métricas de Variação no Período */}
      {beforeAssessment && afterAssessment && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Variação de Peso
            </span>
            <div className={`text-base font-black mt-0.5 ${weightDiff <= 0 ? "text-emerald-400" : "text-amber-400"}`}>
              {weightDiff > 0 ? `+${weightDiff.toFixed(1)}` : weightDiff.toFixed(1)} kg
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Gordura Corporal
            </span>
            <div className={`text-base font-black mt-0.5 ${bfDiff <= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {bfDiff > 0 ? `+${bfDiff.toFixed(1)}` : bfDiff.toFixed(1)}%
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Data Inicial
            </span>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">
              {formatDate(beforeAssessment.date)}
            </div>
          </div>

          <div className="bg-zinc-950/70 border border-zinc-800/80 rounded-2xl p-3 text-center">
            <span className="text-[10px] font-semibold text-zinc-400 uppercase">
              Data Atual
            </span>
            <div className="text-sm font-bold text-zinc-200 mt-0.5">
              {formatDate(afterAssessment.date)}
            </div>
          </div>
        </div>
      )}

      {/* Visualizador Comparativo */}
      <div className="w-full flex justify-center">
        {!beforePhoto || !afterPhoto ? (
          <div className="aspect-[3/4] w-full max-w-md bg-zinc-950 border border-zinc-800/80 rounded-3xl flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs text-zinc-400">
              Uma ou ambas as avaliações selecionadas não possuem foto para o ângulo{" "}
              <span className="text-emerald-400 font-bold">
                {selectedPose === "FRONT"
                  ? "Frente"
                  : selectedPose === "BACK"
                  ? "Costas"
                  : selectedPose === "RIGHT_SIDE"
                  ? "Perfil Direito"
                  : "Perfil Esquerdo"}
              </span>
              .
            </p>
          </div>
        ) : viewMode === "sideBySide" ? (
          /* Modo Lado a Lado */
          <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl">
              <img
                src={beforePhoto.url}
                alt="Antes"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-zinc-200 border border-zinc-700/60 shadow">
                Antes • {formatDate(beforeAssessment?.date)}
              </div>
            </div>

            <div className="relative aspect-[3/4] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-xl">
              <img
                src={afterPhoto.url}
                alt="Depois"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-emerald-400 border border-emerald-500/40 shadow">
                Depois • {formatDate(afterAssessment?.date)}
              </div>
            </div>
          </div>
        ) : (
          /* Modo Cortina Interativa (Split Slider) */
          <div
            ref={containerRef}
            onMouseDown={() => setIsDragging(true)}
            onMouseMove={handleMouseMove}
            onTouchStart={() => setIsDragging(true)}
            onTouchMove={handleTouchMove}
            className="relative aspect-[3/4] w-full max-w-md rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-950 shadow-2xl select-none cursor-ew-resize"
          >
            {/* Imagem "DEPOIS" (Fundo) */}
            <img
              src={afterPhoto.url}
              alt="Depois"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-emerald-950/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-emerald-400 border border-emerald-500/40 shadow pointer-events-none">
              Depois • {formatDate(afterAssessment?.date)}
            </div>

            {/* Imagem "ANTES" (Sobreposta com largura recortada) */}
            <div
              className="absolute inset-y-0 left-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src={beforePhoto.url}
                alt="Antes"
                className="absolute inset-0 max-w-none h-full object-cover"
                style={{
                  width: containerRef.current
                    ? `${containerRef.current.clientWidth}px`
                    : "100%",
                }}
              />
              <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] font-bold text-zinc-200 border border-zinc-700/60 shadow pointer-events-none">
                Antes • {formatDate(beforeAssessment?.date)}
              </div>
            </div>

            {/* Linha Divisória com Alça */}
            <div
              className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.8)]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white text-zinc-900 shadow-2xl flex items-center justify-center border-2 border-emerald-500">
                <ChevronLeft className="w-4 h-4 -mr-1 stroke-[3]" />
                <ChevronRight className="w-4 h-4 -ml-1 stroke-[3]" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
