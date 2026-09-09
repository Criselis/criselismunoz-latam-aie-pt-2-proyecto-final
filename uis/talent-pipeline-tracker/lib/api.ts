import type {
  IncidentCreate,
  IncidentOut,
  IncidentPatch,
  RecordOut,
  NoteOut,
  NoteCreate,
  RecordCreate,
  RecordPatch,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://playground.4geeks.com/tracker/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/** Read the JWT token from localStorage (client-side only). */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nexova_access_token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Attach the auth token if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { headers, ...options });

  if (!res.ok) {
    // ----- 401: token expirado/inválido → logout automático -----
    if (res.status === 401) {
      localStorage.removeItem("nexova_access_token");
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Sesión expirada. Por favor, inicia sesión nuevamente.", 401);
    }

    let message = `Error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) {
        message = Array.isArray(body.detail)
          ? body.detail.map((d: { field?: string; message?: string; msg?: string; loc?: string[] }) => {
              const field = d.field || d.loc?.at(-1);
              const detailMessage = d.message || d.msg || "Valor no válido";
              return field ? `${field}: ${detailMessage}` : detailMessage;
            }).join(", ")
          : body.detail;
      }
    } catch {
      // ignore if body is not JSON
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ===== Records =====

export async function getRecords(params?: {
  status?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<RecordOut[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.stage) searchParams.set("stage", params.stage);
  if (params?.search) searchParams.set("search", params.search);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const qs = searchParams.toString();
  return request<RecordOut[]>(`/records${qs ? `?${qs}` : ""}`);
}

export async function getRecordById(id: string): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`);
}

export async function createRecord(data: RecordCreate): Promise<RecordOut> {
  return request<RecordOut>("/records", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function replaceRecord(id: string, data: RecordCreate): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function patchRecord(id: string, data: RecordPatch): Promise<RecordOut> {
  return request<RecordOut>(`/records/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteRecord(id: string): Promise<void> {
  return request<void>(`/records/${id}`, {
    method: "DELETE",
  });
}

// ===== Incidents =====

export async function getIncidents(params?: {
  status?: string;
  category?: string;
  origin?: string;
  branch?: string;
  search?: string;
}): Promise<IncidentOut[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category) searchParams.set("category", params.category);
  if (params?.origin) searchParams.set("origin", params.origin);
  if (params?.branch) searchParams.set("branch", params.branch);
  if (params?.search) searchParams.set("search", params.search);

  const qs = searchParams.toString();
  return request<IncidentOut[]>(`/incidents${qs ? `?${qs}` : ""}`);
}

export async function createIncident(data: IncidentCreate): Promise<IncidentOut> {
  return request<IncidentOut>("/incidents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function patchIncident(id: string, data: IncidentPatch): Promise<IncidentOut> {
  return request<IncidentOut>(`/incidents/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function transitionIncidentStatus(id: string, status: IncidentPatch["status"]): Promise<IncidentOut> {
  return request<IncidentOut>(`/incidents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getIncidentsSummary(): Promise<{
  total: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  by_origin: Record<string, number>;
  by_branch: Record<string, number>;
}> {
  return request<{
    total: number;
    by_status: Record<string, number>;
    by_category: Record<string, number>;
    by_origin: Record<string, number>;
    by_branch: Record<string, number>;
  }>("/incidents/summary");
}

export async function deleteIncident(id: string): Promise<void> {
  return request<void>(`/incidents/${id}`, {
    method: "DELETE",
  });
}

// ===== Notes =====

export async function getNotes(recordId: string): Promise<NoteOut[]> {
  return request<NoteOut[]>(`/records/${recordId}/notes`);
}

export async function addNote(recordId: string, data: NoteCreate): Promise<NoteOut> {
  return request<NoteOut>(`/records/${recordId}/notes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteNote(recordId: string, noteId: string): Promise<void> {
  return request<void>(`/records/${recordId}/notes/${noteId}`, {
    method: "DELETE",
  });
}

export { ApiError };
