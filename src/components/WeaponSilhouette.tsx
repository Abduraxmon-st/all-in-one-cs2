// Clean crisp SVG silhouettes for CS2 weapons (Fallback for any image load error)

export function getWeaponSilhouetteSvg(weaponName: string): string {
  const name = (weaponName || "").toLowerCase();

  // Knife Silhouette
  if (name.includes("knife") || name.includes("bayonet") || name.includes("karambit") || name.includes("daggers")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 60 120 L 120 100 L 160 90 L 260 70 C 310 60, 360 80, 380 90 C 350 110, 280 120, 220 125 L 150 130 L 100 145 Z" fill="%233b82f6" fill-opacity="0.3" stroke="%2360a5fa" stroke-width="3" stroke-linejoin="round"/><rect x="40" y="115" width="50" height="20" rx="4" transform="rotate(-15 65 125)" fill="%2322c55e" fill-opacity="0.4" stroke="%234ade80" stroke-width="2"/></svg>`;
  }

  // Gloves Silhouette
  if (name.includes("gloves") || name.includes("wraps")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 120 140 C 100 120, 100 80, 120 60 C 140 40, 180 50, 190 70 L 210 70 C 220 50, 260 40, 280 60 C 300 80, 300 120, 280 140 L 250 160 L 150 160 Z" fill="%23eab308" fill-opacity="0.25" stroke="%23facc15" stroke-width="3"/><circle cx="160" cy="100" r="12" fill="%23eab308" fill-opacity="0.5"/><circle cx="240" cy="100" r="12" fill="%23eab308" fill-opacity="0.5"/></svg>`;
  }

  // AWP / Sniper Silhouette
  if (name.includes("awp") || name.includes("ssg") || name.includes("scar") || name.includes("g3sg1")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" fill="none"><path d="M 40 130 L 90 120 L 140 115 L 200 115 L 230 135 L 250 135 L 260 115 L 440 105 L 470 105 L 470 112 L 440 115 L 280 120 L 220 122 L 180 145 L 120 150 Z" fill="%23a855f7" fill-opacity="0.3" stroke="%23c084fc" stroke-width="3"/><rect x="180" y="85" width="120" height="15" rx="3" fill="%23c084fc" fill-opacity="0.5" stroke="%23e9d5ff" stroke-width="2"/><line x1="210" y1="100" x2="210" y2="115" stroke="%23c084fc" stroke-width="3"/><line x1="270" y1="100" x2="270" y2="115" stroke="%23c084fc" stroke-width="3"/></svg>`;
  }

  // Pistol Silhouette
  if (name.includes("glock") || name.includes("usp") || name.includes("deagle") || name.includes("p250") || name.includes("fiveseven") || name.includes("berettas") || name.includes("revolver")) {
    return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 200" fill="none"><path d="M 120 70 L 280 70 L 280 110 L 230 110 L 210 160 L 160 160 L 175 110 L 120 105 Z" fill="%23f97316" fill-opacity="0.3" stroke="%23fb923c" stroke-width="3" stroke-linejoin="round"/><circle cx="200" cy="125" r="8" stroke="%23fb923c" stroke-width="2"/></svg>`;
  }

  // Standard Rifle (AK-47 / M4) Silhouette Default
  return `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 200" fill="none"><path d="M 50 130 L 110 115 L 160 110 L 260 105 L 430 95 L 460 95 L 460 102 L 430 105 L 280 110 L 250 145 L 220 150 L 230 112 L 180 115 L 130 150 L 80 150 Z" fill="%233b82f6" fill-opacity="0.3" stroke="%2360a5fa" stroke-width="3" stroke-linejoin="round"/><rect x="180" y="95" width="80" height="12" rx="2" fill="%2360a5fa" fill-opacity="0.4"/></svg>`;
}
