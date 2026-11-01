import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { getPublicUser } from "../features/identity/api";
import type { PublicUserSummary } from "../features/identity/types";
import { getMatchHistory } from "../features/matches/api";
import type { MatchHistoryEntry } from "../features/matches/types";
import { getMyLoadouts } from "../features/loadouts/api";
import type { CommunityLoadout } from "../features/loadouts/types";
import { navigate } from "../routes";
import "./ProfilePage.css";

interface ProfilePageProps {
  userId?: string;
  notify?: (message: string) => void;
}

export default function ProfilePage({ userId, notify }: ProfilePageProps) {
  const { user, token, loading, updateProfile, logout } = useAuth();
  const isMine = !!user && (!userId || userId === user.id);

  const [profile, setProfile] = useState<PublicUserSummary | null>(null);
  const [history, setHistory] = useState<MatchHistoryEntry[]>([]);
  const [loadouts, setLoadouts] = useState<CommunityLoadout[]>([]);
  const [error, setError] = useState("");

  // Inline Profile Edit Form States
  const [editUsername, setEditUsername] = useState("");
  const [editTradeUrl, setEditTradeUrl] = useState("");
  const [editAvatarUrl, setEditAvatarUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [saveError, setSaveError] = useState("");
  const [copiedSteamId, setCopiedSteamId] = useState(false);

  // Sync form state when user profile changes
  useEffect(() => {
    if (user && isMine) {
      setEditUsername(user.username ?? "");
      setEditTradeUrl(user.tradeUrl ?? "");
      setEditAvatarUrl(user.avatarUrl ?? "");
    }
  }, [user, isMine]);

  // Load public profile or own profile
  useEffect(() => {
    const controller = new AbortController();
    if (!userId) {
      setProfile(
        user
          ? {
              userId: user.id,
              steamId: user.steamId,
              username: user.username,
              avatarUrl: user.avatarUrl,
            }
          : null,
      );
      return () => controller.abort();
    }
    setProfile(null);
    getPublicUser(userId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setProfile(data);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load profile.");
        }
      });
    return () => controller.abort();
  }, [userId, user?.id, user?.username, user?.steamId, user?.avatarUrl]);

  // Load match history
  useEffect(() => {
    if (!profile?.steamId) {
      setHistory([]);
      return;
    }
    const controller = new AbortController();
    getMatchHistory(profile.steamId, controller.signal)
      .then(setHistory)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load match history.");
        }
      });
    return () => controller.abort();
  }, [profile?.steamId]);

  // Load user's saved loadouts
  useEffect(() => {
    if (!isMine || !token) {
      setLoadouts([]);
      return;
    }
    const controller = new AbortController();
    getMyLoadouts(token, controller.signal)
      .then(setLoadouts)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error ? cause.message : "Could not load your loadouts.");
        }
      });
    return () => controller.abort();
  }, [isMine, token]);

  const handleCopySteamId = async () => {
    if (!user?.steamId) return;
    try {
      await navigator.clipboard.writeText(user.steamId);
      setCopiedSteamId(true);
      notify?.("Steam ID copied to clipboard");
      setTimeout(() => setCopiedSteamId(false), 2000);
    } catch {
      notify?.("Failed to copy Steam ID");
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveError("");
    setSaveSuccess("");

    const trimmedUsername = editUsername.trim();
    const trimmedTradeUrl = editTradeUrl.trim();
    const trimmedAvatarUrl = editAvatarUrl.trim();

    // Client-side validation
    if (trimmedUsername.length < 2 || trimmedUsername.length > 64) {
      setSaveError("Display name must be between 2 and 64 characters.");
      return;
    }

    if (
      trimmedTradeUrl &&
      !trimmedTradeUrl.startsWith("https://steamcommunity.com/tradeoffer/new/")
    ) {
      setSaveError(
        "Trade URL must start with 'https://steamcommunity.com/tradeoffer/new/'.",
      );
      return;
    }

    if (trimmedAvatarUrl) {
      try {
        const parsed = new URL(trimmedAvatarUrl);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          setSaveError("Avatar URL must be a valid HTTP or HTTPS web address.");
          return;
        }
      } catch {
        setSaveError("Avatar URL must be a valid URL format.");
        return;
      }
    }

    setSaving(true);
    try {
      await updateProfile({
        username: trimmedUsername,
        tradeUrl: trimmedTradeUrl || undefined,
        avatarUrl: trimmedAvatarUrl || undefined,
      });
      setSaveSuccess("Profile and Trade URL updated successfully!");
      notify?.("Profile updated successfully!");
    } catch (cause) {
      setSaveError(
        cause instanceof Error ? cause.message : "Failed to update profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading && !userId) {
    return (
      <div className="feature-page profile-page">
        <p className="profile-loading">Loading account…</p>
      </div>
    );
  }

  const effectiveAvatar =
    isMine && editAvatarUrl ? editAvatarUrl : profile?.avatarUrl ?? user?.avatarUrl;

  return (
    <div className="feature-page profile-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">PLAYER PROFILE</p>
          <h2>{profile?.username ?? user?.username ?? "Player Profile"}</h2>
          <p>
            {profile
              ? `Steam ID ${profile.steamId}`
              : userId
                ? "Loading profile…"
                : "Sign in with Steam to customize your profile, loadouts, and trade settings."}
          </p>
        </div>
      </div>

      {error && (
        <p className="profile-error" role="alert">
          {error}
        </p>
      )}

      {/* Main Profile Identity Card */}
      {profile && (
        <div className="profile-identity-card">
          <div className="profile-avatar-wrap">
            {effectiveAvatar ? (
              <img
                src={effectiveAvatar}
                alt={profile.username}
                className="profile-avatar"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src =
                    "https://avatars.steamstatic.com/fef49e7fa7e1997310d705b2a6158ff8dc1cdfeb_full.jpg";
                }}
              />
            ) : (
              <div className="profile-avatar-placeholder">
                {profile.username.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>

          <div className="profile-details">
            <div className="profile-header-line">
              <strong>{profile.username}</strong>
              <span className={`profile-badge ${isMine ? "mine" : "community"}`}>
                {isMine ? "YOUR ACCOUNT" : "COMMUNITY PLAYER"}
              </span>
              {isMine && user?.role && (
                <span className={`profile-role-badge ${user.role.toLowerCase()}`}>
                  {user.role}
                </span>
              )}
            </div>

            <div className="profile-steam-meta">
              <span className="profile-steam-id">
                Steam64: <code>{profile.steamId}</code>
              </span>
              {isMine && (
                <button
                  type="button"
                  className="profile-copy-btn"
                  onClick={handleCopySteamId}
                  title="Copy Steam64 ID"
                >
                  {copiedSteamId ? "✓ Copied!" : "Copy Steam ID"}
                </button>
              )}
              {user?.profileUrl && (
                <a
                  href={user.profileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="profile-steam-link"
                >
                  Steam Community Profile ↗
                </a>
              )}
            </div>
          </div>

          {isMine && (
            <div className="profile-admin-shortcut">
              {user?.role === "ADMIN" && (
                <button
                  type="button"
                  className="profile-admin-cta"
                  onClick={() => navigate("/admin")}
                >
                  Open Admin Console →
                </button>
              )}
              <button
                type="button"
                className="profile-signout-btn"
                onClick={() => {
                  logout();
                  notify?.("Signed out of your account.");
                  navigate("/");
                }}
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Inline Profile & Trade URL Settings (Logged-in Owner Only) */}
      {isMine && user && (
        <section className="profile-settings-card">
          <div className="profile-settings-head">
            <div>
              <p className="eyebrow">PROFILE SETTINGS & TRADE URL</p>
              <h3>Manage Your Identity</h3>
            </div>
            <span className="profile-sync-indicator">● LIVE SYNC</span>
          </div>

          {saveSuccess && (
            <div className="profile-success-alert" role="status">
              ✓ {saveSuccess}
            </div>
          )}
          {saveError && (
            <div className="profile-error-alert" role="alert">
              ✕ {saveError}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="profile-edit-form">
            <div className="profile-form-grid">
              <div className="form-group">
                <label htmlFor="input-username">Display Name</label>
                <input
                  id="input-username"
                  type="text"
                  required
                  minLength={2}
                  maxLength={64}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Your CS2 player alias"
                />
                <small className="form-hint">Visible across leaderboards and community loadouts (2–64 characters).</small>
              </div>

              <div className="form-group">
                <label htmlFor="input-avatar">Avatar URL (Optional Override)</label>
                <input
                  id="input-avatar"
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  placeholder="https://... (Direct image link)"
                />
                <small className="form-hint">Leave blank to inherit your official Steam Community avatar.</small>
              </div>
            </div>

            <div className="form-group full-width">
              <div className="label-with-link">
                <label htmlFor="input-trade-url">Steam Trade Offer URL</label>
                <a
                  href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="trade-helper-link"
                >
                  Find your Steam Trade URL here ↗
                </a>
              </div>
              <input
                id="input-trade-url"
                type="url"
                value={editTradeUrl}
                onChange={(e) => setEditTradeUrl(e.target.value)}
                placeholder="https://steamcommunity.com/tradeoffer/new/?partner=...&token=..."
              />
              <small className="form-hint">
                Enables 1-click trade link sharing for loadout crafts and skin exchanges.
              </small>
            </div>

            <div className="profile-form-actions">
              <button type="submit" disabled={saving} className="profile-save-btn">
                {saving ? "SAVING CHANGES…" : "SAVE PROFILE"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Match History Section */}
      <section className="profile-section">
        <div className="profile-section-title">
          <h3>Match History</h3>
          <span className="profile-count">{history.length} Matches</span>
        </div>
        {history.length > 0 ? (
          <div className="profile-history-list">
            {history.map((item) => (
              <button
                key={item.matchId}
                className="profile-history-row"
                onClick={() => navigate(`/m/${item.shareSlug}`)}
              >
                <span className="history-map">
                  {item.mapName.replace(/^de_/, "").toUpperCase()}
                </span>
                <span className={`history-score ${item.won ? "won" : "lost"}`}>
                  {item.scoreLine}
                </span>
                <span className="history-kda">
                  {item.kills} K / {item.deaths} D
                </span>
                <span className="history-rating">
                  {item.impactRating.toFixed(2)} Impact
                </span>
                <span className="history-award">
                  {item.badges?.[0]?.badgeIcon ?? "🏆"} {item.headlineTitle}
                </span>
                <span className="history-arrow">→</span>
              </button>
            ))}
          </div>
        ) : (
          <p className="profile-empty">No analyzed match reports linked to this account yet.</p>
        )}
      </section>

      {/* Saved Loadouts Section (Logged-in Owner Only) */}
      {isMine && (
        <section className="profile-section">
          <div className="profile-section-title">
            <h3>Saved Loadouts</h3>
            <span className="profile-count">{loadouts.length} Loadouts</span>
          </div>
          {loadouts.length > 0 ? (
            <div className="profile-loadouts-grid">
              {loadouts.map((item) => (
                <div className="profile-loadout-card" key={item.id}>
                  <div className="loadout-card-head">
                    <strong>{item.title}</strong>
                    <span className={`loadout-vis ${item.isPublic ? "public" : "private"}`}>
                      {item.isPublic ? "PUBLIC" : "PRIVATE"}
                    </span>
                  </div>
                  <div className="loadout-card-meta">
                    <span>Theme: {item.themeColor}</span>
                    <span>{item.itemsCount} Items</span>
                    <strong className="loadout-price">${item.totalCostUsd.toFixed(2)}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="profile-empty">
              No saved loadouts yet. Head over to{" "}
              <button
                type="button"
                className="profile-link-inline"
                onClick={() => navigate("/loadout-lab")}
              >
                Loadout Lab
              </button>{" "}
              to build your first inventory.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
