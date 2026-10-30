import { useState } from "react";
import DailyGamesPage from "./features/minigames/DailyGamesPage";

type IconName =
  | "bolt"
  | "upload"
  | "target"
  | "map"
  | "game"
  | "layers"
  | "clock"
  | "users"
  | "arrow"
  | "spark"
  | "crosshair"
  | "play"
  | "chevron"
  | "menu";

const iconPaths: Record<IconName, React.ReactNode> = {
  bolt: <path d="M13 2 4.5 13H11l-1 9 8.5-11H12l1-9Z" />,
  upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" /><path d="M5 15v4h14v-4" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 2v3m0 14v3M2 12h3m14 0h3" /></>,
  map: <><path d="m3 6 5-3 8 3 5-3v15l-5 3-8-3-5 3V6Z" /><path d="M8 3v15m8-12v15" /></>,
  game: <><path d="M8 8h8a5 5 0 0 1 4.7 6.7l-.9 2.5a2.4 2.4 0 0 1-4 1L14 16h-4l-1.8 2.2a2.4 2.4 0 0 1-4-1l-.9-2.5A5 5 0 0 1 8 8Z" /><path d="M8 11v4m-2-2h4m6-1h.01m2 2h.01" /></>,
  layers: <><path d="m12 3-9 5 9 5 9-5-9-5Z" /><path d="m3 12 9 5 9-5m-18 4 9 5 9-5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  users: <><path d="M16 20v-1.5A3.5 3.5 0 0 0 12.5 15h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3" /><path d="M17 10a3 3 0 0 1 0 6m1.5 4a3.5 3.5 0 0 0-2-3.2" /></>,
  arrow: <><path d="M5 12h14m-5-5 5 5-5 5" /></>,
  spark: <path d="m12 2 1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6L12 2Zm7 14 .6 2.4L22 19l-2.4.6L19 22l-.6-2.4L16 19l2.4-.6L19 16Z" />,
  crosshair: <><circle cx="12" cy="12" r="6" /><path d="M12 2v4m0 12v4M2 12h4m12 0h4" /></>,
  play: <path d="m9 7 8 5-8 5V7Z" />,
  chevron: <path d="m9 18 6-6-6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
};

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

const navItems: { label: string; icon: IconName }[] = [
  { label: "Command center", icon: "bolt" },
  { label: "Match analyzer", icon: "target" },
  { label: "Strat board", icon: "map" },
  { label: "Daily games", icon: "game" },
  { label: "Loadout lab", icon: "layers" },
];

const pageTitles: Record<string, [string, string]> = {
  "Command center": ["GOOD EVENING, PLAYER", "Ready to lock in?"],
  "Match analyzer": ["DEMO INTELLIGENCE", "Match analyzer"],
  "Strat board": ["LIVE TEAM SESSION", "Strat board"],
  "Daily games": ["DAILY CHALLENGE", "Guess the Elo"],
  "Loadout lab": ["MARKET PRICES UPDATED 4M AGO", "Loadout lab"],
};

function PageIntro({ kicker, title, copy, action, onAction }: { kicker: string; title: string; copy: string; action: string; onAction: () => void }) {
  return (
    <div className="page-intro">
      <div><p className="eyebrow">{kicker}</p><h2>{title}</h2><p>{copy}</p></div>
      <button onClick={onAction}>{action} <Icon name="arrow" size={16} /></button>
    </div>
  );
}

