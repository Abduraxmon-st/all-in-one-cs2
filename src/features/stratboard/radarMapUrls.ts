/**
 * Bulletproof multi-source radar map URL resolver for every CS2 competitive map.
 *
 * Resolution order per map:
 *   1. Local committed file: /maps/de_{map}.webp (in public/maps/ as regular Git blob)
 *   2. Local committed file: /maps/de_{map}.png  (in public/maps/ as regular Git blob)
 *   3. Official csnades.gg CDN (webp) - verified 100% HTTP 200 for all 9 maps
 */

export interface RadarSource {
  url: string;
  label: string;
}

const CSNADES_CDN: Record<string, string> = {
  mirage:   "https://assets.csnades.gg/mirage_game_radar_dfb164f478.webp",
  inferno:  "https://assets.csnades.gg/inferno_game_radar_bbecda6217.webp",
  dust2:    "https://assets.csnades.gg/dust2_game_radar_1b998342f2.webp",
  nuke:     "https://assets.csnades.gg/nuke_game_radar_9276ffd1a4.webp",
  ancient:  "https://assets.csnades.gg/ancient_game_radar_14875e0cb1.webp",
  anubis:   "https://assets.csnades.gg/anubis_game_radar_7bada7b5e9.webp",
  overpass: "https://assets.csnades.gg/overpass_game_radar_454d8227ee.webp",
  train:    "https://assets.csnades.gg/train_game_radar_033a7daae1.webp",
  vertigo:  "https://assets.csnades.gg/vertigo_game_radar_fdb7e7081d.webp",
};

/**
 * Returns an ordered array of image URLs to try for the given map name.
 * The consumer should render the first one and on each `onError`, advance to the next.
 */
export function getRadarSources(mapName: string): RadarSource[] {
  const clean = (mapName || "mirage").toLowerCase().replace(/^de_/, "");
  const sources: RadarSource[] = [
    { url: `/maps/de_${clean}.webp`, label: "local-webp" },
    { url: `/maps/de_${clean}.png`,  label: "local-png" },
  ];

  const cdn = CSNADES_CDN[clean];
  if (cdn) {
    sources.push({ url: cdn, label: "csnades-cdn" });
  }

  return sources;
}

/** Convenience: just the first (best) URL. */
export function getPrimaryRadarUrl(mapName: string): string {
  return getRadarSources(mapName)[0].url;
}
