import { useState, useMemo, type FC } from "react";
import type { CSFloatItem, CurrencyCode } from "../features/loadouts/csfloatCatalogData";
import { formatPrice, getCaseDetails } from "../features/loadouts/csfloatCatalogData";

interface Props {
  skin: CSFloatItem;
  currency: CurrencyCode;
  notify: (msg: string) => void;
  onClose?: () => void;
  onOpen3DModal: (skin: CSFloatItem) => void;
  onSelectSkin?: (skin: CSFloatItem) => void;
  allSkins?: CSFloatItem[];
}

interface WearTierInfo {
  tier: "FN" | "MW" | "FT" | "WW" | "BS";
  name: string;
  floatRange: string;
  multiplier: number;
}

const WEAR_TIERS: WearTierInfo[] = [
  { tier: "FN", name: "Factory New", floatRange: "0.00 – 0.07", multiplier: 1.4 },
  { tier: "MW", name: "Minimal Wear", floatRange: "0.07 – 0.15", multiplier: 1.15 },
  { tier: "FT", name: "Field-Tested", floatRange: "0.15 – 0.38", multiplier: 0.95 },
  { tier: "WW", name: "Well-Worn", floatRange: "0.38 – 0.45", multiplier: 0.82 },
  { tier: "BS", name: "Battle-Scarred", floatRange: "0.45 – 1.00", multiplier: 0.70 },
];

const TIMEFRAMES = ["24h", "7d", "30d", "90d", "1y", "All"] as const;

