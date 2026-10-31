import { API_BASE_URL } from "../../config/api"
import type {
  ApiEnvelope,
  ClipSubmission,
  DailyChallenge,
  GuessResult,
  Leaderboard,
  SubmittedClip,
} from "./types"

const GUEST_SESSION_KEY = "clutch-labs-guest-session-id"
let memoryGuestId: string | null = null

function guestSessionId(): string {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(GUEST_SESSION_KEY, id)
    }
    return id
  } catch {
    memoryGuestId ??= crypto.randomUUID()
    return memoryGuestId
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string,
  guest = false,
): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", `Bearer ${token}`)
  else if (guest) headers.set("X-Guest-Session-Id", guestSessionId())

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })
  const payload = (await response
    .json()
    .catch(() => null)) as ApiEnvelope<T> & { error?: string } | null
  if (!payload)
    throw new Error(
      "The API did not return JSON. Check the backend connection.",
    )
  if (!response.ok || !payload?.success) {
    throw new Error(
      payload?.message || `API request failed (${response.status})`,
    )
  }
  return payload.data
}

export function getDailyChallenge(signal?: AbortSignal, token?: string) {
  return request<DailyChallenge>(
    "/api/v1/minigames/daily",
    { signal },
    token,
    true,
  )
}

export function submitGuess(
  clipId: string,
  guessedPremierRating: number,
  token?: string,
) {
  return request<GuessResult>(
    "/api/v1/minigames/daily/guess",
    {
      method: "POST",
      body: JSON.stringify({ clipId, guessedPremierRating }),
    },
    token,
    true,
  )
}

export function getLeaderboard(
  period: "DAILY" | "ALL_TIME",
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({ period, limit: "20" })
  return request<Leaderboard>(`/api/v1/minigames/leaderboard?${query}`, {
    signal,
  })
}

export function submitClip(clip: ClipSubmission, token: string) {
  return request<SubmittedClip>(
    "/api/v1/minigames/clips",
    {
      method: "POST",
      body: JSON.stringify(clip),
    },
    token,
  )
}

export function getMyClips(token: string) {
  return request<SubmittedClip[]>("/api/v1/minigames/clips/my", {}, token)
}

export function getClipsForReview(status: SubmittedClip["status"], token: string, signal?: AbortSignal) {
  return request<SubmittedClip[]>(`/api/v1/minigames/admin/clips?${new URLSearchParams({ status })}`, { signal }, token)
}

export function reviewClip(clipId: string, status: "APPROVED" | "REJECTED", token: string, overridePremierRating?: number) {
  return request<SubmittedClip>(`/api/v1/minigames/admin/clips/${encodeURIComponent(clipId)}/review`, {
    method: "PATCH",
    body: JSON.stringify({ status, ...(overridePremierRating === undefined ? {} : { overridePremierRating }) }),
  }, token)
}

export function generateDailyChallenge(seedIfEmpty: boolean, token: string) {
  return request<DailyChallenge>(`/api/v1/minigames/admin/daily/generate?${new URLSearchParams({ seedIfEmpty: String(seedIfEmpty) })}`, { method: "POST" }, token)
}
