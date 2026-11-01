import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import type { UserRole } from "./types";
import { navigate } from "../../routes";
import "./AuthPanel.css";

export default function AuthPanel({ onClose }: { onClose: () => void }) {
  const { user, loading, error, signInWithSteam, signInForDevelopment, updateProfile, signOut } = useAuth();
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [steamId, setSteamId] = useState("76561198000000001");
  const [devUsername, setDevUsername] = useState("DevPlayer");
  const [role, setRole] = useState<UserRole>("USER");
  const [username, setUsername] = useState(user?.username ?? "");
  const [tradeUrl, setTradeUrl] = useState(user?.tradeUrl ?? "");
  const [devOpen, setDevOpen] = useState(false);

  const isDevAuthAllowed = import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_AUTH !== "false";

  useEffect(() => {
    setUsername(user?.username ?? "");
    setTradeUrl(user?.tradeUrl ?? "");
    if (user) {
      setSteamId(user.steamId);
      setDevUsername(user.username);
    }
  }, [user]);

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setLocalError("");
    try {
      await action();
    } catch (cause) {
      setLocalError(cause instanceof Error ? cause.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  function submitDev(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await signInForDevelopment({ steamId: steamId.trim(), username: devUsername.trim(), role });
      onClose();
    });
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => updateProfile({ username: username.trim(), tradeUrl: tradeUrl.trim() }));
  }

  return (
    <div className="auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-panel" role="dialog" aria-modal="true" aria-label={user ? "Profile" : "Sign in"}>
        <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">PLAYER ACCOUNT</p>
        <h2>{user ? user.username : "Sign in"}</h2>
        {(error || localError) && <p className="auth-error" role="alert">{localError || error}</p>}
        {loading && <p>Loading profile…</p>}
        {user ? (
          <>
            <div className="auth-user-meta">
              <p>Steam ID: <code>{user.steamId}</code></p>
              <span className={`auth-role-tag ${user.role.toLowerCase()}`}>{user.role}</span>
            </div>
            <form onSubmit={submitProfile}>
              <label>
                Username
                <input value={username} onChange={(event) => setUsername(event.target.value)} required minLength={2} maxLength={64} />
              </label>
              <label>
                Trade URL
                <input
                  type="url"
                  value={tradeUrl}
                  onChange={(event) => setTradeUrl(event.target.value)}
                  placeholder="https://steamcommunity.com/tradeoffer/new/..."
                />
              </label>
              <button disabled={busy}>{busy ? "SAVING…" : "SAVE PROFILE"}</button>
            </form>
            <div className="auth-btn-row">
              <button className="auth-secondary" onClick={() => { navigate("/profile"); onClose(); }}>VIEW PROFILE</button>
              {user.role === "ADMIN" && (
                <button className="auth-admin-link" onClick={() => { navigate("/admin"); onClose(); }}>ADMIN CONSOLE →</button>
              )}
              <button className="auth-secondary" onClick={() => { signOut(); onClose(); }}>SIGN OUT</button>
            </div>
          </>
        ) : (
          <button className="auth-steam" disabled={busy} onClick={() => void run(signInWithSteam)}>
            SIGN IN WITH STEAM
          </button>
        )}

        {isDevAuthAllowed && (
          <div className="auth-dev-section">
            <button
              type="button"
              className="auth-dev-toggle"
              onClick={() => setDevOpen((prev) => !prev)}
              aria-expanded={devOpen}
            >
              <span>{devOpen ? "▼" : "▶"} Developer / Admin Quick Login</span>
            </button>
            {devOpen && (
              <form onSubmit={submitDev} className="auth-dev-form">
                <div className="auth-preset-bar">
                  <button
                    type="button"
                    className="auth-preset-btn admin"
                    onClick={() => {
                      setSteamId(user?.steamId || "76561198000000001");
                      setDevUsername(user?.username || "AdminPlayer");
                      setRole("ADMIN");
                    }}
                  >
                    ★ Fill Admin Preset
                  </button>
                  <button
                    type="button"
                    className="auth-preset-btn"
                    onClick={() => {
                      setSteamId("76561198000000002");
                      setDevUsername("TesterUser");
                      setRole("USER");
                    }}
                  >
                    Fill User Preset
                  </button>
                </div>
                <label>
                  Steam ID
                  <input value={steamId} onChange={(event) => setSteamId(event.target.value)} required />
                </label>
                <label>
                  Username
                  <input value={devUsername} onChange={(event) => setDevUsername(event.target.value)} required />
                </label>
                <label>
                  Role
                  <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <button disabled={busy} className="auth-dev-submit">
                  {busy ? "CONNECTING…" : role === "ADMIN" ? "GET ADMIN TOKEN" : "GET DEV TOKEN"}
                </button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
