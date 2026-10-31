import { API_BASE_URL } from "../../config/api"
import type {
  CommunityDetail,
  CommunityFilters,
  CommunityLoadout,
  CreateCommunityLoadout,
  GenerateRequest,
  GeneratedLoadout,
  Page,
  Skin,
  SkinFilters,
  SeedSummary,
  Sticker,
  StickerFilters,
  UpvoteResult,
} from "./types"

type Envelope<T,> = {
  success: boolean
  message: string
  data: T
}
const PREFIX = "/api/v1/loadouts"

function query(params: object): string {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "")
      search.set(key, String(value))
  }
  return search.size ? `?${search}` : ""
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${PREFIX}${path}`, {
    ...options,
    headers,
  })
  const payload = (await response
    .json()
    .catch(() => null)) as Envelope<T> | null
  if (!payload)
    throw new Error(
      "The API did not return JSON. Check the backend connection.",
    )
  if (!response.ok || !payload.success)
    throw new Error(
      payload.message || `API request failed (${response.status})`,
    )
  return payload.data
}

export const getSkins = (filters: SkinFilters = {}, signal?: AbortSignal) =>
  request<Page<Skin>>(`/catalog/skins${query(filters)}`, { signal })
export const getSkin = (skinId: string, signal?: AbortSignal) =>
  request<Skin>(`/catalog/skins/${encodeURIComponent(skinId)}`, { signal })
export const getStickers = (
  filters: StickerFilters = {},
  signal?: AbortSignal,
) => request<Page<Sticker>>(`/catalog/stickers${query(filters)}`, { signal })
export const getSticker = (stickerId: string, signal?: AbortSignal) =>
  request<Sticker>(`/catalog/stickers/${encodeURIComponent(stickerId)}`, { signal })
export const generateLoadout = (body: GenerateRequest) =>
  request<GeneratedLoadout>("/generate", {
    method: "POST",
    body: JSON.stringify(body),
  })
export const getCommunity = (
  filters: CommunityFilters = {},
  token?: string,
  signal?: AbortSignal,
) =>
  request<Page<CommunityLoadout>>(
    `/community${query(filters)}`,
    { signal },
    token,
  )
export const getCommunityDetail = (
  id: string,
  token?: string,
  signal?: AbortSignal,
) =>
  request<CommunityDetail>(
    `/community/${encodeURIComponent(id)}`,
    { signal },
    token,
  )
export const getMyLoadouts = (token: string, signal?: AbortSignal) =>
  request<CommunityLoadout[]>("/community/my", { signal }, token)
export const createCommunityLoadout = (
  body: CreateCommunityLoadout,
  token: string,
) =>
  request<CommunityDetail>(
    "/community",
    { method: "POST", body: JSON.stringify(body) },
    token,
  )
export const toggleUpvote = (id: string, token: string) =>
  request<UpvoteResult>(
    `/community/${encodeURIComponent(id)}/upvote`,
    { method: "POST" },
    token,
  )
export const deleteCommunityLoadout = (id: string, token: string) =>
  request<null>(
    `/community/${encodeURIComponent(id)}`,
    { method: "DELETE" },
    token,
  )
export const seedCatalog = (token: string) =>
  request<SeedSummary>("/admin/seed", { method: "POST" }, token)
export const syncCatalog = (token: string) =>
  request<SeedSummary>("/admin/sync", { method: "POST" }, token)
