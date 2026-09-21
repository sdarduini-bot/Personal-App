"use client";

import React, { useState, useEffect } from "react";
import {
  Smartphone,
  Share,
  PlusSquare,
  MoreVertical,
  Download,
  X,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";

interface InstallAppGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InstallAppGuideModal({
  isOpen,
  onClose,
}: InstallAppGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"ios" | "android">("ios");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (!isIos && /Android/.test(navigator.userAgent)) {
        setActiveTab("android");
      }

      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsStandalone(Boolean(standalone));
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Glow de fundo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 blur-[60px] rounded-full pointer-events-none" />

        {/* Topo / Cabeçalho */}
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100">Instalar no Celular</h3>
              <p className="text-xs text-zinc-400">Funciona como aplicativo nativo</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status se já estiver em standalone */}
        {isStandalone && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>Você já está executando o aplicativo em modo nativo!</span>
          </div>
        )}

        {/* Tabs de Seleção de SO */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-zinc-950 border border-zinc-800 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab("ios")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === "ios"
                ? "bg-zinc-800 text-emerald-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>iPhone (iOS)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("android")}
            className={`py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${
              activeTab === "android"
                ? "bg-zinc-800 text-emerald-400 shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Android (Chrome)</span>
          </button>
        </div>

        {/* Conteúdo do Tutorial */}
        <div className="space-y-3 relative z-10 text-xs text-zinc-300">
          {activeTab === "ios" ? (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Abra no Safari</p>
                  <p className="text-zinc-400 mt-0.5">
                    Certifique-se de estar usando o navegador <strong>Safari</strong> no seu iPhone.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>Toque no botão Compartilhar</span>
                    <Share className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    Fica na barra inferior do Safari (quadrado com a seta apontando para cima).
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>Escolha "Adicionar à Tela de Início"</span>
                    <PlusSquare className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    Role a lista de opções para baixo, selecione e toque em <strong>"Adicionar"</strong> no canto superior direito.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-zinc-100">Abra no Google Chrome</p>
                  <p className="text-zinc-400 mt-0.5">
                    Acesse o link do aplicativo através do navegador Chrome do seu celular.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>Toque nos três pontinhos</span>
                    <MoreVertical className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    Fica no canto superior direito da tela do navegador.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-2xl flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-zinc-800 flex items-center justify-center shrink-0 text-emerald-400 font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-zinc-100 flex items-center gap-1.5">
                    <span>Toque em "Instalar aplicativo"</span>
                    <Download className="w-3.5 h-3.5 text-emerald-400 inline" />
                  </p>
                  <p className="text-zinc-400 mt-0.5">
                    Ou selecione <em>"Adicionar à tela inicial"</em> e confirme em <strong>"Instalar"</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Vantagens */}
        <div className="p-3 bg-emerald-950/30 border border-emerald-900/50 rounded-2xl text-[11px] text-zinc-300 space-y-1">
          <p className="font-semibold text-emerald-400">✨ Vantagens do App Instalado:</p>
          <p className="text-zinc-400 leading-relaxed">
            Abre instantaneamente em tela cheia (sem barras de navegador), consome menos bateria e fica com o ícone oficial na sua lista de aplicativos.
          </p>
        </div>

        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition flex items-center justify-center"
        >
          Entendi, fechar
        </button>
      </div>
    </div>
  );
}
