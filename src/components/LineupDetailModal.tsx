import { useState, useEffect, useRef, type MouseEvent } from "react";
import type { UtilityLineup, UtilityType } from "../features/stratboard/types";
import ClipPlayer from "./ClipPlayer";
import Icon, { type IconName } from "./Icon";
import RadarMapLayer from "./RadarMapLayer";
import "./LineupDetailModal.css";

interface Props {
  lineup: UtilityLineup | null;
  onClose: () => void;
  onPlaceLineup: (lineup: UtilityLineup) => void;
}

type ModalTab = "video" | "aim" | "stand";

const utilityColors: Record<UtilityType, string> = {
  SMOKE: "#f59e0b",
  FLASH: "#facc15",
  MOLOTOV: "#f97316",
  HE: "#ef4444",
};

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return match ? match[1] : null;
}

export default function LineupDetailModal({ lineup, onClose, onPlaceLineup }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>("video");
  const [copied, setCopied] = useState(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number; show: boolean }>({
    x: 50,
    y: 50,
    show: false,
  });
  const aimContainerRef = useRef<HTMLDivElement>(null);

  const cleanMap = (lineup?.mapName || "mirage").toLowerCase().replace(/^de_/, "");
  const ytId = extractYouTubeId(lineup?.videoUrl);
  const primaryAim = ytId
    ? `https://i.ytimg.com/vi/${ytId}/maxresdefault.jpg`
    : (lineup?.targetImgUrl || `/maps/de_${cleanMap}.webp`);
  const fallbackAim = ytId
    ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
    : `/maps/de_${cleanMap}.webp`;

  const [aimImgSrc, setAimImgSrc] = useState(primaryAim);

  useEffect(() => {
    if (!lineup) return;
    setActiveTab(lineup.videoUrl ? "video" : "aim");
    setCopied(false);
    const id = extractYouTubeId(lineup.videoUrl);
    setAimImgSrc(
      id
        ? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`
        : (lineup.targetImgUrl || `/maps/${lineup.mapName.toLowerCase().replace(/^de_/, "")}.webp`)
    );
  }, [lineup?.id, lineup?.videoUrl, lineup?.mapName, lineup?.targetImgUrl]);

  // Global keydown listeners for Escape (close) and 'C' (copy setpos)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      } else if ((e.key === "c" || e.key === "C") && lineup && !e.ctrlKey && !e.metaKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          e.preventDefault();
          copyConsoleCommand();
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lineup, onClose]);

  if (!lineup) return null;

  const color = utilityColors[lineup.utilityType] ?? "#f59e0b";
  const iconName: IconName =
    lineup.utilityType === "SMOKE"
      ? "smoke"
      : lineup.utilityType === "FLASH"
        ? "flash"
        : lineup.utilityType === "MOLOTOV"
          ? "molotov"
          : "he";

  const consoleCommand =
    lineup.setposCommand ||
    `setpos ${((lineup.standX - 50) * 40).toFixed(2)} ${((lineup.standY - 50) * 40).toFixed(2)} -150.00; setang -28.50 145.20 0.00`;

  function copyConsoleCommand() {
    navigator.clipboard
      .writeText(consoleCommand)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2400);
      })
      .catch(() => {});
  }

  function handleAimMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!aimContainerRef.current) return;
    const rect = aimContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setLensPos({ x, y, show: true });
  }

  function handleAimMouseLeave() {
    setLensPos((prev) => ({ ...prev, show: false }));
  }

  // Determine keybind tags based on technique & movement
  const keybinds: { key: string; label: string }[] = [];
  const techLower = (lineup.technique || lineup.throwType || "").toLowerCase();
  const movLower = (lineup.movement || "").toLowerCase();

  if (techLower.includes("jump")) {
    keybinds.push({ key: "SPACE", label: "Jumpthrow" });
  }
  if (techLower.includes("crouch") || movLower.includes("crouch")) {
    keybinds.push({ key: "CTRL", label: "Crouch" });
  }
  if (techLower.includes("run") || movLower.includes("run") || techLower.includes("walk")) {
    keybinds.push({ key: "W", label: "Run / Forward" });
  }
  if (techLower.includes("right")) {
    keybinds.push({ key: "RMB", label: "Right Click" });
  } else if (techLower.includes("both") || techLower.includes("left + right")) {
    keybinds.push({ key: "LMB + RMB", label: "Both Clicks" });
  } else {
    keybinds.push({ key: "LMB", label: "Left Click" });
  }

  return (
    <div className="csnades-modal-backdrop" onClick={onClose}>
      <div className="csnades-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="csnades-modal-header">
          <div className="csnades-modal-title-wrap">
            <div className="csnades-modal-badge-row">
              <span className="csnades-util-badge" style={{ borderColor: color, color }}>
                <Icon name={iconName} size={13} />
                {lineup.utilityType}
              </span>
              <span className={`csnades-side-badge side-${lineup.teamSide.toLowerCase()}`}>
                {lineup.teamSide} SIDE
              </span>
              <span className="csnades-map-badge">
                {lineup.mapName.replace(/^de_/, "").toUpperCase()}
              </span>
              {lineup.difficulty && (
                <span className={`csnades-diff-badge diff-${lineup.difficulty.toLowerCase()}`}>
                  {lineup.difficulty.toUpperCase()}
                </span>
              )}
              {lineup.isPro && <span className="csnades-pro-badge">★ PRO VERIFIED</span>}
              {lineup.airTimeSeconds && (
                <span className="csnades-time-badge">⏱ {lineup.airTimeSeconds}s</span>
              )}
            </div>
            <h2 className="csnades-modal-title">
              {lineup.fromCallout && lineup.toCallout
                ? `${lineup.fromCallout} → ${lineup.toCallout}`
                : lineup.title}
            </h2>
          </div>

          <button
            type="button"
            className="csnades-modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* SUB-TABS SELECTOR */}
        <div className="csnades-modal-tabs">
          <button
            type="button"
            className={`csnades-tab-btn ${activeTab === "video" ? "active" : ""}`}
            onClick={() => setActiveTab("video")}
          >
            <Icon name="play" size={14} /> VIDEO GUIDE
          </button>
          <button
            type="button"
            className={`csnades-tab-btn ${activeTab === "aim" ? "active" : ""}`}
            onClick={() => setActiveTab("aim")}
          >
            <Icon name="crosshair" size={14} /> AIM & MAGNIFIER
          </button>
          <button
            type="button"
            className={`csnades-tab-btn ${activeTab === "stand" ? "active" : ""}`}
            onClick={() => setActiveTab("stand")}
          >
            <Icon name="target" size={14} /> STAND POSITION
          </button>
        </div>

        {/* MODAL MAIN CONTENT */}
        <div className="csnades-modal-body">
          {/* TAB 1: VIDEO GUIDE */}
          {activeTab === "video" && (
            <div className="csnades-tab-content video-tab">
              {lineup.videoUrl ? (
                <div className="csnades-video-wrapper">
                  <ClipPlayer
                    videoUrl={lineup.videoUrl}
                    title={lineup.title}
                    mapName={lineup.mapName}
                    autoplay={true}
                  />
                </div>
              ) : (
                <div className="csnades-no-video-placeholder">
                  <Icon name="play" size={32} />
                  <p>No video embed available for this lineup.</p>
                  <button type="button" onClick={() => setActiveTab("aim")}>
                    Inspect Aim Magnifier Instead
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AIM & MAGNIFIER */}
          {activeTab === "aim" && (
            <div className="csnades-tab-content aim-tab">
              <div
                className="csnades-aim-canvas-container"
                ref={aimContainerRef}
                onMouseMove={handleAimMouseMove}
                onMouseLeave={handleAimMouseLeave}
              >
                {/* Real HD CS2 First-Person Screenshot */}
                <img
                  src={aimImgSrc}
                  alt={`Aim view for ${lineup.title}`}
                  className="csnades-aim-hd-image"
                  onError={() => {
                    if (aimImgSrc !== fallbackAim) {
                      setAimImgSrc(fallbackAim);
                    }
                  }}
                />

                {/* CS2 Crosshair Reticle Center Overlay */}
                <div className="csnades-aim-crosshair-center">
                  <div className="ch-line ch-top" />
                  <div className="ch-line ch-bottom" />
                  <div className="ch-line ch-left" />
                  <div className="ch-line ch-right" />
                  <div className="ch-center-dot" />
                </div>

                {/* Target Landmark Annotation */}
                <div className="csnades-aim-annotation">
                  <span className="csnades-ann-dot" />
                  <span className="csnades-ann-text">
                    🎯 AIM TARGET: {lineup.precision === "Precise" ? "Align crosshair with vertex / landmark" : "Standard crosshair alignment"}
                  </span>
                </div>

                {/* Real Interactive 2.5x Magnifying Zoom Lens */}
                {lensPos.show && (
                  <div
                    className="csnades-magnifier-lens"
                    style={{
                      left: `${lensPos.x}%`,
                      top: `${lensPos.y}%`,
                      borderColor: color,
                      boxShadow: `0 0 20px ${color}60`,
                    }}
                  >
                    <div
                      className="csnades-magnifier-zoom-layer"
                      style={{
                        backgroundImage: `url(${aimImgSrc})`,
                        backgroundPosition: `${lensPos.x}% ${lensPos.y}%`,
                        backgroundSize: "250%",
                      }}
                    />
                    <div className="csnades-lens-reticle" />
                    <div className="csnades-aim-crosshair-center zoom">
                      <div className="ch-line ch-top" />
                      <div className="ch-line ch-bottom" />
                      <div className="ch-line ch-left" />
                      <div className="ch-line ch-right" />
                      <div className="ch-center-dot" />
                    </div>
                    <span className="csnades-lens-tag">2.5× ZOOM</span>
                  </div>
                )}
              </div>
              <div className="csnades-aim-guide-note">
                <Icon name="spark" size={14} />
                <span>
                  <strong>Alignment Tip:</strong> Hover your mouse over the viewfinder to magnify the
                  crosshair placement with the 2.5× precision lens.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: STAND POSITION */}
          {activeTab === "stand" && (
            <div className="csnades-tab-content stand-tab">
              <div className="csnades-stand-radar-wrap">
                <RadarMapLayer mapName={lineup.mapName} />
                <svg className="csnades-stand-radar-svg" viewBox="0 0 100 100">
                  {/* Dashed trajectory connecting stand to landing */}
                  <line
                    x1={lineup.standX}
                    y1={lineup.standY}
                    x2={lineup.landX}
                    y2={lineup.landY}
                    stroke={color}
                    strokeWidth="0.5"
                    strokeDasharray="1.5,1.2"
                  />
                  {/* Stand Point Pin */}
                  <circle
                    cx={lineup.standX}
                    cy={lineup.standY}
                    r="1.5"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="0.4"
                  />
                  <circle
                    cx={lineup.standX}
                    cy={lineup.standY}
                    r="2.5"
                    fill="none"
                    stroke={color}
                    strokeWidth="0.4"
                    opacity="0.8"
                    className="stand-pulse-ring"
                  />
                  {/* Land Point Pin */}
                  <circle
                    cx={lineup.landX}
                    cy={lineup.landY}
                    r="1.5"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="0.4"
                  />
                </svg>

                <div
                  className="csnades-stand-marker-callout"
                  style={{ left: `${lineup.standX}%`, top: `${Math.max(8, lineup.standY - 8)}%` }}
                >
                  📍 STAND HERE: {lineup.fromCallout || `(${lineup.standX}, ${lineup.standY})`}
                </div>
              </div>
            </div>
          )}

          {/* TECHNIQUE & KEYBINDS STRIP */}
          <div className="csnades-tech-strip">
            <div className="csnades-tech-info">
              <span className="csnades-tech-label">TECHNIQUE</span>
              <strong className="csnades-tech-value">
                {lineup.technique || lineup.throwType || "Standing Throw"}
              </strong>
            </div>

            {/* Visual CS2 Keybind Badges */}
            <div className="csnades-keybinds-row">
              <span className="csnades-tech-label">CONTROLS</span>
              {keybinds.map((kb, idx) => (
                <div key={idx} className="csnades-keybind-pill">
                  <kbd className="csnades-kbd">{kb.key}</kbd>
                  <span className="csnades-kbd-label">{kb.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CONSOLE SETPOS COMMAND STRIP */}
          <div className="csnades-setpos-strip">
            <div className="csnades-setpos-code-wrap">
              <span className="csnades-setpos-tag">CONSOLE</span>
              <code className="csnades-setpos-code">{consoleCommand}</code>
            </div>
            <button
              type="button"
              className={`csnades-btn-copy-console ${copied ? "copied" : ""}`}
              onClick={copyConsoleCommand}
              title="Shortcut: Press 'C' anytime to copy"
            >
              {copied ? "COPIED! ✓" : "COPY (C)"}
            </button>
          </div>

          {/* MODAL FOOTER ACTIONS */}
          <div className="csnades-modal-footer">
            <button
              type="button"
              className="csnades-footer-btn place-btn"
              onClick={() => {
                onPlaceLineup(lineup);
                onClose();
              }}
            >
              <Icon name="target" size={14} /> PLACE ON TACTICAL WHITEBOARD
            </button>
            <button type="button" className="csnades-footer-btn close-btn" onClick={onClose}>
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
