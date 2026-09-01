import { ApiError } from "./apiError";
import type { ApiErrorPayload } from "../../features/auth/types/auth.types";

const configuredBaseURL = import.meta.env.VITE_API_BASE_URL?.trim() ?? "";
const API_BASE_URL = configuredBaseURL.replace(/\/$/, "");

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  csrfToken?: string;
}

function buildURL(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function responseError(response: Response): Promise<ApiError> {
  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as ApiErrorPayload)
    : null;
  const fallback = response.status === 401
    ? "La sesión no es válida o ha caducado."
    : response.status === 403
      ? "La solicitud no pudo validarse. Recarga la página e inténtalo de nuevo."
      : "No pudimos completar la operación.";
  return new ApiError(payload?.error?.message || fallback, response.status, payload?.error?.code || "request_failed");
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  let body: BodyInit | undefined;
  if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }
  if (options.csrfToken) {
    headers.set("X-CSRF-Token", options.csrfToken);
  }

  let response: Response;
  try {
    response = await fetch(buildURL(path), {
      ...options,
      body,
      headers,
      credentials: "include",
    });
  } catch {
    throw new ApiError(
      "No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.",
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as unknown)
    : null;

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload | null;
    const fallback =
      response.status === 401
        ? "La sesión no es válida o las credenciales no son correctas."
        : response.status === 403
          ? "La solicitud no pudo validarse. Recarga la página e inténtalo de nuevo."
          : response.status === 429
            ? "Has realizado demasiados intentos. Espera unos minutos."
            : "No pudimos completar la operación.";

    throw new ApiError(
      errorPayload?.error?.message || fallback,
      response.status,
      errorPayload?.error?.code || "request_failed",
    );
  }

  return payload as T;
}

export async function apiBinaryRequest<T>(
  path: string,
  body: Blob,
  options: { csrfToken: string; headers?: HeadersInit },
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  headers.set("Content-Type", body.type || "application/octet-stream");
  headers.set("X-CSRF-Token", options.csrfToken);
  let response: Response;
  try {
    response = await fetch(buildURL(path), { method: "POST", body, headers, credentials: "include" });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.");
  }
  if (!response.ok) throw await responseError(response);
  return (await response.json()) as T;
}

export async function apiBlobRequest(path: string): Promise<Blob> {
  let response: Response;
  try {
    response = await fetch(buildURL(path), { method: "GET", credentials: "include" });
  } catch {
    throw new ApiError("No se pudo conectar con el servidor. Comprueba tu conexión e inténtalo de nuevo.");
  }
  if (!response.ok) throw await responseError(response);
  return response.blob();
}
