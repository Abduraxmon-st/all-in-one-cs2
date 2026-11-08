import { useState, useEffect, useRef, type MouseEvent } from "react";
import type { UtilityLineup, UtilityType } from "../features/stratboard/types";
import ClipPlayer from "./ClipPlayer";
import Icon, { type IconName } from "./Icon";
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

export default function LineupDetailModal({ lineup, onClose, onPlaceLineup }: Props) {
  const [activeTab, setActiveTab] = useState<ModalTab>("video");
  const [copied, setCopied] = useState(false);
  const [lensPos, setLensPos] = useState<{ x: number; y: number; show: boolean }>({
    x: 50,
    y: 50,
    show: false,
  });
  const aimContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lineup) return;
    setActiveTab(lineup.videoUrl ? "video" : "aim");
    setCopied(false);
  }, [lineup?.id]);

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
                {/* Tactical First-Person Aim Backdrop */}
                <div className="csnades-aim-skyline">
                  {/* Sky & Lighting */}
                  <div className="csnades-aim-sky" />
                  {/* Architectural Building silhouettes */}
                  <svg
                    className="csnades-aim-svg-backdrop"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                  >
                    {/* Distant building wall */}
                    <rect x="0" y="40" width="38" height="60" fill="#18231e" stroke="#25352c" />
                    <rect x="38" y="28" width="28" height="72" fill="#121b16" stroke="#2a3d32" />
                    <rect x="66" y="46" width="34" height="54" fill="#1e2c24" stroke="#2e4236" />
                    {/* Roof trims & windows */}
                    <line x1="0" y1="40" x2="38" y2="40" stroke="#f59e0b" strokeWidth="0.8" opacity="0.6" />
                    <line x1="38" y1="28" x2="66" y2="28" stroke="#38bdf8" strokeWidth="0.8" opacity="0.6" />
                    <line x1="66" y1="46" x2="100" y2="46" stroke="#f59e0b" strokeWidth="0.8" opacity="0.6" />
                    {/* Landmark Antenna / Corner alignment target */}
                    <line x1="50" y1="28" x2="50" y2="15" stroke="#94a3b8" strokeWidth="0.6" />
                    <circle cx="50" cy="15" r="1.2" fill="#ef4444" />
                    <line x1="47" y1="18" x2="53" y2="18" stroke="#94a3b8" strokeWidth="0.4" />
                    <line x1="48" y1="22" x2="52" y2="22" stroke="#94a3b8" strokeWidth="0.4" />
                  </svg>

                  {/* Aim Crosshair Reticle (Centered at 50%, 50%) */}
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
                      🎯 AIM TARGET:{" "}
                      {lineup.precision === "Precise"
                        ? "Antenna tip / edge intersection"
                        : "Roof corner silhouette"}
                    </span>
                  </div>

                  {/* Interactive 2.5x Magnifying Zoom Lens */}
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
                        className="csnades-magnifier-content"
                        style={{
                          transform: `scale(2.5) translate(${50 - lensPos.x}%, ${50 - lensPos.y}%)`,
                        }}
                      >
                        {/* Mini zoom background */}
                        <div className="csnades-aim-crosshair-center zoom">
                          <div className="ch-line ch-top" />
                          <div className="ch-line ch-bottom" />
                          <div className="ch-line ch-left" />
                          <div className="ch-line ch-right" />
                          <div className="ch-center-dot" />
                        </div>
                      </div>
                      <div className="csnades-lens-reticle" />
                      <span className="csnades-lens-tag">2.5× ZOOM</span>
                    </div>
                  )}
                </div>
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
                <img
                  src={`/maps/${lineup.mapName}.png`}
                  alt={lineup.mapName}
                  className="csnades-stand-radar-img"
                  onError={(e) => {
                    const clean = lineup.mapName.toLowerCase().replace(/^de_/, "");
                    (e.currentTarget as HTMLImageElement).src = `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/maps/de_${clean}.png`;
                  }}
                />
                <svg className="csnades-stand-radar-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Dashed trajectory connecting stand to landing */}
                  <line
                    x1={lineup.standX}
                    y1={lineup.standY}
                    x2={lineup.landX}
                    y2={lineup.landY}
                    stroke={color}
                    strokeWidth="1.6"
                    strokeDasharray="3,3"
                  />
                  {/* Stand Point Pin */}
                  <circle
                    cx={lineup.standX}
                    cy={lineup.standY}
                    r="3.5"
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth="1.2"
                  />
                  <circle
                    cx={lineup.standX}
                    cy={lineup.standY}
                    r="6.5"
                    fill="none"
                    stroke={color}
                    strokeWidth="0.8"
                    opacity="0.7"
                    className="stand-pulse-ring"
                  />
                  {/* Land Point Pin */}
                  <circle
                    cx={lineup.landX}
                    cy={lineup.landY}
                    r="2.8"
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth="1.2"
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
            <div className="csnades-tech-keys">
              <span className="csnades-keys-label">KEYBINDS:</span>
              {keybinds.map((kb) => (
                <span key={kb.key} className="csnades-key-chip">
                  <kbd>{kb.key}</kbd>
                  <span>{kb.label}</span>
                </span>
              ))}
            </div>

            <div className="csnades-tech-meta">
              {lineup.movement && (
                <span className="csnades-meta-pill">
                  <strong>Movement:</strong> {lineup.movement}
                </span>
              )}
              {lineup.precision && (
                <span className="csnades-meta-pill">
                  <strong>Precision:</strong> {lineup.precision}
                </span>
              )}
              {lineup.viewsCount && (
                <span className="csnades-meta-pill">
                  👁 {lineup.viewsCount.toLocaleString()} views
                </span>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}
          {lineup.description && (
            <p className="csnades-modal-desc-box">{lineup.description}</p>
          )}

          {/* CONSOLE COMMAND BAR */}
          <div className="csnades-console-bar">
            <div className="csnades-console-text-wrap">
              <span className="csnades-console-label">CS2 CONSOLE:</span>
              <code className="csnades-console-code">{consoleCommand}</code>
            </div>
            <button
              type="button"
              className={`csnades-console-copy-btn ${copied ? "copied" : ""}`}
              onClick={copyConsoleCommand}
              title="Copy console command (Hotkey: C)"
            >
              {copied ? "✓ COPIED!" : "COPY CONSOLE (C)"}
            </button>
          </div>
        </div>

        {/* MODAL FOOTER ACTIONS */}
        <div className="csnades-modal-footer">
          <button
            type="button"
            className="csnades-place-board-btn"
            onClick={() => {
              onPlaceLineup(lineup);
              onClose();
            }}
          >
            + SEND TO TACTICAL BOARD
          </button>
          {lineup.videoUrl && (
            <a
              href={lineup.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="csnades-ext-link-btn"
            >
              OPEN SOURCE VIDEO ↗
            </a>
          )}
          <button type="button" className="csnades-footer-close-btn" onClick={onClose}>
            CLOSE (ESC)
          </button>
        </div>
      </div>
    </div>
  );
}
