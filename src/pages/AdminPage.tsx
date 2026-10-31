import { useEffect, useState } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { getClipsForReview, generateDailyChallenge, reviewClip } from "../features/minigames/api";
import type { SubmittedClip } from "../features/minigames/types";
import { seedCatalog, syncCatalog } from "../features/loadouts/api";
import { getHealth, type HealthStatus } from "../features/health/api";
import "./AdminPage.css";

type ClipStatus = SubmittedClip["status"];
const statuses: ClipStatus[] = ["PENDING", "APPROVED", "REJECTED", "USED"];

function safeVideoUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

export default function AdminPage() {
  const { token, user, loading } = useAuth();
  const [status, setStatus] = useState<ClipStatus>("PENDING");
  const [clips, setClips] = useState<SubmittedClip[]>([]);
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [seedIfEmpty, setSeedIfEmpty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    getHealth(controller.signal).then(setHealth).catch(() => {});
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (user?.role !== "ADMIN" || !token) return;
    const controller = new AbortController();
    setClips([]);
    getClipsForReview(status, token, controller.signal).then((items) => { setClips(items); setError(""); }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load clips.");
    });
    return () => controller.abort();
  }, [status, token, user?.role]);

  async function run(action: () => Promise<string>) {
    setBusy(true); setError(""); setMessage("");
    try { setMessage(await action()); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Admin request failed."); }
    finally { setBusy(false); }
  }

  function moderate(clip: SubmittedClip, nextStatus: "APPROVED" | "REJECTED") {
    if (!token || !clip.id) return;
    const raw = overrides[clip.id]?.trim();
    const rating = raw ? Number(raw) : undefined;
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1000 || rating > 35000)) { setError("Rating override must be between 1,000 and 35,000."); return; }
    void run(async () => {
      await reviewClip(clip.id!, nextStatus, token, rating);
      setClips((current) => current.filter((item) => item.id !== clip.id));
      return `Clip ${nextStatus.toLowerCase()}.`;
    });
  }

  if (loading) return <div className="feature-page admin-page"><p>Loading account…</p></div>;
  if (user?.role !== "ADMIN" || !token) return <div className="feature-page admin-page"><h2>Admin access required</h2><p>Sign in with an administrator account to manage clips and catalog data.</p></div>;

  return <div className="feature-page admin-page">
    <div className="page-intro"><div><p className="eyebrow">PLATFORM OPERATIONS</p><h2>Admin console</h2><p>Review clips, generate the daily challenge, and maintain the loadout catalog.</p></div></div>
    {error && <p className="admin-error" role="alert">{error}</p>}
    {message && <p className="admin-success" role="status">{message}</p>}
    <section className="admin-card"><h3>Service health</h3>{health ? <><p>{health.application} · {health.status} · {health.version}</p><div className="admin-components">{Object.entries(health.components).map(([name, state]) => <span key={name}>{name}: {state}</span>)}</div></> : <p>Health status unavailable.</p>}</section>
    <section className="admin-card"><h3>Clip moderation</h3><label>Status <select value={status} onChange={(event) => setStatus(event.target.value as ClipStatus)}>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label><div className="admin-clips">{clips.map((clip) => <article key={clip.id ?? clip.clipId}><div><strong>{clip.title}</strong><p>{clip.mapName} · {clip.actualPremierRating.toLocaleString()} rating · {clip.submittedBy?.username ?? "Player"}</p>{safeVideoUrl(clip.videoUrl) && <a href={safeVideoUrl(clip.videoUrl) ?? undefined} target="_blank" rel="noopener noreferrer">Open clip ↗</a>}</div><input type="number" min="1000" max="35000" value={overrides[clip.id ?? ""] ?? ""} onChange={(event) => setOverrides((current) => ({ ...current, [clip.id ?? ""]: event.target.value }))} placeholder="Rating override" aria-label={`Rating override for ${clip.title}`} /><button disabled={busy || status === "APPROVED"} onClick={() => moderate(clip, "APPROVED")}>APPROVE</button><button disabled={busy || status === "REJECTED"} onClick={() => moderate(clip, "REJECTED")}>REJECT</button></article>)}{clips.length === 0 && <p>No clips in this status.</p>}</div></section>
    <section className="admin-card"><h3>Daily challenge</h3><label><input type="checkbox" checked={seedIfEmpty} onChange={(event) => setSeedIfEmpty(event.target.checked)} /> Seed sample clips if needed</label><button disabled={busy} onClick={() => { if (window.confirm("Generate today's challenge now?")) void run(async () => { const daily = await generateDailyChallenge(seedIfEmpty, token); return `Challenge ready: ${daily.challengeDate}`; }); }}>GENERATE TODAY</button></section>
    <section className="admin-card"><h3>Loadout catalog</h3><p>Seeding refreshes the curated catalog. Syncing fetches external catalog data.</p><div className="admin-actions"><button disabled={busy} onClick={() => { if (window.confirm("Seed the curated catalog?")) void run(async () => { const result = await seedCatalog(token); return `Catalog seeded: ${result.skinsCount} skins, ${result.stickersCount} stickers.`; }); }}>SEED CATALOG</button><button disabled={busy} onClick={() => { if (window.confirm("Sync the external catalog now?")) void run(async () => { const result = await syncCatalog(token); return `Catalog synced: ${result.skinsCount} skins, ${result.stickersCount} stickers.`; }); }}>SYNC CATALOG</button></div></section>
  </div>;
}
