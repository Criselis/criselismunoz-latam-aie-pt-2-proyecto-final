/**
 * Auth API client
 * Handles login, register, profile, and token management.
 */

import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  RegisterRequest,
  ResetPasswordRequest,
  UserProfile,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://playground.4geeks.com/tracker/api/v1";

class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;
  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  // Attach token if available
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    headers,
    ...options,
  });

  if (!res.ok) {
    // ----- 401: token expirado/inválido → logout automático -----
    if (res.status === 401) {
      removeToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new ApiError("Sesión expirada. Por favor, inicia sesión nuevamente.", 401);
    }

    let message = `Error ${res.status}: ${res.statusText}`;
    let fieldErrors: Record<string, string[]> | undefined;
    try {
      const body = await res.json();
      if (body.detail) {
        if (Array.isArray(body.detail)) {
          // FastAPI validation errors: array of {loc, msg, type}
          fieldErrors = {};
          for (const d of body.detail) {
            const field = d.loc?.join(".") || "body";
            if (!fieldErrors[field]) fieldErrors[field] = [];
            fieldErrors[field].push(d.msg);
          }
          message = Object.values(fieldErrors).flat().join(", ");
        } else {
          message = body.detail;
        }
      }
    } catch {
      // ignore if body is not JSON
    }
    throw new ApiError(message, res.status, fieldErrors);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json();
}

// ===== Token Management =====

const TOKEN_KEY = "nexova_access_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ===== Auth API Functions =====

/**
 * Login: POST /auth/login
 * Stores the token on success.
 */
export async function loginUser(data: LoginRequest): Promise<LoginResponse> {
  // FastAPI OAuth2 expects form-encoded data for /token endpoint
  // But we use JSON as the project API uses JSON body
  const res = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (res.access_token) {
    setToken(res.access_token);
  }
  return res;
}

/**
 * Register: POST /users
 * Then automatically login and store token.
 */
export async function registerUser(data: RegisterRequest): Promise<UserProfile> {
  // First create the user
  const user = await request<UserProfile>("/users", {
    method: "POST",
    body: JSON.stringify(data),
  });

  // Then login to get the token
  const loginRes = await request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: data.email, password: data.password }),
  });

  if (loginRes.access_token) {
    setToken(loginRes.access_token);
  }

  return user;
}

/**
 * Get current user profile: GET /auth/me
 * Requires valid token.
 */
export async function getProfile(): Promise<UserProfile> {
  return request<UserProfile>("/auth/me");
}

/**
 * Update profile: PUT /profiles/me
 * Returns the updated profile.
 */
export async function updateProfile(data: {
  name?: string;
  phone?: string;
  address?: string;
}): Promise<UserProfile> {
  return request<UserProfile>("/profiles/me", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

/**
 * Logout — just clears the token locally.
 */
export function logoutUser(): void {
  removeToken();
}

/**
 * Forgot Password: POST /auth/forgot-password
 * Always returns 200. The user receives an email if the email exists.
 */
export async function forgotPassword(data: ForgotPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Reset Password: POST /auth/reset-password
 * Consumes a one-time reset token and sets a new password.
 */
export async function resetPassword(data: ResetPasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Change Password: POST /auth/change-password
 * Requires authentication. Verifies the current password before updating.
 */
export async function changePassword(data: ChangePasswordRequest): Promise<MessageResponse> {
  return request<MessageResponse>("/auth/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}