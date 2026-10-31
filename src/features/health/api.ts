import { API_BASE_URL } from "../../config/api";

export interface HealthStatus {
  status: string;
  application: string;
  version: string;
  timestamp: string;
  components: Record<string, string>;
}

export async function getHealth(signal?: AbortSignal): Promise<HealthStatus> {
  const response = await fetch(`${API_BASE_URL}/api/v1/health`, { signal });
  const payload = await response.json().catch(() => null) as { success: boolean; message: string; data: HealthStatus } | null;
  if (!response.ok || !payload?.success) throw new Error(payload?.message || `Health check failed (${response.status}).`);
  return payload.data;
}
