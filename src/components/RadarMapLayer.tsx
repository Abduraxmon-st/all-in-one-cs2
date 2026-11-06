import { useState, useEffect, type FC } from "react";
import RadarBlueprint from "./RadarBlueprint";

interface Props {
  mapName: string;
}

export const RadarMapLayer: FC<Props> = ({ mapName }) => {
  const normMap = `de_${(mapName || "").toLowerCase().replace(/^de_/, "")}`;
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setTier(1);
    setImgLoaded(false);
  }, [normMap]);

  const localSrc = `/maps/${normMap}.png`;
  const cdnSrc = `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/maps/${normMap}.png`;

  return (
    <div className="strat-radar-map-layer">
      {/* SVG Blueprint is always active as base vector blueprint */}
      <RadarBlueprint mapName={normMap} />

      {tier === 1 && (
        <img
          key={`tier1-${normMap}`}
          src={localSrc}
          alt={normMap}
          className={`strat-radar-map-image ${imgLoaded ? "loaded" : "loading"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setTier(2);
            setImgLoaded(false);
          }}
        />
      )}

      {tier === 2 && (
        <img
          key={`tier2-${normMap}`}
          src={cdnSrc}
          alt={normMap}
          className={`strat-radar-map-image ${imgLoaded ? "loaded" : "loading"}`}
          onLoad={() => setImgLoaded(true)}
          onError={() => {
            setTier(3);
            setImgLoaded(false);
          }}
        />
      )}
    </div>
  );
};

export default RadarMapLayer;
