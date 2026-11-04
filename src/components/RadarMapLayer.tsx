import { useState, useEffect, type FC } from "react";
import RadarBlueprint from "./RadarBlueprint";

interface Props {
  mapName: string;
}

export const RadarMapLayer: FC<Props> = ({ mapName }) => {
  const [tier, setTier] = useState<1 | 2 | 3>(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setTier(1);
    setImgLoaded(false);
  }, [mapName]);

  const localSrc = `/maps/${mapName}.png`;
  const cdnSrc = `https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/maps/${mapName}.png`;

  return (
    <div className="strat-radar-map-layer">
      {/* SVG Blueprint is always active as base vector blueprint */}
      <RadarBlueprint mapName={mapName} />

      {tier === 1 && (
        <img
          key={`tier1-${mapName}`}
          src={localSrc}
          alt={mapName}
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
          key={`tier2-${mapName}`}
          src={cdnSrc}
          alt={mapName}
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
