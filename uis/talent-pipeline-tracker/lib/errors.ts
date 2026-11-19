/**
 * Friendly error helpers — transforma errores técnicos en mensajes
 * legibles para el usuario final con CTA incluida.
 */

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

/**
 * Mapa de estados HTTP a mensajes públicos (sin exponer detalles internos).
 */
const HTTP_MESSAGES: Record<number, string> = {
  400: "La solicitud contiene datos inválidos. Revisa los campos e inténtalo de nuevo.",
  401: "Tu sesión ha expirado. Inicia sesión nuevamente.",
  403: "No tienes permiso para realizar esta acción.",
  404: "El recurso solicitado no fue encontrado.",
  409: "El recurso ya existe o hay un conflicto con los datos actuales.",
  422: "Los datos enviados no son válidos. Revisa los campos.",
  429: "Has realizado demasiadas solicitudes. Espera unos segundos y vuelve a intentar.",
  500: "El servidor no pudo procesar la solicitud. Inténtalo de nuevo en unos minutos.",
  502: "El servidor está temporalmente sin respuesta. Inténtalo de nuevo.",
  503: "El servicio no está disponible en este momento. Inténtalo más tarde.",
};

const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.";

const DEFAULT_MESSAGE = "Ocurrió un error inesperado. Inténtalo de nuevo o contacta a soporte.";

/**
 * Traducción de términos técnicos a español legible para reemplazos en mensajes.
 */
const TECHNICAL_WORDS: Record<string, string> = {
  full_name: "Nombre completo",
  email: "Correo electrónico",
  phone: "Teléfono",
  position: "Puesto",
  experience_years: "Años de experiencia",
  linkedin_url: "URL de LinkedIn",
  cv_url: "URL del CV",
  title: "Título",
  description: "Descripción",
  category: "Categoría",
  status: "Estado",
  origin: "Origen",
  branch: "Sede",
  open: "abierta",
  in_progress: "en progreso",
  resolved: "resuelta",
  discarded: "descartada",
};

/**
 * Convierte cualquier error (técnico, de red, API) en un mensaje amigable
 * para mostrar al usuario. Usar en catch(err) de todas las páginas.
 *
 * @example
 * ```ts
 * setError(friendlyError(err, "No se pudieron cargar los datos."));
 * ```
 */
export function friendlyError(error: unknown, fallback: string = DEFAULT_MESSAGE): string {
  if (!error) return fallback;

  // Errores de red (TypeError: Failed to fetch)
  if (error instanceof TypeError && error.message === "Failed to fetch") {
    return NETWORK_MESSAGE;
  }

  // Errores sintácticos de JSON (Unexpected token...)
  if (error instanceof SyntaxError && error.message.startsWith("Unexpected")) {
    return "El servidor respondió con un formato inesperado. Inténtalo de nuevo.";
  }

  // ApiError con caché de status
  if (error instanceof ApiError) {
    if (error.status >= 500) {
      return HTTP_MESSAGES[500] ?? DEFAULT_MESSAGE;
    }
    return HTTP_MESSAGES[error.status] ?? translateMessage(error.message) ?? fallback;
  }

  // Error genérico (Error 500: ...)
  if (error instanceof Error) {
    const translated = translateMessage(error.message);
    return translated ?? fallback;
  }

  return fallback;
}

/**
 * Traduce términos técnicos en un mensaje de error a español legible.
 */
function translateMessage(message: string): string {
  // Si el mensaje ya es legible (contiene español), devolverlo tal cual
  if (/[áéíóúñ¿¡]/i.test(message)) return message;

  // Reemplazar términos técnicos por sus equivalentes legibles
  let result = message;
  for (const [tech, readable] of Object.entries(TECHNICAL_WORDS)) {
    result = result.replaceAll(tech, readable);
  }

  // Limpiar "Value error, " y prefijos similares de FastAPI
  result = result.replace(/Value error,?\s*/gi, "");
  result = result.replace(/Field validation failed:?\s*/gi, "");
  result = result.replace(/type=.*?\.\s*/g, "");

  // Si después de traducir sigue pareciendo técnico (contiene ingles o paréntesis), dar fallback
  if (/Error \d{3}/.test(result) || /^[a-z_]+:/.test(result)) {
    return "";
  }

  return result.trim();
}

/**
 * Crea un mensaje de error con CTA para error de carga.
 */
export function errorWithCTA(
  message: string,
  retryFn: () => void,
  homeLink = "/tracker"
): { message: string; retryFn: () => void; homeLink: string } {
  return { message, retryFn, homeLink };
}