import { useState, useEffect, type FC } from "react";
import { getRadarSources } from "../features/stratboard/radarMapUrls";

interface Props {
  mapName: string;
  className?: string;
}

/**
 * Renders the REAL official CS2 radar map image with bulletproof multi-source
 * fallback. NO fake SVG blueprints — ever.
 *
 * Fallback chain:
 *   1. /maps/de_{map}.webp  (committed to public/maps/)
 *   2. /maps/de_{map}.png   (committed to public/maps/)
 *   3. Official csnades.gg CDN webp (100% verified HTTP 200)
 */
export const RadarMapLayer: FC<Props> = ({ mapName, className }) => {
  const sources = getRadarSources(mapName);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSourceIndex(0);
    setLoaded(false);
  }, [mapName]);

  const currentSource = sources[Math.min(sourceIndex, sources.length - 1)];
  const cleanMap = (mapName || "mirage").toLowerCase().replace(/^de_/, "");

  return (
    <img
      key={`radar-${cleanMap}-${sourceIndex}`}
      src={currentSource.url}
      alt={`${cleanMap} radar`}
      className={`strat-radar-map-image csnades-authentic-map-img ${loaded ? "loaded" : "loading"} ${className || ""}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "contain",
        zIndex: 1,
        opacity: 1,
        display: "block",
        pointerEvents: "none",
      }}
      onLoad={() => setLoaded(true)}
      onError={() => {
        if (sourceIndex < sources.length - 1) {
          console.warn(`Radar map load failed for ${currentSource.url}, falling back to ${sources[sourceIndex + 1].url}`);
          setSourceIndex((i) => i + 1);
        }
      }}
    />
  );
};

export default RadarMapLayer;
