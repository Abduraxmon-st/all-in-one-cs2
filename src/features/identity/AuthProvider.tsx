import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { devLogin, getCurrentUser, getSteamLoginUrl, updateCurrentUser } from "./api";
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
  updateProfile: (body: UpdateProfileRequest) => Promise<void>;
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
        sessionStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
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
    if (!import.meta.env.DEV) throw new Error("Development login is unavailable in production.");
    setError("");
    const result = await devLogin(body);
    sessionStorage.setItem(TOKEN_KEY, result.accessToken);
    setToken(result.accessToken);
    setUser(result.user);
  }

  async function updateProfile(body: UpdateProfileRequest) {
    if (!token) throw new Error("Sign in first.");
    const profile = await updateCurrentUser(body, token);
    setUser(profile);
  }

  function signOut() {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setError("");
  }

  return <AuthContext.Provider value={{ token, user, loading, error, signInWithSteam, signInForDevelopment, updateProfile, signOut }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider.");
  return context;
}