function MatchAnalyzerPage({ code, setCode, notify }: { code: string; setCode: (value: string) => void; notify: (message: string) => void }) {
  return (
    <div className="feature-page">
      <PageIntro kicker="TURN MATCHES INTO RECEIPTS" title="Upload. Analyze. Roast." copy="Paste a Premier share code or upload a demo. We’ll surface impact, utility, positioning, and the awards your squad deserves." action="How it works" onAction={() => notify("Opening analyzer guide")} />
      <section className="analyzer-layout">
        <div className="upload-panel">
          <div className="drop-zone" onClick={() => notify("Demo file picker opened")}>
            <div className="upload-icon"><Icon name="upload" size={28} /></div>
            <h3>Drop your .dem file here</h3>
            <p>or click to browse · max 500 MB</p>
            <span>FAST PARSING · PRIVATE BY DEFAULT</span>
          </div>
          <div className="or-line"><span>OR USE A SHARE CODE</span></div>
          <div className="code-form wide">
            <div className="code-input"><span>CS2 PREMIER MATCH</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CSGO-xxxxx-xxxxx-xxxxx-xxxxx-xxxxx" /></div>
            <button onClick={() => notify(code ? "Match added to queue" : "Enter a share code first")}>Start analysis <Icon name="arrow" size={16} /></button>
          </div>
        </div>
        <aside className="queue-panel">
          <div className="panel-title"><span>PROCESSING QUEUE</span><b>01</b></div>
          <div className="queue-match">
            <div className="map-thumb inferno"><span>INFERNO</span></div>
            <div><strong>Premier · 13—10</strong><p>Parsing round 18 of 23</p><div className="progress"><i /></div></div>
            <span>78%</span>
          </div>
          <div className="queue-empty"><Icon name="clock" /><p>Average analysis time<br /><strong>1 min 42 sec</strong></p></div>
        </aside>
      </section>
      <section className="recent-section">
        <div className="panel-title"><span>RECENT MATCHES</span><button onClick={() => notify("Showing all matches")}>View all <Icon name="arrow" size={14} /></button></div>
        <div className="match-table">
          {[
            ["MIRAGE", "13—7", "1.34", "The Eco Cobra", "2 hours ago"],
            ["ANUBIS", "11—13", "0.91", "Exit Fragger", "Yesterday"],
            ["DUST II", "13—5", "1.52", "Lobby Landlord", "May 24"],
          ].map((row, index) => (
            <button className="match-row" key={row[0]} onClick={() => notify(`${row[0]} report opened`)}>
              <span className={`match-map m${index}`}>{row[0].slice(0, 1)}</span>
              <span><small>MAP</small><strong>{row[0]}</strong></span>
              <span><small>SCORE</small><strong>{row[1]}</strong></span>
              <span><small>RATING</small><strong className={index === 1 ? "danger" : "positive"}>{row[2]}</strong></span>
              <span><small>TOP AWARD</small><strong>{row[3]}</strong></span>
              <time>{row[4]}</time><Icon name="chevron" size={16} />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StratBoardPage({ notify }: { notify: (message: string) => void }) {
  const [tool, setTool] = useState("ROUTE");
  return (
    <div className="feature-page board-page">
      <PageIntro kicker="ROOM / INFERNO A EXECUTE" title="Build the round together." copy="Everyone sees the same board. Map the entry, assign utility, and stop explaining your execute in a Discord call." action="Invite players" onAction={() => notify("Room link copied")} />
      <div className="board-shell">
        <div className="board-toolbar">
          <div className="tool-group">
            {["SELECT", "ROUTE", "SMOKE", "FLASH", "FIRE"].map((item) => <button key={item} className={tool === item ? "active" : ""} onClick={() => setTool(item)}>{item}</button>)}
          </div>
          <div className="board-actions"><button onClick={() => notify("Last action undone")}>UNDO</button><button onClick={() => notify("Board cleared")}>CLEAR</button><button className="save" onClick={() => notify("Strategy saved")}>SAVE STRAT</button></div>
        </div>
        <div className="full-board">
          <div className="site-label site-a">A</div><div className="site-label site-b">B</div>
          <div className="map-block mb1" /><div className="map-block mb2" /><div className="map-block mb3" /><div className="map-block mb4" /><div className="map-block mb5" />
          <div className="draw-line dl1" /><div className="draw-line dl2" /><div className="draw-line dl3" />
          <div className="utility smoke-u">S</div><div className="utility flash-u">F</div><div className="utility fire-u">M</div>
          <div className="player-dot pd1">1</div><div className="player-dot pd2">2</div><div className="player-dot pd3">3</div><div className="player-dot pd4">4</div><div className="player-dot pd5">5</div>
          <div className="live-cursor lc1">YOU</div><div className="live-cursor lc2">MATEO</div>
          <div className="board-legend"><span><i className="green-dot" /> T SPAWN</span><span><i className="orange-dot" /> EXECUTE</span><span>INFERNO · COMPETITIVE</span></div>
        </div>
        <aside className="team-panel">
          <div className="panel-title"><span>TEAM / 5</span><b className="online">LIVE</b></div>
          {["YOU", "MATEO", "RUSH", "K1RA", "GHOST"].map((name, index) => <div className="team-row" key={name}><span className={`color-${index}`}>{index + 1}</span><div><strong>{name}</strong><small>{index === 0 ? "Drawing a route" : index < 3 ? "On the board" : "Viewing"}</small></div><i /></div>)}
          <button className="add-player" onClick={() => notify("Invite link copied")}>+ COPY INVITE LINK</button>
          <div className="saved-strats"><p>SAVED STRATS</p><button>A execute v3 <span>12 items</span></button><button>Pistol split B <span>8 items</span></button></div>
        </aside>
      </div>
    </div>
  );
}

function LoadoutPage({ budget, setBudget, notify }: { budget: number; setBudget: (value: number) => void; notify: (message: string) => void }) {
  const skins = [["AK-47", "Neon Rider", "47.82", "purple"], ["M4A1-S", "Player Two", "38.14", "red"], ["AWP", "Atheris", "12.40", "green"], ["USP-S", "Cortex", "8.72", "pink"], ["GLOCK-18", "Water Elemental", "9.26", "blue"], ["DESERT EAGLE", "Light Rail", "4.18", "gold"]];
  return (
    <div className="feature-page">
      <PageIntro kicker="BUILD A FULL INVENTORY" title="Great taste. Smarter budget." copy="Choose a color and set your ceiling. We’ll assemble a complete T and CT inventory using live market pricing." action="View saved builds" onAction={() => notify("Saved builds opened")} />
      <section className="loadout-builder">
        <aside className="filter-panel">
          <div className="filter-block"><label>TOTAL BUDGET <strong>${budget}</strong></label><input className="range" type="range" min="50" max="500" value={budget} onChange={(e)=>setBudget(Number(e.target.value))}/><div><span>$50</span><span>$500</span></div></div>
          <div className="filter-block"><label>COLOR THEME</label><div className="swatches">{["purple","pink","blue","green","orange","mono"].map((color,i)=><button aria-label={color} key={color} className={`${color} ${i===0?"active":""}`} />)}</div></div>
          <div className="filter-block"><label>WEAR RANGE</label><div className="segmented"><button className="active">ANY</button><button>FN</button><button>MW</button><button>FT</button></div></div>
          <div className="filter-block"><label>LOADOUT SIDE</label><div className="segmented"><button className="active">BOTH</button><button>T</button><button>CT</button></div></div>
          <button className="generate" onClick={() => notify(`New $${budget} loadout generated`)}><Icon name="spark" /> GENERATE LOADOUT</button>
        </aside>
        <div className="inventory">
          <div className="inventory-head"><div><span>NEON NIGHTS</span><small>10 ITEMS · FIELD-TESTED OR BETTER</small></div><strong>$120.52 <small>EST. TOTAL</small></strong></div>
          <div className="skin-grid">{skins.map((skin,index)=><button className={`skin-card skin-${skin[3]}`} key={skin[1]} onClick={()=>notify(`${skin[1]} selected`)}><div className="mini-weapon"><i/><i/><i/></div><span>{skin[0]}</span><strong>{skin[1]}</strong><small>${skin[2]}</small>{index===0&&<b>BEST VALUE</b>}</button>)}</div>
          <div className="loadout-summary"><span><i /> $129.48 remaining</span><button onClick={()=>notify("Loadout saved")}>SAVE BUILD <Icon name="arrow" size={14}/></button></div>
        </div>
      </section>
    </div>
  );
}

export default function App() {
  const [activeNav, setActiveNav] = useState("Command center");
  const [code, setCode] = useState("");
  const [budget, setBudget] = useState(250);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast] = useState("");

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  return (
    <div className="app-shell">
      <aside className={mobileOpen ? "sidebar sidebar-open" : "sidebar"}>
        <div className="brand">
          <div className="brand-mark"><Icon name="crosshair" size={22} /></div>
          <div><strong>CLUTCH</strong><span>LABS</span></div>
        </div>
        <nav className="nav">
          <p className="eyebrow">PLAYGROUND</p>
          {navItems.map((item) => (
            <button
              className={activeNav === item.label ? "nav-item active" : "nav-item"}
              key={item.label}
              onClick={() => { setActiveNav(item.label); setMobileOpen(false); }}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
              {item.label === "Daily games" && <i>3</i>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="live-pill"><span /> 2,841 online</div>
          <div className="player">
            <div className="avatar">AK</div>
            <div><strong>Anonymous</strong><span>Sign in with Steam</span></div>
            <Icon name="chevron" size={16} />
          </div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <button className="icon-button mobile-menu" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu"><Icon name="menu" /></button>
          <div>
            <p className="eyebrow">{pageTitles[activeNav][0]}</p>
            <h1>{pageTitles[activeNav][1]}</h1>
          </div>
          <div className="top-actions">
            <div className="streak"><Icon name="bolt" size={15} /><strong>7</strong><span>day streak</span></div>
            <button className="steam-button" onClick={() => notify("Steam sign-in opened")}>Connect Steam <Icon name="arrow" size={16} /></button>
          </div>
        </header>

        {activeNav === "Command center" ? <><section className="hero-grid">
          <div className="analyzer">
            <div className="section-label"><span className="status-dot" /> MATCH ANALYZER / BETA</div>
            <h2>Your match.<br /><em>Brutally honest.</em></h2>
            <p>Drop a CS2 share code. We’ll dissect every round, find the moments your teammates won’t let you forget, and turn them into shareable awards.</p>
            <div className="code-form">
              <div className="code-input">
                <span>steam://rungame/730/...</span>
                <input value={code} onChange={(event) => setCode(event.target.value)} placeholder="Paste match share code" aria-label="Match share code" />
              </div>
              <button onClick={() => notify(code ? "Match queued for analysis" : "Paste a share code first")}>Analyze match <Icon name="arrow" size={17} /></button>
            </div>
            <div className="trust-row">
              <div className="facepile"><span>R</span><span>M</span><span>K</span><span>+</span></div>
              <p><strong>12,480</strong> matches roasted this week</p>
            </div>
          </div>

          <div className="award-wrap">
            <div className="award-card">
              <div className="award-head"><span>POST-MATCH AWARD</span><b>INFERNO · 13—10</b></div>
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
            <button className="share-button" onClick={() => notify("Award copied to clipboard")}>Share award <Icon name="arrow" size={16} /></button>
          </div>
        </section>

        <section className="workspace-head">
          <div><p className="eyebrow">THE FULL TOOLKIT</p><h2>Pick your way to play.</h2></div>
          <button className="text-button" onClick={() => notify("All tools are already unlocked")}>Explore all tools <Icon name="arrow" size={16} /></button>
        </section></> : activeNav === "Match analyzer" ? (
          <MatchAnalyzerPage code={code} setCode={setCode} notify={notify} />
        ) : activeNav === "Strat board" ? (
          <StratBoardPage notify={notify} />
        ) : activeNav === "Daily games" ? (
          <DailyGamesPage notify={notify} />
        ) : (
          <LoadoutPage budget={budget} setBudget={setBudget} notify={notify} />
        )}

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
            <div className="card-footer"><span><Icon name="users" size={15} /> 4 players in room</span><button onClick={() => notify("New strat room created")}>Create room <Icon name="arrow" size={15} /></button></div>
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
              <button className="play" onClick={() => setActiveNav("Daily games")} aria-label="Open daily game"><Icon name="play" size={24} /></button>
              <span>CLIP 01 / 03</span><time>0:08</time>
            </div>
            <div className="guess-row daily-open-row"><button onClick={() => setActiveNav("Daily games")}>OPEN TODAY'S CHALLENGE</button></div>
          </article>

          <article className="tool-card loadout-card">
            <div className="card-top">
              <div className="tool-icon purple"><Icon name="layers" /></div>
              <span className="tag">MARKET LIVE</span>
            </div>
            <h3>Loadout Lab</h3>
            <p>Build a color-matched inventory that looks expensive—even when it isn’t.</p>
            <div className="weapon-stage">
              <div className="weapon">
                <div className="barrel" /><div className="body" /><div className="mag" /><div className="stock" />
              </div>
              <span className="skin-name">NEON RIDER</span>
              <span className="skin-price">$47.82</span>
            </div>
            <div className="budget-line"><span>BUDGET</span><strong>${budget}</strong></div>
            <input className="range" type="range" min="50" max="500" value={budget} onChange={(event) => setBudget(Number(event.target.value))} aria-label="Loadout budget" />
            <div className="card-footer"><span>8 skins · 2 gloves</span><button onClick={() => notify(`Building a $${budget} loadout`)}>Build loadout <Icon name="arrow" size={15} /></button></div>
          </article>
        </section>

        <footer>
          <div><Icon name="crosshair" size={17} /><strong>CLUTCH LABS</strong></div>
          <p>Built for the rounds you’ll never live down.</p>
          <span>NOT AFFILIATED WITH VALVE CORP.</span>
        </footer>
      </main>

      {toast && <div className="toast"><span /><p>{toast}</p></div>}
    </div>
  );
}
