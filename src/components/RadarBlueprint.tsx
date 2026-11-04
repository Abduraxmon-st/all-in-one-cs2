import type { FC } from "react";

interface Props {
  mapName: string;
}

export const RadarBlueprint: FC<Props> = ({ mapName }) => {
  const normMap = mapName.toLowerCase();

  return (
    <svg
      className="strat-svg-blueprint"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Subtle grid pattern */}
        <pattern id="bp-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(200, 241, 53, 0.08)" strokeWidth="0.3" />
        </pattern>
        <pattern id="bp-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.4" fill="rgba(255, 255, 255, 0.12)" />
        </pattern>
        {/* Site Glows */}
        <filter id="glow-a" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#facc15" floodOpacity="0.4" />
        </filter>
        <filter id="glow-b" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor="#f97316" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Blueprint background grid */}
      <rect width="100" height="100" fill="#0b100d" />
      <rect width="100" height="100" fill="url(#bp-grid)" />
      <rect width="100" height="100" fill="url(#bp-dots)" />

      {/* Tactical Radar Ring Overlays */}
      <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(200, 241, 53, 0.12)" strokeWidth="0.4" strokeDasharray="2,2" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(200, 241, 53, 0.08)" strokeWidth="0.3" />
      <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(200, 241, 53, 0.06)" strokeWidth="0.3" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(200, 241, 53, 0.06)" strokeWidth="0.3" />

      {/* Architectural Topological Corridors per map */}
      {normMap === "de_inferno" && (
        <g className="bp-map de_inferno">
          {/* T Spawn & 2nd Mid */}
          <path d="M 42 84 L 58 84 L 58 95 L 42 95 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          <path d="M 44 65 L 56 65 L 56 84 L 44 84 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Banana */}
          <path d="M 22 55 Q 20 75 42 80 L 42 72 Q 28 68 28 55 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* B Site */}
          <rect x="16" y="24" width="18" height="24" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* Construction & Ruins */}
          <path d="M 16 20 L 32 20 L 32 24 L 16 24 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Mid & Arch */}
          <path d="M 46 45 L 56 45 L 56 65 L 46 65 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          <path d="M 52 32 L 62 32 L 62 45 L 52 45 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* CT Spawn */}
          <path d="M 48 14 L 64 14 L 64 26 L 48 26 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />
          {/* A Site */}
          <rect x="68" y="26" width="20" height="22" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* Apartments & Boiler */}
          <path d="M 58 50 L 78 50 L 78 68 L 68 68 L 68 56 L 58 56 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Pit & Balcony */}
          <path d="M 76 20 L 88 20 L 88 26 L 76 26 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />

          {/* Callout Labels */}
          <text x="50" y="91" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="25" y="37" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="26" y="68" textAnchor="middle" fill="#93c5fd" fontSize="2.5">BANANA</text>
          <text x="51" y="58" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID</text>
          <text x="78" y="38" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="72" y="60" textAnchor="middle" fill="#93c5fd" fontSize="2.5">APPS</text>
          <text x="56" y="21" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
          <text x="82" y="24" textAnchor="middle" fill="#a7f3d0" fontSize="2.2">PIT</text>
        </g>
      )}

      {normMap === "de_mirage" && (
        <g className="bp-map de_mirage">
          {/* T Spawn */}
          <path d="M 44 85 L 60 85 L 60 96 L 44 96 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Mid & Top Mid */}
          <path d="M 44 55 L 56 55 L 56 82 L 44 82 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Underpass & Window */}
          <path d="M 46 48 L 56 48 L 56 55 L 46 55 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Connector & Jungle */}
          <path d="M 56 42 L 66 42 L 66 54 L 56 54 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* A Ramp & Palace */}
          <path d="M 68 64 L 84 64 L 84 84 L 68 84 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          <path d="M 78 50 L 88 50 L 88 64 L 78 64 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* A Site */}
          <rect x="66" y="32" width="20" height="20" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* B Apartments */}
          <path d="M 18 54 L 38 54 L 38 78 L 26 78 L 26 62 L 18 62 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Catwalk & Short B */}
          <path d="M 32 44 L 46 44 L 46 54 L 32 54 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* B Site */}
          <rect x="18" y="28" width="18" height="22" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* Market / Kitchen */}
          <path d="M 28 20 L 42 20 L 42 30 L 28 30 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* CT Spawn */}
          <path d="M 46 16 L 62 16 L 62 28 L 46 28 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          {/* Labels */}
          <text x="52" y="92" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="50" y="68" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID</text>
          <text x="27" y="40" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="26" y="68" textAnchor="middle" fill="#93c5fd" fontSize="2.5">B APPS</text>
          <text x="76" y="43" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="76" y="74" textAnchor="middle" fill="#93c5fd" fontSize="2.5">A RAMP</text>
          <text x="83" y="58" textAnchor="middle" fill="#a7f3d0" fontSize="2.2">PALACE</text>
          <text x="54" y="23" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {normMap === "de_dust2" && (
        <g className="bp-map de_dust2">
          {/* T Spawn & Suicide */}
          <path d="M 42 82 L 58 82 L 58 95 L 42 95 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          <path d="M 46 64 L 54 64 L 54 82 L 46 82 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Long Doors & Outside Long */}
          <path d="M 68 72 L 86 72 L 86 86 L 68 86 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Long A & Pit */}
          <path d="M 76 38 L 88 38 L 88 72 L 76 72 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* A Site */}
          <rect x="66" y="22" width="20" height="18" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* Catwalk & Short A */}
          <path d="M 54 36 L 68 36 L 68 48 L 54 48 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Mid Doors */}
          <path d="M 44 48 L 56 48 L 56 64 L 44 64 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Upper & Lower Tunnels */}
          <path d="M 18 48 L 38 48 L 38 68 L 18 68 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* B Site */}
          <rect x="16" y="22" width="20" height="20" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* CT Spawn */}
          <path d="M 46 22 L 62 22 L 62 34 L 46 34 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          {/* Labels */}
          <text x="50" y="90" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="26" y="33" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="28" y="58" textAnchor="middle" fill="#93c5fd" fontSize="2.5">TUNNELS</text>
          <text x="50" y="56" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID</text>
          <text x="76" y="32" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="82" y="58" textAnchor="middle" fill="#93c5fd" fontSize="2.5">LONG A</text>
          <text x="54" y="28" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {normMap === "de_nuke" && (
        <g className="bp-map de_nuke">
          {/* T Spawn */}
          <path d="M 14 80 L 30 80 L 30 94 L 14 94 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Lobby & Radio */}
          <path d="M 28 60 L 46 60 L 46 80 L 28 80 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Ramp */}
          <path d="M 26 40 L 40 40 L 40 60 L 26 60 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* Lower B Site */}
          <rect x="28" y="22" width="18" height="18" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* Upper A Site */}
          <rect x="44" y="34" width="20" height="20" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* Outside & Yard */}
          <path d="M 66 40 L 86 40 L 86 78 L 66 78 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* CT Spawn & Garage */}
          <path d="M 68 18 L 84 18 L 84 34 L 68 34 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          {/* Labels */}
          <text x="22" y="88" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="37" y="70" textAnchor="middle" fill="#93c5fd" fontSize="2.5">LOBBY</text>
          <text x="37" y="32" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE (LOWER)</text>
          <text x="54" y="45" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE (UPPER)</text>
          <text x="76" y="60" textAnchor="middle" fill="#93c5fd" fontSize="2.5">OUTSIDE</text>
          <text x="76" y="27" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {normMap === "de_ancient" && (
        <g className="bp-map de_ancient">
          {/* T Spawn */}
          <path d="M 42 84 L 58 84 L 58 96 L 42 96 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Mid & Elbow */}
          <path d="M 44 48 L 56 48 L 56 82 L 44 82 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* A Main & Halls */}
          <path d="M 66 56 L 82 56 L 82 78 L 66 78 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* A Site */}
          <rect x="66" y="28" width="20" height="22" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* B Main & Ramp */}
          <path d="M 18 54 L 36 54 L 36 78 L 18 78 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* B Site */}
          <rect x="18" y="26" width="18" height="22" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* CT Spawn */}
          <path d="M 42 16 L 58 16 L 58 28 L 42 28 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          {/* Labels */}
          <text x="50" y="91" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="50" y="64" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID</text>
          <text x="27" y="38" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="76" y="39" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="50" y="23" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {normMap === "de_anubis" && (
        <g className="bp-map de_anubis">
          {/* T Spawn */}
          <path d="M 42 84 L 58 84 L 58 96 L 42 96 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          {/* Canal & B Main */}
          <path d="M 18 52 L 36 52 L 36 82 L 18 82 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* B Site */}
          <rect x="18" y="26" width="18" height="22" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          {/* Mid & Bridge */}
          <path d="M 44 48 L 56 48 L 56 80 L 44 80 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* A Main & Walkway */}
          <path d="M 66 52 L 82 52 L 82 78 L 66 78 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          {/* A Site */}
          <rect x="66" y="26" width="20" height="22" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          {/* CT Spawn */}
          <path d="M 44 14 L 58 14 L 58 26 L 44 26 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          {/* Labels */}
          <text x="50" y="91" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="50" y="64" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID / BRIDGE</text>
          <text x="27" y="38" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="76" y="38" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="51" y="21" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {/* Fallback for other maps */}
      {!["de_inferno", "de_mirage", "de_dust2", "de_nuke", "de_ancient", "de_anubis"].includes(normMap) && (
        <g className="bp-map de_generic">
          {/* Generic corridors */}
          <path d="M 42 82 L 58 82 L 58 95 L 42 95 Z" fill="#141f18" stroke="#2e4839" strokeWidth="0.6" />
          <path d="M 46 50 L 54 50 L 54 82 L 46 82 Z" fill="#17241c" stroke="#355642" strokeWidth="0.6" />
          <rect x="68" y="24" width="20" height="22" rx="2" fill="rgba(250, 204, 21, 0.12)" stroke="#facc15" strokeWidth="0.8" filter="url(#glow-a)" />
          <rect x="16" y="24" width="20" height="22" rx="2" fill="rgba(249, 115, 22, 0.12)" stroke="#f97316" strokeWidth="0.8" filter="url(#glow-b)" />
          <path d="M 44 14 L 56 14 L 56 26 L 44 26 Z" fill="#101d24" stroke="#2b5066" strokeWidth="0.6" />

          <text x="50" y="90" textAnchor="middle" fill="#f59e0b" fontSize="2.8" fontWeight="bold">T SPAWN</text>
          <text x="50" y="65" textAnchor="middle" fill="#93c5fd" fontSize="2.5">MID</text>
          <text x="26" y="36" textAnchor="middle" fill="#f97316" fontSize="3.5" fontWeight="bold">B SITE</text>
          <text x="78" y="36" textAnchor="middle" fill="#facc15" fontSize="3.5" fontWeight="bold">A SITE</text>
          <text x="50" y="21" textAnchor="middle" fill="#38bdf8" fontSize="2.8" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {/* Blueprint Header Watermark */}
      <text x="4" y="6" fill="rgba(200, 241, 53, 0.6)" fontSize="2.2" fontWeight="bold" letterSpacing="0.1em">
        ARCHITECTURAL RADAR BLUEPRINT · {mapName.replace(/^de_/, "").toUpperCase()}
      </text>
      <text x="96" y="6" textAnchor="end" fill="rgba(255, 255, 255, 0.3)" fontSize="2" letterSpacing="0.08em">
        CLUTCH LABS TACTICAL 2.0
      </text>
    </svg>
  );
};

export default RadarBlueprint;
