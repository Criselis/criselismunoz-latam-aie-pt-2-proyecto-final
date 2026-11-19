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

export interface IncidentOut {
  id: string;
  title: string;
  description: string;
  category: IncidentCategoryValue;
  status: IncidentStatusValue;
  origin: IncidentOriginValue;
  branch: IncidentBranchValue;
  created_at: string;
  updated_at: string;
}

export interface IncidentCreate {
  title: string;
  description: string;
  category: IncidentCategoryValue;
  origin: IncidentOriginValue;
  branch: IncidentBranchValue;
}

export interface IncidentPatch {
  title?: string;
  description?: string;
  category?: IncidentCategoryValue;
  status?: IncidentStatusValue;
  origin?: IncidentOriginValue;
  branch?: IncidentBranchValue;
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

export const INCIDENT_STATUS_LABELS = {
  open: "Abierta",
  in_progress: "En progreso",
  resolved: "Resuelta",
  discarded: "Descartada",
} as const;

export const INCIDENT_ORIGIN_LABELS = {
  customer: "Cliente",
  branch: "Sede",
  internal: "Interna",
} as const;

export const INCIDENT_BRANCH_LABELS = {
  central: "Central",
  valencia: "Valencia",
  miami: "Miami",
} as const;

export const INCIDENT_CATEGORY_LABELS = {
  recruitment_operations: "Operaciones de selección",
  corporate_training: "Formación corporativa",
  customer_support: "Atención al cliente",
  sales_business_development: "Ventas y desarrollo de negocio",
  marketing_communications: "Marketing y comunicación",
  human_resources: "Recursos humanos",
  technology_infrastructure: "Tecnología e infraestructura",
  executive_management: "Dirección ejecutiva",
} as const;

export const INCIDENT_STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-amber-100 text-amber-800",
  resolved: "bg-green-100 text-green-800",
  discarded: "bg-gray-100 text-gray-700",
};

export type StatusValue = keyof typeof STATUS_LABELS;
export type StageValue = keyof typeof STAGE_LABELS;
export type IncidentStatusValue = keyof typeof INCIDENT_STATUS_LABELS;
export type IncidentOriginValue = keyof typeof INCIDENT_ORIGIN_LABELS;
export type IncidentBranchValue = keyof typeof INCIDENT_BRANCH_LABELS;
export type IncidentCategoryValue = keyof typeof INCIDENT_CATEGORY_LABELS;

export const STATUS_VALUES: StatusValue[] = ["received", "in_progress", "selected", "discarded"];
export const STAGE_VALUES: StageValue[] = [
  "pending",
  "review",
  "personal_interview",
  "technical_interview",
  "offer_presented",
];
export const INCIDENT_STATUS_VALUES = Object.keys(INCIDENT_STATUS_LABELS) as IncidentStatusValue[];
export const INCIDENT_ORIGIN_VALUES = Object.keys(INCIDENT_ORIGIN_LABELS) as IncidentOriginValue[];
export const INCIDENT_BRANCH_VALUES = Object.keys(INCIDENT_BRANCH_LABELS) as IncidentBranchValue[];
export const INCIDENT_CATEGORY_VALUES = Object.keys(INCIDENT_CATEGORY_LABELS) as IncidentCategoryValue[];

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

export interface IncidentFilters {
  status: string;
  category: string;
  origin: string;
  branch: string;
  search: string;
}

// ====================================================================
// Inventory types
// ====================================================================

export interface ProductOut {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  duration_hours: number;
  price: number;
  max_participants: number;
  is_active: boolean;
  current_stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  name: string;
  sku: string;
  description?: string | null;
  duration_hours?: number;
  price?: number;
  max_participants?: number;
  is_active?: boolean;
}

export interface InboundOrderCreate {
  product_id: string;
  quantity: number;
  notes?: string | null;
}

export interface InboundOrderOut {
  id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  user_uuid: string;
  notes: string | null;
}

export interface OutboundOrderCreate {
  product_id: string;
  quantity: number;
  reason?: string | null;
  notes?: string | null;
}

export interface OutboundOrderOut {
  id: string;
  product_id: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  user_uuid: string;
  notes: string | null;
}

export interface OrderOut {
  id: string;
  order_type: "inbound" | "outbound";
  product_id: string;
  product_name: string;
  quantity: number;
  reason: string | null;
  created_at: string;
  user_uuid: string;
  notes: string | null;
}
