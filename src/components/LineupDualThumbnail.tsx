import type { FC } from "react";
import type { UtilityLineup, UtilityType } from "../features/stratboard/types";
import Icon, { type IconName } from "./Icon";
import "./LineupDualThumbnail.css";

interface Props {
  lineup: UtilityLineup;
  mapName: string;
  onClick?: () => void;
}

const utilityTheme: Record<UtilityType, { color: string; label: string; icon: IconName }> = {
  SMOKE: { color: "#f59e0b", label: "SMOKE", icon: "smoke" },
  MOLOTOV: { color: "#f97316", label: "MOLOTOV", icon: "molotov" },
  FLASH: { color: "#facc15", label: "FLASH", icon: "flash" },
  HE: { color: "#ef4444", label: "HE GRENADE", icon: "he" },
};

function getLineupViews(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  const views = 3400 + (hash % 15800);
  return views.toLocaleString();
}

function extractYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([a-zA-Z0-9_-]{11})(?![a-zA-Z0-9_-])/);
  return match ? match[1] : null;
}

export const LineupDualThumbnail: FC<Props> = ({ lineup, mapName, onClick }) => {
  const theme = utilityTheme[lineup.utilityType] ?? utilityTheme.SMOKE;
  const views = getLineupViews(lineup.id);
  const cleanMap = (mapName || "").toLowerCase().replace(/^de_/, "");
  const ytId = extractYouTubeId(lineup.videoUrl);

  const leftBg = ytId
    ? `radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.2) 0%, rgba(10, 14, 12, 0.75) 100%), url(https://i.ytimg.com/vi/${ytId}/hqdefault.jpg)`
    : `radial-gradient(circle at 50% 50%, rgba(15, 23, 42, 0.4) 0%, rgba(10, 14, 12, 0.95) 100%), url(/maps/de_${cleanMap}.webp)`;

  const rightBg = `radial-gradient(circle at 50% 50%, rgba(20, 24, 20, 0.3) 0%, rgba(10, 14, 12, 0.95) 100%), url(/maps/de_${cleanMap}.webp)`;

  return (
    <div
      className="cs2nades-dual-thumb"
      onClick={onClick}
      role="button"
      tabIndex={0}
      title={`Inspect ${lineup.title}`}
    >
      {/* Top Floating Badge Strip */}
      <div className="cs2nades-thumb-header">
        <span className="cs2nades-util-badge" style={{ borderColor: theme.color, color: theme.color }}>
          <Icon name={theme.icon} size={11} /> {theme.label}
        </span>
        <span className="cs2nades-views-pill">
          👁 {views}
        </span>
        <span className={`cs2nades-side-pill ${lineup.teamSide.toLowerCase()}`}>
          {lineup.teamSide} SIDE
        </span>
      </div>

      {/* Split Dual-Screen Canvas */}
      <div className="cs2nades-split-canvas">
        {/* Left Half: Throw Position / Crosshair Reticle */}
        <div className="cs2nades-thumb-half left">
          <div
            className="cs2nades-thumb-bg"
            style={{
              backgroundImage: leftBg,
              backgroundPosition: ytId ? "center" : `${lineup.standX}% ${lineup.standY}%`,
              backgroundSize: ytId ? "cover" : "280%",
            }}
          />
          {/* Tactical Crosshair Reticle */}
          <svg className="cs2nades-reticle-svg" viewBox="0 0 100 100">
            {/* Fine Crosshair Lines */}
            <line x1="50" y1="20" x2="50" y2="44" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.85" />
            <line x1="50" y1="56" x2="50" y2="80" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.85" />
            <line x1="20" y1="50" x2="44" y2="50" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.85" />
            <line x1="56" y1="50" x2="80" y2="50" stroke="#fff" strokeWidth="1.2" strokeOpacity="0.85" />
            {/* Center Aim Dot */}
            <circle cx="50" cy="50" r="1.5" fill={theme.color} />
            <circle cx="50" cy="50" r="12" fill="none" stroke={theme.color} strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.7" />
          </svg>
          <span className="cs2nades-split-label throw-label">
            AIM · ({lineup.standX.toFixed(1)}, {lineup.standY.toFixed(1)})
          </span>
        </div>

        {/* Divider Blade */}
        <div className="cs2nades-divider-blade" />

        {/* Right Half: Landing Bloom / Smoke / Fire */}
        <div className="cs2nades-thumb-half right">
          <div
            className="cs2nades-thumb-bg"
            style={{
              backgroundImage: rightBg,
              backgroundPosition: `${lineup.landX}% ${lineup.landY}%`,
              backgroundSize: "280%",
            }}
          />
          {/* Utility Landing Bloom Graphic */}
          <div className="cs2nades-bloom-overlay">
            {lineup.utilityType === "SMOKE" && (
              <svg className="cs2nades-bloom-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="28" fill="rgba(245, 158, 11, 0.18)" filter="blur(8px)" />
                <circle cx="50" cy="50" r="20" fill="rgba(148, 163, 184, 0.4)" filter="blur(4px)" />
                <circle cx="44" cy="46" r="14" fill="rgba(203, 213, 225, 0.55)" filter="blur(3px)" />
                <circle cx="56" cy="52" r="15" fill="rgba(203, 213, 225, 0.5)" filter="blur(3px)" />
                <circle cx="50" cy="50" r="2" fill="#fff" />
              </svg>
            )}
            {lineup.utilityType === "MOLOTOV" && (
              <svg className="cs2nades-bloom-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="26" fill="rgba(249, 115, 22, 0.35)" filter="blur(7px)" />
                <circle cx="50" cy="50" r="16" fill="rgba(251, 191, 36, 0.6)" filter="blur(4px)" />
                <circle cx="50" cy="48" r="8" fill="#fff" filter="blur(2px)" />
              </svg>
            )}
            {lineup.utilityType === "FLASH" && (
              <svg className="cs2nades-bloom-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="30" fill="rgba(250, 204, 21, 0.35)" filter="blur(9px)" />
                <circle cx="50" cy="50" r="14" fill="#ffffff" filter="blur(3px)" />
              </svg>
            )}
            {lineup.utilityType === "HE" && (
              <svg className="cs2nades-bloom-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="28" fill="rgba(239, 68, 68, 0.35)" filter="blur(8px)" />
                <circle cx="50" cy="12" fill="#fed7aa" filter="blur(3px)" />
              </svg>
            )}
          </div>
          <span className="cs2nades-split-label landing-label">
            LANDING · {lineup.throwType.toUpperCase()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default LineupDualThumbnail;
