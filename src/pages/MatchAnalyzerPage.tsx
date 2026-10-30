import Icon from "../components/Icon";
import PageIntro from "../components/PageIntro";

export default function MatchAnalyzerPage({ code, setCode, notify }: { code: string; setCode: (value: string) => void; notify: (message: string) => void }) {
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
