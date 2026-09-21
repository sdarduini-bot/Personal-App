"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  Camera,
  CheckCircle2,
  Lock,
  Sparkles,
  Info,
  Loader2,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { compressBodyPhoto } from "@/lib/image-compression";

const POSE_INFO: {
  type: "FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE";
  label: string;
  guideText: string;
}[] = [
  {
    type: "FRONT",
    label: "Frente",
    guideText: "Pés afastados na largura dos ombros, braços relaxados.",
  },
  {
    type: "BACK",
    label: "Costas",
    guideText: "Postura ereta, cotovelos levemente afastados.",
  },
  {
    type: "RIGHT_SIDE",
    label: "Perfil Direito",
    guideText: "Olhar para frente, braço à frente do tronco.",
  },
  {
    type: "LEFT_SIDE",
    label: "Perfil Esquerdo",
    guideText: "Coluna neutra e relaxada.",
  },
];

interface PublicPhoto {
  id: string;
  type: string;
  url: string;
}

export default function StudentPhotosUploadPage({
  params,
}: {
  params: { token: string };
}) {
  const { token } = params;
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<{
    id: string;
    date: string;
    studentName: string;
    photos: PublicPhoto[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [uploadingType, setUploadingType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeTypeRef = useRef<"FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE" | null>(null);

  const fetchAssessment = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/public/assessment/${token}/photos`);
      if (!res.ok) {
        throw new Error("Link de avaliação não encontrado ou expirado.");
      }
      const data = await res.json();
      setAssessment(data.assessment);
    } catch (err: any) {
      setError(err.message || "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessment();
  }, [token]);

  const handleSelectPose = (type: "FRONT" | "BACK" | "RIGHT_SIDE" | "LEFT_SIDE") => {
    activeTypeRef.current = type;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const type = activeTypeRef.current;
    if (!file || !type) return;

    setError(null);
    setUploadingType(type);

    try {
      // 1. Comprimir foto no celular do aluno para WebP leve
      const compressed = await compressBodyPhoto(file);

      // 2. Enviar arquivo para a rota pública
      const formData = new FormData();
      formData.append("file", compressed);
      formData.append("type", type);

      const res = await fetch(`/api/public/assessment/${token}/photos`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Erro ao salvar foto.");
      }

      await fetchAssessment();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Falha ao enviar a foto. Tente novamente.");
    } finally {
      setUploadingType(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mb-3" />
        <p className="text-xs text-zinc-400">Carregando formulário seguro...</p>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 text-center">
        <div className="p-4 rounded-3xl bg-red-500/10 border border-red-500/20 max-w-sm">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <h2 className="text-base font-bold text-zinc-200">Link Indisponível</h2>
          <p className="text-xs text-zinc-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-16 font-sans">
      {/* Topo / Barra de Marca */}
      <header className="border-b border-zinc-850 bg-zinc-900/60 backdrop-blur sticky top-0 z-30 px-4 py-3.5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-zinc-950 font-black text-sm shadow-md shadow-emerald-500/20">
              P
            </div>
            <div>
              <span className="font-extrabold text-sm text-zinc-100 block leading-tight">
                Pedro Personal
              </span>
              <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-emerald-400" />
                Envio Seguro & Privado
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Avaliação Física
          </span>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6">
        {/* Boas-vindas */}
        <div className="space-y-1">
          <h1 className="text-xl font-black text-zinc-100">
            Olá, {assessment?.studentName}! 👋
          </h1>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Registre suas fotos para a avaliação de{" "}
            <span className="text-emerald-400 font-semibold">
              {formatDate(assessment?.date)}
            </span>
            . Suas fotos ficam salvas de forma 100% privada e visíveis apenas para você e seu treinador.
          </p>
        </div>

        {/* Card de Dicas de Pose */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 space-y-1">
            <p className="font-bold text-emerald-400">Dicas para uma foto perfeita:</p>
            <ul className="list-disc list-inside text-zinc-400 space-y-0.5 text-[11px]">
              <li>Apoie o celular na altura do umbigo a ~2,5 metros de distância.</li>
              <li>Prefira roupas de treino justas ou trajes de banho.</li>
              <li>Iluminação frontal (de frente para uma janela ou luz).</li>
            </ul>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Grade com as 4 poses */}
        <div className="grid grid-cols-2 gap-3.5">
          {POSE_INFO.map((pose) => {
            const currentPhoto = assessment?.photos.find(
              (p) => p.type === pose.type
            );
            const isUploading = uploadingType === pose.type;

            return (
              <div
                key={pose.type}
                className={`rounded-3xl border overflow-hidden transition flex flex-col ${
                  currentPhoto
                    ? "bg-zinc-900 border-emerald-500/40 shadow-lg shadow-emerald-500/5"
                    : "bg-zinc-900/60 border-zinc-800"
                }`}
              >
                <div className="px-3.5 py-2.5 border-b border-zinc-800/80 flex items-center justify-between">
                  <span className="font-bold text-xs text-zinc-200">
                    {pose.label}
                  </span>
                  {currentPhoto ? (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" />
                      Enviada
                    </span>
                  ) : (
                    <span className="text-[10px] text-zinc-500">Pendente</span>
                  )}
                </div>

                <div className="relative aspect-[3/4] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
                  {isUploading ? (
                    <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
                      <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                      <span className="text-[11px] text-zinc-400 font-medium">
                        Comprimindo...
                      </span>
                    </div>
                  ) : currentPhoto ? (
                    <div className="relative w-full h-full group">
                      <img
                        src={currentPhoto.url}
                        alt={pose.label}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleSelectPose(pose.type)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 text-xs text-zinc-100 font-bold transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Substituir</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectPose(pose.type)}
                      className="w-full h-full p-4 flex flex-col items-center justify-center gap-2 text-zinc-500 hover:text-emerald-400 transition"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition">
                        <Camera className="w-6 h-6 stroke-[2]" />
                      </div>
                      <span className="text-xs font-bold text-zinc-300">
                        Tirar Foto
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

        {/* Rodapé de Confiança e LGPD */}
        <div className="bg-zinc-900/40 border border-zinc-850 rounded-2xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-[11px] text-zinc-400 leading-relaxed">
            Seus dados e imagens estão seguros. Nenhuma foto será divulgada publicamente sem sua autorização explícita.
          </p>
        </div>
      </main>
    </div>
  );
}
