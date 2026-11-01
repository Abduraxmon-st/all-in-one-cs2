import { API_BASE_URL } from "../../config/api";
import type { AuthToken, DevLoginRequest, PublicUserSummary, UpdateProfileRequest, UserProfile } from "./types";

export const identityPaths = {
  devLogin: "/api/v1/auth/dev-login",
  steamLogin: "/api/v1/auth/steam/login",
  steamCallback: "/api/v1/auth/steam/callback",
  currentUser: "/api/v1/users/me",
  currentUserProfile: "/api/v1/users/me/profile",
  publicUser: (userId: string) => `/api/v1/users/${encodeURIComponent(userId)}`,
} as const;

type Envelope<T> = { success: boolean; message: string; data: T };

export class IdentityApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!payload) throw new Error(`Identity API returned an invalid response (${response.status}).`);
  if (!response.ok || !payload.success) throw new IdentityApiError(payload.message || `Identity request failed (${response.status}).`, response.status);
  return payload.data;
}

export const devLogin = (body: DevLoginRequest) =>
  request<AuthToken>(identityPaths.devLogin, { method: "POST", body: JSON.stringify(body) });

export const getSteamLoginUrl = async () => {
  const result = await request<{ loginUrl: string }>(`${identityPaths.steamLogin}?redirect=false`);
  const url = new URL(result.loginUrl);
  if (url.protocol !== "https:" || url.hostname !== "steamcommunity.com") throw new Error("Invalid Steam login URL returned by API.");
  return url.href;
};

export const getCurrentUser = (token: string) => request<UserProfile>(identityPaths.currentUser, {}, token);
export const updateCurrentUser = async (body: UpdateProfileRequest, token: string): Promise<UserProfile> => {
  try {
    return await request<UserProfile>(identityPaths.currentUserProfile, { method: "PATCH", body: JSON.stringify(body) }, token);
  } catch (error) {
    if (error instanceof IdentityApiError && (error.status === 404 || error.status === 405)) {
      return await request<UserProfile>(identityPaths.currentUser, { method: "PATCH", body: JSON.stringify(body) }, token);
    }
    throw error;
  }
};
export const updateProfile = updateCurrentUser;
export const getPublicUser = (userId: string, signal?: AbortSignal) => request<PublicUserSummary>(identityPaths.publicUser(userId), { signal });
