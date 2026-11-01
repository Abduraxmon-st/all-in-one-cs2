import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { devLogin, getCurrentUser, getSteamLoginUrl, IdentityApiError, updateCurrentUser } from "./api";
import type { DevLoginRequest, UpdateProfileRequest, UserProfile } from "./types";
import { routeHref } from "../../routes";

const TOKEN_KEY = "clutch-labs-access-token";

type AuthContextValue = {
  token: string;
  user: UserProfile | null;
  loading: boolean;
  error: string;
  signInWithSteam: () => Promise<void>;
  signInForDevelopment: (body: DevLoginRequest) => Promise<void>;
  updateProfile: (body: UpdateProfileRequest) => Promise<UserProfile>;
  updateUserProfile: (body: UpdateProfileRequest) => Promise<UserProfile>;
  refreshUser: () => Promise<UserProfile | null>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialToken(): string {
  const url = new URL(window.location.href);
  const callbackToken = url.pathname.endsWith("/auth/callback") ? url.searchParams.get("token") : null;
  if (callbackToken) {
    sessionStorage.setItem(TOKEN_KEY, callbackToken);
    window.history.replaceState({}, "", routeHref("/"));
    return callbackToken;
  }
  return sessionStorage.getItem(TOKEN_KEY) ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) { setUser(null); setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    getCurrentUser(token).then((profile) => {
      if (!controller.signal.aborted) { setUser(profile); setError(""); }
    }).catch((cause: unknown) => {
      if (!controller.signal.aborted) {
        if (cause instanceof IdentityApiError && (cause.status === 401 || cause.status === 403)) {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken("");
          setUser(null);
        }
        setError(cause instanceof Error ? cause.message : "Sign-in failed.");
      }
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [token]);

  async function signInWithSteam() {
    setError("");
    window.location.assign(await getSteamLoginUrl());
  }

  async function signInForDevelopment(body: DevLoginRequest) {
    const isDevAuthAllowed = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_AUTH !== "false";
    if (!isDevAuthAllowed) throw new Error("Development login is disabled in this environment.");
    setError("");
    const result = await devLogin(body);
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }

  async function updateProfile(body: UpdateProfileRequest): Promise<UserProfile> {
    if (!token) throw new Error("Sign in first.");
    const profile = await updateCurrentUser(body, token);
    setUser(profile);
    return profile;
  }

  async function refreshUser(): Promise<UserProfile | null> {
    if (!token) return null;
    const profile = await getCurrentUser(token);
    setUser(profile);
    return profile;
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setError("");
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        error,
        signInWithSteam,
        signInForDevelopment,
        updateProfile,
        updateUserProfile: updateProfile,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
