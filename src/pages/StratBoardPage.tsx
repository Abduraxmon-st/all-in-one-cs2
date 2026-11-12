import { useEffect, useMemo, useRef, useState, type FormEvent, type MouseEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import {
  createRoom,
  deleteLineup,
  deleteTactic,
  getLineups,
  getMyTactics,
  getRoom,
  getTactic,
  getTactics,
  loadTacticIntoRoom,
  saveRoomTactic,
  submitLineup,
  updateTactic,
} from "../features/stratboard/api";
import { connectRoom } from "../features/stratboard/realtime";
import type {
  BoardEvent,
  CanvasElement,
  CreateLineupRequest,
  RoomParticipant,
  RoomSnapshot,
  TacticDetail,
  TacticSummary,
  TeamSide,
  UtilityLineup,
  UtilityType,
} from "../features/stratboard/types";
import { getRadarSources } from "../features/stratboard/radarMapUrls";
import { fallbackLineups } from "../features/stratboard/fallbackLineups";
import { fallbackTactics, type ProTacticPlaybook } from "../features/stratboard/fallbackTactics";
import ClipPlayer from "../components/ClipPlayer";
import Icon, { type IconName } from "../components/Icon";
import LineupDualThumbnail from "../components/LineupDualThumbnail";
import RadarMapLayer from "../components/RadarMapLayer";
import LineupDetailModal from "../components/LineupDetailModal";
import { navigate, routeHref } from "../routes";
import "./StratBoardPage.css";


const MAP_CALLOUTS: Record<string, { name: string; x: number; y: number }[]> = {
  mirage: [
    { name: "A Site", x: 71, y: 42 },
    { name: "B Site", x: 26, y: 34 },
    { name: "Window", x: 50, y: 45 },
    { name: "Top Mid", x: 42, y: 60 },
    { name: "Connector", x: 56, y: 52 },
    { name: "Stairs", x: 62, y: 46 },
    { name: "Jungle", x: 56, y: 38 },
    { name: "Palace", x: 79, y: 47 },
    { name: "A Ramp", x: 68, y: 66 },
    { name: "B Apts", x: 22, y: 58 },
    { name: "T Spawn", x: 45, y: 88 },
    { name: "CT Spawn", x: 66, y: 28 },
    { name: "Catwalk", x: 38, y: 46 },
    { name: "Underpass", x: 46, y: 56 },
  ],
  inferno: [
    { name: "A Site", x: 68, y: 38 },
    { name: "B Site", x: 24, y: 38 },
    { name: "Banana", x: 32, y: 68 },
    { name: "Coffin", x: 20, y: 30 },
    { name: "CT Spawn", x: 30, y: 18 },
    { name: "Pit", x: 76, y: 35 },
    { name: "Apps", x: 58, y: 45 },
    { name: "Mid", x: 52, y: 62 },
    { name: "T Spawn", x: 46, y: 90 },
  ],
  dust2: [
    { name: "A Site", x: 76, y: 32 },
    { name: "B Site", x: 22, y: 26 },
    { name: "Long A", x: 82, y: 55 },
    { name: "Catwalk", x: 62, y: 36 },
    { name: "Mid Doors", x: 48, y: 46 },
    { name: "Xbox", x: 46, y: 52 },
    { name: "T Spawn", x: 44, y: 88 },
    { name: "CT Spawn", x: 52, y: 28 },
    { name: "Tunnels", x: 26, y: 46 },
  ],
  nuke: [
    { name: "A Site", x: 50, y: 46 },
    { name: "B Site", x: 50, y: 62 },
    { name: "Ramp", x: 68, y: 56 },
    { name: "Hut", x: 44, y: 50 },
    { name: "Outside", x: 30, y: 44 },
    { name: "Garage", x: 24, y: 36 },
    { name: "Lobby", x: 50, y: 74 },
    { name: "T Spawn", x: 50, y: 88 },
    { name: "CT Spawn", x: 48, y: 24 },
  ],
  ancient: [
    { name: "A Site", x: 68, y: 42 },
    { name: "B Site", x: 30, y: 44 },
    { name: "Mid", x: 48, y: 52 },
    { name: "Donut", x: 58, y: 46 },
    { name: "Cheetah", x: 36, y: 52 },
    { name: "Red Room", x: 46, y: 38 },
    { name: "T Spawn", x: 48, y: 86 },
    { name: "CT Spawn", x: 50, y: 24 },
  ],
  anubis: [
    { name: "A Site", x: 70, y: 36 },
    { name: "B Site", x: 26, y: 40 },
    { name: "Mid", x: 48, y: 46 },
    { name: "Canal", x: 44, y: 64 },
    { name: "Bridge", x: 48, y: 44 },
    { name: "Ruins", x: 32, y: 56 },
    { name: "T Spawn", x: 48, y: 88 },
    { name: "CT Spawn", x: 52, y: 22 },
  ],
  overpass: [
    { name: "A Site", x: 62, y: 44 },
    { name: "B Site", x: 38, y: 34 },
    { name: "Monster", x: 34, y: 52 },
    { name: "Bathrooms", x: 56, y: 54 },
    { name: "Fountain", x: 52, y: 68 },
    { name: "T Spawn", x: 50, y: 86 },
  ],
  train: [
    { name: "A Site", x: 52, y: 48 },
    { name: "B Site", x: 38, y: 58 },
    { name: "Ivy", x: 74, y: 44 },
    { name: "Pop Dog", x: 48, y: 54 },
    { name: "Z Connector", x: 46, y: 48 },
    { name: "T Spawn", x: 48, y: 85 },
  ],
  vertigo: [
    { name: "A Site", x: 62, y: 46 },
    { name: "B Site", x: 28, y: 44 },
    { name: "A Ramp", x: 60, y: 64 },
    { name: "Mid", x: 48, y: 56 },
    { name: "Generator", x: 46, y: 48 },
    { name: "T Spawn", x: 48, y: 82 },
  ]
};

const CS2_MAP_OPTIONS = [
  { id: "de_mirage", name: "MIRAGE" },
  { id: "de_inferno", name: "INFERNO" },
  { id: "de_dust2", name: "DUST II" },
  { id: "de_nuke", name: "NUKE" },
  { id: "de_ancient", name: "ANCIENT" },
  { id: "de_anubis", name: "ANUBIS" },
  { id: "de_overpass", name: "OVERPASS" },
  { id: "de_train", name: "TRAIN" },
  { id: "de_vertigo", name: "VERTIGO" },
];

function formatRouteTitle(title: string): string {
  if (!title) return "Tactical Lineup";
  if (title.includes("→") || title.includes("->")) return title.replace("->", "→");
  const fromMatch = title.match(/^(.*?)(?:\s+(?:Smoke|Molotov|Flash|HE|Nade|Popflash))?\s+from\s+(.*?)$/i);
  if (fromMatch) {
    const to = fromMatch[1].replace(/\s+(Smoke|Molotov|Flash|HE|Grenade|Popflash)$/i, "").trim();
    const from = fromMatch[2].trim();
    return `${from} → ${to}`;
  }
  const toMatch = title.match(/^(.*?)\s+to\s+(.*?)$/i);
  if (toMatch) {
    return `${toMatch[1].trim()} → ${toMatch[2].trim()}`;
  }
  return title;
}

type Props = { notify: (message: string) => void; roomCodeFromRoute?: string };
type Tab = "board" | "lineups" | "tactics";
type Tool = "SELECT" | "ARROW" | "SMOKE" | "FLASH" | "MOLOTOV" | "HE" | "PLAYER";
const maps = ["de_inferno", "de_mirage", "de_dust2", "de_nuke", "de_ancient", "de_anubis", "de_train", "de_vertigo", "de_overpass"];

function normalizeMap(name: string): string {
  const clean = (name || "").toLowerCase().replace(/^de_/, "");
  return `de_${clean}`;
}

const initialLineup: CreateLineupRequest = {
  mapName: "de_inferno",
  utilityType: "SMOKE",
  teamSide: "T",
  title: "",
  throwType: "Jumpthrow",
  standX: 50,
  standY: 50,
  landX: 50,
  landY: 50,
  videoUrl: "",
  description: "",
};

const utilityColors: Record<UtilityType, string> = {
  SMOKE: "#c8f135",
  FLASH: "#facc15",
  MOLOTOV: "#f97316",
  HE: "#ef4444",
};

function safeHttpUrl(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

function applyEvent(room: RoomSnapshot, event: BoardEvent): RoomSnapshot {
  switch (event.eventType) {
    case "PARTICIPANT_JOIN":
      return {
        ...room,
        participants: [
          ...room.participants.filter((p) => p.participantId !== event.participantId),
          event.participant,
        ],
      };
    case "PARTICIPANT_LEAVE":
      return {
        ...room,
        participants: room.participants.filter((p) => p.participantId !== event.participantId),
      };
    case "ELEMENT_UPSERT":
      return {
        ...room,
        canvasElements: [
          ...room.canvasElements.filter((e) => e.elementId !== event.element.elementId),
          event.element,
        ],
      };
    case "ELEMENT_DELETE":
      return {
        ...room,
        canvasElements: room.canvasElements.filter((e) => e.elementId !== event.elementId),
      };
    case "BOARD_CLEAR":
      return { ...room, canvasElements: [] };
    case "MAP_CHANGE":
      return { ...room, mapName: event.mapName, teamSide: event.teamSide, canvasElements: [] };
    default:
      return room;
  }
}

export default function StratBoardPage({ notify, roomCodeFromRoute }: Props) {
  const { token, user } = useAuth();
  const [tab, setTab] = useState<Tab>("board");
  const [mapName, setMapName] = useState("de_mirage");
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

  // Instant Fallback Lineups (0ms resilience)
  const cleanMap = mapName.toLowerCase().replace(/^de_/, "");
  const [lineups, setLineups] = useState<UtilityLineup[]>(() =>
    fallbackLineups.filter((l) => l.mapName.toLowerCase().replace(/^de_/, "") === "mirage")
  );

  const [utilityType, setUtilityType] = useState<UtilityType | "">("");
  const [lineupDraft, setLineupDraft] = useState<CreateLineupRequest>(initialLineup);
  const [showLineupForm, setShowLineupForm] = useState(false);
  const [activeVideoLineup, setActiveVideoLineup] = useState<UtilityLineup | null>(null);
  const [showRadarPreview, setShowRadarPreview] = useState(true);
  const [selectedRadarLineupId, setSelectedRadarLineupId] = useState<string | null>(null);
  const [hoveredRadarLineupId, setHoveredRadarLineupId] = useState<string | null>(null);

  // CS2NADES 2-Column Filters & Controls
  const [lineupSideFilter, setLineupSideFilter] = useState<"T" | "CT" | "PRO" | "ALL">("ALL");
  const [lineupUtility, setLineupUtility] = useState<UtilityType | "ALL">("SMOKE");
  const [radarZoom, setRadarZoom] = useState(1);

  // Board tab interactive csnades.gg nade pins & trajectory lines
  const [showBoardNades, setShowBoardNades] = useState(true);
  const [activeBoardLineupId, setActiveBoardLineupId] = useState<string | null>(null);

  // CSNADES Target Clustering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetCallout, setSelectedTargetCallout] = useState<string | null>(null);
  const [selectedDetailLineup, setSelectedDetailLineup] = useState<UtilityLineup | null>(null);
  const [showCallouts, setShowCallouts] = useState(true);
  const [isSimpleRadar, setIsSimpleRadar] = useState(false);
  const [showCommunityNades, setShowCommunityNades] = useState(true);
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [favouriteIds, setFavouriteIds] = useState<Set<string>>(() => new Set());

  // Tactics
  const [tactics, setTactics] = useState<TacticSummary[]>(() =>
    fallbackTactics.filter(
      (t) => t.mapName.toLowerCase().replace(/^de_/, "") === "mirage" && t.teamSide === "T"
    )
  );
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

  useEffect(() => {
    if (user?.username) setDisplayName(user.username);
  }, [user?.username]);

  useEffect(() => {
    if (!roomCodeFromRoute || room?.roomCode === roomCodeFromRoute) return;
    let active = true;
    getRoom(roomCodeFromRoute)
      .then((snapshot) => {
        if (!active) return;
        setRoom(snapshot);
        setMapName(normalizeMap(snapshot.mapName));
        setTeamSide(snapshot.teamSide);
        setParticipant({
          participantId: `guest-${crypto.randomUUID()}`,
          displayName: user?.username ?? displayName,
          colorHex: "#C8F135",
          userId: user?.id ?? null,
          isHost: false,
        });
        setTab("board");
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Could not join room.");
      });
    return () => {
      active = false;
    };
  }, [roomCodeFromRoute]);

  useEffect(() => {
    if (!room || !participant) return;
    const conn = connectRoom({
      roomCode: room.roomCode,
      participant,
      token: token || undefined,
      onStatus: setConnection,
      onEvent: (event) => {
        if (event.eventType === "CURSOR_MOVE")
          setCursors((current) => ({ ...current, [event.participantId]: event.cursor }));
        else if (event.eventType === "LOAD_TACTIC")
          getRoom(room.roomCode).then(setRoom).catch(() => {});
        else setRoom((current) => (current ? applyEvent(current, event) : current));
      },
    });
    socket.current = conn;
    return () => {
      conn.disconnect();
      if (socket.current === conn) socket.current = null;
    };
  }, [room?.roomCode, participant?.participantId, token]);

  // Lineups Loading: 0ms Instant Fallback + Seamless Live Merge (All sides for current map)
  useEffect(() => {
    const clean = mapName.toLowerCase().replace(/^de_/, "");
    const fallbackMatches = fallbackLineups.filter(
      (l) => l.mapName.toLowerCase().replace(/^de_/, "") === clean
    );

    if (fallbackMatches.length > 0) {
      setLineups(fallbackMatches);
    }

    const controller = new AbortController();
    getLineups(
      { mapName: normalizeMap(mapName) },
      controller.signal
    )
      .then((data) => {
        if (!controller.signal.aborted && data && data.length > 0) {
          const liveIds = new Set(data.map((d) => d.id));
          const merged = [
            ...data,
            ...fallbackMatches.filter((f) => !liveIds.has(f.id)),
          ];
          setLineups(merged);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("Using fallback lineups during network cold start:", cause);
        }
      });

    return () => controller.abort();
  }, [tab, mapName]);

  useEffect(() => {
    if (tab !== "tactics") return;
    const controller = new AbortController();
    const cleanCurrentMap = normalizeMap(mapName).toLowerCase().replace(/^de_/, "");
    // Pre-populate with fallback tactics immediately for instant 0ms rendering
    const fallbackMatches = fallbackTactics.filter(
      (t) => t.mapName.toLowerCase().replace(/^de_/, "") === cleanCurrentMap && t.teamSide === teamSide
    );
    if (fallbackMatches.length > 0) {
      setTactics(fallbackMatches);
      setTacticTotalPages(1);
    }

    getTactics(
      { mapName: normalizeMap(mapName), teamSide, page: tacticPage, size: 20 },
      controller.signal
    )
      .then((data) => {
        if (data && data.content && data.content.length > 0) {
          setTactics(data.content);
          setTacticTotalPages(data.totalPages);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("Using fallback tactics during network cold start:", cause);
        }
      });
    if (token) getMyTactics(token).then(setMyTactics).catch(() => setMyTactics([]));
    else setMyTactics([]);
    return () => controller.abort();
  }, [tab, mapName, teamSide, token, tacticPage]);

  function publish(event: BoardEvent) {
    if (!room || !socket.current?.publish(event)) {
      setError("Room is not connected.");
      return;
    }
    if (event.eventType !== "CURSOR_MOVE")
      setRoom((current) => (current ? applyEvent(current, event) : current));
  }

  async function create() {
    setBusy(true);
    setError("");
    try {
      const snapshot = await createRoom(
        {
          mapName: normalizeMap(mapName),
          teamSide,
          hostDisplayName: displayName.trim() || "Guest",
          hostColorHex: "#C8F135",
        },
        token || undefined
      );
      setRoom(snapshot);
      setParticipant(
        snapshot.participants.find((p) => p.participantId === snapshot.hostParticipantId) ?? {
          participantId: snapshot.hostParticipantId,
          displayName,
          colorHex: "#C8F135",
          userId: user?.id ?? null,
          isHost: true,
        }
      );
      navigate(`/strat-board/${snapshot.roomCode}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not create room.");
    } finally {
      setBusy(false);
    }
  }

  async function join() {
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setBusy(true);
    setError("");
    try {
      const snapshot = await getRoom(code);
      setRoom(snapshot);
      setMapName(normalizeMap(snapshot.mapName));
      setTeamSide(snapshot.teamSide);
      setParticipant({
        participantId: `guest-${crypto.randomUUID()}`,
        displayName: displayName.trim() || "Guest",
        colorHex: "#C8F135",
        userId: user?.id ?? null,
        isHost: false,
      });
      navigate(`/strat-board/${code}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not join room.");
    } finally {
      setBusy(false);
    }
  }

  function point(event: MouseEvent<HTMLDivElement>) {
    if (!room || !participant) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    if (tool === "SELECT") return;
    if (tool === "ARROW" && !arrowStart) {
      setArrowStart({ x, y });
      return;
    }
    const element: CanvasElement =
      tool === "ARROW"
        ? {
            elementId: crypto.randomUUID(),
            elementType: "ARROW",
            x: arrowStart!.x,
            y: arrowStart!.y,
            endX: x,
            endY: y,
            colorHex: "#FF7A28",
            createdByParticipantId: participant.participantId,
          }
        : {
            elementId: crypto.randomUUID(),
            elementType: tool === "PLAYER" ? "PLAYER_TOKEN" : "UTILITY_PIN",
            x,
            y,
            label: tool === "PLAYER" ? teamSide : tool,
            text: tool === "PLAYER" ? `${teamSide} Operator` : undefined,
            colorHex:
              tool === "PLAYER"
                ? teamSide === "CT"
                  ? "#38bdf8"
                  : "#fbbf24"
                : utilityColors[tool as UtilityType] ?? "#C8F135",
            createdByParticipantId: participant.participantId,
          };
    publish({ eventType: "ELEMENT_UPSERT", participantId: participant.participantId, element });
    setArrowStart(null);
  }

  function moveCursor(event: MouseEvent<HTMLDivElement>) {
    if (!room || !participant || Date.now() - lastCursorAt.current < 100) return;
    lastCursorAt.current = Date.now();
    const rect = event.currentTarget.getBoundingClientRect();
    socket.current?.publish({
      eventType: "CURSOR_MOVE",
      participantId: participant.participantId,
      cursor: {
        x: ((event.clientX - rect.left) / rect.width) * 100,
        y: ((event.clientY - rect.top) / rect.height) * 100,
      },
    });
  }

  function changeMap(nextMap: string, nextSide: TeamSide) {
    const norm = normalizeMap(nextMap);
    setMapName(norm);
    setTeamSide(nextSide);
    setArrowStart(null);
    setTacticPage(0);
    setSelectedTargetCallout(null);
    setSelectedRadarLineupId(null);
    setHoveredRadarLineupId(null);
    setSelectedRadarLineupId(null);
    setHoveredRadarLineupId(null);
    setActiveBoardLineupId(null);
    if (room && participant)
      publish({
        eventType: "MAP_CHANGE",
        participantId: participant.participantId,
        mapName: norm,
        teamSide: nextSide,
      });
  }

  async function saveRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !room) {
      setError("Sign in and create a room before saving.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const saved = await saveRoomTactic(
        room.roomCode,
        { title: saveTitle.trim(), description: saveDescription.trim(), isPublic },
        token
      );
      setTactic(saved);
      notify(`Tactic saved: ${saved.shareCode}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save tactic.");
    } finally {
      setBusy(false);
    }
  }

  async function openTactic(code: string) {
    setError("");
    const trimmed = code.trim().toLowerCase();
    const localMatch = fallbackTactics.find(
      (t) => t.id.toLowerCase() === trimmed || t.shareCode.toLowerCase() === trimmed
    );
    if (localMatch) {
      setTactic(localMatch);
      setTab("tactics");
      return;
    }
    try {
      setTactic(await getTactic(code, token || undefined));
      setTab("tactics");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load tactic.");
    }
  }

  function loadTacticOntoBoard(targetTactic: TacticSummary | ProTacticPlaybook | TacticDetail) {
    const foundPlaybook = fallbackTactics.find(
      (t) => t.id === targetTactic.id || t.shareCode === targetTactic.shareCode
    );
    let elements: CanvasElement[] = [];
    if (foundPlaybook?.parsedElements && foundPlaybook.parsedElements.length > 0) {
      elements = foundPlaybook.parsedElements;
    } else if ("canvasStateJson" in targetTactic && targetTactic.canvasStateJson) {
      try {
        const parsed = JSON.parse(targetTactic.canvasStateJson);
        elements = Array.isArray(parsed) ? parsed : (parsed.elements || []);
      } catch {
        elements = [];
      }
    }

    const norm = normalizeMap(targetTactic.mapName);
    setMapName(norm);
    setTeamSide(targetTactic.teamSide);

    if (room) {
      setRoom((cur) =>
        cur
          ? {
              ...cur,
              mapName: norm,
              teamSide: targetTactic.teamSide,
              canvasElements: elements,
            }
          : cur
      );
    } else {
      const localRoom: RoomSnapshot = {
        roomCode: "LOCAL-BOARD",
        mapName: norm,
        teamSide: targetTactic.teamSide,
        hostUserId: user?.id ?? null,
        hostParticipantId: "local-user",
        participants: [
          {
            participantId: "local-user",
            displayName: displayName || "Commander",
            colorHex: "#C8F135",
            userId: user?.id ?? null,
            isHost: true,
          },
        ],
        canvasElements: elements,
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      setRoom(localRoom);
      setParticipant(localRoom.participants[0]);
    }
    setTab("board");
    notify(`Loaded tactic: "${targetTactic.title}" onto whiteboard!`);
  }

  async function loadTactic() {
    if (!tactic) return;
    if (room && room.roomCode !== "LOCAL-BOARD") {
      try {
        setRoom(await loadTacticIntoRoom(room.roomCode, tactic.id, token || undefined));
        setTab("board");
        return;
      } catch {
        // Fall back to direct loading into room snapshot
      }
    }
    loadTacticOntoBoard(tactic);
  }

  async function saveChanges() {
    if (!tactic || !token) return;
    try {
      setTactic(
        await updateTactic(
          tactic.id,
          {
            title: tactic.title,
            mapName: tactic.mapName,
            teamSide: tactic.teamSide,
            description: tactic.description ?? "",
            canvasStateJson: tactic.canvasStateJson,
            isPublic: tactic.isPublic,
          },
          token
        )
      );
      notify("Tactic updated");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update tactic.");
    }
  }

  async function removeTactic() {
    if (!tactic || !token || !window.confirm("Delete this tactic?")) return;
    try {
      await deleteTactic(tactic.id, token);
      setTactic(null);
      setMyTactics((current) => current.filter((item) => item.id !== tactic.id));
      notify("Tactic deleted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete tactic.");
    }
  }

  async function submitNewLineup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("Sign in to submit a lineup.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await submitLineup(
        { ...lineupDraft, mapName: normalizeMap(mapName), teamSide },
        token
      );
      setLineups((current) => [created, ...current]);
      setShowLineupForm(false);
      notify("Lineup submitted for review");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not submit lineup.");
    } finally {
      setBusy(false);
    }
  }

  async function removeLineup(id: string) {
    if (!token || !window.confirm("Delete this lineup?")) return;
    try {
      await deleteLineup(id, token);
      setLineups((current) => current.filter((item) => item.id !== id));
      notify("Lineup deleted");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete lineup.");
    }
  }

  async function placeLineup(lineup: UtilityLineup) {
    if (!room || !participant) {
      setBusy(true);
      try {
        const snapshot = await createRoom(
          {
            mapName: normalizeMap(lineup.mapName),
            teamSide: lineup.teamSide,
            hostDisplayName: displayName.trim() || "Guest",
            hostColorHex: "#C8F135",
          },
          token || undefined
        );
        setRoom(snapshot);
        const hostPart = snapshot.participants.find(
          (p) => p.participantId === snapshot.hostParticipantId
        ) ?? {
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

  // Map lineup counts across all maps
  const mapLineupCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const l of fallbackLineups) {
      const clean = l.mapName.toLowerCase().replace(/^de_/, "");
      counts[clean] = (counts[clean] || 0) + 1;
    }
    return counts;
  }, []);

  const mapLineups = useMemo(() => {
    const clean = mapName.toLowerCase().replace(/^de_/, "");
    return lineups.filter((l) => l.mapName.toLowerCase().replace(/^de_/, "") === clean);
  }, [lineups, mapName]);

  const utilCounts = useMemo(() => {
    const counts = { SMOKE: 0, MOLOTOV: 0, FLASH: 0, HE: 0, COMBOS: 0 };
    for (const l of mapLineups) {
      if (l.utilityType === "SMOKE") counts.SMOKE++;
      else if (l.utilityType === "MOLOTOV") counts.MOLOTOV++;
      else if (l.utilityType === "FLASH") counts.FLASH++;
      else if (l.utilityType === "HE") counts.HE++;
    }
    counts.COMBOS = Math.max(4, Math.floor(counts.SMOKE / 6));
    return counts;
  }, [mapLineups]);

  const filteredLineups = useMemo(() => {
    return mapLineups.filter((l) => {
      if (lineupSideFilter === "T" && l.teamSide !== "T") return false;
      if (lineupSideFilter === "CT" && l.teamSide !== "CT") return false;
      if (lineupSideFilter === "PRO" && !l.isVerified && !l.isPro) return false;
      if (lineupUtility !== "ALL" && l.utilityType !== lineupUtility) return false;
      if (recommendedOnly && !l.isVerified && !l.isPro) return false;
      if (favouritesOnly && !favouriteIds.has(l.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = (l.title || "").toLowerCase().includes(q);
        const matchTo = (l.toCallout || "").toLowerCase().includes(q);
        const matchFrom = (l.fromCallout || "").toLowerCase().includes(q);
        const matchDesc = (l.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchTo && !matchFrom && !matchDesc) return false;
      }
      return true;
    });
  }, [mapLineups, lineupSideFilter, lineupUtility, recommendedOnly, favouritesOnly, favouriteIds, searchQuery]);

  // Target Pin Clustering
  interface TargetCluster {
    toCallout: string;
    landX: number;
    landY: number;
    utilityType: UtilityType;
    teamSide: TeamSide;
    count: number;
    lineups: UtilityLineup[];
  }

  const targetClusters = useMemo(() => {
    const map = new Map<string, UtilityLineup[]>();
    for (const l of filteredLineups) {
      const key = l.toCallout || l.title || `${l.landX.toFixed(1)},${l.landY.toFixed(1)}`;
      const list = map.get(key) || [];
      list.push(l);
      map.set(key, list);
    }
    const clusters: TargetCluster[] = [];
    map.forEach((clusterLineups, key) => {
      const first = clusterLineups[0];
      clusters.push({
        toCallout: key,
        landX: first.landX,
        landY: first.landY,
        utilityType: first.utilityType,
        teamSide: first.teamSide,
        count: clusterLineups.length,
        lineups: clusterLineups,
      });
    });
    return clusters;
  }, [filteredLineups]);

  const activeTargetCluster = useMemo(() => {
    if (!selectedTargetCallout) return null;
    return targetClusters.find((c) => c.toCallout === selectedTargetCallout) || null;
  }, [targetClusters, selectedTargetCallout]);

  const displayedLineups = useMemo(() => {
    if (!selectedTargetCallout) return filteredLineups;
    return filteredLineups.filter(
      (l) => (l.toCallout || l.title || `${l.landX.toFixed(1)},${l.landY.toFixed(1)}`) === selectedTargetCallout
    );
  }, [filteredLineups, selectedTargetCallout]);

  const editorsChoice = displayedLineups.slice(0, 3);
  const popularLineups = displayedLineups.slice(3);
  const activeRadarLineup =
    displayedLineups.find((l) => l.id === (hoveredRadarLineupId ?? selectedRadarLineupId)) ??
    displayedLineups[0] ??
    null;
  const activeBoardLineup = lineups.find((l) => l.id === activeBoardLineupId) ?? null;

  return (
    <div className="feature-page strat-api-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">LIVE TACTICAL ROOMS & CSNADES DATABASE</p>
          <h2>Strat Board</h2>
          <p>
            Create a live tactical room, draw architectural routes with teammates, inspect high-contrast radar maps, and browse verified CS2 utility lineups.
          </p>
        </div>
      </div>

      <div className="strat-tabs">
        {(["board", "lineups", "tactics"] as Tab[]).map((item) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            onClick={() => setTab(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {error && (
        <p className="strat-error" role="alert">
          {error}
        </p>
      )}

      <div className="strat-filters">
        <select
          aria-label="Map"
          value={normalizeMap(mapName)}
          onChange={(event) => changeMap(event.target.value, teamSide)}
        >
          {maps.map((item) => (
            <option key={item} value={item}>
              {item.replace(/^de_/, "").toUpperCase()}
            </option>
          ))}
        </select>
        <select
          aria-label="Team side"
          value={teamSide}
          onChange={(event) => changeMap(mapName, event.target.value as TeamSide)}
        >
          <option value="T">T SIDE</option>
          <option value="CT">CT SIDE</option>
        </select>
      </div>

      {/* BOARD TAB */}
      {tab === "board" && (
        <>
          <div className="strat-room-bar">
            <input
              aria-label="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Your name"
            />
            <button disabled={busy} onClick={create}>
              CREATE ROOM
            </button>
            <input
              aria-label="Room code"
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Room code"
            />
            <button disabled={busy} onClick={join}>
              JOIN ROOM
            </button>
          </div>

          {room && (
            <div className="strat-room-meta">
              <strong>ROOM {room.roomCode}</strong>
              <span>{connection.toUpperCase()}</span>
              <button
                onClick={() =>
                  navigator.clipboard
                    .writeText(`${window.location.origin}${routeHref(`/strat-board/${room.roomCode}`)}`)
                    .then(() => notify("Invite link copied"))
                    .catch(() => notify("Could not copy invite"))
                }
              >
                COPY INVITE LINK
              </button>
              <button
                onClick={() => {
                  setRoom(null);
                  setParticipant(null);
                  setCursors({});
                  navigate("/strat-board");
                }}
              >
                LEAVE ROOM
              </button>
            </div>
          )}

          <div className="strat-tools">
            <button
              className={tool === "SELECT" ? "active" : ""}
              onClick={() => {
                setTool("SELECT");
                setArrowStart(null);
              }}
              title="Select / Move Token"
            >
              <Icon name="select" size={14} /> SELECT
            </button>
            <button
              className={tool === "ARROW" ? "active" : ""}
              onClick={() => {
                setTool("ARROW");
                setArrowStart(null);
              }}
              title="Draw Strategy Arrow"
            >
              <Icon name="arrow" size={14} /> ARROW
            </button>
            <button
              className={tool === "SMOKE" ? "active" : ""}
              onClick={() => {
                setTool("SMOKE");
                setArrowStart(null);
              }}
              title="Place Smoke Grenade"
            >
              <Icon name="smoke" size={14} /> SMOKE
            </button>
            <button
              className={tool === "FLASH" ? "active" : ""}
              onClick={() => {
                setTool("FLASH");
                setArrowStart(null);
              }}
              title="Place Flashbang"
            >
              <Icon name="flash" size={14} /> FLASH
            </button>
            <button
              className={tool === "MOLOTOV" ? "active" : ""}
              onClick={() => {
                setTool("MOLOTOV");
                setArrowStart(null);
              }}
              title="Place Molotov / Incendiary"
            >
              <Icon name="molotov" size={14} /> MOLOTOV
            </button>
            <button
              className={tool === "HE" ? "active" : ""}
              onClick={() => {
                setTool("HE");
                setArrowStart(null);
              }}
              title="Place HE Frag Grenade"
            >
              <Icon name="he" size={14} /> HE
            </button>
            <button
              className={tool === "PLAYER" ? "active" : ""}
              onClick={() => {
                setTool("PLAYER");
                setArrowStart(null);
              }}
              title={`Place ${teamSide} Operator Token`}
            >
              <Icon name={teamSide === "CT" ? "ct" : "t"} size={14} /> {teamSide} PLAYER
            </button>
            <button
              type="button"
              className={showBoardNades ? "active" : ""}
              onClick={() => {
                setShowBoardNades((v) => !v);
                setActiveBoardLineupId(null);
              }}
              title="Toggle csnades.gg Lineup Pins on Whiteboard"
            >
              <Icon name="target" size={14} /> {showBoardNades ? "HIDE NADES" : "SHOW NADES"}
            </button>
            <button
              onClick={() => {
                const last = room?.canvasElements.at(-1);
                if (last && participant)
                  publish({
                    eventType: "ELEMENT_DELETE",
                    participantId: participant.participantId,
                    elementId: last.elementId,
                  });
              }}
              title="Undo last element"
            >
              <Icon name="undo" size={14} /> UNDO
            </button>
            <button
              onClick={() => {
                if (participant && window.confirm("Clear all tactical elements on the whiteboard?"))
                  publish({
                    eventType: "BOARD_CLEAR",
                    participantId: participant.participantId,
                  });
              }}
              title="Clear Board Canvas"
            >
              <Icon name="trash" size={14} /> CLEAR
            </button>
          </div>

          <div className="strat-workspace">
            <div className="strat-canvas">
              <div
                className="strat-board-stage"
                onClick={point}
                onMouseMove={moveCursor}
                role="presentation"
              >
                <RadarMapLayer mapName={mapName} />
              

              {/* Interactive csnades.gg Trajectory on Whiteboard */}
              {showBoardNades && (
                <svg className="strat-board-nades-svg" viewBox="0 0 100 100">
                  <defs>
                    <marker id="board-marker-smoke" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#c8f135" />
                    </marker>
                    <marker id="board-marker-flash" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#facc15" />
                    </marker>
                    <marker id="board-marker-molotov" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#f97316" />
                    </marker>
                    <marker id="board-marker-he" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#ef4444" />
                    </marker>
                  </defs>
                  {lineups.map((l) => {
                    const isActive = activeBoardLineupId === l.id;
                    if (!isActive) return null;
                    const color = utilityColors[l.utilityType] ?? "#c8f135";
                    const markerId = `board-marker-${l.utilityType.toLowerCase()}`;
                    return (
                      <g key={`traj-${l.id}`} className="strat-radar-lineup-path active">
                        <circle cx={l.standX} cy={l.standY} r="1.2" fill={color} stroke="#fff" strokeWidth="0.4" />
                        <circle
                          cx={l.standX}
                          cy={l.standY}
                          r="2.2"
                          fill="none"
                          stroke={color}
                          strokeWidth="0.4"
                          className="strat-radar-stand-pulse"
                        />
                        <text
                          x={l.standX}
                          y={l.standY - 1.8}
                          textAnchor="middle"
                          fill={color}
                          fontSize="2"
                          fontWeight="bold"
                        >
                          STAND
                        </text>
                        <line
                          x1={l.standX}
                          y1={l.standY}
                          x2={l.landX}
                          y2={l.landY}
                          stroke={color}
                          strokeWidth="0.45"
                          strokeDasharray="1.5,1.2"
                          className="strat-radar-trajectory-active"
                          markerEnd={`url(#${markerId})`}
                        />
                      </g>
                    );
                  })}
                </svg>
              )}

              {/* Interactive csnades.gg Nade Pins on Whiteboard Canvas */}
              {showBoardNades &&
                lineups.map((l) => {
                  const isActive = activeBoardLineupId === l.id;
                  const color = utilityColors[l.utilityType] ?? "#c8f135";
                  const iconName: IconName =
                    l.utilityType === "SMOKE"
                      ? "smoke"
                      : l.utilityType === "FLASH"
                        ? "flash"
                        : l.utilityType === "MOLOTOV"
                          ? "molotov"
                          : "he";
                  return (
                    <button
                      key={`board-pin-${l.id}`}
                      type="button"
                      className={`strat-board-nade-pin ${isActive ? "active" : ""}`}
                      style={{
                        left: `${l.landX}%`,
                        top: `${l.landY}%`,
                        borderColor: color,
                        backgroundColor: isActive ? color : "rgba(11, 16, 13, 0.9)",
                        color: isActive ? "#0b100d" : color,
                        boxShadow: isActive ? `0 0 14px ${color}` : undefined,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveBoardLineupId(isActive ? null : l.id);
                      }}
                      title={`${l.title} (${l.utilityType} · ${l.throwType})`}
                    >
                      <Icon name={iconName} size={13} />
                    </button>
                  );
                })}

              {/* Floating Active Lineup Shelf on Whiteboard */}
              {activeBoardLineup && (
                <div className="strat-board-active-card" onClick={(e) => e.stopPropagation()}>
                  <div className="strat-board-card-info">
                    <div className="strat-lineup-badge-row">
                      <span
                        className="strat-badge"
                        style={{
                          borderColor: utilityColors[activeBoardLineup.utilityType],
                          color: utilityColors[activeBoardLineup.utilityType],
                        }}
                      >
                        {activeBoardLineup.utilityType}
                      </span>
                      <span className="strat-throw-badge">{activeBoardLineup.throwType}</span>
                      <span className="strat-badge map">
                        {activeBoardLineup.mapName.replace(/^de_/, "").toUpperCase()}
                      </span>
                    </div>
                    <strong>{activeBoardLineup.title}</strong>
                    <small>
                      Stand ({activeBoardLineup.standX}, {activeBoardLineup.standY}) → Land (
                      {activeBoardLineup.landX}, {activeBoardLineup.landY})
                      {activeBoardLineup.description ? ` · ${activeBoardLineup.description}` : ""}
                    </small>
                  </div>
                  <div className="strat-board-card-actions">
                    {safeHttpUrl(activeBoardLineup.videoUrl) ? (
                      <button
                        type="button"
                        className="strat-video-action-btn"
                        onClick={() => setActiveVideoLineup(activeBoardLineup)}
                      >
                        ▶ VIDEO GUIDE
                      </button>
                    ) : (
                      <button type="button" className="strat-video-action-btn" disabled>
                        NO VIDEO
                      </button>
                    )}
                    <button
                      type="button"
                      className="strat-place-action-btn"
                      onClick={() => {
                        placeLineup(activeBoardLineup);
                        setActiveBoardLineupId(null);
                      }}
                    >
                      + PIN TO ROOM
                    </button>
                    <button
                      type="button"
                      className="strat-radar-close-btn"
                      onClick={() => setActiveBoardLineupId(null)}
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}

              {/* Whiteboard Room Canvas Elements */}
              {room?.canvasElements.map((element) => {
                if (
                  element.elementType === "ARROW" &&
                  element.endX !== undefined &&
                  element.endY !== undefined
                ) {
                  return (
                    <svg
                      className="strat-arrow"
                      key={element.elementId}
                      viewBox="0 0 100 100"
                    >
                      <line
                        x1={element.x}
                        y1={element.y}
                        x2={element.endX}
                        y2={element.endY}
                        stroke={element.colorHex ?? "#ff7a28"}
                        strokeWidth="0.45"
                        strokeDasharray="1.5,1.2"
                        markerEnd="url(#arrowhead)"
                      />
                      <defs>
                        <marker
                          id="arrowhead"
                          markerWidth="3.5"
                          markerHeight="3.5"
                          refX="2.5"
                          refY="1.75"
                          orient="auto"
                        >
                          <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill={element.colorHex ?? "#ff7a28"} />
                        </marker>
                      </defs>
                    </svg>
                  );
                }

                const isSelected = selectedElement === element.elementId;
                const isPlayer =
                  element.elementType === "PLAYER_TOKEN" ||
                  element.label === "CT" ||
                  element.label === "T" ||
                  element.label === "PLAYER";
                const pinType = element.label?.toUpperCase() ?? "SMOKE";
                const iconName: IconName = isPlayer
                  ? element.label === "CT"
                    ? "ct"
                    : "t"
                  : pinType === "SMOKE"
                    ? "smoke"
                    : pinType === "FLASH"
                      ? "flash"
                      : pinType === "MOLOTOV"
                        ? "molotov"
                        : pinType === "HE"
                          ? "he"
                          : "target";

                return (
                  <button
                    key={element.elementId}
                    className={`strat-tactical-token ${isSelected ? "selected" : ""} ${
                      isPlayer ? "player" : "utility"
                    } type-${pinType.toLowerCase()}`}
                    style={{ left: `${element.x}%`, top: `${element.y}%` }}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedElement(element.elementId);
                    }}
                    title={element.text ? `${element.text} (${element.label})` : element.label}
                  >
                    <div className="strat-token-icon-wrap">
                      <Icon name={iconName} size={15} />
                    </div>
                    {element.text && (
                      <span className="strat-token-label-chip">{element.text}</span>
                    )}
                  </button>
                );
              })}
              {arrowStart && (
                <span
                  className="strat-pending"
                  style={{ left: `${arrowStart.x}%`, top: `${arrowStart.y}%` }}
                >
                  START
                </span>
              )}
              {Object.entries(cursors)
                .filter(([id]) => id !== participant?.participantId)
                .map(([id, cursor]) => (
                  <span
                    className="strat-cursor"
                    key={id}
                    style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                  >
                    {room?.participants.find((p) => p.participantId === id)?.displayName ?? "PLAYER"}
                  </span>
                ))}
              </div>
            </div>

            <aside className="strat-people">
              <div className="panel-title">
                <span>TEAM / {room?.participants.length ?? 0}</span>
              </div>
              {room?.participants.map((person) => (
                <p key={person.participantId}>
                  <i style={{ background: person.colorHex }} />
                  {person.displayName}
                  {person.isHost ? " · HOST" : ""}
                </p>
              ))}
              {!room && <p>Create or join a room to draw.</p>}
              {selectedElement && participant && (
                <button
                  onClick={() => {
                    publish({
                      eventType: "ELEMENT_DELETE",
                      participantId: participant.participantId,
                      elementId: selectedElement,
                    });
                    setSelectedElement("");
                  }}
                >
                  DELETE SELECTED
                </button>
              )}
            </aside>
          </div>

          <form className="strat-save" onSubmit={saveRoom}>
            <input
              value={saveTitle}
              onChange={(event) => setSaveTitle(event.target.value)}
              placeholder="Tactic title"
              required
            />
            <input
              value={saveDescription}
              onChange={(event) => setSaveDescription(event.target.value)}
              placeholder="Description"
            />
            <label>
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) => setIsPublic(event.target.checked)}
              />{" "}
              Public
            </label>
            <button disabled={busy || !room || !token}>SAVE ROOM AS TACTIC</button>
          </form>
        </>
      )}

      {/* LINEUPS TAB (CS2NADES 2-COLUMN LAYOUT WITH TARGET CLUSTERING) */}
      {tab === "lineups" && (
        <section className="csnades-authentic-layout">
          {/* 1. LEFT SIDEBAR (270px width, clean dark #121316 panel) */}
          <aside className="csnades-authentic-sidebar">
            {/* Map Header & Switcher */}
            <div className="csnades-sb-header">
              <div className="csnades-sb-map-select-wrap">
                <select
                  aria-label="Select CS2 Map"
                  className="csnades-sb-map-dropdown"
                  value={normalizeMap(mapName)}
                  onChange={(e) => changeMap(e.target.value, teamSide)}
                >
                  {CS2_MAP_OPTIONS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
                <span className="csnades-sb-dropdown-chevron">▼</span>
              </div>
              <p className="csnades-sb-subtitle">
                Find the best {cleanMap.charAt(0).toUpperCase() + cleanMap.slice(1)} smokes, molotovs, flashbangs, and HE grenades for Counter-Strike 2.
              </p>
            </div>

            {/* Guide Links & Community Toggle */}
            <div className="csnades-sb-guides-block">
              <button
                type="button"
                className="csnades-sb-guide-link"
                onClick={() => notify(`Opened ${cleanMap.toUpperCase()} guide`)}
              >
                <span className="guide-icon">📘</span>
                <span>View our {cleanMap.charAt(0).toUpperCase() + cleanMap.slice(1)} guide</span>
              </button>
              <button
                type="button"
                className="csnades-sb-guide-link"
                onClick={() => notify("Opened instant window smokes guide")}
              >
                <span className="guide-icon">📘</span>
                <span>View our instant window smokes guide</span>
              </button>

              <label className="csnades-sb-toggle-row">
                <span className="toggle-label">Show community nades</span>
                <input
                  type="checkbox"
                  checked={showCommunityNades}
                  onChange={(e) => setShowCommunityNades(e.target.checked)}
                />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* NADES Vertical List with Icons & Live Counts */}
            <div className="csnades-sb-section">
              <span className="csnades-sb-section-heading">NADES</span>
              <div className="csnades-sb-nav-list">
                <button
                  type="button"
                  className={`csnades-sb-nav-item ${lineupUtility === "SMOKE" ? "active" : ""}`}
                  onClick={() => {
                    setLineupUtility("SMOKE");
                    setSelectedTargetCallout(null);
                  }}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">☁️</span>
                    <span className="nav-item-label">Smokes</span>
                  </div>
                  <span className="nav-item-count">{utilCounts.SMOKE}</span>
                </button>

                <button
                  type="button"
                  className={`csnades-sb-nav-item ${lineupUtility === "MOLOTOV" ? "active" : ""}`}
                  onClick={() => {
                    setLineupUtility("MOLOTOV");
                    setSelectedTargetCallout(null);
                  }}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">🔥</span>
                    <span className="nav-item-label">Molotovs</span>
                  </div>
                  <span className="nav-item-count">{utilCounts.MOLOTOV}</span>
                </button>

                <button
                  type="button"
                  className={`csnades-sb-nav-item ${lineupUtility === "FLASH" ? "active" : ""}`}
                  onClick={() => {
                    setLineupUtility("FLASH");
                    setSelectedTargetCallout(null);
                  }}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">⚡</span>
                    <span className="nav-item-label">Flashbangs</span>
                  </div>
                  <span className="nav-item-count">{utilCounts.FLASH}</span>
                </button>

                <button
                  type="button"
                  className={`csnades-sb-nav-item ${lineupUtility === "HE" ? "active" : ""}`}
                  onClick={() => {
                    setLineupUtility("HE");
                    setSelectedTargetCallout(null);
                  }}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">💣</span>
                    <span className="nav-item-label">HE Grenades</span>
                  </div>
                  <span className="nav-item-count">{utilCounts.HE}</span>
                </button>

                <button
                  type="button"
                  className={`csnades-sb-nav-item ${lineupUtility === "ALL" ? "active" : ""}`}
                  onClick={() => {
                    setLineupUtility("ALL");
                    setSelectedTargetCallout(null);
                  }}
                >
                  <div className="nav-item-left">
                    <span className="nav-item-icon">🔗</span>
                    <span className="nav-item-label">Solo Combinations</span>
                  </div>
                  <span className="nav-item-count">{utilCounts.COMBOS}</span>
                </button>
              </div>
            </div>

            {/* TEAMS Segmented 3-Button Row */}
            <div className="csnades-sb-section">
              <span className="csnades-sb-section-heading">TEAMS</span>
              <div className="csnades-sb-teams-row">
                <button
                  type="button"
                  className={`csnades-team-pill ${lineupSideFilter === "ALL" ? "active" : ""}`}
                  onClick={() => setLineupSideFilter("ALL")}
                >
                  Any
                </button>
                <button
                  type="button"
                  className={`csnades-team-pill ${lineupSideFilter === "CT" ? "active" : ""}`}
                  onClick={() => setLineupSideFilter("CT")}
                >
                  🛡️ CT
                </button>
                <button
                  type="button"
                  className={`csnades-team-pill ${lineupSideFilter === "T" ? "active" : ""}`}
                  onClick={() => setLineupSideFilter("T")}
                >
                  ⭐ T
                </button>
              </div>
            </div>

            {/* FILTERS Section */}
            <div className="csnades-sb-section">
              <span className="csnades-sb-section-heading">FILTERS</span>
              <div className="csnades-sb-filter-btn-grid">
                <button
                  type="button"
                  className={`csnades-filter-box-btn ${recommendedOnly ? "active" : ""}`}
                  onClick={() => setRecommendedOnly((v) => !v)}
                >
                  📖 Recommended
                </button>
                <button
                  type="button"
                  className={`csnades-filter-box-btn ${favouritesOnly ? "active" : ""}`}
                  onClick={() => setFavouritesOnly((v) => !v)}
                >
                  ⭐ Favourites
                </button>
              </div>

              <button
                type="button"
                className="csnades-sb-submit-btn"
                onClick={() => setShowLineupForm((v) => !v)}
              >
                + Submit nade
              </button>
            </div>
          </aside>

          {/* 2. MAIN CENTER STAGE (Full-Height Centered Architectural CS2 Radar Map) */}
          <main className="csnades-authentic-stage">
            {showLineupForm && (
              <form className="strat-lineup-form" onSubmit={submitNewLineup}>
                <input
                  value={lineupDraft.title}
                  onChange={(event) => setLineupDraft({ ...lineupDraft, title: event.target.value })}
                  placeholder="Lineup title (e.g. Coffin Smoke from Banana)"
                  required
                />
                <select
                  value={lineupDraft.utilityType}
                  onChange={(event) =>
                    setLineupDraft({ ...lineupDraft, utilityType: event.target.value as UtilityType })
                  }
                >
                  {["SMOKE", "FLASH", "MOLOTOV", "HE"].map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
                <input
                  value={lineupDraft.throwType}
                  onChange={(event) => setLineupDraft({ ...lineupDraft, throwType: event.target.value })}
                  placeholder="Throw type (e.g. Jumpthrow, Left-Click)"
                  required
                />
                {(["standX", "standY", "landX", "landY"] as const).map((field) => (
                  <label key={field}>
                    {field}
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={lineupDraft[field]}
                      onChange={(event) =>
                        setLineupDraft({ ...lineupDraft, [field]: Number(event.target.value) })
                      }
                      required
                    />
                  </label>
                ))}
                <input
                  type="url"
                  value={lineupDraft.videoUrl ?? ""}
                  onChange={(event) => setLineupDraft({ ...lineupDraft, videoUrl: event.target.value })}
                  placeholder="Video URL"
                />
                <textarea
                  value={lineupDraft.description ?? ""}
                  onChange={(event) =>
                    setLineupDraft({ ...lineupDraft, description: event.target.value })
                  }
                  placeholder="Description"
                />
                <button disabled={busy || !token}>SUBMIT LINEUP</button>
              </form>
            )}

            <div className="csnades-radar-centerpiece">
              {/* Top-Right Radar Controls */}
              <div className="csnades-radar-top-controls">
                <button
                  type="button"
                  onClick={() => setRadarZoom((z) => Math.min(2.5, +(z + 0.25).toFixed(2)))}
                  title="Zoom In"
                >
                  +
                </button>
                <span className="csnades-radar-zoom-display">{(radarZoom * 100).toFixed(0)}%</span>
                <button
                  type="button"
                  onClick={() => setRadarZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
                  title="Zoom Out"
                >
                  −
                </button>
                {radarZoom > 1 && (
                  <button type="button" onClick={() => setRadarZoom(1)} title="Reset Zoom">
                    ↺
                  </button>
                )}
              </div>

              {/* Bottom-Right Radar Controls */}
              <div className="csnades-radar-bottom-controls">
                <button
                  type="button"
                  className={`csnades-radar-control-pill ${showCallouts ? "active" : ""}`}
                  onClick={() => setShowCallouts((v) => !v)}
                  title="Toggle map callouts"
                >
                  📍 {showCallouts ? "Disable callouts" : "Enable callouts"}
                </button>
                <button
                  type="button"
                  className={`csnades-radar-control-pill ${isSimpleRadar ? "active" : ""}`}
                  onClick={() => setIsSimpleRadar((v) => !v)}
                  title="Toggle SimpleRadar theme"
                >
                  ⇄ {isSimpleRadar ? "Game Radar" : "SimpleRadar"}
                </button>
              </div>

              {/* Interactive Radar Stage Viewport */}
              <div
                className="csnades-radar-canvas-viewport"
                style={{
                  transform: `scale(${radarZoom})`,
                  transformOrigin: "center center",
                }}
              >
                {/* Guaranteed Visible Grey/Tan Architectural CS2 Radar Layer */}
                <div className={`csnades-radar-floor-layer ${isSimpleRadar ? "simpleradar" : ""}`}>

                  {/* Real Official CS2 Radar Image (multi-source fallback) */}
                  <RadarMapLayer mapName={mapName} />
                </div>

                {/* CS2 Map Callout Text Labels (Toggled by [📍 Enable callouts]) */}
                {showCallouts &&
                  (MAP_CALLOUTS[cleanMap] || []).map((c) => (
                    <div
                      key={c.name}
                      className="csnades-callout-label-chip"
                      style={{ left: `${c.x}%`, top: `${c.y}%` }}
                    >
                      {c.name}
                    </div>
                  ))}

                {/* Trajectory SVG Layer */}
                <svg className="csnades-radar-traj-svg" viewBox="0 0 100 100">
                  <defs>
                    <marker id="csnades-arrow-smoke" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#ffeba6" />
                    </marker>
                    <marker id="csnades-arrow-molo" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#f97316" />
                    </marker>
                    <marker id="csnades-arrow-flash" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#facc15" />
                    </marker>
                    <marker id="csnades-arrow-he" markerWidth="3.5" markerHeight="3.5" refX="2.5" refY="1.75" orient="auto">
                      <path d="M 0 0 L 3.5 1.75 L 0 3.5 Z" fill="#ef4444" />
                    </marker>
                  </defs>

                  {/* Fan-Out Trajectories for Selected Cloud Pin */}
                  {activeTargetCluster &&
                    activeTargetCluster.lineups.map((l) => {
                      const isHovered = hoveredRadarLineupId === l.id;
                      const color =
                        l.utilityType === "MOLOTOV"
                          ? "#f97316"
                          : l.utilityType === "FLASH"
                            ? "#facc15"
                            : l.utilityType === "HE"
                              ? "#ef4444"
                              : "#ffeba6";
                      const markerId =
                        l.utilityType === "MOLOTOV"
                          ? "csnades-arrow-molo"
                          : l.utilityType === "FLASH"
                            ? "csnades-arrow-flash"
                            : l.utilityType === "HE"
                              ? "csnades-arrow-he"
                              : "csnades-arrow-smoke";
                      return (
                        <g key={`fan-${l.id}`} className={`csnades-traj-group active ${isHovered ? "hovered" : ""}`}>
                          <circle
                            cx={l.standX}
                            cy={l.standY}
                            r="1.2"
                            fill={color}
                            stroke="#ffffff"
                            strokeWidth="0.4"
                          />
                          <circle
                            cx={l.standX}
                            cy={l.standY}
                            r="2.2"
                            fill="none"
                            stroke={color}
                            strokeWidth="0.4"
                            className="csnades-stand-pulse"
                          />
                          <line
                            x1={l.standX}
                            y1={l.standY}
                            x2={activeTargetCluster.landX}
                            y2={activeTargetCluster.landY}
                            stroke={color}
                            strokeWidth={isHovered ? "0.7" : "0.45"}
                            strokeDasharray="1.5,1.2"
                            className="csnades-traj-active"
                            markerEnd={`url(#${markerId})`}
                          />
                        </g>
                      );
                    })}
                </svg>

                {/* SCALLOPED PUFFY SMOKE CLOUD PINS (Signature csnades.gg Pins) */}
                {targetClusters.map((cluster) => {
                  const isSelected = selectedTargetCallout === cluster.toCallout;
                  const isSmoke = cluster.utilityType === "SMOKE";
                  const isMolo = cluster.utilityType === "MOLOTOV";
                  const isFlash = cluster.utilityType === "FLASH";

                  let fillColor = cluster.teamSide === "CT" ? "#B8D4F2" : "#FFEBA6";
                  let strokeColor = cluster.teamSide === "CT" ? "#7AA7D8" : "#E2CE82";
                  if (isMolo) {
                    fillColor = "#FED7AA";
                    strokeColor = "#F97316";
                  } else if (isFlash) {
                    fillColor = "#FEF08A";
                    strokeColor = "#EAB308";
                  } else if (!isSmoke) {
                    fillColor = "#FECACA";
                    strokeColor = "#EF4444";
                  }

                  return (
                    <button
                      key={`cluster-${cluster.toCallout}`}
                      type="button"
                      className={`csnades-cloud-pin-btn ${isSelected ? "selected" : ""}`}
                      style={{
                        left: `${cluster.landX}%`,
                        top: `${cluster.landY}%`,
                      }}
                      onClick={() => setSelectedTargetCallout(isSelected ? null : cluster.toCallout)}
                      title={`Target: ${cluster.toCallout} (${cluster.count} setups)`}
                    >
                      <svg
                        viewBox="0 0 101 100"
                        className="csnades-cloud-pin-svg"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M50.0859 0C56.9811 0 65.1892 9.25689 65.1892 9.25689C65.1892 9.25689 77.3554 7.5062 82.6374 11.9925C87.9195 16.4788 88.3288 28.9105 88.3288 28.9105C88.3288 28.9105 98.7604 35.4852 99.9577 42.3585C101.155 49.2319 93.5741 59.0215 93.5741 59.0215C93.5741 59.0215 97.39 70.8452 93.9424 76.8895C90.4948 82.9339 78.4708 85.5007 78.4708 85.5007C78.4708 85.5007 73.8856 97.041 67.4062 99.4281C60.9269 101.815 50.0859 95.9581 50.0859 95.9581C50.0859 95.9581 39.245 101.815 32.7657 99.4281C26.2863 97.0409 21.7011 85.5007 21.7011 85.5007C21.7011 85.5007 9.67706 82.9339 6.22946 76.8895C2.78186 70.8452 6.59778 59.0215 6.59778 59.0215C6.59778 59.0215 -0.983148 49.2319 0.21419 42.3585C1.41153 35.4852 11.8431 28.9105 11.8431 28.9105C11.8431 28.9105 12.2524 16.4788 17.5345 11.9925C22.8165 7.5062 34.9827 9.25689 34.9827 9.25689C34.9827 9.25689 43.1907 0 50.0859 0Z"
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth="3.2"
                        />
                        <text
                          x="50.5"
                          y="54"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize="36"
                          fontWeight="900"
                          fill="#181a1f"
                        >
                          {cluster.count}
                        </text>
                      </svg>
                    </button>
                  );
                })}

                {/* FAN-OUT THROW ORIGIN PINS (Shown when a cloud pin is clicked) */}
                {activeTargetCluster &&
                  activeTargetCluster.lineups.map((l) => (
                    <button
                      key={`origin-${l.id}`}
                      type="button"
                      className="csnades-fan-origin-dot"
                      style={{
                        left: `${l.standX}%`,
                        top: `${l.standY}%`,
                      }}
                      onMouseEnter={() => setHoveredRadarLineupId(l.id)}
                      onMouseLeave={() => setHoveredRadarLineupId(null)}
                      onClick={() => setSelectedDetailLineup(l)}
                      title={`Throw from ${l.fromCallout || "Stand"} (${l.technique || l.throwType})`}
                    >
                      <span className="origin-dot-core" />
                      <span className="origin-dot-callout">{l.fromCallout || "Stand"}</span>
                    </button>
                  ))}
              </div>
            </div>
          </main>

          {/* 3. SLIDE-OVER LINEUP PREVIEW DRAWER (Opens when a cloud pin is clicked) */}
          {selectedTargetCallout && activeTargetCluster && (
            <aside className="csnades-preview-drawer">
              <div className="csnades-drawer-header">
                <div className="csnades-drawer-title-group">
                  <div className="csnades-drawer-badge-row">
                    <span className="csnades-drawer-type-pill">
                      {activeTargetCluster.utilityType}
                    </span>
                    <span className="csnades-drawer-team-pill">
                      {activeTargetCluster.teamSide} SIDE
                    </span>
                  </div>
                  <h3 className="csnades-drawer-heading">
                    Target: {selectedTargetCallout}
                  </h3>
                  <span className="csnades-drawer-count">
                    {activeTargetCluster.lineups.length} verified setups available
                  </span>
                </div>
                <button
                  type="button"
                  className="csnades-drawer-close-btn"
                  onClick={() => setSelectedTargetCallout(null)}
                  title="Close preview drawer"
                >
                  ✕
                </button>
              </div>

              <div className="csnades-drawer-cards-stack">
                {activeTargetCluster.lineups.map((lineup) => {
                  const ytMatch = (lineup.videoUrl || "").match(/watch\?v=([a-zA-Z0-9_-]+)/);
                  const ytId = ytMatch ? ytMatch[1] : null;
                  const thumbUrl = ytId
                    ? `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`
                    : `/maps/de_${cleanMap}.png`;

                  return (
                    <article key={lineup.id} className="csnades-drawer-card">
                      <div
                        className="csnades-card-thumb-wrap"
                        onClick={() => setSelectedDetailLineup(lineup)}
                      >
                        <img
                          src={thumbUrl}
                          alt={lineup.title}
                          className="csnades-card-thumb-img"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = `/maps/de_${cleanMap}.png`;
                          }}
                        />
                        <span className="csnades-play-overlay">▶ Watch Guide</span>
                        <span className="csnades-tech-badge">{lineup.technique || lineup.throwType}</span>
                      </div>

                      <div className="csnades-card-info">
                        <h4 className="csnades-card-route-title">
                          {lineup.fromCallout} → {lineup.toCallout}
                        </h4>

                        <div className="csnades-card-tags">
                          <span className="csnades-tag-key">[SPACE] Jumpthrow</span>
                          <span className="csnades-tag-neutral">{lineup.movement || "Stationary"}</span>
                          <span className="csnades-tag-pro">★ PRO</span>
                        </div>

                        <p className="csnades-card-description">{lineup.description}</p>

                        <div className="csnades-card-actions-row">
                          <button
                            type="button"
                            className="csnades-btn-view"
                            onClick={() => setSelectedDetailLineup(lineup)}
                          >
                            🔍 Step-by-Step
                          </button>
                          <button
                            type="button"
                            className="csnades-btn-setpos"
                            onClick={() => {
                              navigator.clipboard.writeText(lineup.setposCommand || "setpos 0 0 0");
                              notify("Copied setpos console command!");
                            }}
                            title="Copy CS2 setpos command"
                          >
                            📋 setpos
                          </button>
                          <button
                            type="button"
                            className="csnades-btn-pin"
                            onClick={() => {
                              placeLineup(lineup);
                              notify(`Pinned ${lineup.title} to Tactical Whiteboard`);
                            }}
                            title="Place on Whiteboard"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </aside>
          )}
        </section>
      )}
      {/* TACTICS TAB */}
      {tab === "tactics" && (
        <section className="strat-list">
          <div className="panel-title">
            <span>PRO PLAYBOOKS &amp; COMMUNITY TACTICS · {tactics.length}</span>
          </div>
          <form
            className="strat-code"
            onSubmit={(event) => {
              event.preventDefault();
              void openTactic(tacticCode.trim());
            }}
          >
            <input
              value={tacticCode}
              onChange={(event) => setTacticCode(event.target.value)}
              placeholder="Enter Share Code (e.g. NAVI-MIRA, FAZE-MIDB)"
            />
            <button type="submit">OPEN</button>
          </form>

          <div className="strat-tactics-grid">
            {[...myTactics, ...tactics.filter((item) => !myTactics.some((mine) => mine.id === item.id))].map(
              (item) => {
                const playbook = fallbackTactics.find((t) => t.id === item.id || t.shareCode === item.shareCode);
                return (
                  <article className="strat-tactic-card" key={item.id}>
                    <div className="strat-tactic-card-header">
                      <div className="strat-tactic-badges">
                        {playbook?.proTeam && (
                          <span className="strat-pro-badge">★ {playbook.proTeam}</span>
                        )}
                        <span className={`strat-side-pill side-${item.teamSide.toLowerCase()}`}>
                          {item.teamSide} SIDE
                        </span>
                        <span className="strat-map-pill">
                          {item.mapName.replace(/^de_/, "").toUpperCase()}
                        </span>
                        {playbook?.difficulty && (
                          <span className={`strat-diff-pill diff-${playbook.difficulty.toLowerCase()}`}>
                            {playbook.difficulty}
                          </span>
                        )}
                      </div>
                      <small className="strat-share-code">{item.shareCode}</small>
                    </div>

                    <h3 className="strat-tactic-title">{item.title}</h3>
                    {item.description && <p className="strat-tactic-desc">{item.description}</p>}

                    <div className="strat-tactic-actions">
                      <button
                        type="button"
                        className="strat-btn-load-board"
                        onClick={() => loadTacticOntoBoard(item)}
                        title="Load execute onto Tactical Whiteboard"
                      >
                        ⚡ Load onto Board
                      </button>
                      <button
                        type="button"
                        className="strat-btn-inspect"
                        onClick={() => openTactic(item.id)}
                      >
                        Inspect Details
                      </button>
                    </div>
                  </article>
                );
              }
            )}
          </div>

          <div className="strat-pagination">
            <button disabled={tacticPage === 0} onClick={() => setTacticPage((page) => page - 1)}>
              PREVIOUS
            </button>
            <span>
              PAGE {tacticPage + 1} / {Math.max(1, tacticTotalPages)}
            </span>
            <button
              disabled={tacticPage + 1 >= tacticTotalPages}
              onClick={() => setTacticPage((page) => page + 1)}
            >
              NEXT
            </button>
          </div>
          {tactic && (
            <div className="strat-tactic-detail">
              <h3>{tactic.title}</h3>
              <p>{tactic.description}</p>
              <p>Share code: {tactic.shareCode}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button type="button" className="strat-btn-load-board" onClick={() => loadTacticOntoBoard(tactic)}>
                  ⚡ LOAD ONTO BOARD
                </button>
                {room && room.roomCode !== "LOCAL-BOARD" && (
                  <button type="button" onClick={loadTactic}>
                    SYNC TO ROOM ({room.roomCode})
                  </button>
                )}
              </div>
              {token && tactic.authorUserId === user?.id && (
                <>
                  <input
                    value={tactic.title}
                    onChange={(event) => setTactic({ ...tactic, title: event.target.value })}
                    aria-label="Tactic title"
                  />
                  <textarea
                    value={tactic.description ?? ""}
                    onChange={(event) => setTactic({ ...tactic, description: event.target.value })}
                    aria-label="Tactic description"
                  />
                  <button onClick={saveChanges}>SAVE CHANGES</button>
                  <button onClick={removeTactic}>DELETE TACTIC</button>
                </>
              )}
            </div>
          )}
        </section>
      )}

      {/* Authentic csnades.gg Lineup Detail Modal (Video, Stand Position, Aim Magnifier & Setpos) */}
      {selectedDetailLineup && (
        <LineupDetailModal
          lineup={selectedDetailLineup}
          onClose={() => setSelectedDetailLineup(null)}
          onPlaceLineup={placeLineup}
        />
      )}
      {activeVideoLineup && (
        <LineupDetailModal
          lineup={activeVideoLineup}
          onClose={() => setActiveVideoLineup(null)}
          onPlaceLineup={placeLineup}
        />
      )}
    </div>
  );
}
