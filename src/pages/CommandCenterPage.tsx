import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { getRecentMatches, simulateMatch } from "../features/matches/api";
import type { MatchSummary } from "../features/matches/types";
import { getDailyChallenge } from "../features/minigames/api";
import type { DailyChallenge } from "../features/minigames/types";
import { getCommunity } from "../features/loadouts/api";
import type { CommunityLoadout } from "../features/loadouts/types";
import { useAuth } from "../features/identity/AuthProvider";
import "./CommandCenterPage.css";

type Props = {
  code: string;
  setCode: (value: string) => void;
  budget: number;
  setBudget: (value: number) => void;
  notify: (message: string) => void;
  navigate: (path: string) => void;
};

export default function CommandCenterPage({
  code,
  setCode,
  budget,
  setBudget,
  notify,
  navigate,
}: Props) {
  const { token, user } = useAuth();
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [latestMatch, setLatestMatch] = useState<MatchSummary | null>(null);
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [loadoutCount, setLoadoutCount] = useState<number | null>(null);
  const [featuredLoadout, setFeaturedLoadout] = useState<CommunityLoadout | null>(null);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    // 1. Live Match Feed
    getRecentMatches(0, 5, controller.signal)
      .then((data) => {
        setMatchCount(data.totalElements);
        if (data.content.length > 0) {
          setLatestMatch(data.content[0]);
        }
      })
      .catch(() => {});

    // 2. Daily Challenge Status
    getDailyChallenge(controller.signal, token || undefined)
      .then((challenge) => setDailyChallenge(challenge))
      .catch(() => {});

    // 3. Featured Community Loadouts
    getCommunity({ size: 1, sortBy: "popular" }, token || undefined, controller.signal)
      .then((data) => {
        setLoadoutCount(data.totalElements);
        if (data.content.length > 0) {
          setFeaturedLoadout(data.content[0]);
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [token]);

  async function handleSimulateMatch() {
    setSimulating(true);
    try {
      const match = await simulateMatch("de_mirage", token || undefined);
      notify(`Simulated ${match.mapName?.replace(/^de_/, "").toUpperCase()} match!`);
      navigate(`/m/${match.shareSlug || match.id}`);
    } catch (err) {
      notify(err instanceof Error ? err.message : "Failed to trigger match simulation.");
    } finally {
      setSimulating(false);
    }
  }

  return (
    <>
      {/* Live Platform Telemetry Bar */}
      <section className="cc-telemetry-bar">
        <div className="cc-telemetry-item">
          <span className="cc-telemetry-label">
            <span className="status-dot" /> VERIFIED MATCHES
          </span>
          <span className="cc-telemetry-val">
            {matchCount !== null ? matchCount.toLocaleString() : "..."}
          </span>
          <span className="cc-telemetry-sub">Dissected rounds & tactical stats</span>
        </div>

        <div className="cc-telemetry-item orange">
          <span className="cc-telemetry-label">
            <Icon name="game" size={13} /> DAILY CHALLENGE
          </span>
          <span className="cc-telemetry-val">
            {dailyChallenge ? `${dailyChallenge.rounds?.length ?? 3} CLIPS ACTIVE` : "ACTIVE TODAY"}
          </span>
          <span className="cc-telemetry-sub">
            {dailyChallenge ? `Date: ${dailyChallenge.challengeDate}` : "Guess Premier ratings"}
          </span>
        </div>

        <div className="cc-telemetry-item purple">
          <span className="cc-telemetry-label">
            <Icon name="layers" size={13} /> COMMUNITY BUILDS
          </span>
          <span className="cc-telemetry-val">
            {loadoutCount !== null ? `${loadoutCount.toLocaleString()}+` : "..."}
          </span>
          <span className="cc-telemetry-sub">Player loadouts & 5-slot crafts</span>
        </div>

        <div className="cc-telemetry-item blue">
          <span className="cc-telemetry-label">
            <Icon name="map" size={13} /> STRAT ROOMS
          </span>
          <span className="cc-telemetry-val">REAL-TIME</span>
          <span className="cc-telemetry-sub">Collaborative whiteboard & lineups</span>
        </div>
      </section>

      {/* Hero Section */}
      <section className="hero-grid">
        <div className="analyzer">
          <div className="section-label">
            <span className="status-dot" /> MATCH ANALYZER / LIVE
          </div>
          <h2>
            Your match.<br />
            <em>Brutally honest.</em>
          </h2>
          <p>
            Drop a CS2 Premier share code. We’ll dissect every round, find the moments
            your teammates won’t let you forget, and turn them into shareable 1200×630 awards.
          </p>
          <div className="code-form">
            <div className="code-input">
              <span>CS2 PREMIER SHARE CODE</span>
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx"
                aria-label="Match share code"
              />
            </div>
            <button
              onClick={() =>
                code ? navigate("/match-analyzer") : notify("Paste a share code first")
              }
            >
              Analyze match <Icon name="arrow" size={17} />
            </button>
          </div>
          <div className="trust-row">
            <div className="facepile">
              <span>R</span>
              <span>M</span>
              <span>K</span>
              <span>+</span>
            </div>
            <p>
              {matchCount === null ? (
                "Dissecting Premier matches"
              ) : (
                <>
                  <strong>{matchCount.toLocaleString()}</strong> analyzed matches on platform
                </>
              )}
            </p>
          </div>
        </div>

        {/* Dynamic Match Showcase or Example Award */}
        <div className="award-wrap">
          {latestMatch ? (
            <div className="cc-match-showcase">
              <div className="cc-match-badge-row">
                <span className="section-label">LATEST PLATFORM MATCH</span>
                <span className="tag live">PARSED</span>
              </div>
              <div className="cc-match-map">
                {latestMatch.mapName?.replace(/^de_/, "").toUpperCase() || "DE_MIRAGE"}
              </div>
              <div className="cc-match-score">
                {latestMatch.teamAScore} — {latestMatch.teamBScore}
              </div>
              <div className="cc-match-meta">
                <span>{latestMatch.totalRounds} Rounds Played</span>
                <span>{Math.round(latestMatch.durationSeconds / 60)} Minutes</span>
              </div>
              <button
                className="cc-shortcut-btn primary"
                onClick={() => navigate(`/m/${latestMatch.shareSlug || latestMatch.id}`)}
              >
                Inspect Match Analysis <Icon name="arrow" size={15} />
              </button>
            </div>
          ) : (
            <div className="award-card">
              <div className="award-head">
                <span>EXAMPLE AWARD</span>
                <b>INFERNO · 13—10</b>
              </div>
              <div className="award-art">
                <div className="flash flash-one" />
                <div className="flash flash-two" />
                <div className="award-icon">
                  <Icon name="spark" size={48} />
                </div>
                <span className="award-count">12×</span>
              </div>
              <div className="award-copy">
                <small>RAREST · 0.8% OF PLAYERS</small>
                <h3>
                  Flashbang<br />Philanthropist
                </h3>
                <p>
                  You blinded your teammates <strong>12 times.</strong>
                  <br />At least someone saw your utility.
                </p>
              </div>
              <div className="award-foot">
                <span>CLUTCH LABS</span>
                <span>@AK47Enjoyer</span>
              </div>
            </div>
          )}
          <button
            className="share-button"
            onClick={() => navigate("/match-analyzer")}
          >
            See match reports <Icon name="arrow" size={16} />
          </button>
        </div>
      </section>

      {/* Quick Action Shortcuts Toolbar */}
      <section className="cc-shortcuts-bar">
        <span className="cc-shortcuts-label">QUICK ACTIONS:</span>
        <button
          className="cc-shortcut-btn primary"
          onClick={handleSimulateMatch}
          disabled={simulating}
        >
          <Icon name="spark" size={14} />
          {simulating ? "Simulating Match…" : "⚡ Quick Match Simulator"}
        </button>
        <button
          className="cc-shortcut-btn"
          onClick={() => navigate("/strat-board")}
        >
          <Icon name="map" size={14} /> Open Strat Board Room
        </button>
        <button
          className="cc-shortcut-btn"
          onClick={() => navigate("/daily-games")}
        >
          <Icon name="game" size={14} /> Play Daily Guess the Elo
        </button>
        <button
          className="cc-shortcut-btn"
          onClick={() => navigate("/loadout-lab")}
        >
          <Icon name="layers" size={14} /> Browse Loadout Catalog
        </button>
      </section>

      {/* Toolkit Headline */}
      <section className="workspace-head">
        <div>
          <p className="eyebrow">THE FULL TOOLKIT</p>
          <h2>Pick your way to play.</h2>
        </div>
        <button
          className="text-button"
          onClick={() => notify("All tools unlocked and operational")}
        >
          Explore all tools <Icon name="arrow" size={16} />
        </button>
      </section>

      {/* Live Tool Grid */}
      <section className="tool-grid">
        {/* Strat Board Tool Card */}
        <article className="tool-card strat-card">
          <div className="card-top">
            <div className="tool-icon green">
              <Icon name="map" />
            </div>
            <span className="tag live">LIVE COLLAB</span>
          </div>
          <h3>Strat Board</h3>
          <p>
            Plan executes together. Draw routes, place utility lineups, preview in-app clips,
            and sync your five-stack in real time via STOMP WebSockets.
          </p>
          <div className="mini-board">
            <div className="map-shape shape-a" />
            <div className="map-shape shape-b" />
            <div className="route route-a" />
            <div className="route route-b" />
            <span className="pin pin-a">A</span>
            <span className="pin pin-b">B</span>
            <div className="cursor cursor-one">{user?.username ?? "NIKO"}</div>
            <div className="cursor cursor-two">YOU</div>
          </div>
          <div className="card-footer">
            <span>
              <Icon name="users" size={15} /> Invite your squad
            </span>
            <button onClick={() => navigate("/strat-board")}>
              Create room <Icon name="arrow" size={15} />
            </button>
          </div>
        </article>

        {/* Daily Minigames Tool Card */}
        <article className="tool-card daily-card">
          <div className="card-top">
            <div className="tool-icon orange">
              <Icon name="game" />
            </div>
            <span className="tag">DAILY GAME</span>
          </div>
          <h3>Guess the Elo</h3>
          <p>
            Three clips. Three ranks. One chance to prove your game sense is better than your aim.
          </p>
          {dailyChallenge && (
            <div className="cc-daily-status-box">
              <div>
                <strong>CHALLENGE ACTIVE</strong>
                <div style={{ color: "var(--muted)", fontSize: "9px" }}>
                  {dailyChallenge.challengeDate}
                </div>
              </div>
              <span className="cc-daily-rounds-badge">
                {dailyChallenge.rounds?.filter((r) => r.userGuess !== null).length ?? 0}/3 ROUNDS
                {dailyChallenge.completed ? " · COMPLETED" : ""}
              </span>
            </div>
          )}
          <div className="clip">
            <div className="clip-noise" />
            <button
              className="play"
              onClick={() => navigate("/daily-games")}
              aria-label="Open daily game"
            >
              <Icon name="play" size={24} />
            </button>
            <span>CLIP 01 / 03</span>
            <time>0:08</time>
          </div>
          <div className="guess-row daily-open-row">
            <button onClick={() => navigate("/daily-games")}>
              OPEN TODAY&apos;S CHALLENGE
            </button>
          </div>
        </article>

        {/* Loadout Lab Tool Card */}
        <article className="tool-card loadout-card">
          <div className="card-top">
            <div className="tool-icon purple">
              <Icon name="layers" />
            </div>
            <span className="tag">LOADOUT BUILDER</span>
          </div>
          <h3>Loadout Lab</h3>
          <p>
            Build a color-matched inventory with full 5-slot sticker crafting that looks
            expensive—even when it isn&apos;t.
          </p>

          {featuredLoadout ? (
            <div className="cc-loadout-featured-box">
              <div className="cc-loadout-featured-head">
                <span>COMMUNITY SPOTLIGHT</span>
                <span>{featuredLoadout.themeColor} THEME</span>
              </div>
              <div className="cc-loadout-featured-title">
                {featuredLoadout.title}
              </div>
              <div className="cc-loadout-featured-author">
                by {featuredLoadout.author.username}
              </div>
              <div className="cc-loadout-featured-cost">
                <span>${featuredLoadout.totalCostUsd.toFixed(2)}</span>
                <em>▲ {featuredLoadout.upvotes} upvotes</em>
              </div>
            </div>
          ) : (
            <div className="weapon-stage">
              <div className="weapon">
                <div className="barrel" />
                <div className="body" />
                <div className="mag" />
                <div className="stock" />
              </div>
              <span className="skin-name">NEON RIDER</span>
              <span className="skin-price">COLOR-MATCHED</span>
            </div>
          )}

          <div className="budget-line">
            <span>BUDGET</span>
            <strong>${budget}</strong>
          </div>
          <input
            className="range"
            type="range"
            min="50"
            max="500"
            value={budget}
            onChange={(event) => setBudget(Number(event.target.value))}
            aria-label="Loadout budget"
          />
          <div className="card-footer">
            <span>No login to generate</span>
            <button onClick={() => navigate("/loadout-lab")}>
              Build loadout <Icon name="arrow" size={15} />
            </button>
          </div>
        </article>
      </section>
    </>
  );
}
