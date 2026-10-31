import { API_BASE_URL } from "../../config/api";
import type { MatchDetail, MatchHistoryEntry, RoastCard } from "./types";

type Envelope<T> = { success: boolean; message: string; data: T };
const base = "/api/v1/matches";

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${base}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!payload) throw new Error(`Matches API returned an invalid response (${response.status}).`);
  if (!response.ok || !payload.success) throw new Error(payload.message || `Matches request failed (${response.status}).`);
  return payload.data;
}

export const submitMatch = (body: { shareCode?: string; demoUrl?: string }, token?: string) =>
  request<MatchDetail>("/submit", { method: "POST", body: JSON.stringify(body) }, token);
export const simulateMatch = (body: { mapName?: string } = {}, token?: string) =>
  request<MatchDetail>("/simulate", { method: "POST", body: JSON.stringify(body) }, token);
export const getMatch = (id: string, signal?: AbortSignal) => request<MatchDetail>(`/${encodeURIComponent(id)}`, { signal });
export const getMatchBySlug = (slug: string, signal?: AbortSignal) => request<MatchDetail>(`/slug/${encodeURIComponent(slug)}`, { signal });
export const getRoastCard = (matchId: string, steamId: string) =>
  request<RoastCard>(`/${encodeURIComponent(matchId)}/players/${encodeURIComponent(steamId)}/roast`);
export const getMatchHistory = (steamId: string, signal?: AbortSignal) =>
  request<MatchHistoryEntry[]>(`/history/${encodeURIComponent(steamId)}`, { signal });
