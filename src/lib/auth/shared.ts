export type AppRole = "admin" | "teacher";

export interface AppUser {
  id: string;
  name: string;
  username: string;
  role: AppRole;
  isActive: boolean;
}

export interface AuthMeResponse {
  id: string;
  name: string;
  role: AppRole;
}

export interface LoginActionState {
  errorMessage: string | null;
}

export const initialLoginActionState: LoginActionState = {
  errorMessage: null,
};

const DEFAULT_AUTH_EMAIL_DOMAIN = "noor-al-eman.local";

export function getAuthEmailDomain(): string {
  return process.env.AUTH_EMAIL_DOMAIN?.trim() || DEFAULT_AUTH_EMAIL_DOMAIN;
}

export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function usernameToEmail(username: string): string {
  return `${normalizeUsername(username)}@${getAuthEmailDomain()}`;
}

export function roleHomePath(role: AppRole): string {
  return role === "admin" ? "/admin" : "/teacher";
}
