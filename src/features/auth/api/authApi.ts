import { apiRequest } from "../../../shared/api/httpClient";
import type {
  LoginPayload,
  SessionResponse,
} from "../types/auth.types";

export const authApi = {
  login(payload: LoginPayload) {
    return apiRequest<SessionResponse>("/api/v1/auth/login", {
      method: "POST",
      body: payload,
    });
  },

  getSession() {
    return apiRequest<SessionResponse>("/api/v1/auth/session", {
      method: "GET",
    });
  },

  logout(csrfToken: string) {
    return apiRequest<void>("/api/v1/auth/logout", {
      method: "POST",
      csrfToken,
    });
  },

  logoutAll(csrfToken: string) {
    return apiRequest<void>("/api/v1/auth/logout-all", {
      method: "POST",
      csrfToken,
    });
  },
};
