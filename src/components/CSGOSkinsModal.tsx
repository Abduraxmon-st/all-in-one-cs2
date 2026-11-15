import { useState, useRef, useEffect, type FC } from "react";
import type { CSFloatItem, CurrencyCode } from "../features/loadouts/csfloatCatalogData";
import {
  formatPrice,
  enrichItemWithCSGOSkins,
  getCaseDetails,
  simulateCaseOpening,
  type CaseDetails,
} from "../features/loadouts/csfloatCatalogData";
import { getWeaponSilhouetteSvg } from "./WeaponSilhouette";

interface Props {
  item: CSFloatItem;
  currency?: CurrencyCode;
  onClose: () => void;
  notify: (msg: string) => void;
  onEquip?: (side: "CT" | "T") => void;
}

type ModalTab = "markets" | "3d" | "wears" | "specs" | "cases";

const DOPPLER_PHASES = [
  { name: "Phase 1", color: "#6366f1", mult: 1.0 },
  { name: "Phase 2 (Pink Galaxy)", color: "#ec4899", mult: 1.25 },
  { name: "Phase 3", color: "#06b6d4", mult: 0.95 },
  { name: "Phase 4", color: "#3b82f6", mult: 1.15 },
  { name: "Ruby", color: "#ef4444", mult: 5.5 },
  { name: "Sapphire", color: "#2563eb", mult: 6.8 },
  { name: "Black Pearl", color: "#475569", mult: 3.2 },
  { name: "Emerald", color: "#10b981", mult: 7.5 },
];

