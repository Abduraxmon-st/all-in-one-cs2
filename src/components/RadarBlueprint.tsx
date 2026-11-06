import type { FC } from "react";

interface Props {
  mapName: string;
}

export const RadarBlueprint: FC<Props> = ({ mapName }) => {
  const cleanMap = (mapName || "").toLowerCase().replace(/^de_/, "");
  const normMap = `de_${cleanMap}`;

  return (
    <svg
      className="strat-svg-blueprint"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ zIndex: 1 }}
    >
      <defs>
        {/* Subtle grid pattern */}
        <pattern id="bp-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(200, 241, 53, 0.15)" strokeWidth="0.3" />
        </pattern>
        <pattern id="bp-dots" width="5" height="5" patternUnits="userSpaceOnUse">
          <circle cx="2.5" cy="2.5" r="0.4" fill="rgba(255, 255, 255, 0.18)" />
        </pattern>
        {/* High-Contrast Bombsite Glow Filters */}
        <filter id="glow-a" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#facc15" floodOpacity="0.8" />
        </filter>
        <filter id="glow-b" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#f97316" floodOpacity="0.8" />
        </filter>
      </defs>

      {/* Blueprint base background grid */}
      <rect width="100" height="100" fill="#0d1410" />
      <rect width="100" height="100" fill="url(#bp-grid)" />
      <rect width="100" height="100" fill="url(#bp-dots)" />

      {/* Tactical Radar Concentric Target Rings */}
      <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(200, 241, 53, 0.22)" strokeWidth="0.4" strokeDasharray="3,2" />
      <circle cx="50" cy="50" r="28" fill="none" stroke="rgba(200, 241, 53, 0.18)" strokeWidth="0.3" />
      <circle cx="50" cy="50" r="14" fill="none" stroke="rgba(200, 241, 53, 0.14)" strokeWidth="0.25" strokeDasharray="2,2" />
      <line x1="50" y1="2" x2="50" y2="98" stroke="rgba(200, 241, 53, 0.12)" strokeWidth="0.3" />
      <line x1="2" y1="50" x2="98" y2="50" stroke="rgba(200, 241, 53, 0.12)" strokeWidth="0.3" />

      {/* ========================================================
          DE_INFERNO High-Contrast Blueprint Architecture
          Corridors: #254432 / #2e533d | Stroke: #4e8766
          ======================================================== */}
      {normMap === "de_inferno" && (
        <g className="bp-map de_inferno">
          {/* T Spawn & 2nd Mid */}
          <path d="M 40 82 L 60 82 L 60 96 L 40 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          <path d="M 44 65 L 56 65 L 56 82 L 44 82 Z" fill="#2e533d" stroke="#4e8766" strokeWidth="0.8" />
          {/* Banana */}
          <path d="M 20 54 Q 18 76 42 80 L 42 70 Q 28 66 28 54 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.9" />
          {/* B Site Glowing Box */}
          <rect x="15" y="24" width="20" height="24" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* Construction & Ruins */}
          <path d="M 14 18 L 34 18 L 34 24 L 14 24 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Mid & Arch */}
          <path d="M 46 45 L 56 45 L 56 65 L 46 65 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          <path d="M 52 30 L 64 30 L 64 45 L 52 45 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* CT Spawn */}
          <path d="M 46 12 L 66 12 L 66 26 L 46 26 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />
          {/* A Site Glowing Box */}
          <rect x="67" y="25" width="22" height="23" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* Apartments & Boiler */}
          <path d="M 58 48 L 80 48 L 80 68 L 68 68 L 68 56 L 58 56 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Pit & Balcony */}
          <path d="M 76 18 L 90 18 L 90 26 L 76 26 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />

          {/* Prominent High-Contrast Callouts */}
          <text x="50" y="90" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="25" y="37" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="25" y="67" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">BANANA</text>
          <text x="51" y="56" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID</text>
          <text x="78" y="37" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="74" y="60" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">APPS</text>
          <text x="56" y="20" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
          <text x="83" y="23" textAnchor="middle" fill="#a7f3d0" fontSize="2.5" fontWeight="bold">PIT</text>
        </g>
      )}

      {/* ========================================================
          DE_MIRAGE High-Contrast Blueprint Architecture
          ======================================================== */}
      {normMap === "de_mirage" && (
        <g className="bp-map de_mirage">
          {/* T Spawn */}
          <path d="M 42 84 L 62 84 L 62 96 L 42 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Mid & Top Mid */}
          <path d="M 43 54 L 57 54 L 57 82 L 43 82 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Underpass & Window */}
          <path d="M 45 46 L 57 46 L 57 54 L 45 54 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Connector & Jungle */}
          <path d="M 57 40 L 68 40 L 68 54 L 57 54 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* A Ramp & Palace */}
          <path d="M 68 62 L 85 62 L 85 84 L 68 84 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          <path d="M 77 48 L 89 48 L 89 62 L 77 62 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* A Site Glowing Box */}
          <rect x="65" y="30" width="22" height="22" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* B Apartments */}
          <path d="M 16 52 L 38 52 L 38 78 L 26 78 L 26 62 L 16 62 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Catwalk & Short B */}
          <path d="M 30 42 L 46 42 L 46 54 L 30 54 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* B Site Glowing Box */}
          <rect x="17" y="26" width="20" height="23" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* Market / Kitchen */}
          <path d="M 27 18 L 43 18 L 43 29 L 27 29 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* CT Spawn */}
          <path d="M 45 14 L 63 14 L 63 27 L 45 27 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          {/* Prominent High-Contrast Callouts */}
          <text x="52" y="91" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="50" y="66" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID</text>
          <text x="27" y="39" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="26" y="67" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">B APPS</text>
          <text x="76" y="42" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="76" y="73" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">A RAMP</text>
          <text x="83" y="56" textAnchor="middle" fill="#a7f3d0" fontSize="2.5" fontWeight="bold">PALACE</text>
          <text x="54" y="21" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
          <text x="63" y="48" textAnchor="middle" fill="#93c5fd" fontSize="2.3">CONNECTOR</text>
          <text x="38" y="49" textAnchor="middle" fill="#93c5fd" fontSize="2.3">CATWALK</text>
        </g>
      )}

      {/* ========================================================
          DE_DUST2 High-Contrast Blueprint Architecture
          ======================================================== */}
      {normMap === "de_dust2" && (
        <g className="bp-map de_dust2">
          {/* T Spawn & Suicide */}
          <path d="M 40 82 L 60 82 L 60 96 L 40 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          <path d="M 45 64 L 55 64 L 55 82 L 45 82 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Long Doors & Outside Long */}
          <path d="M 66 70 L 88 70 L 88 86 L 66 86 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Long A & Pit */}
          <path d="M 75 36 L 89 36 L 89 70 L 75 70 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* A Site Glowing Box */}
          <rect x="65" y="20" width="22" height="20" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* Catwalk & Short A */}
          <path d="M 53 34 L 69 34 L 69 48 L 53 48 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Mid Doors */}
          <path d="M 43 48 L 57 48 L 57 64 L 43 64 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Upper & Lower Tunnels */}
          <path d="M 16 46 L 39 46 L 39 68 L 16 68 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* B Site Glowing Box */}
          <rect x="15" y="20" width="22" height="22" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* CT Spawn */}
          <path d="M 45 20 L 63 20 L 63 33 L 45 33 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          {/* Prominent High-Contrast Callouts */}
          <text x="50" y="90" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="26" y="32" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="27" y="58" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">TUNNELS</text>
          <text x="50" y="55" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID</text>
          <text x="76" y="31" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="82" y="56" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">LONG A</text>
          <text x="61" y="42" textAnchor="middle" fill="#93c5fd" fontSize="2.4" fontWeight="bold">CATWALK</text>
          <text x="54" y="27" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {/* ========================================================
          DE_NUKE High-Contrast Blueprint Architecture
          ======================================================== */}
      {normMap === "de_nuke" && (
        <g className="bp-map de_nuke">
          {/* T Spawn */}
          <path d="M 12 78 L 30 78 L 30 95 L 12 95 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Lobby & Radio */}
          <path d="M 26 58 L 47 58 L 47 80 L 26 80 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Ramp */}
          <path d="M 25 38 L 41 38 L 41 60 L 25 60 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* Lower B Site Glowing Box */}
          <rect x="27" y="20" width="20" height="20" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* Upper A Site Glowing Box */}
          <rect x="43" y="32" width="22" height="22" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* Outside & Yard */}
          <path d="M 65 38 L 88 38 L 88 80 L 65 80 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* CT Spawn & Garage */}
          <path d="M 66 16 L 86 16 L 86 34 L 66 34 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          {/* Prominent High-Contrast Callouts */}
          <text x="21" y="88" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="36" y="70" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">LOBBY</text>
          <text x="37" y="31" textAnchor="middle" fill="#f97316" fontSize="3.6" fontWeight="bold">B SITE (LOWER)</text>
          <text x="54" y="44" textAnchor="middle" fill="#facc15" fontSize="3.6" fontWeight="bold">A SITE (UPPER)</text>
          <text x="76" y="60" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">OUTSIDE</text>
          <text x="76" y="26" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {/* ========================================================
          DE_ANCIENT High-Contrast Blueprint Architecture
          ======================================================== */}
      {normMap === "de_ancient" && (
        <g className="bp-map de_ancient">
          {/* T Spawn */}
          <path d="M 40 82 L 60 82 L 60 96 L 40 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Mid & Elbow */}
          <path d="M 43 46 L 57 46 L 57 82 L 43 82 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* A Main & Halls */}
          <path d="M 65 54 L 84 54 L 84 78 L 65 78 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* A Site Glowing Box */}
          <rect x="65" y="26" width="22" height="23" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* B Main & Ramp */}
          <path d="M 16 52 L 37 52 L 37 78 L 16 78 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* B Site Glowing Box */}
          <rect x="17" y="24" width="20" height="23" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* CT Spawn */}
          <path d="M 40 14 L 60 14 L 60 27 L 40 27 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          {/* Prominent High-Contrast Callouts */}
          <text x="50" y="90" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="50" y="63" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID</text>
          <text x="27" y="37" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="76" y="38" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="50" y="22" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
          <text x="74" y="67" textAnchor="middle" fill="#c8f135" fontSize="2.5">A MAIN</text>
          <text x="26" y="66" textAnchor="middle" fill="#c8f135" fontSize="2.5">B MAIN</text>
        </g>
      )}

      {/* ========================================================
          DE_ANUBIS High-Contrast Blueprint Architecture
          ======================================================== */}
      {normMap === "de_anubis" && (
        <g className="bp-map de_anubis">
          {/* T Spawn */}
          <path d="M 40 82 L 60 82 L 60 96 L 40 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          {/* Canal & B Main */}
          <path d="M 16 50 L 37 50 L 37 82 L 16 82 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* B Site Glowing Box */}
          <rect x="17" y="24" width="20" height="23" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          {/* Mid & Bridge */}
          <path d="M 43 46 L 57 46 L 57 80 L 43 80 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* A Main & Walkway */}
          <path d="M 65 50 L 84 50 L 84 78 L 65 78 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          {/* A Site Glowing Box */}
          <rect x="65" y="24" width="22" height="23" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          {/* CT Spawn */}
          <path d="M 42 12 L 58 12 L 58 25 L 42 25 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          {/* Prominent High-Contrast Callouts */}
          <text x="50" y="90" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="50" y="63" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID / BRIDGE</text>
          <text x="27" y="37" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="76" y="37" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="50" y="20" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
          <text x="74" y="66" textAnchor="middle" fill="#c8f135" fontSize="2.5">A WALKWAY</text>
          <text x="26" y="68" textAnchor="middle" fill="#c8f135" fontSize="2.5">CANAL</text>
        </g>
      )}

      {/* Fallback for other maps (Train, Vertigo, Overpass, etc.) */}
      {!["de_inferno", "de_mirage", "de_dust2", "de_nuke", "de_ancient", "de_anubis"].includes(normMap) && (
        <g className="bp-map de_generic">
          <path d="M 40 82 L 60 82 L 60 96 L 40 96 Z" fill="#254432" stroke="#4e8766" strokeWidth="0.8" />
          <path d="M 45 48 L 55 48 L 55 82 L 45 82 Z" fill="#2e533d" stroke="#5ba179" strokeWidth="0.8" />
          <rect x="67" y="24" width="22" height="23" rx="2" fill="rgba(250, 204, 21, 0.22)" stroke="#facc15" strokeWidth="1.2" filter="url(#glow-a)" />
          <rect x="15" y="24" width="22" height="23" rx="2" fill="rgba(249, 115, 22, 0.22)" stroke="#f97316" strokeWidth="1.2" filter="url(#glow-b)" />
          <path d="M 42 12 L 58 12 L 58 25 L 42 25 Z" fill="#1b3345" stroke="#38bdf8" strokeWidth="0.9" />

          <text x="50" y="90" textAnchor="middle" fill="#fbbf24" fontSize="3" fontWeight="bold">T SPAWN</text>
          <text x="50" y="65" textAnchor="middle" fill="#c8f135" fontSize="2.8" fontWeight="bold">MID</text>
          <text x="26" y="37" textAnchor="middle" fill="#f97316" fontSize="3.8" fontWeight="bold">B SITE</text>
          <text x="78" y="37" textAnchor="middle" fill="#facc15" fontSize="3.8" fontWeight="bold">A SITE</text>
          <text x="50" y="20" textAnchor="middle" fill="#38bdf8" fontSize="3" fontWeight="bold">CT SPAWN</text>
        </g>
      )}

      {/* Blueprint Watermark */}
      <text x="4" y="6" fill="#c8f135" fontSize="2.4" fontWeight="bold" letterSpacing="0.1em">
        ARCHITECTURAL RADAR BLUEPRINT · {cleanMap.toUpperCase()}
      </text>
      <text x="96" y="6" textAnchor="end" fill="rgba(255, 255, 255, 0.4)" fontSize="2" letterSpacing="0.08em">
        CLUTCH LABS TACTICAL 2.0
      </text>
    </svg>
  );
};

export default RadarBlueprint;
