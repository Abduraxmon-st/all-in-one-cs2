import { useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { createRoom, deleteLineup, deleteTactic, getLineups, getMyTactics, getRoom, getTactic, getTactics, loadTacticIntoRoom, saveRoomTactic, submitLineup, updateTactic } from "../features/stratboard/api";
import { connectRoom } from "../features/stratboard/realtime";
import type { BoardEvent, CanvasElement, CreateLineupRequest, RoomParticipant, RoomSnapshot, TacticDetail, TacticSummary, TeamSide, UtilityLineup, UtilityType } from "../features/stratboard/types";
import ClipPlayer from "../components/ClipPlayer";
import { navigate, routeHref } from "../routes";
import "./StratBoardPage.css";

type Props = { notify: (message: string) => void; roomCodeFromRoute?: string };
type Tab = "board" | "lineups" | "tactics";
type Tool = "SELECT" | "ARROW" | "SMOKE" | "FLASH" | "MOLOTOV" | "PLAYER";
const maps = ["de_mirage", "de_inferno", "de_dust2", "de_nuke", "de_ancient", "de_anubis", "de_train", "de_vertigo"];
const initialLineup: CreateLineupRequest = { mapName: "de_inferno", utilityType: "SMOKE", teamSide: "T", title: "", throwType: "STANDING", standX: 50, standY: 50, landX: 50, landY: 50, videoUrl: "", description: "" };

const utilityColors: Record<UtilityType, string> = {
  SMOKE: "#94a3b8",
  FLASH: "#facc15",
  MOLOTOV: "#f97316",
  HE: "#22c55e",
};

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch { return null; }
}

function applyEvent(room: RoomSnapshot, event: BoardEvent): RoomSnapshot {
  switch (event.eventType) {
    case "PARTICIPANT_JOIN": return { ...room, participants: [...room.participants.filter((p) => p.participantId !== event.participantId), event.participant] };
    case "PARTICIPANT_LEAVE": return { ...room, participants: room.participants.filter((p) => p.participantId !== event.participantId) };
    case "ELEMENT_UPSERT": return { ...room, canvasElements: [...room.canvasElements.filter((e) => e.elementId !== event.element.elementId), event.element] };
    case "ELEMENT_DELETE": return { ...room, canvasElements: room.canvasElements.filter((e) => e.elementId !== event.elementId) };
    case "BOARD_CLEAR": return { ...room, canvasElements: [] };
    case "MAP_CHANGE": return { ...room, mapName: event.mapName, teamSide: event.teamSide, canvasElements: [] };
    default: return room;
  }
}