export const CSGOSkinsModal: FC<Props> = ({
  item: rawItem,
  currency = "USD",
  onClose,
  notify,
  onEquip,
}) => {
  const item = enrichItemWithCSGOSkins(rawItem);
  const caseDetails = getCaseDetails(item);
  const isDoppler = item.skinName.toLowerCase().includes("doppler");
  const isFade = item.skinName.toLowerCase().includes("fade");

  const [activeTab, setActiveTab] = useState<ModalTab>(
    item.category === "CASES" ? "cases" : "markets"
  );
  const [selectedDopplerPhase, setSelectedDopplerPhase] = useState("Phase 1");
  const [fadePercent, setFadePercent] = useState(item.fadePercentage || 95);

  const [simResult, setSimResult] = useState<ReturnType<typeof simulateCaseOpening> | null>(null);
  const [isOpeningAnim, setIsOpeningAnim] = useState(false);

  const [rotateX, setRotateX] = useState(-5);
  const [rotateY, setRotateY] = useState(25);
  const [zoom, setZoom] = useState(1.1);
  const [autoSpin, setAutoSpin] = useState(true);
  const [wearFloat, setWearFloat] = useState(item.floatValue || 0.05);
  const [isStatTrakSelected, setIsStatTrakSelected] = useState(item.isStatTrak);
  const [selectedWearTier, setSelectedWearTier] = useState<"FN" | "MW" | "FT" | "WW" | "BS">(
    item.wearTier || "FN"
  );
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Auto spin animation loop
  useEffect(() => {
    if (!autoSpin || isDragging || activeTab !== "3d") return;
    const interval = setInterval(() => {
      setRotateY((y) => (y + 0.6) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [autoSpin, isDragging, activeTab]);

  // Drag rotation handlers for 3D tab
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current) return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotateY((y) => y + dx * 0.5);
    setRotateX((x) => Math.max(-60, Math.min(60, x - dy * 0.5)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (activeTab !== "3d") return;
    e.preventDefault();
    setZoom((z) => Math.max(0.7, Math.min(2.0, z - e.deltaY * 0.0015)));
  };

  // Inspect in game action
  const handleInspectInGame = () => {
    const inspectUrl =
      item.inspectLink ||
      `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${item.paintSeed}D${Math.floor(
        wearFloat * 1000000
      )}`;

    navigator.clipboard.writeText(inspectUrl).catch(() => {});
    window.location.href = inspectUrl;
    notify(`Copied inspect command! Launching ${item.skinName} in CS2...`);
  };

  const handleCopyConsole = () => {
    const cmd = `give weapon_${(item.weaponName || "knife").toLowerCase().replace(/[^a-z0-9]/g, "")}; ent_fire weapon_${(item.weaponName || "knife").toLowerCase().replace(/[^a-z0-9]/g, "")} addoutput "classname weapon_knifegg"`;
    navigator.clipboard.writeText(cmd).catch(() => {});
    notify(`Copied CS2 console command for ${item.skinName}!`);
  };

  const handleSimulateUnbox = () => {
    if (!caseDetails) return;
    setIsOpeningAnim(true);
    setTimeout(() => {
      const res = simulateCaseOpening(caseDetails);
      setSimResult(res);
      setIsOpeningAnim(false);
      notify(`Unboxed ${res.item.name} (${res.wearTier}) - Value ${formatPrice(res.estimatedPrice, currency)}!`);
    }, 500);
  };

  // Compute wear tier label from float
  const getWearTier = (f: number) => {
    if (f < 0.07) return "Factory New";
    if (f < 0.15) return "Minimal Wear";
    if (f < 0.38) return "Field-Tested";
    if (f < 0.45) return "Well-Worn";
    return "Battle-Scarred";
  };

  // Dynamic wear visual degradation filter
  const brightness = Math.max(0.65, 1 - wearFloat * 0.35);
  const contrast = Math.max(0.75, 1 - wearFloat * 0.25);
  const sepia = wearFloat * 0.3;

  const minFloat = item.minFloat ?? 0.0;
  const maxFloat = item.maxFloat ?? 1.0;

  // Active price calculation based on StatTrak toggle, Doppler Phase, and Fade %
  const statTrakMultiplier = isStatTrakSelected ? 1.45 : 1.0;
  const dopplerMult = isDoppler
    ? DOPPLER_PHASES.find((p) => p.name === selectedDopplerPhase)?.mult || 1.0
    : 1.0;
  const fadeMult = isFade ? 1.0 + Math.max(0, (fadePercent - 80) * 0.015) : 1.0;

  const currentWearPrice =
    (item.wearPrices?.find((w) => w.wear === selectedWearTier)?.price || item.priceUsd) *
    statTrakMultiplier *
    dopplerMult *
    fadeMult;

  return (
    <div
      className="csf-modal-overlay"
      onClick={onClose}
      onMouseUp={handleMouseUp}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 12, 0.92)",
        backdropFilter: "blur(14px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="csf-csgoskins-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#10161f",
          border: "1px solid #283548",
          borderRadius: 16,
          maxWidth: 960,
          width: "100%",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,0.85), 0 0 50px rgba(59, 130, 246, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Top Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #1f2a3a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            background: "linear-gradient(180deg, #161e2b 0%, #10161f 100%)",
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #2563eb, #7c3aed)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 8px",
                  borderRadius: 4,
                  letterSpacing: "0.06em",
                }}
              >
                CSGOSKINS.GG HUB
              </span>
              <span
                style={{
                  background: "#1e293b",
                  color: "#94a3b8",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 4,
                }}
              >
                {item.category}
              </span>
              <span
                style={{
                  background: "rgba(235, 75, 75, 0.15)",
                  color: "#f87171",
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(235, 75, 75, 0.3)",
                }}
              >
                {item.rarity}
              </span>
              {item.isStatTrak && (
                <span
                  style={{
                    background: "rgba(249, 115, 22, 0.15)",
                    color: "#fb923c",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "3px 8px",
                    borderRadius: 4,
                    border: "1px solid rgba(249, 115, 22, 0.4)",
                  }}
                >
                  ★ StatTrak™
                </span>
              )}
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                color: "#f1f5f9",
                fontWeight: 800,
                letterSpacing: "-0.02em",
              }}
            >
              {item.marketHashName}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: 12 }}>
              Finish: {item.finishStyle || "Custom Paint Job"} · Paint Seed #{item.paintSeed} ·
              Collection: {item.collectionName || "CS2 Active Duty"}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "#64748b", fontWeight: 700 }}>BEST MARKET PRICE</div>
              <div style={{ fontSize: 20, color: "#22c55e", fontWeight: 800 }}>
                {formatPrice(currentWearPrice, currency)}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "#1e293b",
                border: "1px solid #334155",
                color: "#94a3b8",
                borderRadius: 8,
                width: 34,
                height: 34,
                fontSize: 16,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid #1f2a3a",
            backgroundColor: "#0d121a",
            padding: "0 24px",
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("markets")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "markets" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "markets" ? "#60a5fa" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🏷️ MARKET OFFERS ({item.marketPrices?.length || 7})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("3d")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "3d" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "3d" ? "#60a5fa" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            🧊 3D INSPECTOR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wears")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "wears" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "wears" ? "#60a5fa" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📊 WEAR & FLOAT SPECTRUM
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("specs")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "specs" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "specs" ? "#60a5fa" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📜 VALVE CS2 DETAILS
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("cases")}
            style={{
              background: "transparent",
              border: "none",
              borderBottom: activeTab === "cases" ? "2px solid #3b82f6" : "2px solid transparent",
              color: activeTab === "cases" ? "#60a5fa" : "#94a3b8",
              fontWeight: 700,
              fontSize: 12,
              padding: "12px 14px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            📦 {caseDetails ? caseDetails.caseName : "CASE CONTENTS & SIMULATOR"}
          </button>
        </div>

        {/* Tab Content Body */}
        <div style={{ padding: 24, overflowY: "auto", flex: 1 }}>
          {/* TAB 1: CSGOSKINS.GG MARKET COMPARISON TABLE */}
          {activeTab === "markets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "#161f2c",
                  padding: "12px 16px",
                  borderRadius: 10,
                  border: "1px solid #233044",
                }}
              >
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#f8fafc" }}>
                    Live Price Comparison Aggregator
                  </span>
                  <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                    Verified real-time marketplace prices sorted by lowest available price with direct links.
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={() => setIsStatTrakSelected(false)}
                    style={{
                      background: !isStatTrakSelected ? "#2563eb" : "#1e293b",
                      color: !isStatTrakSelected ? "#fff" : "#94a3b8",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsStatTrakSelected(true)}
                    style={{
                      background: isStatTrakSelected ? "#ea580c" : "#1e293b",
                      color: isStatTrakSelected ? "#fff" : "#94a3b8",
                      border: "none",
                      padding: "6px 12px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ★ StatTrak™
                  </button>
                </div>
              </div>

              {/* Doppler Phase Selector in Market Tab */}
              {isDoppler && (
                <div
                  style={{
                    background: "#161f2c",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #233044",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f8fafc" }}>
                      SELECT DOPPLER PHASE: <strong style={{ color: "#818cf8" }}>{selectedDopplerPhase}</strong>
                    </span>
                    <span style={{ fontSize: 10, color: "#94a3b8" }}>Multiplier: {dopplerMult}x</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {DOPPLER_PHASES.map((p) => {
                      const isPhaseActive = selectedDopplerPhase === p.name;
                      return (
                        <button
                          key={p.name}
                          type="button"
                          className="csgoskins-doppler-pill"
                          onClick={() => setSelectedDopplerPhase(p.name)}
                          style={{
                            background: isPhaseActive ? p.color : "#1e293b",
                            color: isPhaseActive ? "#000" : "#cbd5e1",
                            border: `1px solid ${isPhaseActive ? p.color : "#334155"}`,
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 800,
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fade Percentage Calculator in Market Tab */}
              {isFade && (
                <div
                  style={{
                    background: "#161f2c",
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid #233044",
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#f8fafc" }}>
                      FADE PERCENTAGE: <strong style={{ color: "#ec4899" }}>{fadePercent}%</strong>
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: fadePercent >= 100 ? "#22c55e" : "#eab308",
                        background: "rgba(234, 179, 8, 0.15)",
                        padding: "2px 6px",
                        borderRadius: 4,
                      }}
                    >
                      {fadePercent >= 100 ? "★ Full Fade (Tier 1)" : fadePercent >= 98 ? "99% Fade" : "Base Fade"}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="80"
                    max="100"
                    step="0.5"
                    value={fadePercent}
                    onChange={(e) => setFadePercent(Number(e.target.value))}
                    style={{ width: "100%", accentColor: "#ec4899", cursor: "pointer" }}
                  />
                </div>
              )}

              {/* Markets Table */}
              <div
                style={{
                  border: "1px solid #1e2a3a",
                  borderRadius: 10,
                  overflow: "hidden",
                  backgroundColor: "#0d131c",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.8fr 1fr 1fr 1.2fr 1fr",
                    padding: "10px 16px",
                    backgroundColor: "#131b26",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    borderBottom: "1px solid #1e2a3a",
                  }}
                >
                  <span>MARKETPLACE</span>
                  <span>TRUST RATING</span>
                  <span>ACTIVE OFFERS</span>
                  <span>PRICE</span>
                  <span style={{ textAlign: "right" }}>ACTION</span>
                </div>

                {(item.marketPrices || []).map((m, idx) => {
                  const adjustedPrice = m.price * statTrakMultiplier * dopplerMult * fadeMult;
                  return (
                    <div
                      key={idx}
                      className="csgoskins-market-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1.8fr 1fr 1fr 1.2fr 1fr",
                        padding: "14px 16px",
                        alignItems: "center",
                        borderBottom:
                          idx < (item.marketPrices?.length || 0) - 1 ? "1px solid #16202e" : "none",
                        backgroundColor: m.best ? "rgba(34, 197, 94, 0.04)" : "transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: "#1e293b",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 12,
                            fontWeight: 800,
                            color: m.best ? "#22c55e" : "#60a5fa",
                          }}
                        >
                          {m.market.slice(0, 2).toUpperCase()}
                        </span>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <strong style={{ fontSize: 13, color: "#f8fafc" }}>{m.market}</strong>
                            {m.best && (
                              <span
                                style={{
                                  background: "rgba(34, 197, 94, 0.2)",
                                  color: "#4ade80",
                                  fontSize: 9,
                                  fontWeight: 800,
                                  padding: "1px 6px",
                                  borderRadius: 4,
                                  border: "1px solid rgba(34, 197, 94, 0.3)",
                                }}
                              >
                                BEST PRICE
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: 10, color: "#64748b" }}>Instant Steam Trade</span>
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <span style={{ color: "#eab308", fontSize: 11 }}>★</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>
                          {m.rating}
                        </span>
                        <span style={{ fontSize: 10, color: "#64748b" }}>({m.reviews})</span>
                      </div>

                      <div style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>
                        {m.offersCount} offers
                      </div>

                      <div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: m.best ? "#22c55e" : "#f8fafc" }}>
                          {formatPrice(adjustedPrice, currency)}
                        </div>
                        {m.discount > 0 && (
                          <span style={{ fontSize: 10, color: "#4ade80", fontWeight: 700 }}>
                            -{m.discount}% vs Steam
                          </span>
                        )}
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: "inline-block",
                            background: m.best
                              ? "linear-gradient(135deg, #22c55e, #16a34a)"
                              : "#1e293b",
                            color: m.best ? "#000" : "#60a5fa",
                            border: m.best ? "none" : "1px solid #334155",
                            borderRadius: 6,
                            padding: "6px 14px",
                            fontSize: 11,
                            fontWeight: 800,
                            textDecoration: "none",
                            cursor: "pointer",
                          }}
                        >
                          VIEW OFFER ↗
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 30-Day Market Trading History & Activity */}
              <div
                style={{
                  background: "#121a24",
                  border: "1px solid #1e2a3a",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc" }}>
                      30-DAY PRICE HISTORY & MARKET ACTIVITY
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                      Aggregated verified transactions across CSFloat, Skinport, BUFF163 and Steam Community Market.
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: 11,
                        color: "#22c55e",
                        fontWeight: 800,
                        background: "rgba(34, 197, 94, 0.15)",
                        padding: "4px 8px",
                        borderRadius: 4,
                      }}
                    >
                      ▲ +4.8% (30D)
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>
                      Volume: <strong>1,280 sold</strong>
                    </span>
                  </div>
                </div>

                {/* Sparkline SVG */}
                <div
                  style={{
                    height: 55,
                    width: "100%",
                    background: "#0a0e14",
                    borderRadius: 6,
                    padding: "6px 12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <svg viewBox="0 0 400 50" style={{ width: "100%", height: "100%", overflow: "visible" }}>
                    <defs>
                      <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 0,40 Q 50,30 100,35 T 200,22 T 300,18 T 400,8 L 400,50 L 0,50 Z"
                      fill="url(#priceGrad)"
                    />
                    <path
                      d="M 0,40 Q 50,30 100,35 T 200,22 T 300,18 T 400,8"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="2.5"
                    />
                    <circle cx="400" cy="8" r="4" fill="#22c55e" />
                  </svg>
                </div>

                {/* Accepted payment methods */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: 10,
                    color: "#64748b",
                    borderTop: "1px solid #1a2230",
                    paddingTop: 8,
                    flexWrap: "wrap",
                    gap: 6,
                  }}
                >
                  <span>ACCEPTED PAYMENT METHODS:</span>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#cbd5e1" }}>
                      💳 Visa/Mastercard
                    </span>
                    <span style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#cbd5e1" }}>
                      🅿️ PayPal
                    </span>
                    <span style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#cbd5e1" }}>
                      ⚡ Crypto (USDT/BTC)
                    </span>
                    <span style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#cbd5e1" }}>
                      🧧 Alipay
                    </span>
                    <span style={{ background: "#1e293b", padding: "2px 6px", borderRadius: 4, color: "#cbd5e1" }}>
                      🎮 Steam Wallet
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTERACTIVE 3D INSPECTOR */}
          {activeTab === "3d" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onWheel={handleWheel}
                style={{
                  position: "relative",
                  height: 380,
                  background:
                    "radial-gradient(circle, rgba(30, 58, 138, 0.2) 0%, rgba(10, 14, 22, 0.98) 75%)",
                  borderRadius: 12,
                  border: "1px solid #1f2a3a",
                  overflow: "hidden",
                  cursor: isDragging ? "grabbing" : "grab",
                  perspective: 1100,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {/* Holographic Specular Lighting */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: `radial-gradient(ellipse at ${50 + rotateY * 0.1}% ${
                      50 + rotateX * 0.2
                    }%, rgba(255,255,255,0.08) 0%, transparent 60%)`,
                    pointerEvents: "none",
                  }}
                />

                {/* 3D Weapon Geometry Container */}
                <div
                  style={{
                    transform: `scale(${zoom}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    transformStyle: "preserve-3d",
                    transition: isDragging ? "none" : "transform 0.1s ease-out",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={item.imageUrl}
                    alt={item.skinName}
                    onError={(e) => {
                      e.currentTarget.src = getWeaponSilhouetteSvg(item.weaponName);
                    }}
                    style={{
                      maxWidth: 520,
                      maxHeight: 280,
                      objectFit: "contain",
                      filter: `drop-shadow(0 15px 30px rgba(0,0,0,0.9)) brightness(${brightness}) contrast(${contrast}) sepia(${sepia})`,
                      userSelect: "none",
                      pointerEvents: "none",
                    }}
                  />

                  {/* Applied Stickers Preview */}
                  {item.stickers && item.stickers.length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 30,
                        left: "35%",
                        display: "flex",
                        gap: 12,
                        transform: "translateZ(15px)",
                      }}
                    >
                      {item.stickers.map((st, i) => (
                        <img
                          key={i}
                          src={st.imageUrl}
                          alt={st.name}
                          title={st.name}
                          style={{
                            width: 34,
                            height: 34,
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.9))",
                            transform: "scale(1.1)",
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* On-stage 3D controls */}
                <div style={{ position: "absolute", bottom: 12, left: 12, display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setAutoSpin((v) => !v)}
                    style={{
                      background: autoSpin ? "#1e3a8a" : "#1e293b",
                      color: autoSpin ? "#60a5fa" : "#94a3b8",
                      border: "1px solid #334155",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    {autoSpin ? "⚡ Auto-Spin ON" : "⏸ Auto-Spin OFF"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRotateX(-5);
                      setRotateY(25);
                      setZoom(1.1);
                    }}
                    style={{
                      background: "#1e293b",
                      color: "#94a3b8",
                      border: "1px solid #334155",
                      borderRadius: 6,
                      padding: "6px 12px",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    ↺ Reset View
                  </button>
                </div>

                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    right: 12,
                    fontSize: 11,
                    color: "#64748b",
                    pointerEvents: "none",
                  }}
                >
                  Drag mouse to rotate 360° · Scroll wheel to zoom
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WEAR CONDITIONS & FLOAT SPECTRUM */}
          {activeTab === "wears" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Wear Tier Selector Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                {(item.wearPrices || []).map((w) => {
                  const isSelected = selectedWearTier === w.wear;
                  const price = w.price * statTrakMultiplier;
                  return (
                    <div
                      key={w.wear}
                      onClick={() => setSelectedWearTier(w.wear)}
                      style={{
                        background: isSelected ? "#1e293b" : "#0d131c",
                        border: isSelected ? "2px solid #3b82f6" : "1px solid #1e2a3a",
                        borderRadius: 10,
                        padding: "12px 10px",
                        cursor: "pointer",
                        textAlign: "center",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: isSelected ? "#60a5fa" : "#94a3b8",
                        }}
                      >
                        {w.wear}
                      </div>
                      <div style={{ fontSize: 10, color: "#64748b", margin: "2px 0 6px" }}>
                        {w.floatRange}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                        {formatPrice(price, currency)}
                      </div>
                      <div style={{ fontSize: 9, color: "#64748b", marginTop: 4 }}>
                        {w.offersCount} offers
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Float Spectrum Degradation Slider */}
              <div
                style={{
                  background: "#131a26",
                  border: "1px solid #1f2a3a",
                  borderRadius: 12,
                  padding: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc" }}>
                      CS2 FLOAT WEAR SPECTRUM:{" "}
                      <strong style={{ color: "#3b82f6" }}>{wearFloat.toFixed(6)}</strong>
                    </span>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                      Allowed Float Range for {item.skinName}: {minFloat.toFixed(2)} – {maxFloat.toFixed(2)}
                    </p>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: "#10b981",
                      background: "rgba(16, 185, 129, 0.15)",
                      padding: "4px 10px",
                      borderRadius: 6,
                    }}
                  >
                    {getWearTier(wearFloat)}
                  </span>
                </div>

                {/* Visual Wear Spectrum Bar */}
                <div
                  style={{
                    position: "relative",
                    height: 24,
                    borderRadius: 6,
                    overflow: "hidden",
                    display: "flex",
                    background: "#1e293b",
                  }}
                >
                  <div
                    title="Factory New (0.00-0.07)"
                    style={{
                      width: "7%",
                      background: "#10b981",
                      opacity: minFloat <= 0.07 ? 1 : 0.2,
                    }}
                  />
                  <div
                    title="Minimal Wear (0.07-0.15)"
                    style={{
                      width: "8%",
                      background: "#3b82f6",
                      opacity: minFloat <= 0.15 && maxFloat >= 0.07 ? 1 : 0.2,
                    }}
                  />
                  <div
                    title="Field-Tested (0.15-0.38)"
                    style={{
                      width: "23%",
                      background: "#eab308",
                      opacity: minFloat <= 0.38 && maxFloat >= 0.15 ? 1 : 0.2,
                    }}
                  />
                  <div
                    title="Well-Worn (0.38-0.45)"
                    style={{
                      width: "7%",
                      background: "#f97316",
                      opacity: minFloat <= 0.45 && maxFloat >= 0.38 ? 1 : 0.2,
                    }}
                  />
                  <div
                    title="Battle-Scarred (0.45-1.00)"
                    style={{
                      width: "55%",
                      background: "#ef4444",
                      opacity: maxFloat >= 0.45 ? 1 : 0.2,
                    }}
                  />

                  {/* Current Float Indicator Needle */}
                  <div
                    style={{
                      position: "absolute",
                      left: `${wearFloat * 100}%`,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      background: "#fff",
                      boxShadow: "0 0 8px rgba(255,255,255,0.9)",
                      transform: "translateX(-50%)",
                    }}
                  />
                </div>

                <input
                  type="range"
                  min={minFloat}
                  max={maxFloat}
                  step="0.001"
                  value={wearFloat}
                  onChange={(e) => setWearFloat(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 10,
                    color: "#64748b",
                    fontWeight: 700,
                  }}
                >
                  <span>FN (0.00 – 0.07)</span>
                  <span>MW (0.07 – 0.15)</span>
                  <span>FT (0.15 – 0.38)</span>
                  <span>WW (0.38 – 0.45)</span>
                  <span>BS (0.45 – 1.00)</span>
                </div>

                {/* CSGOSKINS.GG Doppler Phase Selector */}
                {isDoppler && (
                  <div
                    style={{
                      background: "#161f2c",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #233044",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc" }}>
                        DOPPLER PHASE SELECTOR: <strong style={{ color: "#818cf8" }}>{selectedDopplerPhase}</strong>
                      </span>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>
                        Multiplier: {dopplerMult}x
                      </span>
                    </div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {DOPPLER_PHASES.map((p) => {
                        const isPhaseActive = selectedDopplerPhase === p.name;
                        return (
                          <button
                            key={p.name}
                            type="button"
                            onClick={() => setSelectedDopplerPhase(p.name)}
                            style={{
                              background: isPhaseActive ? p.color : "#1e293b",
                              color: isPhaseActive ? "#000" : "#cbd5e1",
                              border: `1px solid ${isPhaseActive ? p.color : "#334155"}`,
                              padding: "5px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 800,
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CSGOSKINS.GG Fade Percentage Calculator */}
                {isFade && (
                  <div
                    style={{
                      background: "#161f2c",
                      padding: 14,
                      borderRadius: 10,
                      border: "1px solid #233044",
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#f8fafc" }}>
                        FADE PERCENTAGE CALCULATOR: <strong style={{ color: "#ec4899" }}>{fadePercent}%</strong>
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: fadePercent >= 100 ? "#22c55e" : "#eab308",
                          background: "rgba(234, 179, 8, 0.15)",
                          padding: "3px 8px",
                          borderRadius: 4,
                        }}
                      >
                        {fadePercent >= 100
                          ? "★ 100% True Full Fade (Tier 1)"
                          : fadePercent >= 98
                          ? "99% Fade (Tier 2)"
                          : fadePercent >= 95
                          ? "95% Fade (Tier 3)"
                          : "Base Fade"}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="80"
                      max="100"
                      step="0.5"
                      value={fadePercent}
                      onChange={(e) => setFadePercent(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#ec4899", cursor: "pointer", marginTop: 4 }}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#64748b" }}>
                      <span>80% Minimum Fade</span>
                      <span>95% High Fade</span>
                      <span>100% True Full Fade</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: VALVE CS2 DETAILS & METADATA */}
          {activeTab === "specs" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "#f8fafc", fontWeight: 800 }}>
                  Valve Technical Specification
                </h4>

                <div
                  style={{
                    background: "#0d131c",
                    border: "1px solid #1e2a3a",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Finish Style:</span>
                    <strong style={{ color: "#f8fafc", fontSize: 12 }}>
                      {item.finishStyle || "Custom Paint Job"}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Finish Catalog ID:</span>
                    <strong style={{ color: "#f8fafc", fontSize: 12 }}>
                      #{item.finishCatalog || item.paintSeed}
                    </strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Paint Seed:</span>
                    <strong style={{ color: "#f8fafc", fontSize: 12 }}>#{item.paintSeed}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Pattern Rank:</span>
                    <strong style={{ color: "#f8fafc", fontSize: 12 }}>
                      {item.patternRank ? `Tier ${item.patternRank}` : "Standard"}
                    </strong>
                  </div>
                  {item.fadePercentage !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b", fontSize: 12 }}>Fade Percentage:</span>
                      <strong style={{ color: "#e879f9", fontSize: 12 }}>
                        {item.fadePercentage}% Fade
                      </strong>
                    </div>
                  )}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#64748b", fontSize: 12 }}>Team Side:</span>
                    <strong style={{ color: "#f8fafc", fontSize: 12 }}>
                      {item.teamSide === "BOTH" ? "CT & Terrorist" : item.teamSide}
                    </strong>
                  </div>
                </div>

                {item.description && (
                  <div
                    style={{
                      background: "#0d131c",
                      border: "1px solid #1e2a3a",
                      borderRadius: 10,
                      padding: 16,
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>
                      VALVE FLAVOR LORE
                    </span>
                    <p style={{ margin: "6px 0 0", color: "#cbd5e1", fontSize: 12, lineHeight: 1.5 }}>
                      "{item.description}"
                    </p>
                  </div>
                )}
              </div>

              {/* Collection & Quick Commands */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ margin: 0, fontSize: 14, color: "#f8fafc", fontWeight: 800 }}>
                  Case &amp; Collection Source
                </h4>

                <div
                  style={{
                    background: "#0d131c",
                    border: "1px solid #1e2a3a",
                    borderRadius: 10,
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span style={{ fontSize: 24 }}>📦</span>
                  <div>
                    <strong style={{ fontSize: 13, color: "#f8fafc" }}>
                      {item.collectionName || "Operation Breakout Weapon Case"}
                    </strong>
                    <p style={{ margin: "2px 0 0", fontSize: 11, color: "#64748b" }}>
                      Available in official CS2 drop pools &amp; container openings.
                    </p>
                  </div>
                </div>

                <h4 style={{ margin: "10px 0 0", fontSize: 14, color: "#f8fafc", fontWeight: 800 }}>
                  Developer Console Commands
                </h4>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleCopyConsole}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "#94a3b8",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>📋</span> Copy Practice Server 'Give' Command
                  </button>
                  <button
                    type="button"
                    onClick={handleInspectInGame}
                    style={{
                      background: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: 8,
                      padding: "10px 14px",
                      color: "#94a3b8",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span>🔗</span> Copy Steam Inspect Protocol URL
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CSGOSKINS.GG CASE CONTENTS & DROP SIMULATOR */}
          {activeTab === "cases" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {caseDetails ? (
                <>
                  {/* Case Header Banner */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
                      border: "1px solid #334155",
                      borderRadius: 12,
                      padding: 18,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            background: "#eab308",
                            color: "#000",
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: 4,
                          }}
                        >
                          CS2 WEAPON CONTAINER
                        </span>
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>
                          Released: {caseDetails.releaseDate}
                        </span>
                      </div>
                      <h3 style={{ margin: 0, fontSize: 18, color: "#fff", fontWeight: 800 }}>
                        {caseDetails.caseName}
                      </h3>
                      <p style={{ margin: "4px 0 0", fontSize: 11, color: "#94a3b8" }}>
                        {caseDetails.description}
                      </p>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>
                          CASE: {formatPrice(caseDetails.casePriceUsd, currency)} + KEY: {formatPrice(caseDetails.keyPriceUsd, currency)}
                        </div>
                        <div style={{ fontSize: 15, color: "#22c55e", fontWeight: 800 }}>
                          Total: {formatPrice(caseDetails.casePriceUsd + caseDetails.keyPriceUsd, currency)}
                        </div>
                      </div>
                      <button
                        type="button"
                        disabled={isOpeningAnim}
                        onClick={handleSimulateUnbox}
                        style={{
                          background: "linear-gradient(135deg, #f59e0b, #d97706)",
                          color: "#000",
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 18px",
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 4px 15px rgba(245, 158, 11, 0.4)",
                        }}
                      >
                        {isOpeningAnim ? "🎲 UNBOXING..." : "🎲 TEST UNBOX / SIMULATE DROP"}
                      </button>
                    </div>
                  </div>

                  {/* Simulated Unboxing Result Banner */}
                  {simResult && (
                    <div
                      style={{
                        background: "#0d131c",
                        border: `2px solid ${simResult.item.rarityColor}`,
                        borderRadius: 12,
                        padding: 16,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: `0 0 25px ${simResult.item.rarityColor}33`,
                        flexWrap: "wrap",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div
                          style={{
                            width: 50,
                            height: 50,
                            borderRadius: 10,
                            background: `${simResult.item.rarityColor}22`,
                            border: `1px solid ${simResult.item.rarityColor}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 24,
                          }}
                        >
                          {simResult.item.rarity === "Special" ? "★" : "🔫"}
                        </div>
                        <div>
                          <span
                            style={{
                              background: simResult.item.rarityColor,
                              color: "#000",
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 3,
                            }}
                          >
                            {simResult.item.rarity.toUpperCase()}
                            {simResult.isStatTrak ? " · STATTRAK™" : ""}
                          </span>
                          <h4 style={{ margin: "4px 0 2px", fontSize: 16, color: "#fff", fontWeight: 800 }}>
                            {simResult.item.weapon} | {simResult.item.name}
                          </h4>
                          <span style={{ fontSize: 11, color: "#94a3b8" }}>
                            {simResult.wearName} (Float: {simResult.floatValue})
                          </span>
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#94a3b8" }}>SIMULATED DROP VALUE</div>
                        <div style={{ fontSize: 18, color: "#22c55e", fontWeight: 800 }}>
                          {formatPrice(simResult.estimatedPrice, currency)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color:
                              simResult.estimatedPrice >= (caseDetails.casePriceUsd + caseDetails.keyPriceUsd)
                                ? "#22c55e"
                                : "#ef4444",
                          }}
                        >
                          {simResult.estimatedPrice >= (caseDetails.casePriceUsd + caseDetails.keyPriceUsd)
                            ? `▲ Profit +${formatPrice(simResult.estimatedPrice - (caseDetails.casePriceUsd + caseDetails.keyPriceUsd), currency)}`
                            : `▼ Net -${formatPrice((caseDetails.casePriceUsd + caseDetails.keyPriceUsd) - simResult.estimatedPrice, currency)}`}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Drops Categorized Grid */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {(["Special", "Covert", "Classified", "Restricted", "Mil-Spec"] as const).map((tier) => {
                      const tierDrops = caseDetails.drops.filter((d) => d.rarity === tier);
                      if (tierDrops.length === 0) return null;
                      const odds =
                        tier === "Special"
                          ? "0.26%"
                          : tier === "Covert"
                          ? "0.64%"
                          : tier === "Classified"
                          ? "3.20%"
                          : tier === "Restricted"
                          ? "15.98%"
                          : "79.92%";
                      const tierColor = tierDrops[0].rarityColor;

                      return (
                        <div
                          key={tier}
                          style={{ background: "#111823", border: "1px solid #1e293b", borderRadius: 8, padding: 12 }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: 10,
                              borderBottom: "1px solid #1c2635",
                              paddingBottom: 6,
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{ width: 8, height: 8, borderRadius: "50%", background: tierColor }} />
                              <strong style={{ fontSize: 11, color: tierColor, textTransform: "uppercase" }}>
                                {tier} DROPS
                              </strong>
                            </div>
                            <span style={{ fontSize: 10, color: "#64748b" }}>
                              Official Valve Odds: <strong>{odds}</strong>
                            </span>
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
                              gap: 8,
                            }}
                          >
                            {tierDrops.map((d, dIdx) => (
                              <div
                                key={dIdx}
                                style={{
                                  background: "#16202e",
                                  border: "1px solid #233144",
                                  borderRadius: 6,
                                  padding: "8px 10px",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <div style={{ overflow: "hidden" }}>
                                  <strong
                                    style={{
                                      fontSize: 11,
                                      color: "#f1f5f9",
                                      display: "block",
                                      textOverflow: "ellipsis",
                                      overflow: "hidden",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {d.name}
                                  </strong>
                                  <span style={{ fontSize: 9, color: "#94a3b8" }}>{d.weapon}</span>
                                </div>
                                <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700, marginLeft: 8 }}>
                                  from {formatPrice(d.minPrice, currency)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
                  <h3>CS2 Active Duty Drop Pool</h3>
                  <p>
                    This skin is part of the CS2 general weapon drop pool and available through weekly service medals or
                    direct P2P marketplace exchanges.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid #1f2a3a",
            background: "#0d131c",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>
              {formatPrice(currentWearPrice, currency)}
            </span>
            <span
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                color: "#4ade80",
                fontSize: 11,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 4,
              }}
            >
              -{Math.abs(item.discountPercent || 22).toFixed(1)}% CSGOSKINS.GG DISCOUNT
            </span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {onEquip && (
              <>
                <button
                  type="button"
                  onClick={() => onEquip("CT")}
                  style={{
                    background: "#1e3a8a",
                    color: "#93c5fd",
                    border: "1px solid #2563eb",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Equip CT
                </button>
                <button
                  type="button"
                  onClick={() => onEquip("T")}
                  style={{
                    background: "#78350f",
                    color: "#fde68a",
                    border: "1px solid #d97706",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Equip T
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleInspectInGame}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#000",
                border: "0",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(34, 197, 94, 0.3)",
              }}
            >
              🎮 Inspect in CS2 Game
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
