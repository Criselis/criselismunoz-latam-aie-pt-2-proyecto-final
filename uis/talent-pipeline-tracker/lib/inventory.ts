/**
 * Inventory API client — centralised calls to /inventory endpoints.
 *
 * Every function reads the auth token from localStorage and attaches
 * it as `Authorization: Bearer <token>`. Errors from the API are
 * extracted from the response body and thrown as ApiError instances
 * with user-friendly messages in Spanish.
 */

import type {
  InboundOrderCreate,
  InboundOrderOut,
  OrderOut,
  OutboundOrderCreate,
  OutboundOrderOut,
  ProductCreate,
  ProductOut,
} from "./types";
import { ApiError } from "./errors";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

/** Read the JWT token from localStorage (client-side only). */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nexova_access_token");
}

/**
 * Central request helper — adds auth headers, handles errors,
 * and returns parsed JSON.
 */
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  const token = getAuthToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, { headers, ...options });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.",
      0,
    );
  }

  if (!res.ok) {
    // 401 → token expirado — redirigir al login (lo maneja el AuthGuard)
    if (res.status === 401) {
      throw new ApiError(
        "Sesión expirada. Por favor, inicia sesión nuevamente.",
        401,
      );
    }

    let message = `Error ${res.status}: ${res.statusText}`;
    try {
      const body = await res.json();
      if (body.detail) {
        message = Array.isArray(body.detail)
          ? body.detail
              .map(
                (d: {
                  field?: string;
                  message?: string;
                  msg?: string;
                  loc?: string[];
                }) => {
                  const field = d.field || d.loc?.at(-1);
                  const detailMessage =
                    d.message || d.msg || "Valor no válido";
                  return field
                    ? `${field}: ${detailMessage}`
                    : detailMessage;
                },
              )
              .join(", ")
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

  try {
    return await res.json();
  } catch {
    throw new ApiError(
      "El servidor respondió con un formato inesperado. Inténtalo de nuevo.",
      res.status,
    );
  }
}

// ====================================================================
// Products
// ====================================================================

/** GET /inventory/products — list all active products with computed stock. */
export async function getProducts(): Promise<ProductOut[]> {
  return request<ProductOut[]>("/inventory/products");
}

/** GET /inventory/products/:id — get a single product with computed stock. */
export async function getProductById(id: string): Promise<ProductOut> {
  return request<ProductOut>(`/inventory/products/${id}`);
}

/** POST /inventory/products — create a new product (training program). */
export async function createProduct(
  data: ProductCreate,
): Promise<ProductOut> {
  return request<ProductOut>("/inventory/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ====================================================================
// Inbound orders
// ====================================================================

/** POST /inventory/orders/inbound — register an inbound order. */
export async function createInboundOrder(
  data: InboundOrderCreate,
): Promise<InboundOrderOut> {
  return request<InboundOrderOut>("/inventory/orders/inbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ====================================================================
// Outbound orders
// ====================================================================

/** POST /inventory/orders/outbound — register an outbound order. */
export async function createOutboundOrder(
  data: OutboundOrderCreate,
): Promise<OutboundOrderOut> {
  return request<OutboundOrderOut>("/inventory/orders/outbound", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ====================================================================
// Combined orders
// ====================================================================

/** GET /inventory/orders — list all orders (inbound + outbound). */
export async function getOrders(
  productId?: string,
): Promise<OrderOut[]> {
  const qs = productId ? `?product_id=${encodeURIComponent(productId)}` : "";
  return request<OrderOut[]>(`/inventory/orders${qs}`);
}