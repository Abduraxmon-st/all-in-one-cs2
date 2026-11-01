import { useRef, useState } from "react";
import type { RoastCard, Award } from "../features/matches/types";
import "./RoastCardView.css";

interface RoastCardViewProps {
  roast: RoastCard;
  onClose?: () => void;
  notify?: (message: string) => void;
}

/**
 * Deterministically renders a high-res 1200x630 HTML5 Canvas for the CS2 Player Roast Card.
 */
export function generateRoastCardCanvas(roast: RoastCard): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;

  const isWon = roast.won;
  const primaryColor = isWon ? "#c8f135" : "#ff7a28";
  const mapDisplay = roast.mapName.replace(/^de_/, "").toUpperCase();

  // 1. Background Gradient
  const bgGradient = ctx.createLinearGradient(0, 0, 1200, 630);
  bgGradient.addColorStop(0, "#0b0f0e");
  bgGradient.addColorStop(0.5, "#131917");
  bgGradient.addColorStop(1, "#0a0c0b");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, 1200, 630);

  // 2. Subtle Tactical Grid Overlay
  ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
  ctx.lineWidth = 1;
  for (let x = 40; x < 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 630);
    ctx.stroke();
  }
  for (let y = 40; y < 630; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1200, y);
    ctx.stroke();
  }

  // 3. Card Outer Border & Corner Accents
  ctx.strokeStyle = "rgba(200, 241, 53, 0.35)";
  ctx.lineWidth = 2;
  ctx.strokeRect(24, 24, 1152, 582);

  // Glowing corner brackets
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 4;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(24, 60);
  ctx.lineTo(24, 24);
  ctx.lineTo(60, 24);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(1140, 24);
  ctx.lineTo(1176, 24);
  ctx.lineTo(1176, 60);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(24, 570);
  ctx.lineTo(24, 606);
  ctx.lineTo(60, 606);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(1140, 606);
  ctx.lineTo(1176, 606);
  ctx.lineTo(1176, 570);
  ctx.stroke();

  // 4. Header Bar
  ctx.font = "800 13px 'DM Sans', sans-serif";
  ctx.fillStyle = primaryColor;
  ctx.letterSpacing = "0.15em";
  ctx.fillText("CLUTCH LABS // MATCH ROAST & FLEX INTEL", 50, 65);

  // Match Result Badge
  const scoreBadge = `${mapDisplay} · ${roast.scoreLine} (${isWon ? "VICTORY" : "DEFEAT"})`;
  ctx.font = "700 14px 'DM Sans', sans-serif";
  ctx.fillStyle = "#8f9995";
  ctx.textAlign = "right";
  ctx.fillText(scoreBadge, 1150, 65);
  ctx.textAlign = "left";

  // Dividing Line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 82);
  ctx.lineTo(1150, 82);
  ctx.stroke();

  // 5. Player Identity
  ctx.font = "900 46px 'DM Sans', 'Barlow Condensed', sans-serif";
  ctx.fillStyle = "#f1f3ec";
  ctx.fillText(roast.playerName, 50, 140);

  ctx.font = "600 14px monospace";
  ctx.fillStyle = "#8f9995";
  ctx.fillText(`STEAM64: ${roast.steamId}`, 50, 168);

  // 6. Headline Award Pill
  const primaryBadge = roast.badges[0];
  const awardTitle = roast.headlineTitle || primaryBadge?.badgeTitle || "Match Performer";
  const awardIcon = primaryBadge?.badgeIcon || (isWon ? "👑" : "💀");

  ctx.fillStyle = "rgba(200, 241, 53, 0.12)";
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(50, 192, ctx.measureText(`${awardIcon}  ${awardTitle.toUpperCase()}`).width + 60, 36, 4);
  ctx.fill();
  ctx.stroke();

  ctx.font = "800 14px 'DM Sans', sans-serif";
  ctx.fillStyle = primaryColor;
  ctx.fillText(`${awardIcon}  ${awardTitle.toUpperCase()}`, 66, 215);

  // 7. Headline Roast Quote
  ctx.font = "italic 600 24px 'DM Sans', serif";
  ctx.fillStyle = "#f1f3ec";
  const quoteText = `"${roast.headlineRoast}"`;

  // Helper for word wrapping
  function wrapText(renderCtx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = renderCtx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        renderCtx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    renderCtx.fillText(line, x, currentY);
    return currentY + lineHeight;
  }

  wrapText(ctx, quoteText, 50, 275, 1080, 36);

  // 8. Stat Boxes (4 Columns)
  const statBoxY = 370;
  const statBoxWidth = 255;
  const statBoxHeight = 90;
  const statGap = 26;

  const stats = [
    { label: "K / D / A", value: `${roast.kills} / ${roast.deaths} / ${roast.assists}`, sub: `${roast.kills - roast.deaths >= 0 ? "+" : ""}${roast.kills - roast.deaths} DIFF` },
    { label: "AVG DAMAGE / ROUND", value: `${roast.adr.toFixed(1)}`, sub: "ADR" },
    { label: "HEADSHOT ACCURACY", value: `${roast.headshotPct.toFixed(1)}%`, sub: "HS PCT" },
    { label: "IMPACT RATING", value: `${roast.impactRating.toFixed(2)}`, sub: roast.impactRating >= 1.0 ? "HIGH IMPACT" : "LOW IMPACT" },
  ];

  stats.forEach((st, idx) => {
    const boxX = 50 + idx * (statBoxWidth + statGap);

    ctx.fillStyle = "rgba(18, 23, 21, 0.85)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(boxX, statBoxY, statBoxWidth, statBoxHeight, 4);
    ctx.fill();
    ctx.stroke();

    // Stat Label
    ctx.font = "800 11px 'DM Sans', sans-serif";
    ctx.fillStyle = "#8f9995";
    ctx.fillText(st.label, boxX + 16, statBoxY + 26);

    // Stat Value
    ctx.font = "900 28px 'DM Sans', sans-serif";
    ctx.fillStyle = "#f1f3ec";
    ctx.fillText(st.value, boxX + 16, statBoxY + 62);

    // Subtag
    ctx.font = "700 10px 'DM Sans', sans-serif";
    ctx.fillStyle = primaryColor;
    ctx.textAlign = "right";
    ctx.fillText(st.sub, boxX + statBoxWidth - 14, statBoxY + 60);
    ctx.textAlign = "left";
  });

  // 9. Badges Strip
  const badgeY = 490;
  let currentBadgeX = 50;
  ctx.font = "700 12px 'DM Sans', sans-serif";

  roast.badges.slice(0, 4).forEach((badge) => {
    const isFlex = badge.badgeCategory === "FLEX";
    const badgeText = `${badge.badgeIcon} ${badge.badgeTitle}`;
    const badgeWidth = ctx.measureText(badgeText).width + 24;

    ctx.fillStyle = isFlex ? "rgba(200, 241, 53, 0.1)" : "rgba(255, 122, 40, 0.1)";
    ctx.strokeStyle = isFlex ? "rgba(200, 241, 53, 0.35)" : "rgba(255, 122, 40, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(currentBadgeX, badgeY, badgeWidth, 30, 3);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFlex ? "#c8f135" : "#ff7a28";
    ctx.fillText(badgeText, currentBadgeX + 12, badgeY + 20);
    currentBadgeX += badgeWidth + 12;
  });

  // 10. Footer Watermark
  ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 560);
  ctx.lineTo(1150, 560);
  ctx.stroke();

  ctx.font = "600 12px 'DM Sans', sans-serif";
  ctx.fillStyle = "#8f9995";
  ctx.fillText("CLUTCH LABS // COUNTER-STRIKE 2 COMMUNITY INTELLIGENCE", 50, 588);

  ctx.textAlign = "right";
  ctx.fillStyle = primaryColor;
  ctx.fillText("all-in-one-cs2.vercel.app", 1150, 588);
  ctx.textAlign = "left";

  return canvas;
}

