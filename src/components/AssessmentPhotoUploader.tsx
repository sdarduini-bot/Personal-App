"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, Trash2, CheckCircle2, AlertCircle, Info, Loader2 } from "lucide-react";
import { compressBodyPhoto } from "@/lib/image-compression";

export interface PhotoItem {
  id?: string;
  type: "FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE" | "OTHER";
  url: string;
  notes?: string | null;
}

interface AssessmentPhotoUploaderProps {
  photos: PhotoItem[];
  onChange: (photos: PhotoItem[]) => void;
  disabled?: boolean;
}

const POSE_CONFIG: {
  type: "FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE";
  label: string;
  subtitle: string;
  guideText: string;
}[] = [
  {
    type: "FRONT",
    label: "Frente",
    subtitle: "Visão Anterior",
    guideText: "Pés na largura dos ombros, braços relaxados ao lado do tronco.",
  },
  {
    type: "BACK",
    label: "Costas",
    subtitle: "Visão Posterior",
    guideText: "Postura ereta, cotovelos levemente afastados para ver dorsais.",
  },
  {
    type: "RIGHT_SIDE",
    label: "Perfil Direito",
    subtitle: "Lado Direito",
    guideText: "Braço esquerdo oculto ou levemente à frente para expor o abdômen e postura.",
  },
  {
    type: "LEFT_SIDE",
    label: "Perfil Esquerdo",
    subtitle: "Lado Esquerdo",
    guideText: "Coluna neutra, olhando para o horizonte sem forçar a postura.",
  },
];

export default function AssessmentPhotoUploader({
  photos,
  onChange,
  disabled = false,
}: AssessmentPhotoUploaderProps) {
  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTypeRef = useRef<"FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE" | null>(null);

  const handleSelectFile = (type: "FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE") => {
    if (disabled) return;
    activeTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = activeTypeRef.current;
    if (!file || !type) return;

    setErrorMsg(null);
    setUploadingType(type);

    try {
      // 1. Compressão client-side em WebP (1200x1600, ~150KB)
      const compressed = await compressBodyPhoto(file);

      // 2. Upload para a API
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("category", "assessments");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Falha no upload da foto.");
      }

      const data = await res.json();

      // 3. Atualizar lista de fotos (substituir se já houver esse tipo)
      const filtered = photos.filter((p) => p.type !== type);
      const updated: PhotoItem[] = [
        ...filtered,
        {
          type,
          url: data.url,
          notes: null,
        },
      ];

      onChange(updated);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao processar imagem da avaliação.");
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemovePhoto = (type: string) => {
    if (disabled) return;
    const updated = photos.filter((p) => p.type !== type);
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Guia Rápido Premium */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-start gap-3 text-xs">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-zinc-300 leading-relaxed">
          <span className="font-bold text-emerald-400">Padronização para Comparativo Perfeito:</span>{" "}
          Mantenha sempre a mesma distância (~2,5m), câmera na altura do umbigo e boa iluminação natural ou frontal.
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input oculto compartilhado */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Grid das 4 poses */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {POSE_CONFIG.map((pose) => {
          const currentPhoto = photos.find((p) => p.type === pose.type);
          const isThisUploading = uploadingType === pose.type;

          return (
            <div
              key={pose.type}
              className={`relative rounded-2xl border transition overflow-hidden flex flex-col ${
                currentPhoto
                  ? "bg-zinc-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                  : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
              }`}
            >
              {/* Header do Card */}
              <div className="px-3 py-2 border-b border-zinc-800/80 flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-200">
                  {pose.label}
                </span>
                {currentPhoto ? (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3 h-3" />
                    Salva
                  </span>
                ) : (
                  <span className="text-[10px] text-zinc-500 font-medium">
                    Opcional
                  </span>
                )}
              </div>

              {/* Área de Visualização / Upload */}
              <div className="relative aspect-[3/4] w-full bg-zinc-950 flex items-center justify-center overflow-hidden group">
                {isThisUploading ? (
                  <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                    <span className="text-[11px] text-zinc-400 font-medium">
                      Comprimindo...
                    </span>
                  </div>
                ) : currentPhoto ? (
                  <>
                    <img
                      src={currentPhoto.url}
                      alt={`Foto de ${pose.label}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay com ações ao passar o mouse / toque */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                      <button
                        type="button"
                        onClick={() => handleSelectFile(pose.type)}
                        disabled={disabled}
                        className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition shadow"
                        title="Substituir foto"
                      >
                        <Upload className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(pose.type)}
                        disabled={disabled}
                        className="p-2 rounded-xl bg-red-500/80 hover:bg-red-500 text-white transition shadow"
                        title="Remover foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelectFile(pose.type)}
                    disabled={disabled}
                    className="w-full h-full p-4 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-emerald-400 transition"
                  >
                    <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover:border-emerald-500/40 group-hover:bg-emerald-500/10 transition">
                      <Camera className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-[11px] font-semibold text-center leading-tight">
                      Adicionar
                    </span>
                    <span className="text-[9px] text-zinc-500 text-center line-clamp-2 px-1">
                      {pose.guideText}
                    </span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
