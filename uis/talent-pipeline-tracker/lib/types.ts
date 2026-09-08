// ===== API Response Types =====

export interface RecordOut {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url: string | null;
  cv_url: string | null;
  status: StatusValue;
  stage: StageValue;
  experience_years: number;
  notes_count: number;
  applied_at: string;
  updated_at: string;
}

export interface NoteOut {
  id: string;
  content: string;
  created_at: string;
}

export interface NoteCreate {
  content: string;
}

export interface RecordCreate {
  full_name: string;
  email: string;
  phone: string;
  position: string;
  linkedin_url?: string | null;
  cv_url?: string | null;
  experience_years: number;
}

export interface RecordPatch {
  status?: StatusValue | null;
  stage?: StageValue | null;
}

// ===== Enums =====

export const STATUS_LABELS: Record<string, string> = {
  received: "Recibido",
  in_progress: "En Progreso",
  selected: "Seleccionado",
  discarded: "Descartado",
};

export const STAGE_LABELS: Record<string, string> = {
  pending: "Pendiente",
  review: "Revisión",
  personal_interview: "Entrevista Personal",
  technical_interview: "Entrevista Técnica",
  offer_presented: "Ofertado",
};

export const STATUS_COLORS: Record<string, string> = {
  received: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  selected: "bg-green-100 text-green-800",
  discarded: "bg-red-100 text-red-800",
};

export const STAGE_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  review: "bg-purple-100 text-purple-800",
  personal_interview: "bg-indigo-100 text-indigo-800",
  technical_interview: "bg-teal-100 text-teal-800",
  offer_presented: "bg-emerald-100 text-emerald-800",
};

export type StatusValue = keyof typeof STATUS_LABELS;
export type StageValue = keyof typeof STAGE_LABELS;

export const STATUS_VALUES: StatusValue[] = ["received", "in_progress", "selected", "discarded"];
export const STAGE_VALUES: StageValue[] = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented",
];

// ===== Auth / User types =====

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  full_name?: string;
  phone?: string;
  address?: string;
  linkedin_url?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  phone?: string;
  linkedin_url?: string;
}

// ===== Password Reset types =====

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface MessageResponse {
  message: string;
}

// ===== Filter types =====

export interface Filters {
  status: string;
  stage: string;
  search: string;
}
