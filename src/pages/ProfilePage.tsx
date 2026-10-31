import { useEffect, useState } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { getPublicUser } from "../features/identity/api";
import type { PublicUserSummary } from "../features/identity/types";
import { getMatchHistory } from "../features/matches/api";
import type { MatchHistoryEntry } from "../features/matches/types";
import { getMyLoadouts } from "../features/loadouts/api";
import type { CommunityLoadout } from "../features/loadouts/types";
import { navigate } from "../routes";
import "./ProfilePage.css";

export default function ProfilePage({ userId }: { userId?: string }) {
  const { user, token, loading } = useAuth();
  const isMine = !!user && (!userId || userId === user.id);
  const [profile, setProfile] = useState<PublicUserSummary | null>(null);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loadouts, setLoadouts] = useState<CommunityLoadout[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    if (!userId) {
      setProfile(user ? { userId: user.id, steamId: user.steamId, username: user.username, avatarUrl: user.avatarUrl } : null);
      return () => controller.abort();
    }
    setProfile(null);
    getPublicUser(userId, controller.signal).then((data) => { if (!controller.signal.aborted) { setProfile(data); setError(""); } }).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load profile.");
    });
    return () => controller.abort();
  }, [userId, user?.id, user?.username, user?.steamId, user?.avatarUrl]);

  useEffect(() => {
    if (!profile?.steamId) { setHistory([]); return; }
    const controller = new AbortController();
    getMatchHistory(profile.steamId, controller.signal).then(setHistory).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load match history.");
    });
    return () => controller.abort();
  }, [profile?.steamId]);

  useEffect(() => {
    if (!isMine || !token) { setLoadouts([]); return; }
    const controller = new AbortController();
    getMyLoadouts(token, controller.signal).then(setLoadouts).catch((cause: unknown) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load your loadouts.");
    });
    return () => controller.abort();
  }, [isMine, token]);

  if (loading && !userId) return <div className="feature-page profile-page"><p>Loading account…</p></div>;

  return <div className="feature-page profile-page">
    <div className="page-intro"><div><p className="eyebrow">PLAYER PROFILE</p><h2>{profile?.username ?? "Player profile"}</h2><p>{profile ? `Steam ID ${profile.steamId}` : userId ? "Loading profile…" : "Sign in to see your profile."}</p></div></div>
    {error && <p className="profile-error" role="alert">{error}</p>}
    {profile && <div className="profile-identity">{profile.avatarUrl && <img src={profile.avatarUrl} alt="" />}<div><strong>{profile.username}</strong><span>{isMine ? "YOUR PROFILE" : "COMMUNITY PLAYER"}</span></div></div>}
    <section className="profile-section"><h3>Match history</h3>{history.map((item) => <button key={item.matchId} onClick={() => navigate(`/m/${item.shareSlug}`)}><strong>{item.mapName.replace(/^de_/, "").toUpperCase()}</strong><span>{item.scoreLine}</span><span>{item.kills} K / {item.deaths} D</span><span>{item.headlineTitle}</span></button>)}{history.length === 0 && <p>No match history found.</p>}</section>
    {isMine && <section className="profile-section"><h3>My loadouts</h3>{loadouts.map((item) => <div className="profile-loadout" key={item.id}><strong>{item.title}</strong><span>{item.themeColor} · {item.itemsCount} items · ${item.totalCostUsd.toFixed(2)}</span><small>{item.isPublic ? "PUBLIC" : "PRIVATE"}</small></div>)}{loadouts.length === 0 && <p>No saved loadouts yet.</p>}</section>}
  </div>;
}
