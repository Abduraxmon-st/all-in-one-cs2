import { useState } from "react";
import Icon from "../components/Icon";
import PageIntro from "../components/PageIntro";

export default function StratBoardPage({ notify }: { notify: (message: string) => void }) {
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
