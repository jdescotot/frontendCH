export interface AuthUser {
  id: string;
  email: string;
}

export interface Person {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Membership {
  id: string;
  companyId: string;
  companyName: string;
  timeZone: string;
  roles: string[];
}

export interface PlatformAccess {
  id: string;
  roleCode: string;
  roleName: string;
  mfaRequired: boolean;
  permissions: string[];
}

export interface AuthSession {
  user: AuthUser;
  person: Person | null;
  memberships: Membership[];
  platformAccess?: PlatformAccess;
  csrfToken: string;
  sessionExpiresAt: string;
}

export interface SessionResponse {
  data: AuthSession;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface ApiErrorPayload {
  error?: {
    code?: string;
    message?: string;
  };
}
