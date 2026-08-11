import type { RecordOut, NoteOut, NoteCreate, RecordCreate, RecordPatch } from "./types";

const API_BASE = "https://playground.4geeks.com/tracker/api/v1";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let message = `Error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) {
        message = Array.isArray(body.detail)
          ? body.detail.map((d: { msg: string }) => d.msg).join(", ")
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