export default function StratBoardPage({ notify, roomCodeFromRoute }: Props) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>("board");
  const [mapName, setMapName] = useState("de_inferno");
  const [teamSide, setTeamSide] = useState<TeamSide>("T");
  const [displayName, setDisplayName] = useState(user?.username ?? "Guest");
  const [joinCode, setJoinCode] = useState("");
  const [room, setRoom] = useState<RoomSnapshot | null>(null);
  const [participant, setParticipant] = useState<RoomParticipant | null>(null);
  const [connection, setConnection] = useState("disconnected");
  const socket = useRef<ReturnType<typeof connectRoom> | null>(null);
  const lastCursorAt = useRef(0);
  const [cursors, setCursors] = useState<Record<string, { x: number; y: number }>>({});
  const [tool, setTool] = useState<Tool>("ARROW");
  const [arrowStart, setArrowStart] = useState<{ x: number; y: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState("");
  const [lineups, setLineups] = useState<UtilityLineup[]>([]);
  const [utilityType, setUtilityType] = useState<UtilityType | "">("");
  const [lineupDraft, setLineupDraft] = useState<CreateLineupRequest>(initialLineup);
  const [showLineupForm, setShowLineupForm] = useState(false);
  const [activeVideoLineup, setActiveVideoLineup] = useState<UtilityLineup | null>(null);
  const [showRadarPreview, setShowRadarPreview] = useState(true);
  const [selectedRadarLineupId, setSelectedRadarLineupId] = useState<string | null>(null);
  const [tactics, setTactics] = useState<TacticSummary[]>([]);
  const [tacticPage, setTacticPage] = useState(0);
  const [tacticTotalPages, setTacticTotalPages] = useState(0);
  const [myTactics, setMyTactics] = useState<TacticSummary[]>([]);
  const [tactic, setTactic] = useState<TacticDetail | null>(null);
  const [tacticCode, setTacticCode] = useState("");
  const [saveTitle, setSaveTitle] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { if (user?.username) setDisplayName(user.username); }, [user?.username]);

  useEffect(() => {
    if (!roomCodeFromRoute || room?.roomCode === roomCodeFromRoute) return;
    let active = true;
    getRoom(roomCodeFromRoute).then((snapshot) => {
      if (!active) return;
      setRoom(snapshot);
      setMapName(snapshot.mapName);
      setTeamSide(snapshot.teamSide);
      setParticipant({ participantId: `guest-${crypto.randomUUID()}`, displayName: user?.username ?? displayName, colorHex: "#C8F135", userId: user?.id ?? null, isHost: false });
      setTab("board");
    }).catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Could not join room."); });
    return () => { active = false; };
  }, [roomCodeFromRoute]);

  useEffect(() => {
    if (!room || !participant) return;
    const connection = connectRoom({ roomCode: room.roomCode, participant, token: token || undefined,
      onStatus: setConnection,
      onEvent: (event) => {
        if (event.eventType === "CURSOR_MOVE") setCursors((current) => ({ ...current, [event.participantId]: event.cursor }));
        else if (event.eventType === "LOAD_TACTIC") getRoom(room.roomCode).then(setRoom).catch(() => {});
        else setRoom((current) => current ? applyEvent(current, event) : current);
      },
    });
    socket.current = connection;
    return () => { connection.disconnect(); if (socket.current === connection) socket.current = null; };
  }, [room?.roomCode, participant?.participantId, token]);

  useEffect(() => {
    if (tab !== "lineups") return;
    const controller = new AbortController();
    getLineups({ mapName, teamSide, utilityType: utilityType || undefined }, controller.signal).then(setLineups).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load lineups."); });
    return () => controller.abort();
  }, [tab, mapName, teamSide, utilityType]);

  useEffect(() => {
    if (tab !== "tactics") return;
    const controller = new AbortController();
    getTactics({ mapName, teamSide, page: tacticPage, size: 20 }, controller.signal).then((data) => { setTactics(data.content); setTacticTotalPages(data.totalPages); }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load tactics."); });
    if (token) getMyTactics(token).then(setMyTactics).catch(() => setMyTactics([]));
    else setMyTactics([]);
    return () => controller.abort();
  }, [tab, mapName, teamSide, token, tacticPage]);

  function publish(event: BoardEvent) {
    if (!room || !socket.current?.publish(event)) { setError("Room is not connected."); return; }
    if (event.eventType !== "CURSOR_MOVE") setRoom((current) => current ? applyEvent(current, event) : current);
  }

  async function create() {
    setBusy(true); setError("");
    try {
      const snapshot = await createRoom({ mapName, teamSide, hostDisplayName: displayName.trim() || "Guest", hostColorHex: "#C8F135" }, token || undefined);
      setRoom(snapshot);
      setParticipant(snapshot.participants.find((p) => p.participantId === snapshot.hostParticipantId) ?? { participantId: snapshot.hostParticipantId, displayName, colorHex: "#C8F135", userId: user?.id ?? null, isHost: true });
      navigate(`/strat-board/${snapshot.roomCode}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not create room."); }
    finally { setBusy(false); }
  }

  async function join() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true); setError("");
    try {
      const snapshot = await getRoom(code);
      setRoom(snapshot); setMapName(snapshot.mapName); setTeamSide(snapshot.teamSide);
      setParticipant({ participantId: `guest-${crypto.randomUUID()}`, displayName: displayName.trim() || "Guest", colorHex: "#C8F135", userId: user?.id ?? null, isHost: false });
      navigate(`/strat-board/${code}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not join room."); }
    finally { setBusy(false); }
  }

  function point(event: MouseEvent<HTMLDivElement>) {
    if (!room || !participant) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    if (tool === "SELECT") return;
    if (tool === "ARROW" && !arrowStart) { setArrowStart({ x, y }); return; }
    const element: CanvasElement = tool === "ARROW" ? { elementId: crypto.randomUUID(), elementType: "ARROW", x: arrowStart!.x, y: arrowStart!.y, endX: x, endY: y, colorHex: "#FF7A28", createdByParticipantId: participant.participantId } : { elementId: crypto.randomUUID(), elementType: tool === "PLAYER" ? "PLAYER_TOKEN" : "UTILITY_PIN", x, y, label: tool, colorHex: "#C8F135", createdByParticipantId: participant.participantId };
    publish({ eventType: "ELEMENT_UPSERT", participantId: participant.participantId, element });
    setArrowStart(null);
  }

  function moveCursor(event: MouseEvent<HTMLDivElement>) {
    if (!room || !participant || Date.now() - lastCursorAt.current < 100) return;
    lastCursorAt.current = Date.now();
    const rect = event.currentTarget.getBoundingClientRect();
    socket.current?.publish({ eventType: "CURSOR_MOVE", participantId: participant.participantId, cursor: { x: ((event.clientX - rect.left) / rect.width) * 100, y: ((event.clientY - rect.top) / rect.height) * 100 } });
  }

  function changeMap(nextMap: string, nextSide: TeamSide) {
    setMapName(nextMap); setTeamSide(nextSide); setArrowStart(null); setTacticPage(0);
    if (room && participant) publish({ eventType: "MAP_CHANGE", participantId: participant.participantId, mapName: nextMap, teamSide: nextSide });
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !room) { setError("Sign in and create a room before saving."); return; }
    setBusy(true); setError("");
    try { const saved = await saveRoomTactic(room.roomCode, { title: saveTitle.trim(), description: saveDescription.trim(), isPublic }, token); setTactic(saved); notify(`Tactic saved: ${saved.shareCode}`); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save tactic."); }
    finally { setBusy(false); }
  }

  async function openTactic(code: string) {
    setError("");
    try { setTactic(await getTactic(code, token || undefined)); setTab("tactics"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load tactic."); }
  }

  async function loadTactic() {
    if (!room || !tactic) { setError("Join a room first."); return; }
    try { setRoom(await loadTacticIntoRoom(room.roomCode, tactic.id, token || undefined)); setTab("board"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load tactic into room."); }
  }

  async function saveChanges() {
    if (!tactic || !token) return;
    try { setTactic(await updateTactic(tactic.id, { title: tactic.title, mapName: tactic.mapName, teamSide: tactic.teamSide, description: tactic.description ?? "", canvasStateJson: tactic.canvasStateJson, isPublic: tactic.isPublic }, token)); notify("Tactic updated"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update tactic."); }
  }

  async function removeTactic() {
    if (!tactic || !token || !window.confirm("Delete this tactic?")) return;
    try { await deleteTactic(tactic.id, token); setTactic(null); setMyTactics((current) => current.filter((item) => item.id !== tactic.id)); notify("Tactic deleted"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete tactic."); }
  }

  async function submitNewLineup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) { setError("Sign in to submit a lineup."); return; }
    setBusy(true); setError("");
    try { const created = await submitLineup({ ...lineupDraft, mapName, teamSide }, token); setLineups((current) => [created, ...current]); setShowLineupForm(false); notify("Lineup submitted for review"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not submit lineup."); }
    finally { setBusy(false); }
  }

  async function removeLineup(id: string) {
    if (!token || !window.confirm("Delete this lineup?")) return;
    try { await deleteLineup(id, token); setLineups((current) => current.filter((item) => item.id !== id)); notify("Lineup deleted"); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete lineup."); }
  }

  async function placeLineup(lineup: UtilityLineup) {
    if (!room || !participant) {
      setBusy(true);
      try {
        const snapshot = await createRoom({
          mapName: lineup.mapName,
          teamSide: lineup.teamSide,
          hostDisplayName: displayName.trim() || "Guest",
          hostColorHex: "#C8F135",
        }, token || undefined);
        setRoom(snapshot);
        const hostPart = snapshot.participants.find((p) => p.participantId === snapshot.hostParticipantId) ?? {
          participantId: snapshot.hostParticipantId,
          displayName,
          colorHex: "#C8F135",
          userId: user?.id ?? null,
          isHost: true,
        };
        setParticipant(hostPart);
        navigate(`/strat-board/${snapshot.roomCode}`);
        setTab("board");
        notify(`Created room ${snapshot.roomCode} and pinned "${lineup.title}"`);
      } catch {
        setError("Join or create a room first to place this lineup on the canvas.");
      } finally {
        setBusy(false);
      }
      return;
    }
    publish({
      eventType: "ELEMENT_UPSERT",
      participantId: participant.participantId,
      element: {
        elementId: crypto.randomUUID(),
        elementType: "UTILITY_PIN",
        x: lineup.landX,
        y: lineup.landY,
        label: lineup.utilityType,
        text: lineup.title,
        lineupId: lineup.id,
        colorHex: utilityColors[lineup.utilityType] ?? "#C8F135",
        createdByParticipantId: participant.participantId,
      },
    });
    setTab("board");
    notify(`Pinned "${lineup.title}" to whiteboard`);
  }

  const selectedRadarLineup = lineups.find((l) => l.id === selectedRadarLineupId) ?? null;

  return <div className="feature-page strat-api-page">
    <div className="page-intro"><div><p className="eyebrow">LIVE TACTICAL ROOMS</p><h2>Strat board</h2><p>Create a guest room, draw with teammates, browse lineups, and save tactics when signed in.</p></div></div>
    <div className="strat-tabs">{(["board", "lineups", "tactics"] as Tab[]).map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item.toUpperCase()}</button>)}</div>
    {error && <p className="strat-error" role="alert">{error}</p>}
    <div className="strat-filters"><select aria-label="Map" value={mapName} onChange={(event) => changeMap(event.target.value, teamSide)}>{maps.map((item) => <option key={item} value={item}>{item.replace(/^de_/, "").toUpperCase()}</option>)}</select><select aria-label="Team side" value={teamSide} onChange={(event) => changeMap(mapName, event.target.value as TeamSide)}><option value="T">T SIDE</option><option value="CT">CT SIDE</option></select></div>
    {tab === "board" && <>
      <div className="strat-room-bar"><input aria-label="Display name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" /><button disabled={busy} onClick={create}>CREATE ROOM</button><input aria-label="Room code" value={joinCode} onChange={(event) => setJoinCode(event.target.value)} placeholder="Room code" /><button disabled={busy} onClick={join}>JOIN ROOM</button></div>
      {room && <div className="strat-room-meta"><strong>ROOM {room.roomCode}</strong><span>{connection.toUpperCase()}</span><button onClick={() => navigator.clipboard.writeText(`${window.location.origin}${routeHref(`/strat-board/${room.roomCode}`)}`).then(() => notify("Invite link copied")).catch(() => notify("Could not copy invite"))}>COPY INVITE LINK</button><button onClick={() => { setRoom(null); setParticipant(null); setCursors({}); navigate("/strat-board"); }}>LEAVE ROOM</button></div>}
      <div className="strat-tools">{(["SELECT", "ARROW", "SMOKE", "FLASH", "MOLOTOV", "PLAYER"] as Tool[]).map((item) => <button className={tool === item ? "active" : ""} key={item} onClick={() => { setTool(item); setArrowStart(null); }}>{item}</button>)}<button onClick={() => { const last = room?.canvasElements.at(-1); if (last && participant) publish({ eventType: "ELEMENT_DELETE", participantId: participant.participantId, elementId: last.elementId }); }}>UNDO</button><button onClick={() => { if (participant) publish({ eventType: "BOARD_CLEAR", participantId: participant.participantId }); }}>CLEAR</button></div>
      <div className="strat-workspace"><div className="strat-canvas" onClick={point} onMouseMove={moveCursor} role="presentation"><span className="strat-site a">A</span><span className="strat-site b">B</span>{room?.canvasElements.map((element) => element.elementType === "ARROW" && element.endX !== undefined && element.endY !== undefined ? <svg className="strat-arrow" key={element.elementId} viewBox="0 0 100 100" preserveAspectRatio="none"><line x1={element.x} y1={element.y} x2={element.endX} y2={element.endY} stroke={element.colorHex ?? "#ff7a28"} strokeWidth=".7" markerEnd="url(#arrowhead)" /><defs><marker id="arrowhead" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto"><path d="M0,0 L5,2.5 L0,5 Z" fill="#ff7a28" /></marker></defs></svg> : <button key={element.elementId} className={`strat-pin ${selectedElement === element.elementId ? "selected" : ""}`} style={{ left: `${element.x}%`, top: `${element.y}%` }} onClick={(event) => { event.stopPropagation(); setSelectedElement(element.elementId); }} title={element.text ?? element.label}>{element.label ?? "P"}</button>)}{arrowStart && <span className="strat-pending" style={{ left: `${arrowStart.x}%`, top: `${arrowStart.y}%` }}>START</span>}{Object.entries(cursors).filter(([id]) => id !== participant?.participantId).map(([id, cursor]) => <span className="strat-cursor" key={id} style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}>{room?.participants.find((p) => p.participantId === id)?.displayName ?? "PLAYER"}</span>)}</div><aside className="strat-people"><div className="panel-title"><span>TEAM / {room?.participants.length ?? 0}</span></div>{room?.participants.map((person) => <p key={person.participantId}><i style={{ background: person.colorHex }} />{person.displayName}{person.isHost ? " · HOST" : ""}</p>)}{!room && <p>Create or join a room to draw.</p>}{selectedElement && participant && <button onClick={() => { publish({ eventType: "ELEMENT_DELETE", participantId: participant.participantId, elementId: selectedElement }); setSelectedElement(""); }}>DELETE SELECTED</button>}</aside></div>
      <form className="strat-save" onSubmit={saveRoom}><input value={saveTitle} onChange={(event) => setSaveTitle(event.target.value)} placeholder="Tactic title" required /><input value={saveDescription} onChange={(event) => setSaveDescription(event.target.value)} placeholder="Description" /><label><input type="checkbox" checked={isPublic} onChange={(event) => setIsPublic(event.target.checked)} /> Public</label><button disabled={busy || !room || !token}>SAVE ROOM AS TACTIC</button></form>
    </>}
    {tab === "lineups" && <section className="strat-list">
      <div className="panel-title">
        <span>UTILITY LINEUPS · {lineups.length}</span>
        <div className="strat-header-actions">
          <button
            type="button"
            className="strat-radar-toggle-btn"
            onClick={() => setShowRadarPreview((v) => !v)}
          >
            {showRadarPreview ? "HIDE RADAR MAP" : "SHOW RADAR MAP"}
          </button>
          <button onClick={() => setShowLineupForm((value) => !value)}>+ SUBMIT LINEUP</button>
        </div>
      </div>

      <div className="strat-filters">
        <select aria-label="Utility type" value={utilityType} onChange={(event) => setUtilityType(event.target.value as UtilityType | "")}>
          <option value="">ALL UTILITY</option>
          {["SMOKE", "FLASH", "MOLOTOV", "HE"].map((item) => <option key={item}>{item}</option>)}
        </select>
      </div>

      {showRadarPreview && (
        <div className="strat-radar-container">
          <div className="strat-radar-header">
            <div>
              <strong>TACTICAL RADAR · {mapName.replace(/^de_/, "").toUpperCase()}</strong>
              <span>{lineups.length} pinned lineup{lineups.length === 1 ? "" : "s"} · {teamSide} SIDE</span>
            </div>
            <div className="strat-radar-legend">
              <span className="legend-item"><i style={{ background: utilityColors.SMOKE }} /> SMOKE</span>
              <span className="legend-item"><i style={{ background: utilityColors.FLASH }} /> FLASH</span>
              <span className="legend-item"><i style={{ background: utilityColors.MOLOTOV }} /> MOLOTOV</span>
              <span className="legend-item"><i style={{ background: utilityColors.HE }} /> HE</span>
            </div>
          </div>

          <div className="strat-radar-map-box">
            <span className="strat-site a">A</span>
            <span className="strat-site b">B</span>

            <svg className="strat-radar-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <marker id="radar-arrowhead" markerWidth="4" markerHeight="4" refX="2.5" refY="2" orient="auto">
                  <polygon points="0 0, 4 2, 0 4" fill="#c8f135" opacity="0.8" />
                </marker>
              </defs>
              {lineups.map((l) => {
                const isSelected = selectedRadarLineupId === l.id;
                const color = utilityColors[l.utilityType] ?? "#c8f135";
                return (
                  <g key={l.id}>
                    <line
                      x1={l.standX}
                      y1={l.standY}
                      x2={l.landX}
                      y2={l.landY}
                      stroke={color}
                      strokeWidth={isSelected ? "1.5" : "0.7"}
                      strokeDasharray={isSelected ? "none" : "2,2"}
                      opacity={isSelected ? "1" : "0.6"}
                      markerEnd="url(#radar-arrowhead)"
                    />
                    <circle
                      cx={l.standX}
                      cy={l.standY}
                      r={isSelected ? "2.2" : "1.4"}
                      fill="none"
                      stroke={color}
                      strokeWidth="0.8"
                      opacity={isSelected ? "1" : "0.7"}
                    />
                  </g>
                );
              })}
            </svg>

            {lineups.map((l) => {
              const isSelected = selectedRadarLineupId === l.id;
              const color = utilityColors[l.utilityType] ?? "#c8f135";
              const label = l.utilityType === "SMOKE" ? "SMK" : l.utilityType === "FLASH" ? "FLS" : l.utilityType === "MOLOTOV" ? "MOL" : "HE";
              return (
                <button
                  key={l.id}
                  className={`strat-radar-pin ${isSelected ? "selected" : ""}`}
                  style={{
                    left: `${l.landX}%`,
                    top: `${l.landY}%`,
                    borderColor: color,
                    color: isSelected ? "#111" : color,
                    backgroundColor: isSelected ? color : "#131917",
                  }}
                  onClick={() => setSelectedRadarLineupId(isSelected ? null : l.id)}
                  title={`${l.title} (${l.utilityType})`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {selectedRadarLineup && (
            <div className="strat-radar-selected-shelf">
              <div className="strat-radar-selected-info">
                <span className="strat-badge" style={{ borderColor: utilityColors[selectedRadarLineup.utilityType], color: utilityColors[selectedRadarLineup.utilityType] }}>
                  {selectedRadarLineup.utilityType}
                </span>
                <strong>{selectedRadarLineup.title}</strong>
                <small>
                  {selectedRadarLineup.throwType} · Stand ({selectedRadarLineup.standX}, {selectedRadarLineup.standY}) → Land ({selectedRadarLineup.landX}, {selectedRadarLineup.landY})
                </small>
              </div>
              <div className="strat-radar-selected-actions">
                {safeHttpUrl(selectedRadarLineup.videoUrl) && (
                  <button
                    type="button"
                    className="strat-video-action-btn"
                    onClick={() => setActiveVideoLineup(selectedRadarLineup)}
                  >
                    ▶ WATCH IN-APP VIDEO
                  </button>
                )}
                <button onClick={() => placeLineup(selectedRadarLineup)}>
                  + PLACE ON WHITEBOARD
                </button>
                <button
                  className="strat-radar-close-btn"
                  onClick={() => setSelectedRadarLineupId(null)}
                >
                  DESELECT ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="strat-lineups-grid">
        {lineups.map((lineup) => {
          const isSelected = selectedRadarLineupId === lineup.id;
          const color = utilityColors[lineup.utilityType] ?? "#c8f135";
          return (
            <article key={lineup.id} className={`strat-lineup-card ${isSelected ? "highlighted" : ""}`}>
              <div className="strat-lineup-card-header">
                <span className="strat-badge" style={{ borderColor: color, color }}>
                  {lineup.utilityType}
                </span>
                <span className="strat-lineup-throw">{lineup.throwType}</span>
                {lineup.isVerified ? (
                  <span className="strat-badge-verified">✓ VERIFIED</span>
                ) : (
                  <span className="strat-badge-pending">PENDING</span>
                )}
              </div>
              <strong>{lineup.title}</strong>
              <p className="strat-lineup-desc">{lineup.description || "No description provided."}</p>
              <div className="strat-lineup-coords">
                <span>Stand: ({lineup.standX}, {lineup.standY})</span>
                <span>Land: ({lineup.landX}, {lineup.landY})</span>
              </div>
              <div className="strat-lineup-card-actions">
                {safeHttpUrl(lineup.videoUrl) && (
                  <button
                    type="button"
                    className="strat-video-action-btn"
                    onClick={() => setActiveVideoLineup(lineup)}
                  >
                    ▶ WATCH VIDEO
                  </button>
                )}
                <button onClick={() => placeLineup(lineup)}>PLACE ON BOARD</button>
                {token && lineup.createdByUserId === user?.id && (
                  <button className="strat-delete-btn" onClick={() => removeLineup(lineup.id)}>
                    DELETE
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {lineups.length === 0 && <p className="strat-empty-note">No lineups found for these map and utility filters.</p>}

      {showLineupForm && (
        <form className="strat-lineup-form" onSubmit={submitNewLineup}>
          <input value={lineupDraft.title} onChange={(event) => setLineupDraft({ ...lineupDraft, title: event.target.value })} placeholder="Lineup title" required />
          <select value={lineupDraft.utilityType} onChange={(event) => setLineupDraft({ ...lineupDraft, utilityType: event.target.value as UtilityType })}>
            {["SMOKE", "FLASH", "MOLOTOV", "HE"].map((item) => <option key={item}>{item}</option>)}
          </select>
          <input value={lineupDraft.throwType} onChange={(event) => setLineupDraft({ ...lineupDraft, throwType: event.target.value })} placeholder="Throw type" required />
          {(["standX", "standY", "landX", "landY"] as const).map((field) => (
            <label key={field}>{field}
              <input type="number" min="0" max="100" step="0.1" value={lineupDraft[field]} onChange={(event) => setLineupDraft({ ...lineupDraft, [field]: Number(event.target.value) })} required />
            </label>
          ))}
          <input type="url" value={lineupDraft.videoUrl ?? ""} onChange={(event) => setLineupDraft({ ...lineupDraft, videoUrl: event.target.value })} placeholder="Video URL" />
          <textarea value={lineupDraft.description ?? ""} onChange={(event) => setLineupDraft({ ...lineupDraft, description: event.target.value })} placeholder="Description" />
          <button disabled={busy || !token}>SUBMIT LINEUP</button>
        </form>
      )}
    </section>}
    {tab === "tactics" && <section className="strat-list"><div className="panel-title"><span>PUBLIC TACTICS · {tactics.length}</span></div><form className="strat-code" onSubmit={(event) => { event.preventDefault(); void openTactic(tacticCode.trim()); }}><input value={tacticCode} onChange={(event) => setTacticCode(event.target.value)} placeholder="Tactic ID or share code" /><button>OPEN</button></form>{[...myTactics, ...tactics.filter((item) => !myTactics.some((mine) => mine.id === item.id))].map((item) => <button className="strat-tactic-row" key={item.id} onClick={() => openTactic(item.id)}><strong>{item.title}</strong><span>{item.mapName} · {item.teamSide}</span><small>{item.shareCode}</small></button>)}<div className="strat-pagination"><button disabled={tacticPage === 0} onClick={() => setTacticPage((page) => page - 1)}>PREVIOUS</button><span>PAGE {tacticPage + 1} / {Math.max(1, tacticTotalPages)}</span><button disabled={tacticPage + 1 >= tacticTotalPages} onClick={() => setTacticPage((page) => page + 1)}>NEXT</button></div>{tactic && <div className="strat-tactic-detail"><h3>{tactic.title}</h3><p>{tactic.description}</p><p>Share code: {tactic.shareCode}</p><button onClick={loadTactic} disabled={!room}>LOAD INTO ROOM</button>{token && tactic.authorUserId === user?.id && <><input value={tactic.title} onChange={(event) => setTactic({ ...tactic, title: event.target.value })} aria-label="Tactic title" /><textarea value={tactic.description ?? ""} onChange={(event) => setTactic({ ...tactic, description: event.target.value })} aria-label="Tactic description" /><button onClick={saveChanges}>SAVE CHANGES</button><button onClick={removeTactic}>DELETE TACTIC</button></>}</div>}</section>}

    {/* In-App Video Modal Dialog */}
    {activeVideoLineup && (
      <div className="strat-video-modal-backdrop" onClick={() => setActiveVideoLineup(null)}>
        <div className="strat-video-modal-dialog" onClick={(e) => e.stopPropagation()}>
          <div className="strat-video-modal-header">
            <div className="strat-video-modal-title-group">
              <div className="strat-badge-row">
                <span className="strat-badge" style={{ borderColor: utilityColors[activeVideoLineup.utilityType], color: utilityColors[activeVideoLineup.utilityType] }}>
                  {activeVideoLineup.utilityType}
                </span>
                <span className="strat-badge map">{activeVideoLineup.mapName.replace(/^de_/, "").toUpperCase()}</span>
                <span className="strat-badge team">{activeVideoLineup.teamSide} SIDE</span>
                <span className="strat-badge throw">{activeVideoLineup.throwType}</span>
              </div>
              <h3>{activeVideoLineup.title}</h3>
            </div>
            <button
              className="strat-modal-close-btn"
              onClick={() => setActiveVideoLineup(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>

          <div className="strat-video-modal-body">
            {activeVideoLineup.videoUrl ? (
              <div className="strat-modal-player-wrap">
                <ClipPlayer
                  videoUrl={activeVideoLineup.videoUrl}
                  title={activeVideoLineup.title}
                  mapName={activeVideoLineup.mapName}
                  autoplay={true}
                />
              </div>
            ) : (
              <div className="strat-no-video">No video embed available for this lineup.</div>
            )}

            <div className="strat-modal-meta">
              <div className="strat-coords-chips">
                <span>Stand Position: <strong>X: {activeVideoLineup.standX} · Y: {activeVideoLineup.standY}</strong></span>
                <span>Landing Target: <strong>X: {activeVideoLineup.landX} · Y: {activeVideoLineup.landY}</strong></span>
              </div>
              {activeVideoLineup.description && (
                <p className="strat-modal-desc">{activeVideoLineup.description}</p>
              )}
            </div>
          </div>

          <div className="strat-video-modal-footer">
            <button
              className="strat-modal-place-btn"
              onClick={() => {
                placeLineup(activeVideoLineup);
                setActiveVideoLineup(null);
              }}
            >
              + PLACE ON WHITEBOARD CANVAS
            </button>
            {safeHttpUrl(activeVideoLineup.videoUrl) && (
              <a
                href={safeHttpUrl(activeVideoLineup.videoUrl) ?? undefined}
                target="_blank"
                rel="noopener noreferrer"
                className="strat-modal-ext-link"
              >
                OPEN LINK ↗
              </a>
            )}
            <button
              className="strat-modal-cancel-btn"
              onClick={() => setActiveVideoLineup(null)}
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    )}
  </div>;
}
