import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { authApi } from "../../features/auth/api/authApi";
import type {
  AuthSession,
  LoginPayload,
  Membership,
} from "../../features/auth/types/auth.types";
import { ApiError } from "../../shared/api/apiError";

const MEMBERSHIP_STORAGE_KEY = "control-horario:selected-membership";

type AuthStatus = "loading" | "authenticated" | "anonymous";

interface AuthContextValue {
  status: AuthStatus;
  session: AuthSession | null;
  selectedMembership: Membership | null;
  login(payload: LoginPayload): Promise<AuthSession>;
  logout(): Promise<void>;
  logoutAll(): Promise<void>;
  selectMembership(membershipId: string): void;
  clearSelectedMembership(): void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveStoredMembership(session: AuthSession): Membership | null {
  const storedID = window.localStorage.getItem(MEMBERSHIP_STORAGE_KEY);
  const storedMembership = session.memberships.find(
    (membership) => membership.id === storedID,
  );

  if (storedMembership) {
    return storedMembership;
  }

  if (session.memberships.length === 1) {
    const membership = session.memberships[0];
    window.localStorage.setItem(MEMBERSHIP_STORAGE_KEY, membership.id);
    return membership;
  }

  window.localStorage.removeItem(MEMBERSHIP_STORAGE_KEY);
  return null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [session, setSession] = useState<AuthSession | null>(null);
  const [selectedMembership, setSelectedMembership] =
    useState<Membership | null>(null);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      try {
        const response = await authApi.getSession();
        if (!active) return;
        setSession(response.data);
        setSelectedMembership(resolveStoredMembership(response.data));
        setStatus("authenticated");
      } catch (error) {
        if (!active) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          console.error("No se pudo recuperar la sesión", error);
        }
        setSession(null);
        setSelectedMembership(null);
        setStatus("anonymous");
      }
    }

    void restoreSession();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    setSession(response.data);
    setSelectedMembership(resolveStoredMembership(response.data));
    setStatus("authenticated");
    return response.data;
  }, []);

  const clearState = useCallback(() => {
    window.localStorage.removeItem(MEMBERSHIP_STORAGE_KEY);
    setSession(null);
    setSelectedMembership(null);
    setStatus("anonymous");
  }, []);

  const logout = useCallback(async () => {
    if (!session) {
      clearState();
      return;
    }
    try {
      await authApi.logout(session.csrfToken);
    } finally {
      clearState();
    }
  }, [clearState, session]);

  const logoutAll = useCallback(async () => {
    if (!session) {
      clearState();
      return;
    }
    try {
      await authApi.logoutAll(session.csrfToken);
    } finally {
      clearState();
    }
  }, [clearState, session]);

  const selectMembership = useCallback(
    (membershipId: string) => {
      if (!session) return;
      const membership = session.memberships.find(
        (item) => item.id === membershipId,
      );
      if (!membership) return;
      window.localStorage.setItem(MEMBERSHIP_STORAGE_KEY, membership.id);
      setSelectedMembership(membership);
    },
    [session],
  );

  const clearSelectedMembership = useCallback(() => {
    window.localStorage.removeItem(MEMBERSHIP_STORAGE_KEY);
    setSelectedMembership(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      selectedMembership,
      login,
      logout,
      logoutAll,
      selectMembership,
      clearSelectedMembership,
    }),
    [
      status,
      session,
      selectedMembership,
      login,
      logout,
      logoutAll,
      selectMembership,
      clearSelectedMembership,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }
  return context;
}
