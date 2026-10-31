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

  useEffect(() => {
    setUsername(user?.username ?? "");
    setTradeUrl(user?.tradeUrl ?? "");
  }, [user?.username, user?.tradeUrl]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setLocalError("");
    try { await action(); }
    catch (cause) { setLocalError(cause instanceof Error ? cause.message : "Request failed."); }
    finally { setBusy(false); }
  }

  function submitDev(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => signInForDevelopment({ steamId, username: devUsername, role }));
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => updateProfile({ username: username.trim(), tradeUrl: tradeUrl.trim() }));
  }

  return <div className="auth-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="auth-panel" role="dialog" aria-modal="true" aria-label={user ? "Profile" : "Sign in"}>
      <button className="auth-close" onClick={onClose} aria-label="Close">×</button>
      <p className="eyebrow">PLAYER ACCOUNT</p>
      <h2>{user ? user.username : "Sign in"}</h2>
      {(error || localError) && <p className="auth-error" role="alert">{localError || error}</p>}
      {loading && <p>Loading profile…</p>}
      {user ? <>
        <p>Steam ID: {user.steamId} · {user.role}</p>
        <form onSubmit={submitProfile}>
          <label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          <label>Trade URL<input type="url" value={tradeUrl} onChange={(event) => setTradeUrl(event.target.value)} placeholder="https://steamcommunity.com/tradeoffer/new/..." /></label>
          <button disabled={busy}>SAVE PROFILE</button>
        </form>
        <button className="auth-secondary" onClick={() => { signOut(); onClose(); }}>SIGN OUT</button>
        <button className="auth-secondary" onClick={() => { navigate("/profile"); onClose(); }}>VIEW PROFILE</button>
      </> : <>
        <button className="auth-steam" disabled={busy} onClick={() => void run(signInWithSteam)}>SIGN IN WITH STEAM</button>
        {import.meta.env.DEV && <form onSubmit={submitDev}>
          <p className="auth-dev-label">Development login</p>
          <label>Steam ID<input value={steamId} onChange={(event) => setSteamId(event.target.value)} required /></label>
          <label>Username<input value={devUsername} onChange={(event) => setDevUsername(event.target.value)} required /></label>
          <label>Role<select value={role} onChange={(event) => setRole(event.target.value as UserRole)}><option value="USER">USER</option><option value="ADMIN">ADMIN</option></select></label>
          <button disabled={busy}>GET DEV TOKEN</button>
        </form>}
      </>}
    </section>
  </div>;
}
