"use client";

import { useRef, useState, type DragEvent } from "react";
import Link from "next/link";
import { AuthGuard } from "@/lib/auth-guard";
import { Header, Spinner } from "@/lib/components";
import { ApiError } from "@/lib/errors";
import {
  INVALID_RULE_LABELS,
  SCORE_LABELS,
  STATUS_LABELS,
  analyzeIncidentsFile,
  downloadIncidentsResults,
  type IncidentsAnalysis,
} from "@/lib/incidents-analysis";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof ApiError || error instanceof Error ? error.message : fallback;
}

function StatCard({ label, value, tone = "gray" }: { label: string; value: string | number; tone?: "gray" | "green" | "amber" | "indigo" }) {
  const tones = {
    gray: "text-gray-900",
    green: "text-emerald-700",
    amber: "text-amber-700",
    indigo: "text-indigo-700",
  };
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${tones[tone]}`}>{value}</p>
    </div>
  );
}

function BreakdownTable({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; count: number; percentage: number }[];
}) {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-label={title}>
      <h2 className="text-base font-semibold text-gray-900 mb-4">{title}</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
            <th scope="col" className="pb-2 font-semibold">Valor</th>
            <th scope="col" className="pb-2 font-semibold text-right">Tickets</th>
            <th scope="col" className="pb-2 font-semibold text-right">%</th>
            <th scope="col" className="pb-2 pl-4 font-semibold w-1/3"><span className="sr-only">Proporción</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.name}>
              <td className="py-2 font-medium text-gray-800">{row.name}</td>
              <td className="py-2 text-right tabular-nums">{row.count}</td>
              <td className="py-2 text-right tabular-nums text-gray-500">{row.percentage.toFixed(1)}%</td>
              <td className="py-2 pl-4">
                <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
                  <div className="h-2 rounded-full bg-indigo-500" style={{ width: `${row.percentage}%` }} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function AnalysisContent() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [analysis, setAnalysis] = useState<IncidentsAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pickFile = (selected: File | undefined) => {
    setError(null);
    if (!selected) return;
    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setError("Selecciona un fichero con extensión .csv.");
      return;
    }
    setFile(selected);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    pickFile(event.dataTransfer.files[0]);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      setAnalysis(await analyzeIncidentsFile(file));
    } catch (err) {
      setAnalysis(null);
      setError(errorMessage(err, "No se pudo analizar el fichero."));
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      await downloadIncidentsResults();
    } catch (err) {
      setError(errorMessage(err, "No se pudo descargar el CSV de resultados."));
    } finally {
      setExporting(false);
    }
  };

  const invalidRules = analysis?.invalid_breakdown.filter((item) => item.count > 0) ?? [];
  const average = analysis?.satisfaction.average_score;

  return (
    <div className="font-sans text-gray-800 antialiased bg-gray-50 min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Análisis de tickets de soporte</h1>
            <p className="mt-1 text-sm text-gray-500">
              Sube el CSV exportado del helpdesk para validar los registros y ver las métricas del equipo de soporte.
              Los emails de clientes nunca se muestran ni se exportan.
            </p>
          </div>
          <Link href="/incidents" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
            ← Gestor de incidencias
          </Link>
        </div>

        {/* Upload */}
        <section aria-label="Cargar fichero" className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <div
            role="button"
            tabIndex={0}
            aria-label="Arrastra el CSV aquí o pulsa para seleccionarlo"
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
              dragging ? "border-indigo-500 bg-indigo-50" : "border-gray-300 hover:border-indigo-400"
            }`}
          >
            <p className="text-sm font-medium text-gray-700">
              {file ? file.name : "Arrastra aquí el fichero CSV o haz clic para seleccionarlo"}
            </p>
            <p className="mt-1 text-xs text-gray-500">Formato: CSV del helpdesk (ticket_id, category, status, …)</p>
            <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              aria-label="Seleccionar fichero CSV"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={analyze}
              disabled={!file || loading}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-700 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading && <Spinner className="w-4 h-4" />}
              {loading ? "Analizando…" : "Analizar fichero"}
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={!analysis || exporting}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {exporting && <Spinner className="w-4 h-4" />}
              Descargar resultados (CSV)
            </button>
          </div>
        </section>

        {error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {analysis && (
          <>
            <p className="text-sm text-gray-500">
              Fichero analizado: <span className="font-medium text-gray-700">{analysis.source_file}</span>
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Registros en el fichero" value={analysis.total_records} />
              <StatCard label="Registros válidos" value={analysis.valid_records} tone="green" />
              <StatCard label="Inválidos / incompletos" value={analysis.invalid_records} tone={analysis.invalid_records ? "amber" : "gray"} />
              <StatCard label="Satisfacción media" value={average == null ? "—" : `${average.toFixed(2)} / 5`} tone="indigo" />
            </div>

            {/* Invalid records */}
            {analysis.invalid_records > 0 ? (
              <section role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h2 className="text-base font-semibold text-amber-800">
                  {analysis.invalid_records} {analysis.invalid_records === 1 ? "registro excluido" : "registros excluidos"} del análisis
                </h2>
                <p className="mt-1 text-sm text-amber-800">
                  No se tienen en cuenta en las métricas. Corrige estos problemas en el helpdesk y vuelve a exportar:
                </p>
                <ul className="mt-3 space-y-1 text-sm text-amber-900">
                  {invalidRules.map((item) => (
                    <li key={item.rule} className="flex justify-between gap-4 max-w-md">
                      <span>{INVALID_RULE_LABELS[item.rule] ?? item.label}</span>
                      <span className="font-semibold tabular-nums">{item.count}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : (
              <section role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Todos los registros del fichero son válidos.
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <BreakdownTable
                title="Tickets por categoría (válidos)"
                rows={analysis.by_category.map((item) => ({ name: item.category, count: item.count, percentage: item.percentage }))}
              />
              <BreakdownTable
                title="Tickets por estado (válidos)"
                rows={analysis.by_status.map((item) => ({
                  name: `${item.status} · ${STATUS_LABELS[item.status] ?? item.status}`,
                  count: item.count,
                  percentage: item.percentage,
                }))}
              />
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm" aria-label="Índice de satisfacción">
              <h2 className="text-base font-semibold text-gray-900">Índice de satisfacción (tickets cerrados)</h2>
              <p className="mt-1 text-sm text-gray-500">
                {analysis.satisfaction.scored_tickets} de {analysis.satisfaction.closed_tickets} tickets cerrados con puntuación · media{" "}
                <span className="font-semibold text-gray-800">{average == null ? "—" : `${average.toFixed(2)} / 5.00`}</span>
              </p>
              <ul className="mt-4 space-y-2">
                {analysis.satisfaction.distribution.map((item) => {
                  const pct = analysis.satisfaction.scored_tickets
                    ? (item.count * 100) / analysis.satisfaction.scored_tickets
                    : 0;
                  return (
                    <li key={item.score} className="grid grid-cols-[10rem_1fr_3rem] items-center gap-3 text-sm">
                      <span className="text-gray-700">
                        {item.score} · {SCORE_LABELS[item.score]}
                      </span>
                      <div className="h-2 rounded-full bg-gray-100" aria-hidden="true">
                        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-right tabular-nums">{item.count}</span>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default function IncidentsAnalysisPage() {
  return (
    <AuthGuard>
      <AnalysisContent />
    </AuthGuard>
  );
}
