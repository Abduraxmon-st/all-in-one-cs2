import { API_BASE_URL } from "../../config/api";

export interface HealthStatus {
  status: string;
  application: string;
  version: string;
  timestamp: string;
  components: Record<string, string>;
}

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

export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const merged = mergeSignal(signal, 8000);
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, { signal: merged });
  const payload = await response.json().catch(() => null) as { success: boolean; message: string; data: HealthStatus } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `Health check failed (${response.status}).`);
  return payload.data;
}
