import { useEffect, useState } from "react";
import Icon from "../components/Icon";
import { getRecentMatches } from "../features/matches/api";

type Props = {
  code: string;
  setCode: (value: string) => void;
  budget: number;
  setBudget: (value: number) => void;
  notify: (message: string) => void;
  navigate: (path: string) => void;
};

export default function CommandCenterPage({ code, setCode, budget, setBudget, notify, navigate }: Props) {
  const [matchCount, setMatchCount] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getRecentMatches(0, 1, controller.signal).then((data) => setMatchCount(data.totalElements)).catch(() => {});
    return () => controller.abort();
  }, []);
  return <>
<section className="hero-grid">
          <div className="analyzer">
            <div className="section-label"><span className="status-dot" /> MATCH ANALYZER / BETA</div>
            <h2>Your match.<br /><em>Brutally honest.</em></h2>
            <p>Drop a CS2 share code. We’ll dissect every round, find the moments your teammates won’t let you forget, and turn them into shareable awards.</p>
            <div className="code-form">
              <div className="code-input">
                <span>CS2 PREMIER SHARE CODE</span>
                <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste match share code" aria-label="Match share code" />
              </div>
              <button onClick={() => code ? navigate("/match-analyzer") : notify("Paste a share code first")}>Analyze match <Icon name="arrow" size={17} /></button>
            </div>
            <div className="trust-row">
              <div className="facepile"><span>R</span><span>M</span><span>K</span><span>+</span></div>
              <p>{matchCount === null ? "Browse match reports" : <><strong>{matchCount.toLocaleString()}</strong> analyzed matches</>}</p>
            </div>
          </div>

          <div className="award-wrap">
            <div className="award-card">
              <div className="award-head"><span>EXAMPLE AWARD</span><b>INFERNO · 13—10</b></div>
              <div className="award-art">
                <div className="flash flash-one" />
                <div className="flash flash-two" />
                <div className="award-icon"><Icon name="spark" size={48} /></div>
                <span className="award-count">12×</span>
              </div>
              <div className="award-copy">
                <small>RAREST · 0.8% OF PLAYERS</small>
                <h3>Flashbang<br />Philanthropist</h3>
                <p>You blinded your teammates <strong>12 times.</strong><br />At least someone saw your utility.</p>
              </div>
              <div className="award-foot"><span>CLUTCH LABS</span><span>@AK47Enjoyer</span></div>
            </div>
            <button className="share-button" onClick={() => navigate("/match-analyzer")}>See match reports <Icon name="arrow" size={16} /></button>
          </div>
        </section>

        <section className="workspace-head">
          <div><p className="eyebrow">THE FULL TOOLKIT</p><h2>Pick your way to play.</h2></div>
          <button className="text-button" onClick={() => notify("All tools are already unlocked")}>Explore all tools <Icon name="arrow" size={16} /></button>
        </section>
<section className="tool-grid">
          <article className="tool-card strat-card">
            <div className="card-top">
              <div className="tool-icon green"><Icon name="map" /></div>
              <span className="tag live">LIVE COLLAB</span>
            </div>
            <h3>Strat Board</h3>
            <p>Plan executes together. Draw routes, place utility, and sync your five-stack in real time.</p>
            <div className="mini-board">
              <div className="map-shape shape-a" /><div className="map-shape shape-b" />
              <div className="route route-a" /><div className="route route-b" />
              <span className="pin pin-a">A</span><span className="pin pin-b">B</span>
              <div className="cursor cursor-one">NIKO</div><div className="cursor cursor-two">YOU</div>
            </div>
            <div className="card-footer"><span><Icon name="users" size={15} /> Invite your squad</span><button onClick={() => navigate("/strat-board")}>Create room <Icon name="arrow" size={15} /></button></div>
          </article>

          <article className="tool-card daily-card">
            <div className="card-top">
              <div className="tool-icon orange"><Icon name="game" /></div>
              <span className="tag">DAILY GAME</span>
            </div>
            <h3>Guess the Elo</h3>
            <p>Three clips. Three ranks. One chance to prove your game sense is better than your aim.</p>
            <div className="clip">
              <div className="clip-noise" />
              <button className="play" onClick={() => navigate("/daily-games")} aria-label="Open daily game"><Icon name="play" size={24} /></button>
              <span>CLIP 01 / 03</span><time>0:08</time>
            </div>
            <div className="guess-row daily-open-row"><button onClick={() => navigate("/daily-games")}>OPEN TODAY'S CHALLENGE</button></div>
          </article>

          <article className="tool-card loadout-card">
            <div className="card-top">
              <div className="tool-icon purple"><Icon name="layers" /></div>
              <span className="tag">LOADOUT BUILDER</span>
            </div>
            <h3>Loadout Lab</h3>
            <p>Build a color-matched inventory that looks expensive—even when it isn’t.</p>
            <div className="weapon-stage">
              <div className="weapon">
                <div className="barrel" /><div className="body" /><div className="mag" /><div className="stock" />
              </div>
              <span className="skin-name">NEON RIDER</span>
              <span className="skin-price">COLOR-MATCHED</span>
            </div>
            <div className="budget-line"><span>BUDGET</span><strong>${budget}</strong></div>
            <input className="range" type="range" min="50" max="500" value={budget} onChange={(event) => setBudget(Number(event.target.value))} aria-label="Loadout budget" />
            <div className="card-footer"><span>No login to generate</span><button onClick={() => navigate("/loadout-lab")}>Build loadout <Icon name="arrow" size={15} /></button></div>
          </article>
        </section>
  </>;
}
