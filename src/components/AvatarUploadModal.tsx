"use client";

import React, { useState, useRef } from "react";
import { X, Camera, Upload, Trash2, Check, Loader2 } from "lucide-react";
import { compressAvatar } from "@/lib/image-compression";

interface AvatarUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAvatarUrl: string | null) => void;
  studentId: string;
  studentName: string;
  currentAvatarUrl?: string | null;
}

export default function AvatarUploadModal({
  isOpen,
  onClose,
  onSuccess,
  studentId,
  studentName,
  currentAvatarUrl,
}: AvatarUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentAvatarUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMsg(null);
    try {
      // Compressão client-side imediata para WebP 400x400
      const compressed = await compressAvatar(file);
      setSelectedFile(compressed);

      const objectUrl = URL.createObjectURL(compressed);
      setPreviewUrl(objectUrl);
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Falha ao processar a imagem. Tente outra foto.");
    }
  };

  const handleSave = async () => {
    if (!selectedFile && previewUrl === currentAvatarUrl) {
      onClose();
      return;
    }

    setIsUploading(true);
    setErrorMsg(null);

    try {
      let finalAvatarUrl: string | null = previewUrl;

      if (selectedFile) {
        // Enviar imagem comprimida para a API de upload
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("category", "avatars");

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json();
          throw new Error(errData.error || "Erro ao salvar arquivo.");
        }

        const uploadData = await uploadRes.json();
        finalAvatarUrl = uploadData.url;
      }

      // Atualizar aluno com a nova URL
      const updateRes = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: finalAvatarUrl }),
      });

      if (!updateRes.ok) {
        throw new Error("Erro ao vincular foto ao perfil do aluno.");
      }

      onSuccess(finalAvatarUrl);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Erro ao salvar foto de perfil.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!confirm("Deseja realmente remover a foto de perfil?")) return;

    setIsUploading(true);
    setErrorMsg(null);
    try {
      const updateRes = await fetch(`/api/students/${studentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: null }),
      });

      if (!updateRes.ok) throw new Error("Erro ao remover foto.");

      setPreviewUrl(null);
      setSelectedFile(null);
      onSuccess(null);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao remover foto.");
    } finally {
      setIsUploading(false);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/80">
          <div>
            <h3 className="text-base font-bold text-zinc-100">Foto de Identificação</h3>
            <p className="text-xs text-zinc-400 mt-0.5">{studentName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 flex flex-col items-center">
          {/* Preview Circular */}
          <div className="relative group mb-6">
            <div className="w-36 h-36 rounded-full ring-4 ring-emerald-500/30 overflow-hidden bg-zinc-800 flex items-center justify-center shadow-xl">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={studentName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-emerald-400">
                  {getInitials(studentName)}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/30 transition active:scale-95"
              title="Alterar foto"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <div className="w-full space-y-2 text-center mb-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              O app comprime a imagem automaticamente para <span className="text-emerald-400 font-semibold">WebP leve</span> com alta nitidez sem pesar no seu celular.
            </p>
          </div>

          {errorMsg && (
            <div className="w-full mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 text-center">
              {errorMsg}
            </div>
          )}

          {/* Ações */}
          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition"
            >
              <Upload className="w-4 h-4 text-zinc-400" />
              <span>Escolher Foto</span>
            </button>

            {currentAvatarUrl && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={isUploading}
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition"
              >
                <Trash2 className="w-4 h-4" />
                <span>Remover</span>
              </button>
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="px-6 py-4 bg-zinc-950/60 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isUploading || (!selectedFile && previewUrl === currentAvatarUrl)}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvando...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Confirmar Foto</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
