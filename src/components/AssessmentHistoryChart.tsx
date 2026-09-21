"use client";

import React from "react";
import { TrendingDown, TrendingUp, Sparkles, Target, Activity } from "lucide-react";

interface AssessmentRecord {
  id: string;
  date: string;
  weight: number;
  bodyFatPercent: number;
  fatMass: number;
  leanMass: number;
  idealWeight: number;
  targetBodyFat: number;
}

interface Props {
  assessments: AssessmentRecord[];
  targetBodyFat?: number;
}

export default function AssessmentHistoryChart({ assessments, targetBodyFat }: Props) {
  if (!assessments || assessments.length === 0) return null;

  // Ordenar cronologicamente para os gráficos (mais antiga -> mais recente)
  const chronological = [...assessments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const latest = chronological[chronological.length - 1];
  const first = chronological[0];
  const totalAssessments = chronological.length;

  const diffBf = totalAssessments > 1 ? latest.bodyFatPercent - first.bodyFatPercent : 0;
  const diffLean = totalAssessments > 1 ? latest.leanMass - first.leanMass : 0;
  const diffFat = totalAssessments > 1 ? latest.fatMass - first.fatMass : 0;

  // Dados para o gráfico de linha de % de Gordura
  const minBf = Math.max(0, Math.min(...chronological.map((a) => a.bodyFatPercent)) - 3);
  const maxBf = Math.max(...chronological.map((a) => a.bodyFatPercent)) + 3;
  const bfRange = maxBf - minBf || 1;

  const chartWidth = 500;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 25;

  const points = chronological.map((a, index) => {
    const x =
      chronological.length === 1
        ? chartWidth / 2
        : paddingX +
          (index / (chronological.length - 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((a.bodyFatPercent - minBf) / bfRange) * (chartHeight - paddingY * 2);
    return { x, y, data: a };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, "");

  // Linha da Meta
  const targetY = targetBodyFat
    ? chartHeight -
      paddingY -
      ((targetBodyFat - minBf) / bfRange) * (chartHeight - paddingY * 2)
    : null;

  return (
    <div className="space-y-6">
      {/* 1. CARDS DE DESTAQUE EVOLUTIVO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: Variação de Gordura */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">
              {totalAssessments > 1 ? "Evolução do % Gordura" : "% Gordura Atual"}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-emerald-400 font-mono">
                {latest.bodyFatPercent.toFixed(1)}%
              </span>
              {totalAssessments > 1 && (
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    diffBf <= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {diffBf <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {diffBf > 0 ? "+" : ""}
                  {diffBf.toFixed(1)}%
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              Meta: {latest.targetBodyFat.toFixed(1)}%
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Target className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Massa Magra */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Massa Magra</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-cyan-400 font-mono">
                {latest.leanMass.toFixed(1)} kg
              </span>
              {totalAssessments > 1 && (
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    diffLean >= 0 ? "text-cyan-400" : "text-zinc-400"
                  }`}
                >
                  {diffLean >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {diffLean > 0 ? "+" : ""}
                  {diffLean.toFixed(1)} kg
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              Músculos, ossos e órgãos
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Massa Gorda */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-xs text-zinc-400 font-medium block">Massa Gorda</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-400 font-mono">
                {latest.fatMass.toFixed(1)} kg
              </span>
              {totalAssessments > 1 && (
                <span
                  className={`text-xs font-bold flex items-center gap-0.5 ${
                    diffFat <= 0 ? "text-emerald-400" : "text-amber-400"
                  }`}
                >
                  {diffFat <= 0 ? (
                    <TrendingDown className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  {diffFat > 0 ? "+" : ""}
                  {diffFat.toFixed(1)} kg
                </span>
              )}
            </div>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              Peso total: {latest.weight.toFixed(1)} kg
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. GRÁFICO DE EVOLUÇÃO TEMPORAL */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-3xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-zinc-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Curva de Evolução do % de Gordura
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Acompanhamento ao longo das avaliações realizadas
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
              <span className="text-zinc-300">% Gordura</span>
            </div>
            {targetBodyFat && (
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-0.5 border-t-2 border-dashed border-cyan-400" />
                <span className="text-zinc-300">Meta ({targetBodyFat}%)</span>
              </div>
            )}
          </div>
        </div>

        {chronological.length === 1 ? (
          /* Se tiver apenas 1 avaliação, exibe visualização de composição em barra/donut */
          <div className="py-6 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-full max-w-md bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800/80 mb-3">
              <div className="flex justify-between text-xs font-semibold text-zinc-300 mb-2">
                <span>Composição Corporal Atual ({latest.weight.toFixed(1)} kg)</span>
                <span className="text-emerald-400">{latest.bodyFatPercent.toFixed(1)}% Gordura</span>
              </div>
              <div className="w-full h-4 bg-zinc-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${100 - latest.bodyFatPercent}%` }}
                  className="bg-cyan-500 h-full transition-all duration-500"
                  title={`Massa Magra: ${latest.leanMass.toFixed(1)} kg`}
                />
                <div
                  style={{ width: `${latest.bodyFatPercent}%` }}
                  className="bg-amber-500 h-full transition-all duration-500"
                  title={`Massa Gorda: ${latest.fatMass.toFixed(1)} kg`}
                />
              </div>
              <div className="flex justify-between text-[11px] text-zinc-400 mt-2">
                <span className="flex items-center gap-1 text-cyan-400">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" />
                  Massa Magra: {latest.leanMass.toFixed(1)} kg ({(100 - latest.bodyFatPercent).toFixed(1)}%)
                </span>
                <span className="flex items-center gap-1 text-amber-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                  Gordura: {latest.fatMass.toFixed(1)} kg ({latest.bodyFatPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
            <p className="text-xs text-zinc-500">
              💡 Registre novas avaliações nas próximas consultas para habilitar o gráfico histórico de tendência comparativa!
            </p>
          </div>
        ) : (
          /* SVG do gráfico de linha */
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-48 overflow-visible"
            >
              {/* Linhas de Grade de Fundo */}
              <line
                x1={paddingX}
                y1={paddingY}
                x2={chartWidth - paddingX}
                y2={paddingY}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight / 2}
                x2={chartWidth - paddingX}
                y2={chartHeight / 2}
                stroke="#27272a"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1={paddingX}
                y1={chartHeight - paddingY}
                x2={chartWidth - paddingX}
                y2={chartHeight - paddingY}
                stroke="#27272a"
                strokeWidth="1"
              />

              {/* Linha da Meta */}
              {targetY !== null && targetY >= paddingY && targetY <= chartHeight - paddingY && (
                <line
                  x1={paddingX}
                  y1={targetY}
                  x2={chartWidth - paddingX}
                  y2={targetY}
                  stroke="#22d3ee"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                />
              )}

              {/* Área Sombreada sob a linha */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d={`${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${
                  points[0].x
                } ${chartHeight - paddingY} Z`}
                fill="url(#chartGradient)"
              />

              {/* Linha Principal da Trajetória */}
              <path
                d={pathD}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Pontos nas Avaliações */}
              {points.map((pt, i) => (
                <g key={i}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="5"
                    className="fill-emerald-400 stroke-zinc-950 stroke-2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 10}
                    textAnchor="middle"
                    className="text-[10px] font-mono font-bold fill-zinc-200"
                  >
                    {pt.data.bodyFatPercent.toFixed(1)}%
                  </text>
                  <text
                    x={pt.x}
                    y={chartHeight - 6}
                    textAnchor="middle"
                    className="text-[9px] fill-zinc-500 font-mono"
                  >
                    {new Date(pt.data.date + "T12:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}