export function downloadRoastCardPng(roast: RoastCard, notify?: (msg: string) => void) {
  const canvas = generateRoastCardCanvas(roast);
  const link = document.createElement("a");
  const cleanPlayer = roast.playerName.replace(/[^a-zA-Z0-9_-]/g, "_");
  const cleanMap = roast.mapName.replace(/^de_/, "");
  link.download = `clutch-labs-roast-${cleanPlayer}-${cleanMap}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
  notify?.("Roast card PNG downloaded (1200×630)!");
}

export async function copyRoastCardImage(roast: RoastCard, notify?: (msg: string) => void) {
  try {
    const canvas = generateRoastCardCanvas(roast);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        notify?.("Failed to generate image blob");
        return;
      }
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        notify?.("Roast card image copied to clipboard! Paste directly into Discord or Twitter.");
      } catch {
        notify?.("Clipboard image write not supported in this browser. Please download PNG.");
      }
    }, "image/png");
  } catch {
    notify?.("Could not copy card image.");
  }
}

export default function RoastCardView({ roast, onClose, notify }: RoastCardViewProps) {
  const [downloading, setDownloading] = useState(false);
  const [copyingImage, setCopyingImage] = useState(false);

  const isWon = roast.won;
  const primaryBadge = roast.badges[0];
  const awardTitle = roast.headlineTitle || primaryBadge?.badgeTitle || "Match Performance";
  const awardIcon = primaryBadge?.badgeIcon || (isWon ? "🏆" : "💀");

  const handleDownload = () => {
    setDownloading(true);
    try {
      downloadRoastCardPng(roast, notify);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const handleCopyImage = async () => {
    setCopyingImage(true);
    try {
      await copyRoastCardImage(roast, notify);
    } finally {
      setTimeout(() => setCopyingImage(false), 600);
    }
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/m/${roast.shareSlug}?p=${encodeURIComponent(roast.steamId)}`;
      await navigator.clipboard.writeText(shareUrl);
      notify?.("Roast card link copied to clipboard!");
    } catch {
      notify?.("Could not copy card link.");
    }
  };

  return (
    <section className="roast-card-section">
      {/* Top Action Bar */}
      <div className="roast-toolbar">
        <div className="roast-toolbar-left">
          <span className="roast-pill">1200×630 SHARE CARD</span>
          <span className="roast-format-tag">PNG READY</span>
        </div>
        <div className="roast-toolbar-right">
          <button
            type="button"
            className="roast-btn primary"
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? "GENERATING PNG…" : "⬇ DOWNLOAD PNG (1200×630)"}
          </button>
          <button
            type="button"
            className="roast-btn secondary"
            onClick={handleCopyImage}
            disabled={copyingImage}
          >
            {copyingImage ? "COPYING…" : "📋 COPY IMAGE TO CLIPBOARD"}
          </button>
          <button
            type="button"
            className="roast-btn link"
            onClick={handleCopyLink}
          >
            🔗 COPY LINK
          </button>
          {onClose && (
            <button
              type="button"
              className="roast-close-btn"
              onClick={onClose}
              aria-label="Close roast card"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* 1200:630 Aspect Ratio Visual Card */}
      <div className="roast-visual-card">
        <div className="roast-inner-container">
          {/* Header */}
          <div className="roast-card-header">
            <div className="roast-brand">
              <span className="brand-dot" />
              <strong>CLUTCH LABS</strong>
              <span>// ROAST & FLEX INTEL</span>
            </div>
            <div className="roast-match-meta">
              <span className="roast-map-name">
                {roast.mapName.replace(/^de_/, "").toUpperCase()}
              </span>
              <span className={`roast-score-tag ${isWon ? "won" : "lost"}`}>
                {roast.scoreLine} ({isWon ? "VICTORY" : "DEFEAT"})
              </span>
            </div>
          </div>

          {/* Player Identity & Award */}
          <div className="roast-player-row">
            <div>
              <h2 className="roast-player-name">{roast.playerName}</h2>
              <span className="roast-steam-id">STEAM64: {roast.steamId}</span>
            </div>
            <div className="roast-award-pill">
              <span className="award-emoji">{awardIcon}</span>
              <strong>{awardTitle}</strong>
            </div>
          </div>

          {/* Roast Quote */}
          <blockquote className="roast-quote">
            "{roast.headlineRoast}"
          </blockquote>

          {/* Stats Quad Grid */}
          <div className="roast-stats-grid">
            <div className="roast-stat-box">
              <span className="stat-label">K / D / A</span>
              <strong className="stat-value">{roast.kills} / {roast.deaths} / {roast.assists}</strong>
              <small className="stat-sub">{roast.kills - roast.deaths >= 0 ? "+" : ""}{roast.kills - roast.deaths} DIFF</small>
            </div>
            <div className="roast-stat-box">
              <span className="stat-label">AVERAGE DAMAGE</span>
              <strong className="stat-value">{roast.adr.toFixed(1)}</strong>
              <small className="stat-sub">ADR</small>
            </div>
            <div className="roast-stat-box">
              <span className="stat-label">HEADSHOT %</span>
              <strong className="stat-value">{roast.headshotPct.toFixed(1)}%</strong>
              <small className="stat-sub">HS RATIO</small>
            </div>
            <div className="roast-stat-box">
              <span className="stat-label">IMPACT RATING</span>
              <strong className="stat-value">{roast.impactRating.toFixed(2)}</strong>
              <small className={`stat-sub ${roast.impactRating >= 1 ? "high" : "low"}`}>
                {roast.impactRating >= 1 ? "HIGH IMPACT" : "LOW IMPACT"}
              </small>
            </div>
          </div>

          {/* Badges Tray & Footer */}
          <div className="roast-card-footer">
            <div className="roast-badges-strip">
              {roast.badges.map((badge: Award) => (
                <span
                  key={badge.badgeCode}
                  className={`roast-badge-tag ${badge.badgeCategory.toLowerCase()}`}
                  title={badge.description}
                >
                  <i>{badge.badgeIcon}</i> {badge.badgeTitle}
                </span>
              ))}
            </div>
            <div className="roast-watermark">
              <span>all-in-one-cs2.vercel.app</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
