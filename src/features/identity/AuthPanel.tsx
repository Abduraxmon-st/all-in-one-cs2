import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "./AuthProvider";
import type { UserRole } from "./types";
import { navigate } from "../../routes";
import "./AuthPanel.css";

interface AuthPanelProps {
  onClose: () => void;
  notify?: (message: string) => void;
}

export default function AuthPanel({ onClose, notify }: AuthPanelProps) {
  const {
    user,
    loading,
    error,
    signInWithSteam,
    signInForDevelopment,
    signInWithPassword,
    registerWithPassword,
    updateProfile,
    logout,
  } = useAuth();

  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState("");
  const [authTab, setAuthTab] = useState<"steam" | "password">("steam");
  const [passwordMode, setPasswordMode] = useState<"signin" | "register">("signin");

  // Email/Password login inputs
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register inputs
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");

  // Dev login inputs
  const [steamId, setSteamId] = useState("76561198000000001");
  const [devUsername, setDevUsername] = useState("DevPlayer");
  const [role, setRole] = useState<UserRole>("USER");
  const [devOpen, setDevOpen] = useState(false);

  // Profile edit inputs (for logged-in user)
  const [username, setUsername] = useState(user?.username ?? "");
  const [tradeUrl, setTradeUrl] = useState(user?.tradeUrl ?? "");

  const isDevAuthAllowed =
    import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEV_AUTH !== "false";

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

  function handlePasswordLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!usernameOrEmail.trim() || !loginPassword) {
      setLocalError("Please enter your username/email and password.");
      return;
    }
    void run(async () => {
      await signInWithPassword({
        usernameOrEmail: usernameOrEmail.trim(),
        password: loginPassword,
      });
      notify?.("Signed in successfully!");
      onClose();
    });
  }

  function handlePasswordRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!regUsername.trim() || regUsername.trim().length < 3) {
      setLocalError("Username must be at least 3 characters.");
      return;
    }
    if (!regPassword || regPassword.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    void run(async () => {
      await registerWithPassword({
        username: regUsername.trim(),
        email: regEmail.trim() || undefined,
        password: regPassword,
      });
      notify?.("Account created and signed in!");
      onClose();
    });
  }

  function submitDev(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await signInForDevelopment({
        steamId: steamId.trim(),
        username: devUsername.trim(),
        role,
      });
      notify?.(`Signed in as ${role} (${devUsername.trim()})`);
      onClose();
    });
  }

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(async () => {
      await updateProfile({
        username: username.trim(),
        tradeUrl: tradeUrl.trim(),
      });
      notify?.("Profile updated successfully!");
    });
  }

  function handleSignOut() {
    logout();
    notify?.("Signed out successfully.");
    onClose();
  }

  return (
    <div
      className="auth-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="auth-panel"
        role="dialog"
        aria-modal="true"
        aria-label={user ? "Profile" : "Sign in"}
      >
        <button className="auth-close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <p className="eyebrow">PLAYER ACCOUNT</p>
        <h2>{user ? user.username : "Sign in"}</h2>

        {(error || localError) && (
          <p className="auth-error" role="alert">
            {localError || error}
          </p>
        )}

        {loading && <p className="auth-loading">Loading profile session…</p>}

        {user ? (
          <>
            <div className="auth-user-meta">
              <div>
                <p>
                  Steam ID: <code>{user.steamId || "CUSTOM"}</code>
                </p>
                <small className="auth-user-joined">
                  Member since {new Date(user.createdAt || Date.now()).toLocaleDateString()}
                </small>
              </div>
              <span className={`auth-role-tag ${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>

            <form onSubmit={submitProfile}>
              <label>
                Display Username
                <input
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  minLength={2}
                  maxLength={64}
                />
              </label>

              <label>
                Steam Trade Offer URL
                <input
                  type="url"
                  value={tradeUrl}
                  onChange={(event) => setTradeUrl(event.target.value)}
                  placeholder="https://steamcommunity.com/tradeoffer/new/..."
                />
              </label>

              <button disabled={busy} type="submit">
                {busy ? "SAVING…" : "SAVE PROFILE"}
              </button>
            </form>

            <div className="auth-btn-row">
              <button
                type="button"
                className="auth-secondary"
                onClick={() => {
                  navigate("/profile");
                  onClose();
                }}
              >
                VIEW FULL PROFILE
              </button>

              {user.role === "ADMIN" && (
                <button
                  type="button"
                  className="auth-admin-link"
                  onClick={() => {
                    navigate("/admin");
                    onClose();
                  }}
                >
                  ADMIN CONSOLE →
                </button>
              )}

              <button
                type="button"
                className="auth-signout-btn"
                onClick={handleSignOut}
              >
                SIGN OUT / DISCONNECT
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Tab Selection: Steam vs Password */}
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "steam" ? "active" : ""}`}
                onClick={() => {
                  setAuthTab("steam");
                  setLocalError("");
                }}
              >
                🎮 STEAM LOGIN
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${authTab === "password" ? "active" : ""}`}
                onClick={() => {
                  setAuthTab("password");
                  setLocalError("");
                }}
              >
                ✉️ EMAIL / PASSWORD
              </button>
            </div>

            {authTab === "steam" && (
              <div className="auth-steam-tab-content">
                <p className="auth-tab-desc">
                  Sign in instantly using your official Steam account to sync match replays,
                  verify Premier ratings, and enable direct trade offers.
                </p>
                <button
                  className="auth-steam"
                  disabled={busy}
                  onClick={() => void run(signInWithSteam)}
                  type="button"
                >
                  SIGN IN WITH STEAM ↗
                </button>
              </div>
            )}

            {authTab === "password" && (
              <div className="auth-password-tab-content">
                <div className="auth-sub-tabs">
                  <button
                    type="button"
                    className={`auth-sub-tab-btn ${passwordMode === "signin" ? "active" : ""}`}
                    onClick={() => {
                      setPasswordMode("signin");
                      setLocalError("");
                    }}
                  >
                    SIGN IN
                  </button>
                  <button
                    type="button"
                    className={`auth-sub-tab-btn ${passwordMode === "register" ? "active" : ""}`}
                    onClick={() => {
                      setPasswordMode("register");
                      setLocalError("");
                    }}
                  >
                    CREATE ACCOUNT
                  </button>
                </div>

                {passwordMode === "signin" ? (
                  <form onSubmit={handlePasswordLogin}>
                    <label>
                      Username or Email
                      <input
                        type="text"
                        value={usernameOrEmail}
                        onChange={(e) => setUsernameOrEmail(e.target.value)}
                        placeholder="Username or email address"
                        required
                        autoComplete="username"
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        autoComplete="current-password"
                      />
                    </label>

                    <button disabled={busy} type="submit" className="auth-submit-btn">
                      {busy ? "SIGNING IN…" : "LOG IN"}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordRegister}>
                    <label>
                      Username
                      <input
                        type="text"
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value)}
                        placeholder="Display username (3+ chars)"
                        required
                        minLength={3}
                        maxLength={64}
                        autoComplete="username"
                      />
                    </label>

                    <label>
                      Email Address (Optional)
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="player@clutchlabs.gg"
                        autoComplete="email"
                      />
                    </label>

                    <label>
                      Password
                      <input
                        type="password"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        autoComplete="new-password"
                      />
                    </label>

                    <button disabled={busy} type="submit" className="auth-submit-btn">
                      {busy ? "CREATING ACCOUNT…" : "REGISTER & JOIN"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </>
        )}

        {/* Development Quick Login Tool */}
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
                  <input
                    value={steamId}
                    onChange={(event) => setSteamId(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Username
                  <input
                    value={devUsername}
                    onChange={(event) => setDevUsername(event.target.value)}
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={role}
                    onChange={(event) => setRole(event.target.value as UserRole)}
                  >
                    <option value="USER">USER</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                </label>
                <button disabled={busy} className="auth-dev-submit" type="submit">
                  {busy
                    ? "CONNECTING…"
                    : role === "ADMIN"
                      ? "GET ADMIN TOKEN"
                      : "GET DEV TOKEN"}
                </button>
              </form>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
