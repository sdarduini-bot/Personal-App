"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Plus, Bell, Volume2, VolumeX } from "lucide-react";

interface RestTimerProps {
  initialSeconds?: number;
  onFinished?: () => void;
  autoStart?: boolean;
}

export default function RestTimer({
  initialSeconds = 60,
  onFinished,
  autoStart = false,
}: RestTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Reproduzir bipe sintetizado no fim do descanso usando Web Audio API
  const playBeep = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      // Sequência de 3 bipes esportivos
      [0, 0.2, 0.4].forEach((delay, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(idx === 2 ? 880 : 587.33, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.18);
      });

      // Vibração móvel se disponível
      if ("vibrate" in navigator) {
        navigator.vibrate([250, 100, 250, 100, 400]);
      }
    } catch {
      // AudioContext pode estar bloqueado antes do primeiro clique do usuário
    }
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            playBeep();
            if (onFinished) onFinished();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, soundEnabled]);

  const toggleRun = () => {
    if (timeLeft === 0) {
      setTimeLeft(totalSeconds);
      setIsRunning(true);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(totalSeconds);
  };

  const addTime = (secs: number) => {
    setTimeLeft((prev) => prev + secs);
    setTotalSeconds((prev) => Math.max(prev, timeLeft + secs));
  };

  const setPreset = (secs: number) => {
    setTotalSeconds(secs);
    setTimeLeft(secs);
    setIsRunning(true);
  };

  // Formatar tempo mm:ss
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const progressPercent = totalSeconds > 0 ? ((totalSeconds - timeLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 shadow-xl flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
            Cronômetro de Descanso
          </span>
        </div>
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-zinc-400 hover:text-zinc-200 transition"
          title={soundEnabled ? "Desativar som" : "Ativar som"}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          )}
        </button>
      </div>

      {/* Display do Tempo */}
      <div className="relative my-2 flex items-center justify-center">
        <div className={`text-5xl font-black font-mono tracking-tight transition-all duration-300 ${
          timeLeft === 0
            ? "text-emerald-400 scale-110 animate-bounce"
            : isRunning
            ? "text-zinc-100"
            : "text-zinc-300"
        }`}>
          {timeFormatted}
        </div>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden mb-4 border border-zinc-800">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Controles Principais */}
      <div className="flex items-center justify-center gap-3 w-full mb-3">
        <button
          type="button"
          onClick={handleReset}
          className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition"
          title="Reiniciar"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={toggleRun}
          className={`flex-1 py-3 px-6 rounded-2xl font-bold text-sm transition shadow-lg flex items-center justify-center gap-2 active:scale-95 ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20"
              : "bg-emerald-500 hover:bg-emerald-400 text-zinc-950 shadow-emerald-500/20"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5 fill-current" />
              <span>Pausar</span>
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" />
              <span>{timeLeft === 0 ? "Novo Descanso" : "Iniciar"}</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => addTime(15)}
          className="p-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 active:scale-95 transition flex items-center gap-0.5 text-xs font-bold"
          title="+15 segundos"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>15s</span>
        </button>
      </div>

      {/* Presets Rápidos */}
      <div className="flex items-center gap-1.5 w-full justify-center">
        {[30, 45, 60, 90, 120].map((sec) => (
          <button
            key={sec}
            type="button"
            onClick={() => setPreset(sec)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
              totalSeconds === sec
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                : "bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400"
            }`}
          >
            {sec >= 60 ? `${sec / 60}m` : `${sec}s`}
          </button>
        ))}
      </div>
    </div>
  );
}
