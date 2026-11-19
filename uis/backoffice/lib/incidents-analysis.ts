/**
 * Incidents CSV analysis client — calls POST /api/incidents/analyze and
 * GET /api/incidents/results/export (same logic as scripts/analyze.py).
 */

import { ApiError } from "./errors";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/backend-api";

export interface InvalidRuleCount {
  rule: string;
  label: string;
  count: number;
}

export interface CategoryCount {
  category: string;
  count: number;
  percentage: number;
}

export interface StatusCount {
  status: string;
  count: number;
  percentage: number;
}

export interface ScoreCount {
  score: number;
  label: string;
  count: number;
}

export interface IncidentsAnalysis {
  source_file: string;
  total_records: number;
  valid_records: number;
  invalid_records: number;
  invalid_breakdown: InvalidRuleCount[];
  by_category: CategoryCount[];
  by_status: StatusCount[];
  satisfaction: {
    closed_tickets: number;
    scored_tickets: number;
    average_score: number | null;
    distribution: ScoreCount[];
  };
}

/** Spanish labels for the invalid-record rules returned by the API. */
export const INVALID_RULE_LABELS: Record<string, string> = {
  missing_ticket_id: "Falta ticket_id",
  missing_date: "Falta la fecha",
  missing_client_company: "Falta client_company",
  invalid_category: "Categoría vacía o no válida",
  invalid_description: "Descripción vacía o con menos de 5 caracteres",
  invalid_agent_id: "agent_id vacío o sin formato AGT-XX",
  invalid_status: "Estado vacío o no válido",
  invalid_email: "Email de cliente vacío o no válido",
  closed_without_score: "Ticket cerrado sin puntuación",
  score_out_of_range: "Puntuación fuera del rango 1–5",
};

export const STATUS_LABELS: Record<string, string> = {
  OPEN: "Abierto",
  CLOSED: "Cerrado",
  DISCARDED: "Descartado",
};

export const SCORE_LABELS: Record<number, string> = {
  1: "Muy insatisfecho",
  2: "Insatisfecho",
  3: "Neutral",
  4: "Satisfecho",
  5: "Muy satisfecho",
};

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("nexova_access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: { ...authHeaders(), ...(init.headers as Record<string, string>) },
    });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Inténtalo de nuevo.", 0);
  }
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      if (typeof body.detail === "string") message = body.detail;
    } catch {
      // body is not JSON
    }
    if (res.status === 401) message = "Sesión expirada. Por favor, inicia sesión nuevamente.";
    throw new ApiError(message, res.status);
  }
  return res;
}

/** Upload the CSV (multipart) and get the summary. */
export async function analyzeIncidentsFile(file: File): Promise<IncidentsAnalysis> {
  const form = new FormData();
  form.append("file", file);
  // No Content-Type header: the browser sets the multipart boundary.
  const res = await send("/api/incidents/analyze", { method: "POST", body: form });
  return res.json();
}

/** Download the last analysis as CSV through the browser. */
export async function downloadIncidentsResults(): Promise<void> {
  const res = await send("/api/incidents/results/export", { method: "GET" });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "incidents-analysis-results.csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
