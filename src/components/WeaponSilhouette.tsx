// Clean crisp SVG silhouettes for CS2 weapons (Fallback for any image load error)
// Fully encoded for 100% reliable rendering in Microsoft Edge & Chromium

function svgToDataUri(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function getWeaponSilhouetteSvg(weaponName: string): string {
  const name = (weaponName || "").toLowerCase().trim();

  // Knife Silhouette (Handles "knives", "knife", "karambit", "bayonet", "daggers", etc.)
  if (
    name.includes("knife") ||
    name.includes("knives") ||
    name.includes("bayonet") ||
    name.includes("karambit") ||
    name.includes("daggers")
  ) {
    return svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 60 120 L 120 100 L 160 90 L 260 70 C 310 60, 360 80, 380 90 C 350 110, 280 120, 220 125 L 150 130 L 100 145 Z" fill="#bef264" fill-opacity="0.25" stroke="#bef264" stroke-width="2.5" stroke-linejoin="round"/><rect x="40" y="115" width="50" height="18" rx="3" transform="rotate(-15 65 125)" fill="#1e293b" stroke="#bef264" stroke-width="2"/></svg>`
    );
  }

  // Gloves Silhouette
  if (name.includes("gloves") || name.includes("glove") || name.includes("wraps")) {
    return svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 120 140 C 100 120, 100 80, 120 60 C 140 40, 180 50, 190 70 L 210 70 C 220 50, 260 40, 280 60 C 300 80, 300 120, 280 140 L 250 160 L 150 160 Z" fill="#bef264" fill-opacity="0.2" stroke="#bef264" stroke-width="2.5"/><circle cx="160" cy="100" r="10" fill="#1e293b" stroke="#bef264" stroke-width="1.5"/><circle cx="240" cy="100" r="10" fill="#1e293b" stroke="#bef264" stroke-width="1.5"/></svg>`
    );
  }

  // AWP / Sniper Silhouette
  if (name.includes("awp") || name.includes("ssg") || name.includes("scar") || name.includes("g3sg1") || name.includes("sniper")) {
    return svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" fill="none"><path d="M 40 130 L 90 120 L 140 115 L 200 115 L 230 135 L 250 135 L 260 115 L 440 105 L 470 105 L 470 112 L 440 115 L 280 120 L 220 122 L 180 145 L 120 150 Z" fill="#bef264" fill-opacity="0.25" stroke="#bef264" stroke-width="2.5"/><rect x="180" y="85" width="120" height="15" rx="3" fill="#1e293b" stroke="#bef264" stroke-width="2"/><line x1="210" y1="100" x2="210" y2="115" stroke="#bef264" stroke-width="2"/><line x1="270" y1="100" x2="270" y2="115" stroke="#bef264" stroke-width="2"/></svg>`
    );
  }

  // Pistol Silhouette
  if (name.includes("glock") || name.includes("usp") || name.includes("deagle") || name.includes("p250") || name.includes("fiveseven") || name.includes("berettas") || name.includes("revolver") || name.includes("pistol")) {
    return svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 120 70 L 280 70 L 280 110 L 230 110 L 210 160 L 160 160 L 175 110 L 120 105 Z" fill="#bef264" fill-opacity="0.25" stroke="#bef264" stroke-width="2.5" stroke-linejoin="round"/><circle cx="200" cy="125" r="8" fill="#1e293b" stroke="#bef264" stroke-width="1.5"/></svg>`
    );
  }

  // Case / Container Silhouette
  if (name.includes("case") || name.includes("container") || name.includes("capsule")) {
    return svgToDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><rect x="120" y="60" width="160" height="100" rx="10" fill="#bef264" fill-opacity="0.2" stroke="#bef264" stroke-width="2.5"/><line x1="120" y1="95" x2="280" y2="95" stroke="#bef264" stroke-width="2"/><rect x="180" y="88" width="40" height="14" rx="3" fill="#1e293b" stroke="#bef264" stroke-width="1.5"/></svg>`
    );
  }

  // Standard Rifle (AK-47 / M4) Silhouette Default
  return svgToDataUri(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" fill="none"><path d="M 50 130 L 110 115 L 160 110 L 260 105 L 430 95 L 460 95 L 460 102 L 430 105 L 280 110 L 250 145 L 220 150 L 230 112 L 180 115 L 130 150 L 80 150 Z" fill="#bef264" fill-opacity="0.25" stroke="#bef264" stroke-width="2.5" stroke-linejoin="round"/><rect x="180" y="95" width="80" height="12" rx="2" fill="#1e293b" stroke="#bef264" stroke-width="1.5"/></svg>`
  );
}
