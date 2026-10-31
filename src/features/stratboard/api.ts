import { API_BASE_URL } from "../../config/api";
import type { CreateLineupRequest, CreateRoomRequest, CreateTacticRequest, Page, RoomSnapshot, SaveRoomRequest, TacticDetail, TacticSummary, TeamSide, UtilityLineup, UtilityType } from "./types";

const base = "/api/v1/stratboard";

export const stratboardPaths = {
  lineups: `${base}/lineups`,
  lineup: (id: string) => `${base}/lineups/${encodeURIComponent(id)}`,
  tactics: `${base}/tactics`,
  myTactics: `${base}/tactics/my`,
  tactic: (idOrShareCode: string) => `${base}/tactics/${encodeURIComponent(idOrShareCode)}`,
  rooms: `${base}/rooms`,
  room: (roomCode: string) => `${base}/rooms/${encodeURIComponent(roomCode)}`,
  loadTactic: (roomCode: string, idOrShareCode: string) =>
    `${base}/rooms/${encodeURIComponent(roomCode)}/load-tactic/${encodeURIComponent(idOrShareCode)}`,
  saveRoomTactic: (roomCode: string) => `${base}/rooms/${encodeURIComponent(roomCode)}/save-tactic`,
} as const;

type Envelope<T> = { success: boolean; message: string; data: T };

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!payload) throw new Error(`Stratboard API returned an invalid response (${response.status}).`);
  if (!response.ok || !payload.success) throw new Error(payload.message || `Stratboard request failed (${response.status}).`);
  return payload.data;
}

function query(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") params.set(key, String(value));
  return params.size ? `?${params}` : "";
}

export const getLineups = (filters: { mapName?: string; utilityType?: UtilityType; teamSide?: TeamSide } = {}, signal?: AbortSignal) =>
  request<UtilityLineup[]>(`${stratboardPaths.lineups}${query(filters)}`, { signal });
export const getLineup = (id: string) => request<UtilityLineup>(stratboardPaths.lineup(id));
export const submitLineup = (body: CreateLineupRequest, token: string) => request<UtilityLineup>(stratboardPaths.lineups, { method: "POST", body: JSON.stringify(body) }, token);
export const deleteLineup = (id: string, token: string) => request<null>(stratboardPaths.lineup(id), { method: "DELETE" }, token);
export const getTactics = (filters: { mapName?: string; teamSide?: TeamSide; page?: number; size?: number } = {}, signal?: AbortSignal) =>
  request<Page<TacticSummary>>(`${stratboardPaths.tactics}${query(filters)}`, { signal });
export const getMyTactics = (token: string) => request<TacticSummary[]>(stratboardPaths.myTactics, {}, token);
export const getTactic = (idOrShareCode: string, token?: string) => request<TacticDetail>(stratboardPaths.tactic(idOrShareCode), {}, token);
export const createTactic = (body: CreateTacticRequest, token: string) => request<TacticDetail>(stratboardPaths.tactics, { method: "POST", body: JSON.stringify(body) }, token);
export const updateTactic = (id: string, body: CreateTacticRequest, token: string) => request<TacticDetail>(stratboardPaths.tactic(id), { method: "PUT", body: JSON.stringify(body) }, token);
export const deleteTactic = (id: string, token: string) => request<null>(stratboardPaths.tactic(id), { method: "DELETE" }, token);
export const createRoom = (body: CreateRoomRequest, token?: string) => request<RoomSnapshot>(stratboardPaths.rooms, { method: "POST", body: JSON.stringify(body) }, token);
export const getRoom = (roomCode: string) => request<RoomSnapshot>(stratboardPaths.room(roomCode));
export const loadTacticIntoRoom = (roomCode: string, idOrShareCode: string, token?: string) => request<RoomSnapshot>(stratboardPaths.loadTactic(roomCode, idOrShareCode), { method: "POST" }, token);
export const saveRoomTactic = (roomCode: string, body: SaveRoomRequest, token: string) => request<TacticDetail>(stratboardPaths.saveRoomTactic(roomCode), { method: "POST", body: JSON.stringify(body) }, token);
