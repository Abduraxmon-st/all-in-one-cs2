import { API_BASE_URL } from "../../config/api";
import type { MatchDetail, MatchHistoryEntry, MatchSummary, Page, RoastCard } from "./types";

type Envelope<T> = { success: boolean; message: string; data: T };
const base = "/api/v1/matches";

function createTimeoutSignal(ms = 8000): AbortSignal {
  if (typeof AbortSignal.timeout === "function") {
    return AbortSignal.timeout(ms);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(new Error(`Request timed out after ${ms}ms`)), ms);
  return controller.signal;
}

function mergeSignal(userSignal?: AbortSignal | null, ms = 8000): AbortSignal {
  const timeoutSignal = createTimeoutSignal(ms);
  if (!userSignal) return timeoutSignal;
  if (typeof AbortSignal.any === "function") {
    return AbortSignal.any([userSignal, timeoutSignal]);
  }
  const controller = new AbortController();
  const onAbort = () => controller.abort(userSignal.reason || timeoutSignal.reason);
  userSignal.addEventListener("abort", onAbort);
  timeoutSignal.addEventListener("abort", onAbort);
  return controller.signal;
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const signal = mergeSignal(options.signal, 8000);
  const response = await fetch(`${API_BASE_URL}${base}${path}`, { ...options, headers, signal });
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!payload) throw new Error(`Matches API returned an invalid response (${response.status}).`);
  if (!response.ok || !payload.success) throw new Error(payload.message || `Matches request failed (${response.status}).`);
  return payload.data;
}

export const submitMatch = (body: { shareCode?: string; demoUrl?: string }, token?: string) =>
  request<MatchDetail>("", { method: "POST", body: JSON.stringify(body) }, token);
export const simulateMatch = (mapName = "de_mirage", token?: string) =>
  request<MatchDetail>(`/simulate?${new URLSearchParams({ mapName })}`, { method: "POST" }, token);
export const getMatch = (idOrSlug: string, signal?: AbortSignal) =>
  request<MatchDetail>(`/${encodeURIComponent(idOrSlug)}`, { signal });
export const getMatchBySlug = getMatch;
export const getRoastCard = (idOrSlug: string, steamId: string) =>
  request<RoastCard>(`/${encodeURIComponent(idOrSlug)}/players/${encodeURIComponent(steamId)}/roast-card`);
export const getMatchHistory = (steamId: string, signal?: AbortSignal) =>
  request<MatchHistoryEntry[]>(`/player/${encodeURIComponent(steamId)}`, { signal });
export const getRecentMatches = (page = 0, size = 15, signal?: AbortSignal) =>
  request<Page<MatchSummary>>(`/recent?${new URLSearchParams({ page: String(page), size: String(size) })}`, { signal });
