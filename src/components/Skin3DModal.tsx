import { useState, useRef, useEffect, type FC } from "react";
import type { CSFloatItem } from "../features/loadouts/csfloatCatalogData";
import { getWeaponSilhouetteSvg } from "./WeaponSilhouette";

interface Props {
  item: CSFloatItem;
  onClose: () => void;
  notify: (msg: string) => void;
  onEquip?: (side: "CT" | "T") => void;
}

export const Skin3DModal: FC<Props> = ({ item, onClose, notify, onEquip }) => {
  const [rotateX, setRotateX] = useState(-5);
  const [rotateY, setRotateY] = useState(25);
  const [zoom, setZoom] = useState(1.1);
  const [autoSpin, setAutoSpin] = useState(true);
  const [wearFloat, setWearFloat] = useState(item.floatValue);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Auto spin animation loop
  useEffect(() => {
    if (!autoSpin || isDragging) return;
    const interval = setInterval(() => {
      setRotateY((y) => (y + 0.6) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [autoSpin, isDragging]);

  // Drag rotation handlers
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

    // Copy to clipboard
    navigator.clipboard.writeText(inspectUrl).catch(() => {});

    // Launch Steam protocol
    window.location.href = inspectUrl;
    notify(`Copied inspect command! Opening ${item.skinName} in CS2...`);
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

  return (
    <div
      className="csf-modal-overlay"
      onClick={onClose}
      onMouseUp={handleMouseUp}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 12, 0.88)",
        backdropFilter: "blur(12px)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        className="csf-3d-dialog"
        onClick={(e) => e.stopPropagation()}
        onMouseMove={handleMouseMove}
        onWheel={handleWheel}
        style={{
          backgroundColor: "#11161d",
          border: "1px solid #2b3644",
          borderRadius: 14,
          maxWidth: 880,
          width: "100%",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 18,
          boxShadow: "0 25px 60px rgba(0,0,0,0.8), 0 0 40px rgba(59, 130, 246, 0.12)",
          userSelect: "none",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 4,
                  letterSpacing: "0.05em",
                }}
              >
                🧊 3D WEAPON INSPECTOR
              </span>
              {item.isStatTrak && (
                <span style={{ color: "#f97316", fontWeight: 800, fontSize: 11 }}>★ StatTrak™</span>
              )}
              {item.isSouvenir && (
                <span style={{ color: "#eab308", fontWeight: 800, fontSize: 11 }}>★ Souvenir</span>
              )}
            </div>
            <h2 style={{ margin: 0, fontSize: 20, color: "#fff", fontWeight: 800 }}>
              {item.marketHashName}
            </h2>
            <p style={{ margin: "2px 0 0", color: "#8b98a5", fontSize: 12 }}>
              {item.category} · {item.rarity} · Paint Seed #{item.paintSeed} · Rank #{item.patternRank ?? "N/A"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "#1e2632",
              border: "1px solid #374353",
              color: "#9ca3af",
              borderRadius: 6,
              width: 32,
              height: 32,
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* 3D Perspective Stage */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            position: "relative",
            height: 340,
            background:
              "radial-gradient(circle, rgba(30, 58, 138, 0.15) 0%, rgba(10, 14, 20, 0.98) 70%)",
            borderRadius: 10,
            border: "1px solid #1f2937",
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

          {/* 3D Weapon Model Container */}
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
                maxWidth: 480,
                maxHeight: 250,
                objectFit: "contain",
                filter: `drop-shadow(0 15px 25px rgba(0,0,0,0.8)) brightness(${brightness}) contrast(${contrast}) sepia(${sepia})`,
                userSelect: "none",
                pointerEvents: "none",
              }}
            />

            {/* In-place stickers preview */}
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
                      width: 32,
                      height: 32,
                      filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.9))",
                      transform: "scale(1.1)",
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Controls overlay in stage */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              display: "flex",
              gap: 8,
            }}
          >
            <button
              type="button"
              onClick={() => setAutoSpin((v) => !v)}
              style={{
                background: autoSpin ? "#1e3a8a" : "#1e2632",
                color: autoSpin ? "#60a5fa" : "#9ca3af",
                border: "1px solid #374353",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 10,
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
                background: "#1e2632",
                color: "#9ca3af",
                border: "1px solid #374353",
                borderRadius: 4,
                padding: "4px 10px",
                fontSize: 10,
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
              fontSize: 10,
              color: "#6b7280",
              pointerEvents: "none",
            }}
          >
            Drag to Rotate 3D · Scroll to Zoom
          </div>
        </div>

        {/* Live Float Spectrum Slider */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#d1d5db" }}>
              FLOAT WEAR SLIDER: <strong style={{ color: "#3b82f6" }}>{wearFloat.toFixed(6)}</strong>
            </span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10b981" }}>
              {getWearTier(wearFloat)}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.001"
            value={wearFloat}
            onChange={(e) => setWearFloat(Number(e.target.value))}
            style={{ width: "100%", accentColor: "#3b82f6", cursor: "pointer" }}
          />

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 9,
              color: "#6b7280",
              fontWeight: 700,
            }}
          >
            <span>FN (0.00 - 0.07)</span>
            <span>MW (0.07 - 0.15)</span>
            <span>FT (0.15 - 0.38)</span>
            <span>WW (0.38 - 0.45)</span>
            <span>BS (0.45 - 1.00)</span>
          </div>
        </div>

        {/* Bottom Actions Bar */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid #1f2937",
            paddingTop: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 18, fontWeight: 800, color: "#fff" }}>
              ${item.priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
            <span
              style={{
                background: "rgba(34, 197, 94, 0.15)",
                color: "#4ade80",
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              {item.discountPercent.toFixed(1)}% OFF
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
                    color: "#60a5fa",
                    border: "1px solid #2563eb",
                    borderRadius: 6,
                    padding: "8px 14px",
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
                    color: "#fbbf24",
                    border: "1px solid #d97706",
                    borderRadius: 6,
                    padding: "8px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  + Equip T
                </button>
              </>
            )}

            {/* Inspect in Game button */}
            <button
              type="button"
              onClick={handleInspectInGame}
              style={{
                background: "linear-gradient(135deg, #22c55e, #16a34a)",
                color: "#111",
                border: "0",
                borderRadius: 6,
                padding: "8px 18px",
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
