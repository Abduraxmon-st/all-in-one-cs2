import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  devLogin,
  getCurrentUser,
  getSteamLoginUrl,
  IdentityApiError,
  loginWithPassword,
  registerWithPassword as apiRegisterWithPassword,
  updateCurrentUser,
} from "./api";
import type {
  DevLoginRequest,
  PasswordLoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  UserProfile,
} from "./types";
import { routeHref } from "../../routes";

const TOKEN_KEY = "clutch-labs-access-token";

type AuthContextValue = {
  token: string;
  user: UserProfile | null;
  loading: boolean;
  error: string;
  signInWithSteam: () => Promise<void>;
  signInForDevelopment: (body: DevLoginRequest) => Promise<void>;
  signInWithPassword: (body: PasswordLoginRequest) => Promise<void>;
  registerWithPassword: (body: RegisterRequest) => Promise<void>;
  updateProfile: (body: UpdateProfileRequest) => Promise<UserProfile>;
  updateUserProfile: (body: UpdateProfileRequest) => Promise<UserProfile>;
  refreshUser: () => Promise<UserProfile | null>;
  logout: () => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function initialToken(): string {
  try {
    const url = new URL(window.location.href);
    const callbackToken = url.pathname.endsWith("/auth/callback")
      ? url.searchParams.get("token")
      : null;
    if (callbackToken) {
      localStorage.setItem(TOKEN_KEY, callbackToken);
      window.history.replaceState({}, "", routeHref("/"));
      return callbackToken;
    }
    return localStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(initialToken);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    getCurrentUser(token)
      .then((profile) => {
        if (!controller.signal.aborted) {
          setUser(profile);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          if (
            cause instanceof IdentityApiError &&
            (cause.status === 401 || cause.status === 403)
          ) {
            localStorage.removeItem(TOKEN_KEY);
            setToken("");
            setUser(null);
          }
          setError(cause instanceof Error ? cause.message : "Sign-in session expired.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token]);

  async function signInWithSteam() {
    setError("");
    window.location.assign(await getSteamLoginUrl());
  }

  async function signInForDevelopment(body: DevLoginRequest) {
    const isDevAuthAllowed =
      import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_AUTH !== "false";
    if (!isDevAuthAllowed)
      throw new Error("Development login is disabled in this environment.");
    setError("");
    const result = await devLogin(body);
    const accessToken = result.accessToken || (result as unknown as { token?: string }).token || "";
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    setUser(result.user);
  }

  async function signInWithPassword(body: PasswordLoginRequest) {
    setError("");
    const result = await loginWithPassword(body);
    const accessToken = result.accessToken || (result as unknown as { token?: string }).token || "";
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    if (result.user) {
      setUser(result.user);
    } else {
      const profile = await getCurrentUser(accessToken);
      setUser(profile);
    }
  }

  async function registerWithPassword(body: RegisterRequest) {
    setError("");
    const result = await apiRegisterWithPassword(body);
    const accessToken = result.accessToken || (result as unknown as { token?: string }).token || "";
    localStorage.setItem(TOKEN_KEY, accessToken);
    setToken(accessToken);
    if (result.user) {
      setUser(result.user);
    } else {
      const profile = await getCurrentUser(accessToken);
      setUser(profile);
    }
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

  function logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
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
        signInWithPassword,
        registerWithPassword,
        updateProfile,
        updateUserProfile: updateProfile,
        refreshUser,
        logout,
        signOut: logout,
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