export const SkinDetailOverview: FC<Props> = ({
  skin,
  currency,
  notify,
  onClose,
  onOpen3DModal,
  onSelectSkin,
  allSkins = [],
}) => {
  const [activeVariant, setActiveVariant] = useState<"normal" | "stattrak" | "souvenir">("normal");
  const [selectedWear, setSelectedWear] = useState<"FN" | "MW" | "FT" | "WW" | "BS">(skin.wearTier || "FN");
  const [offersTab, setOffersTab] = useState<"BUY" | "SELL" | "TRADE">("BUY");
  const [activeTimeframe, setActiveTimeframe] = useState<string>("30d");
  const [customFloat, setCustomFloat] = useState<number>(skin.floatValue || 0.15);
  const [studioMode, setStudioMode] = useState<"wear" | "3d">("wear");
  const [userRating, setUserRating] = useState<number>(5);

  const money = (usd: number) => formatPrice(usd, currency);

  // Variant multiplier
  const variantMultiplier = activeVariant === "stattrak" ? 1.45 : activeVariant === "souvenir" ? 1.6 : 1.0;

  // Selected wear multiplier
  const currentWearInfo = WEAR_TIERS.find((w) => w.tier === selectedWear) || WEAR_TIERS[0];
  const activeBasePrice = skin.priceUsd * currentWearInfo.multiplier * variantMultiplier;

  // Case & Collection Info
  const caseDetails = useMemo(() => getCaseDetails(skin), [skin]);

  // Dynamic wear table prices
  const wearPrices = useMemo(() => {
    return WEAR_TIERS.map((tier) => {
      const explicit = skin.wearPrices?.find((wp) => wp.wear === tier.tier);
      const base = explicit ? explicit.price : skin.priceUsd * tier.multiplier;
      const price = base * variantMultiplier;
      return {
        ...tier,
        price,
      };
    });
  }, [skin, variantMultiplier]);

  // Market offers based on active wear and variant
  const marketOffers = useMemo(() => {
    const isSlate = skin.skinName === "Slate";
    const isFN = selectedWear === "FN";
    const isNormal = activeVariant === "normal";

    if (isSlate && isFN && isNormal) {
      return [
        {
          id: "csmoney",
          market: "CS.MONEY",
          rating: 4.7,
          reviews: "9.2K reviews",
          activeOffers: "416",
          price: 12.13,
          promoted: true,
          logoBg: "#ec4899",
        },
        {
          id: "dmarket",
          market: "DMarket",
          rating: 3.9,
          reviews: "22.2K reviews",
          activeOffers: "283",
          price: 11.74,
          promoted: false,
          logoBg: "#10b981",
        },
        {
          id: "ntskins",
          market: "NTSkins",
          rating: 3.8,
          reviews: "15 reviews",
          activeOffers: "1.5K",
          price: 11.82,
          promoted: false,
          logoBg: "#8b5cf6",
        },
        {
          id: "csfloat",
          market: "CSFloat",
          rating: 4.8,
          reviews: "9.9K reviews",
          activeOffers: "1.1K",
          price: 12.04,
          bestValue: true,
          promoted: false,
          logoBg: "#3b82f6",
        },
        {
          id: "skinvault",
          market: "Skinvault",
          rating: 4.2,
          reviews: "213 reviews",
          activeOffers: "203",
          price: 12.10,
          promoted: false,
          logoBg: "#f59e0b",
        },
      ];
    }

    const currentWearPrice = wearPrices.find((w) => w.tier === selectedWear)?.price || activeBasePrice;
    return [
      {
        id: "csmoney",
        market: "CS.MONEY",
        rating: 4.7,
        reviews: "9.2K reviews",
        activeOffers: `${Math.floor((skin.paintSeed % 300) + 250)}`,
        price: currentWearPrice * 1.033,
        promoted: true,
        logoBg: "#ec4899",
      },
      {
        id: "dmarket",
        market: "DMarket",
        rating: 3.9,
        reviews: "22.2K reviews",
        activeOffers: `${Math.floor((skin.paintSeed % 200) + 180)}`,
        price: currentWearPrice * 1.00,
        promoted: false,
        logoBg: "#10b981",
      },
      {
        id: "ntskins",
        market: "NTSkins",
        rating: 3.8,
        reviews: "15 reviews",
        activeOffers: "1.5K",
        price: currentWearPrice * 1.007,
        promoted: false,
        logoBg: "#8b5cf6",
      },
      {
        id: "csfloat",
        market: "CSFloat",
        rating: 4.8,
        reviews: "9.9K reviews",
        activeOffers: "1.1K",
        price: currentWearPrice * 1.025,
        bestValue: true,
        promoted: false,
        logoBg: "#3b82f6",
      },
      {
        id: "skinvault",
        market: "Skinvault",
        rating: 4.2,
        reviews: "213 reviews",
        activeOffers: `${Math.floor((skin.paintSeed % 120) + 90)}`,
        price: currentWearPrice * 1.03,
        promoted: false,
        logoBg: "#f59e0b",
      },
    ];
  }, [skin, activeBasePrice, selectedWear, activeVariant, wearPrices]);

  // Similar skins for the same weapon
  const similarSkins = useMemo(() => {
    return allSkins
      .filter((s) => s.weaponName === skin.weaponName && s.id !== skin.id)
      .slice(0, 6);
  }, [allSkins, skin]);

  // Recommended stickers for this skin
  const recommendedStickers = useMemo(() => {
    return [
      {
        name: "Titan (Holo) | Katowice 2014",
        priceUsd: 58000,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjM-sJnCW8Vli_YTxuAm2FVLll4Lh8x1T4P6hJqZrJfHAXjXGkr0i4rc_GSjixEh35GSAnNr8IyqSbg8kA8ciRrQJshGm0oqwlCzKr50",
      },
      {
        name: "Crown (Foil)",
        priceUsd: 940,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjNm1PHic4ERmpsj3-FbwTyL3kZ_ssycDt6v4PvU_dvTGDWGWl-xwtLZoS36ykB4ltTvXy42seS_EPFQpC8BuBbldJQkRI1c",
      },
      {
        name: "Battle Scarred (Holo)",
        priceUsd: 14.50,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjM-sJnCW8Vli_YTxuAm2FVLll4Lh8x1T4P6hJqZrJfHAXjXGkr0i4rc_GSjixEh35GSAnNr8IyqSbg8kA8ciRrQJshGm0oqwlCzKr50",
      },
      {
        name: "FURIA (Holo) | Stockholm 2021",
        priceUsd: 18.20,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjNm1PHic4ERmpsj3-FbwTyL3kZ_ssycDt6v4PvU_dvTGDWGWl-xwtLZoS36ykB4ltTvXy42seS_EPFQpC8BuBbldJQkRI1c",
      },
    ];
  }, []);

  const handleCopyInspect = () => {
    const url =
      skin.inspectLink ||
      `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${skin.paintSeed}D0`;
    navigator.clipboard.writeText(url).catch(() => {});
    notify(`CS2 inspect command copied! Launching game client...`);
    window.location.href = url;
  };

  const handleCopyServer = () => {
    const connectCmd = `connect clutch.cs2hub.gg; play_sound clutch`;
    navigator.clipboard.writeText(connectCmd).catch(() => {});
    notify(`Clutch server connect command copied to clipboard: ${connectCmd}`);
  };

  const handleOpenSteam = () => {
    const steamUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`;
    window.open(steamUrl, "_blank");
  };

  const handleCopyGenCode = () => {
    const genCode = `!gen 730 ${skin.weaponName} ${skin.finishCatalog ?? 1035} ${skin.paintSeed} ${customFloat.toFixed(8)}`;
    navigator.clipboard.writeText(genCode).catch(() => {});
    notify(`CS2 inspect gen-code copied: ${genCode}`);
  };

  // Derive wear tier label from custom float
  const currentFloatTier = useMemo(() => {
    if (customFloat < 0.07) return { label: "Factory New", badge: "FN" };
    if (customFloat < 0.15) return { label: "Minimal Wear", badge: "MW" };
    if (customFloat < 0.38) return { label: "Field-Tested", badge: "FT" };
    if (customFloat < 0.45) return { label: "Well-Worn", badge: "WW" };
    return { label: "Battle-Scarred", badge: "BS" };
  }, [customFloat]);

  return (
    <section className="clutch-skin-detail-section">
      {/* 1. Header with Skin Title & Badges */}
      <div className="clutch-skin-detail-header">
        <div className="clutch-skin-title-wrap">
          <h2 className="clutch-skin-title">
            <span>{skin.weaponName}</span>
            <span className="clutch-skin-pipe">|</span>
            <span className="clutch-skin-highlight">{skin.skinName}</span>
          </h2>
          <div className="clutch-skin-badges">
            <span className="clutch-rarity-pill">
              {skin.rarity} {skin.category.replace(/S$/, "")}
            </span>
            <span className="clutch-case-pill">
              📦 {skin.collectionName || caseDetails?.caseName || "Weapon Case"}
            </span>
            <span className="clutch-meta-pill">
              Quality: {activeVariant === "stattrak" ? "StatTrak™" : activeVariant === "souvenir" ? "Souvenir" : "Normal"}
            </span>
            <span className="clutch-meta-pill">
              Paint #{skin.finishCatalog ?? 1035} · Float: {skin.minFloat ?? 0.00} – {skin.maxFloat ?? 1.00}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="clutch-open-3d-btn"
            onClick={() => onOpen3DModal(skin)}
            title="Open Full 3D Interactive Inspector & Unboxing Simulator"
          >
            <span>🧊 3D INSPECT & COMPARISON</span>
            <span style={{ color: "#c8f135" }}>↗</span>
          </button>
          {onClose && (
            <button
              type="button"
              className="clutch-close-details-btn"
              onClick={onClose}
              title="Close skin details and return to catalog"
            >
              ✕ Close Details
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="clutch-skin-detail-grid">
        {/* ================= LEFT COLUMN ================= */}
        <div className="clutch-skin-left-col">
          {/* Top Quick Links Bar */}
          <div className="clutch-quick-links">
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleCopyInspect}
              title="Inspect directly in Counter-Strike 2 client"
            >
              <span className="clutch-link-icon">🏃</span>
              <span>In Game</span>
            </button>
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleCopyServer}
              title="Connect to Clutch Labs 128-tick Inspect Server"
            >
              <span className="clutch-link-icon">🌐</span>
              <span>In Server</span>
            </button>
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleOpenSteam}
              title="Search on Steam Community Market"
            >
              <span className="clutch-link-icon">🎮</span>
              <span>On Steam</span>
            </button>
          </div>

          {/* Large Skin Render Stage */}
          <div className="clutch-skin-stage">
            <img
              src={skin.imageUrl}
              alt={skin.marketHashName}
              className="clutch-skin-big-img"
              loading="eager"
            />
            {skin.fadePercentage !== undefined && (
              <div className="clutch-fade-tag">{skin.fadePercentage}% Fade</div>
            )}
            {activeVariant === "stattrak" && (
              <div className="clutch-stattrak-tag">StatTrak™</div>
            )}
            {activeVariant === "souvenir" && (
              <div className="clutch-souvenir-tag">Souvenir</div>
            )}
          </div>

          {/* Variant Selector Tabs */}
          <div className="clutch-variant-tabs">
            <button
              type="button"
              className={`clutch-variant-tab ${activeVariant === "normal" ? "active" : ""}`}
              onClick={() => setActiveVariant("normal")}
            >
              Normal
            </button>
            <button
              type="button"
              className={`clutch-variant-tab stattrak ${activeVariant === "stattrak" ? "active" : ""}`}
              onClick={() => setActiveVariant("stattrak")}
            >
              StatTrak™
            </button>
            <button
              type="button"
              className={`clutch-variant-tab souvenir ${activeVariant === "souvenir" ? "active" : ""}`}
              onClick={() => setActiveVariant("souvenir")}
            >
              Souvenir
            </button>
          </div>

          {/* Wear & Float Pricing Breakdown Table */}
          <div className="clutch-wear-table">
            {wearPrices.map((tier) => {
              const isSelected = selectedWear === tier.tier;

              return (
                <div
                  key={tier.tier}
                  className={`clutch-wear-row ${isSelected ? "active" : ""}`}
                  onClick={() => setSelectedWear(tier.tier)}
                >
                  <div className="clutch-wear-left">
                    <span className={`clutch-wear-badge wear-${tier.tier.toLowerCase()}`}>
                      {tier.tier}
                    </span>
                    <div className="clutch-wear-texts">
                      <span className="clutch-wear-name">{tier.name}</span>
                      <span className="clutch-wear-float">{tier.floatRange}</span>
                    </div>
                  </div>
                  <div className="clutch-wear-price">{money(tier.price)}</div>
                </div>
              );
            })}
          </div>

          {/* Metadata Summary Card */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Item Summary</div>
            <div className="clutch-meta-kv-grid">
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Category</span>
                <span className="kv-val">Weapon Skins</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Weapon</span>
                <span className="kv-val">{skin.weaponName}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish</span>
                <span className="kv-val">{skin.skinName}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish Style</span>
                <span className="kv-val">{skin.finishStyle || "Gunsmith"}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Released</span>
                <span className="kv-val">{caseDetails?.releaseDate || "May 3, 2021"}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish Catalog</span>
                <span className="kv-val">#{skin.finishCatalog ?? 1035}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Popularity</span>
                <span className="kv-val" style={{ color: "#bef264", fontWeight: 800 }}>100% (High Demand)</span>
              </div>
            </div>
          </div>

          {/* Containers & Collection Card */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Container & Collection</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className="clutch-container-row-item">
                <span style={{ fontSize: 24 }}>📦</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                    {skin.collectionName || caseDetails?.caseName || "Snakebite Case"}
                  </div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>
                    Case Price: {money(caseDetails?.casePriceUsd || 0.85)} · Key: {money(caseDetails?.keyPriceUsd || 2.49)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Color Palette & Liquidity Rating */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Color Palette & Liquidity</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Dominant Colors:</span>
              <span className="clutch-palette-circle" style={{ backgroundColor: "#1e1e1e" }} title="Matte Black" />
              <span className="clutch-palette-circle" style={{ backgroundColor: "#2e2e2e" }} title="Dark Charcoal" />
              <span className="clutch-palette-circle" style={{ backgroundColor: "#404040" }} title="Slate Gray" />
            </div>

            <div className="clutch-liquidity-bar-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>Liquidity Rating:</span>
                <strong style={{ color: "#bef264" }}>93% (Very High)</strong>
              </div>
              <div className="clutch-liquidity-track">
                <div className="clutch-liquidity-fill" style={{ width: "93%" }} />
              </div>
            </div>
          </div>

          {/* Drop Chance Funnel */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Drop Chance Funnel</div>
            <div className="clutch-funnel-pipeline">
              <div className="funnel-step">
                <span className="funnel-dot" />
                <span className="funnel-label">Open Case: 100%</span>
              </div>
              <div className="funnel-step">
                <span className="funnel-dot" />
                <span className="funnel-label">{skin.rarity} Tier: 15.98%</span>
              </div>
              <div className="funnel-step">
                <span className="funnel-dot active" />
                <span className="funnel-label active">{skin.skinName}: ~3.20% (1 in 31)</span>
              </div>
            </div>
          </div>

          {/* Community Rating */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Community Rating</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc" }}>
                  4.8 <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>/ 5.0</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Based on 1,742 verified community reviews</div>
              </div>
              <div className="clutch-star-widget">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-btn ${star <= userRating ? "filled" : ""}`}
                    onClick={() => {
                      setUserRating(star);
                      notify(`Thank you for rating ${skin.skinName} ${star} stars!`);
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="clutch-skin-right-col">
          {/* 1. Active Offers Aggregator */}
          <div className="clutch-offers-header">
            <div className="clutch-offers-title-wrap">
              <h3 className="clutch-offers-title">Active Offers</h3>
              <span
                className="clutch-offers-info-icon"
                title="Real-time live quotes tracked from 7 verified CS2 marketplaces"
              >
                ⓘ
              </span>
            </div>

            <div className="clutch-offers-tabs">
              {(["BUY", "SELL", "TRADE"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`clutch-offers-tab ${offersTab === tab ? "active" : ""}`}
                  onClick={() => setOffersTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Market Offers List */}
          <div className="clutch-market-list">
            {marketOffers.map((mo) => (
              <div
                key={mo.id}
                className={`clutch-market-card ${mo.promoted ? "promoted" : ""} ${mo.bestValue ? "best-value" : ""}`}
              >
                {mo.promoted && (
                  <div className="clutch-market-promoted-badge">
                    <span>Promoted</span>
                    <span style={{ fontSize: 11 }}>ⓘ</span>
                  </div>
                )}

                <div className="clutch-market-card-content">
                  <div className="clutch-market-meta">
                    <div className="clutch-market-name-row">
                      <span
                        className="clutch-market-dot"
                        style={{ backgroundColor: mo.logoBg }}
                      />
                      <strong className="clutch-market-name">{mo.market}</strong>
                      {mo.bestValue && (
                        <span className="clutch-market-best-tag">BEST PRICE</span>
                      )}
                    </div>
                    <div className="clutch-market-stars">
                      <span className="clutch-star-rating">
                        {"★".repeat(Math.floor(mo.rating))}
                        {"☆".repeat(5 - Math.floor(mo.rating))}
                      </span>
                      <span className="clutch-reviews-count">{mo.rating} · {mo.reviews}</span>
                    </div>
                  </div>

                  <div className="clutch-market-offers-count">
                    <span className="clutch-count-num">{mo.activeOffers}</span>
                    <span className="clutch-count-label">active offers</span>
                  </div>

                  <div className="clutch-market-price-col">
                    <span className="clutch-price-from-label">from</span>
                    <span className="clutch-market-price-val">{money(mo.price)}</span>
                    <button
                      type="button"
                      className="clutch-view-offer-btn"
                      onClick={() => {
                        notify(`Navigating to ${mo.market} offer for ${skin.marketHashName}...`);
                        window.open(
                          `https://www.google.com/search?q=${encodeURIComponent(mo.market + " " + skin.marketHashName)}`,
                          "_blank"
                        );
                      }}
                    >
                      <span>VIEW OFFER</span>
                      <span style={{ fontSize: 13 }}>&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. In-Game Preview & Interactive Wear Scrubber Studio */}
          <div className="clutch-studio-card">
            <div className="clutch-studio-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                  Inspect & Wear Studio
                </h4>
                <span className="clutch-studio-badge">
                  {currentFloatTier.badge} · {customFloat.toFixed(4)}
                </span>
              </div>

              <div className="clutch-studio-mode-tabs">
                <button
                  type="button"
                  className={`clutch-studio-tab ${studioMode === "wear" ? "active" : ""}`}
                  onClick={() => setStudioMode("wear")}
                >
                  Wear Scrubber
                </button>
                <button
                  type="button"
                  className={`clutch-studio-tab ${studioMode === "3d" ? "active" : ""}`}
                  onClick={() => onOpen3DModal(skin)}
                >
                  3D View ↗
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, color: "#94a3b8" }}>
                <span>Float Scrubber (0.00 Factory New to 1.00 Battle-Scarred)</span>
                <strong style={{ color: "#bef264" }}>{currentFloatTier.label}</strong>
              </div>
              <input
                type="range"
                min="0.00"
                max="1.00"
                step="0.005"
                value={customFloat}
                onChange={(e) => setCustomFloat(parseFloat(e.target.value))}
                className="clutch-float-range-slider"
              />

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Seed: <strong style={{ color: "#cbd5e1" }}>{skin.paintSeed}</strong>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="clutch-code-btn"
                    onClick={handleCopyGenCode}
                    title="Copy CS2 Inspect Gen Code"
                  >
                    📋 Copy !gen Code
                  </button>
                  <button
                    type="button"
                    className="clutch-code-btn"
                    onClick={handleCopyInspect}
                    title="Launch Inspect in CS2"
                  >
                    🎮 Launch CS2
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Price History Chart & Statistics Suite */}
          <div className="clutch-chart-card">
            <div className="clutch-chart-header">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                  Price History & Statistics
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: "#22c55e", fontWeight: 800 }}>▲ +$0.84 (+7.4%)</span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>Past 30 days</span>
                </div>
              </div>

              <div className="clutch-timeframe-pills">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`clutch-timeframe-pill ${activeTimeframe === tf ? "active" : ""}`}
                    onClick={() => setActiveTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* SVG Sparkline Price Trend Chart */}
            <div className="clutch-svg-chart-stage">
              <svg viewBox="0 0 700 180" className="clutch-svg-chart" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#bef264" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#bef264" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Area Fill */}
                <path
                  d="M 0 140 Q 70 120, 140 135 T 280 110 T 420 95 T 560 70 T 700 50 L 700 180 L 0 180 Z"
                  fill="url(#chartGradient)"
                />
                {/* Trend Line */}
                <path
                  d="M 0 140 Q 70 120, 140 135 T 280 110 T 420 95 T 560 70 T 700 50"
                  fill="none"
                  stroke="#bef264"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Price KPI Table */}
            <div className="clutch-kpi-grid">
              <div className="clutch-kpi-box">
                <span className="kpi-label">All-Time High</span>
                <span className="kpi-val">{money(activeBasePrice * 1.55)}</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">All-Time Low</span>
                <span className="kpi-val">{money(activeBasePrice * 0.65)}</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">24h Volume</span>
                <span className="kpi-val">2,291 units</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">Market Cap</span>
                <span className="kpi-val">$2.4M</span>
              </div>
            </div>
          </div>

          {/* 4. Recommended Stickers Carousel */}
          <div className="clutch-stickers-card">
            <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
              Recommended Sticker Crafts
            </h4>
            <div className="clutch-stickers-row">
              {recommendedStickers.map((st, sIdx) => (
                <div key={sIdx} className="clutch-sticker-item">
                  <img src={st.image} alt={st.name} className="clutch-sticker-img" />
                  <div className="clutch-sticker-name" title={st.name}>{st.name}</div>
                  <div className="clutch-sticker-price">from {money(st.priceUsd)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Description & Trivia Fact Cards */}
          <div className="clutch-trivia-card">
            <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
              Description & Fact Cards
            </h4>
            <p className="clutch-trivia-desc">
              {skin.description ||
                "It has been custom painted with a matte black finish. Call it whatever you want, as long as it's black."}
            </p>

            <div className="clutch-facts-grid">
              <div className="clutch-fact-box">
                <strong>Origin & History</strong>
                <span>Released on May 3rd, 2021 as part of the Snakebite Case alongside Operation Broken Fang.</span>
              </div>
              <div className="clutch-fact-box">
                <strong>Finish Style</strong>
                <span>Gunsmith matte finish. At higher float values, the patina darkens without peeling off paint.</span>
              </div>
              <div className="clutch-fact-box">
                <strong>Rarity & Odds</strong>
                <span>Restricted classification with an estimated 3.20% drop probability per case unboxing.</span>
              </div>
              <div className="clutch-fact-box">
                <strong>Pro Ownership</strong>
                <span>Owned and actively fielded in tier-1 Valve majors by pro riflers s1mple, NiKo, and m0NESY.</span>
              </div>
            </div>
          </div>

          {/* 6. Similar Skins for this Weapon */}
          {similarSkins.length > 0 && (
            <div className="clutch-similar-card">
              <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                More {skin.weaponName} Skins
              </h4>
              <div className="clutch-similar-grid">
                {similarSkins.map((sim) => (
                  <div
                    key={sim.id}
                    className="clutch-similar-item"
                    onClick={() => {
                      if (onSelectSkin) onSelectSkin(sim);
                      notify(`Selected ${sim.marketHashName}`);
                    }}
                    title={`View ${sim.marketHashName}`}
                  >
                    <img src={sim.imageUrl} alt={sim.skinName} className="clutch-similar-img" />
                    <div className="clutch-similar-title">{sim.skinName}</div>
                    <div className="clutch-similar-price">from {money(sim.priceUsd)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
