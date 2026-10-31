import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { getMatch, getMatchBySlug, getMatchHistory, getRoastCard, simulateMatch, submitMatch } from "../features/matches/api";
import type { MatchDetail, MatchHistoryEntry, RoastCard } from "../features/matches/types";
import { routeHref } from "../routes";
import "./MatchAnalyzerPage.css";

type Props = { code: string; setCode: (value: string) => void; notify: (message: string) => void; shareSlug?: string };

export default function MatchAnalyzerPage({ code, setCode, notify, shareSlug }: Props) {
  const { token, user } = useAuth();
  const [demoUrl, setDemoUrl] = useState("");
  const [match, setMatch] = useState<MatchDetail | null>(null);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [roast, setRoast] = useState<RoastCard | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!shareSlug) return;
    const controller = new AbortController();
    setBusy(true);
    getMatchBySlug(shareSlug, controller.signal).then(setMatch).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load match.");
    }).finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [shareSlug]);

  useEffect(() => {
    if (!match || match.status === "COMPLETED" || match.status === "FAILED") return;
    let active = true;
    const timer = window.setInterval(() => {
      getMatch(match.id).then((updated) => { if (active) setMatch(updated); }).catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not refresh match status.");
      });
    }, 4000);
    return () => { active = false; window.clearInterval(timer); };
  }, [match?.id, match?.status]);

  useEffect(() => {
    if (!user?.steamId) { setHistory([]); return; }
    const controller = new AbortController();
    getMatchHistory(user.steamId, controller.signal).then(setHistory).catch(() => { if (!controller.signal.aborted) setHistory([]); });
    return () => controller.abort();
  }, [user?.steamId]);

  useEffect(() => {
    const playerId = new URLSearchParams(window.location.search).get("p");
    if (!shareSlug || !playerId || match?.shareSlug !== shareSlug || match.status !== "COMPLETED") return;
    let active = true;
    getRoastCard(match.id, playerId).then((card) => { if (active) setRoast(card); }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : "Could not load roast card.");
    });
    return () => { active = false; };
  }, [shareSlug, match?.id, match?.shareSlug, match?.status]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const shareCode = code.trim();
    const url = demoUrl.trim();
    if (!shareCode && !url) { setError("Enter a share code or demo URL."); return; }
    setBusy(true); setError(""); setRoast(null);
    try { setMatch(await submitMatch({ ...(shareCode && { shareCode }), ...(url && { demoUrl: url }) }, token || undefined)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit match."); }
    finally { setBusy(false); }
  }

  async function handleSimulate() {
    setBusy(true); setError(""); setRoast(null);
    try { setMatch(await simulateMatch({ mapName: "de_mirage" }, token || undefined)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not simulate match."); }
    finally { setBusy(false); }
  }

  async function openRoast(steamId: string) {
    if (!match) return;
    try { setRoast(await getRoastCard(match.id, steamId)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load roast card."); }
  }

  async function openHistory(id: string) {
    setBusy(true); setError(""); setRoast(null);
    try { setMatch(await getMatch(id)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load match."); }
    finally { setBusy(false); }
  }

  async function copyShareLink() {
    if (!match?.shareSlug) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}${routeHref(`/m/${match.shareSlug}`)}`); notify("Match link copied"); }
    catch { notify("Could not copy match link"); }
  }

  async function copyRoastLink() {
    if (!match?.shareSlug || !roast) return;
    try { await navigator.clipboard.writeText(`${window.location.origin}${routeHref(`/m/${match.shareSlug}`)}?p=${encodeURIComponent(roast.steamId)}`); notify("Roast card link copied"); }
    catch { notify("Could not copy roast card link"); }
  }

  return <div className="feature-page match-api-page">
    <div className="page-intro"><div><p className="eyebrow">ROAST & FLEX</p><h2>Match analyzer</h2><p>Submit a Premier share code or replay URL. The analyzer will show processing status, player stats, and awards.</p></div><button onClick={handleSimulate} disabled={busy}>SIMULATE MATCH</button></div>
    <section className="analyzer-layout">
      <form className="upload-panel match-submit" onSubmit={handleSubmit}>
        <label>Premier share code<input value={code} onChange={(event) => setCode(event.target.value)} placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" /></label>
        <span>OR</span>
        <label>Replay URL<input type="url" value={demoUrl} onChange={(event) => setDemoUrl(event.target.value)} placeholder="https://.../replay.dem.bz2" /></label>
        <p>The API accepts replay URLs. Direct file uploads are not supported by this contract.</p>
        <button disabled={busy}>{busy ? "WORKING…" : "ANALYZE MATCH"}</button>
      </form>
      <aside className="queue-panel match-status"><div className="panel-title"><span>MATCH STATUS</span></div>{match ? <><strong>{match.mapName?.replace(/^de_/, "").toUpperCase() ?? "PENDING MAP"}</strong><p>{match.status}</p><p>{match.status === "COMPLETED" ? `${match.teamAScore} — ${match.teamBScore}` : match.failureReason ?? "Checking for updates…"}</p>{match.shareSlug && <button onClick={copyShareLink}>COPY SHARE LINK</button>}</> : <p>No match selected yet.</p>}</aside>
    </section>
    {error && <p className="match-error" role="alert">{error}</p>}
    {match?.status === "COMPLETED" && <section className="match-results"><div className="panel-title"><span>PLAYER SCOREBOARD</span><b>{match.players?.length ?? 0} PLAYERS</b></div><div className="match-scoreboard">{(match.players ?? []).map((player) => <button key={player.steamId} onClick={() => openRoast(player.steamId)}><span>{player.teamSide === "TEAM_A" ? "A" : "B"}</span><strong>{player.playerName}</strong><small>{player.kills}/{player.deaths}/{player.assists}</small><small>{player.adr.toFixed(1)} ADR</small><small>{player.impactRating.toFixed(2)} IMPACT</small><em>{player.awards[0]?.emoji} {player.awards[0]?.displayName ?? "—"}</em></button>)}</div></section>}
    {roast && <section className="match-roast"><button onClick={() => setRoast(null)}>CLOSE ×</button><button onClick={copyRoastLink}>COPY CARD LINK</button><p>{roast.primaryBadge?.emoji} {roast.primaryBadge?.displayName}</p><h3>{roast.playerName}</h3><blockquote>{roast.roastQuote}</blockquote><small>{roast.kills} KILLS · {roast.adr.toFixed(1)} ADR · {roast.impactRating.toFixed(2)} IMPACT</small></section>}
    <section className="recent-section match-history"><div className="panel-title"><span>YOUR MATCH HISTORY</span></div>{user ? history.length ? history.map((entry) => <button key={entry.matchId} onClick={() => openHistory(entry.matchId)}><strong>{entry.mapName.replace(/^de_/, "").toUpperCase()}</strong><span>{entry.teamAScore} — {entry.teamBScore}</span><span>{entry.kills} K / {entry.deaths} D</span><span>{entry.primaryBadge?.emoji} {entry.primaryBadge?.displayName}</span></button>) : <p>No matches found for your Steam account.</p> : <p>Sign in with Steam to view your match history.</p>}</section>
  </div>;
}
