import { useEffect, useMemo, useState } from "react";
import { csfloatCatalogData, type CSFloatItem, formatPrice, type CurrencyCode } from "../features/loadouts/csfloatCatalogData";
import { CSGOSkinsModal } from "../components/CSGOSkinsModal";
import { CSGOSkinsHeaderNav } from "../components/CSGOSkinsHeaderNav";
import { SkinDetailOverview } from "../components/SkinDetailOverview";
import { AdvancedSearchModal, type AdvancedSearchParams } from "../components/AdvancedSearchModal";
import { getWeaponSilhouetteSvg } from "../components/WeaponSilhouette";
import { getWeaponIconUrl } from "../features/loadouts/weaponIconResolver";
import type { Wear } from "../features/loadouts/types";
import "./LoadoutPage.css";
import "./CSGOSkinsGrid.css";

type Props = {
  budget: number;
  setBudget: (value: number) => void;
  notify: (message: string) => void;
};

// Sub-Weapon Options by Category
const SUB_WEAPONS: Record<string, string[]> = {
  Rifles: ["All", "AK-47", "AUG", "AWP", "FAMAS", "G3SG1", "Galil AR", "M4A1-S", "M4A4", "SCAR-20", "SG 553", "SSG 08"],
  Pistols: ["All", "CZ75-Auto", "Desert Eagle", "Dual Berettas", "Five-SeveN", "Glock-18", "P2000", "P250", "R8 Revolver", "Tec-9", "USP-S"],
  Knives: ["All", "Karambit", "Butterfly Knife", "M9 Bayonet", "Bayonet", "Skeleton Knife", "Talon Knife", "Stiletto Knife", "Bowie Knife", "Classic Knife", "Falchion Knife", "Flip Knife", "Gut Knife", "Huntsman Knife", "Kukri Knife", "Navaja Knife", "Nomad Knife", "Paracord Knife", "Shadow Daggers", "Survival Knife", "Ursus Knife"],
  Gloves: ["All", "Bloodhound Gloves", "Broken Fang Gloves", "Driver Gloves", "Hand Wraps", "Hydra Gloves", "Moto Gloves", "Specialist Gloves", "Sport Gloves"],
  "Mid-Tier": ["All", "MAC-10", "MP5-SD", "MP7", "MP9", "P90", "PP-Bizon", "UMP-45", "MAG-7", "Nova", "Sawed-Off", "XM1014", "M249", "Negev"],
  SMGs: ["All", "MAC-10", "MP5-SD", "MP7", "MP9", "P90", "PP-Bizon", "UMP-45", "MAG-7", "Nova", "Sawed-Off", "XM1014", "M249", "Negev"],
  Heavy: ["All", "MAG-7", "Nova", "Sawed-Off", "XM1014", "M249", "Negev"],
  Cases: ["All", "Danger Zone Case", "CS20 Case", "Revolution Case", "Dreams & Nightmares Case", "Clutch Case", "Fracture Case", "Kilowatt Case", "Recoil Case", "Snakebite Case"],
  Containers: ["All", "Danger Zone Case", "CS20 Case", "Revolution Case", "Dreams & Nightmares Case", "Clutch Case", "Fracture Case", "Kilowatt Case", "Recoil Case", "Snakebite Case"],
  Collections: ["All", "The Armory Collection", "The Mirage 2021 Collection", "The Dust 2 2021 Collection", "The Cobblestone Collection", "The Control Collection"],
  Stickers: ["All", "Katowice 2014", "Cologne 2014", "Stockholm 2021", "Antwerp 2022", "Paris 2023", "Copenhagen 2024"],
  Other: ["All", "Music Kits", "Storage Units", "Agents", "Patches", "Pins"],
};

const PAGE_SIZE = 24;

function formatPriceRange(min?: number, max?: number, currency: CurrencyCode = "USD"): string {
  if (min === undefined || min === null) return "Check Offers";
  if (max === undefined || max === null || max === min) return formatPrice(min, currency);
  return `${formatPrice(min, currency)} - ${formatPrice(max, currency)}`;
}

function getRarityGlowColor(rarity?: string, category?: string): string {
  if (category === "KNIVES" || category === "GLOVES") return "#ffd700";
  const r = (rarity || "").toLowerCase();
  if (r.includes("covert") || r.includes("extraordinary") || r.includes("contraband")) return "#eb4b4b";
  if (r.includes("classified")) return "#d32ce6";
  if (r.includes("restricted")) return "#8847ff";
  if (r.includes("mil-spec")) return "#4b69ff";
  if (r.includes("industrial")) return "#5e98d9";
  if (r.includes("consumer")) return "#b0c3d9";
  return "#8847ff";
}

function getRarityLabel(item: CSFloatItem): string {
  if (item.category === "KNIVES") return "★ Covert Knife";
  if (item.category === "GLOVES") return "★ Extraordinary Gloves";
  const r = item.rarity || "Covert";
  const cat =
    item.category === "SMGS"
      ? "SMG"
      : item.category === "RIFLES"
      ? "Rifle"
      : item.category === "PISTOLS"
      ? "Pistol"
      : item.category === "HEAVY"
      ? "Heavy"
      : "";
  return cat ? `${r} ${cat}` : r;
}

function getPageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 4) {
    return [1, 2, 3, 4, 5, "...", total];
  }
  if (current >= total - 3) {
    return [1, "...", total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, "...", current - 1, current, current + 1, "...", total];
}

export default function LoadoutPage({ budget: _budget, setBudget: _setBudget, notify }: Props) {
  // 1. Core State & Currency
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [items, setItems] = useState<CSFloatItem[]>(csfloatCatalogData);

  // Active Category & Selected Weapon
  const [activeMegaCategory, setActiveMegaCategory] = useState<string>("Rifles");
  const [selectedSubWeapon, setSelectedSubWeapon] = useState<string>("All");

  // Grid Search & Sort
  const [gridSearch, setGridSearch] = useState("");
  const [gridSort, setGridSort] = useState<string>("popularity");

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Chosen Skin for In-Depth Detail Overview (NULL initially until a skin card is clicked!)
  const [selectedSkin, setSelectedSkin] = useState<CSFloatItem | null>(null);

  // 3D Inspector Modal State
  const [inspect3DItem, setInspect3DItem] = useState<CSFloatItem | null>(null);

  // Advanced Search Modal State
  const [isAdvancedSearchOpen, setIsAdvancedSearchOpen] = useState(false);
  const [advancedParams, setAdvancedParams] = useState<AdvancedSearchParams>({
    query: "",
    minPrice: "",
    maxPrice: "",
    color: "Any",
    weapon: "Any",
    exterior: "Any",
    variant: "Any",
    orderBy: "popularity",
  });

  // Weapon / Category Selection Handler
  const handleSelectWeapon = (cat: string, wep: string) => {
    const normalizedWep = wep.startsWith("All") ? "All" : wep;
    setActiveMegaCategory(cat);
    setSelectedSubWeapon(normalizedWep);
    setCurrentPage(1);
    // Detail overview only opens when user clicks a skin card in the grid!
    setSelectedSkin(null);
  };

  const handleApplyAdvancedSearch = (params: AdvancedSearchParams) => {
    setAdvancedParams(params);
    if (params.query) setGridSearch(params.query);
    if (params.orderBy) setGridSort(params.orderBy);
    setCurrentPage(1);

    if (params.weapon && params.weapon !== "Any") {
      setSelectedSubWeapon(params.weapon);
      for (const [cat, weps] of Object.entries(SUB_WEAPONS)) {
        if (weps.includes(params.weapon)) {
          setActiveMegaCategory(cat);
          break;
        }
      }
    }
    notify("Applied Advanced Search filters");
  };

  // Reset pagination when category, weapon, search, sort, or advanced filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeMegaCategory, selectedSubWeapon, gridSearch, gridSort, advancedParams]);

  // Dynamic Image Enrichment from CSGO-API on Mount
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data)) return;
        const lookup = new Map<string, string>();
        const norm = (str: string) => str.replace(/[★™\s|()_-]/g, "").toLowerCase();
        for (const s of data) {
          if (s.name && s.image) {
            lookup.set(norm(s.name), s.image);
            lookup.set(s.name.toLowerCase().trim(), s.image);
            if (s.pattern?.name) {
              lookup.set(norm(`${s.name} ${s.pattern.name}`), s.image);
            }
          }
        }
        setItems((current) =>
          current.map((item) => {
            const withoutWear = item.marketHashName.replace(/\s*\([^)]*\)\s*$/, "").trim();
            const found =
              lookup.get(norm(item.marketHashName)) ||
              lookup.get(norm(withoutWear)) ||
              lookup.get(norm(`${item.weaponName} ${item.skinName}`)) ||
              lookup.get(norm(item.skinName)) ||
              lookup.get(withoutWear.toLowerCase());
            return found ? { ...item, imageUrl: found } : item;
          })
        );
      })
      .catch(() => {});
  }, []);

  // Filtered & Sorted Skins
  const displayedSkins = useMemo(() => {
    let result = items;

    // 1. Weapon or Category Filter
    if (selectedSubWeapon && selectedSubWeapon !== "All") {
      const wepClean = selectedSubWeapon.replace(/[★™\s]/g, "").toLowerCase();
      result = result.filter((i) => {
        const itemWep = i.weaponName.replace(/[★™\s]/g, "").toLowerCase();
        const itemHash = i.marketHashName.replace(/[★™\s]/g, "").toLowerCase();
        const itemSkin = (i.skinName || "").replace(/[★™\s]/g, "").toLowerCase();
        const itemCrate = (i.crateName || "").replace(/[★™\s]/g, "").toLowerCase();
        const inCrates = i.crates && i.crates.some((c: any) => c.name && c.name.replace(/[★™\s]/g, "").toLowerCase().includes(wepClean));
        return (
          itemWep === wepClean ||
          itemWep.includes(wepClean) ||
          itemSkin.includes(wepClean) ||
          itemHash.startsWith(wepClean) ||
          itemHash.includes(wepClean) ||
          itemCrate.includes(wepClean) ||
          inCrates
        );
      });
    } else if (activeMegaCategory) {
      const cat = activeMegaCategory.toLowerCase();
      if (cat === "knives") result = result.filter((i) => i.category === "KNIVES");
      else if (cat === "gloves") result = result.filter((i) => i.category === "GLOVES");
      else if (cat === "rifles") result = result.filter((i) => i.category === "RIFLES");
      else if (cat === "pistols") result = result.filter((i) => i.category === "PISTOLS");
      else if (cat === "mid-tier" || cat === "smgs" || cat === "heavy") {
        result = result.filter((i) => i.category === "SMGS" || i.category === "HEAVY");
      } else if (cat === "cases" || cat === "containers") {
        result = result.filter((i) => i.category === "CASES");
      }
    }

    // 2. Search Query (within current view)
    if (gridSearch.trim()) {
      const q = gridSearch.trim().toLowerCase();
      result = result.filter(
        (i) =>
          i.skinName.toLowerCase().includes(q) ||
          i.weaponName.toLowerCase().includes(q) ||
          i.marketHashName.toLowerCase().includes(q)
      );
    }

    // 3. Advanced Search: Price Range
    if (advancedParams.minPrice !== "" && advancedParams.minPrice !== undefined) {
      const minP = Number(advancedParams.minPrice);
      if (!isNaN(minP)) {
        result = result.filter((i) => (i.minPrice ?? i.priceUsd) >= minP);
      }
    }
    if (advancedParams.maxPrice !== "" && advancedParams.maxPrice !== undefined) {
      const maxP = Number(advancedParams.maxPrice);
      if (!isNaN(maxP)) {
        result = result.filter((i) => (i.maxPrice ?? i.priceUsd) <= maxP);
      }
    }

    // 4. Advanced Search: Color Filter
    if (advancedParams.color && advancedParams.color !== "Any") {
      const col = advancedParams.color.toUpperCase();
      result = result.filter((i) => (i.primaryColor || "").toUpperCase() === col);
    }

    // 5. Advanced Search: Exterior / Wear Tier
    if (advancedParams.exterior && advancedParams.exterior !== "Any") {
      const codeMap: Record<string, Wear> = {
        "Factory New": "FN",
        "Minimal Wear": "MW",
        "Field-Tested": "FT",
        "Well-Worn": "WW",
        "Battle-Scarred": "BS",
      };
      const targetWear = codeMap[advancedParams.exterior];
      if (targetWear) {
        result = result.filter(
          (i) =>
            i.wearTier === targetWear ||
            (i.wearPrices && i.wearPrices.some((w) => w.wear === targetWear))
        );
      }
    }

    // 6. Advanced Search: Variant (StatTrak / Souvenir / Normal)
    if (advancedParams.variant === "StatTrak") {
      result = result.filter((i) => i.isStatTrak || i.statTrakMin !== undefined);
    } else if (advancedParams.variant === "Souvenir") {
      result = result.filter((i) => i.isSouvenir);
    } else if (advancedParams.variant === "Normal") {
      result = result.filter((i) => !i.isStatTrak && !i.isSouvenir);
    }

    // 7. Sorting
    return [...result].sort((a, b) => {
      if (gridSort === "price-asc") return (a.minPrice ?? a.priceUsd) - (b.minPrice ?? b.priceUsd);
      if (gridSort === "price-desc") return (b.maxPrice ?? b.priceUsd) - (a.maxPrice ?? a.priceUsd);
      if (gridSort === "name-asc") return a.skinName.localeCompare(b.skinName);

      // Default Popularity sort (Covert first, then by offers)
      const rarityRank = (r?: string) => {
        const lr = (r || "").toLowerCase();
        if (lr.includes("covert") || lr.includes("extraordinary")) return 10;
        if (lr.includes("classified")) return 8;
        if (lr.includes("restricted")) return 6;
        if (lr.includes("mil-spec")) return 4;
        if (lr.includes("industrial")) return 2;
        return 1;
      };
      const rDiff = rarityRank(b.rarity) - rarityRank(a.rarity);
      if (rDiff !== 0) return rDiff;
      const countB = typeof b.offersCount === "number" ? b.offersCount : parseInt(b.offersCount || "0", 10) || 0;
      const countA = typeof a.offersCount === "number" ? a.offersCount : parseInt(a.offersCount || "0", 10) || 0;
      return countB - countA;
    });
  }, [items, selectedSubWeapon, activeMegaCategory, gridSearch, gridSort, advancedParams]);

  // Total pages and paginated slice (24 skins per page)
  const totalPages = Math.max(1, Math.ceil(displayedSkins.length / PAGE_SIZE));
  const paginatedSkins = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return displayedSkins.slice(start, start + PAGE_SIZE);
  }, [displayedSkins, currentPage]);

  // Hero Section Dynamic Information (Matching Photo 2)
  const isCaseCategory = activeMegaCategory === "Containers" || activeMegaCategory === "Cases";
  const activeHeroTitle =
    selectedSubWeapon !== "All"
      ? selectedSubWeapon.includes("Case") || selectedSubWeapon.includes("Package") || selectedSubWeapon.includes("Capsule")
        ? selectedSubWeapon
        : `${selectedSubWeapon} Skins`
      : isCaseCategory
      ? "CS2 Weapon Cases & Containers"
      : activeMegaCategory
      ? `${activeMegaCategory} Skins`
      : "All CS2 Skins";

  const activeHeroDescription =
    selectedSubWeapon !== "All"
      ? `Buy, sell & trade all ${selectedSubWeapon} items for CS2. Compare real-time market offers, wear float spectrums, and pattern variations across 7 top marketplaces.`
      : isCaseCategory
      ? "Explore all 480+ official CS2 weapon cases, souvenir packages, sticker capsules, and containers with live market prices and contained skin drops."
      : activeMegaCategory
      ? `Explore all CS2 ${activeMegaCategory} finishes, Doppler phases, wear spectrums, and live price comparisons.`
      : "Browse every CS2 skin, glove, knife, and case with verified market quotes from CSFloat, Skinport, BUFF163, and Steam Market.";

  const activeHeroThumbnail =
    (selectedSubWeapon !== "All" ? getWeaponIconUrl(selectedSubWeapon) : null) ||
    getWeaponIconUrl(
      activeMegaCategory === "Knives"
        ? "Karambit"
        : activeMegaCategory === "Gloves"
        ? "Sport Gloves"
        : activeMegaCategory === "Rifles"
        ? "AK-47"
        : activeMegaCategory === "Pistols"
        ? "USP-S"
        : activeMegaCategory || "AK-47"
    ) ||
    (displayedSkins.length > 0
      ? displayedSkins[0].imageUrl
      : "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFCzvfqffVsKfyFCEvFkeB-j7I3Xjeyxh5z52CGnNv4J3yRb1AnC8N5FO5U5kK6wI_sMrjX713XjN4SxC2vi35K4yq1t09e8H8D");

  return (
    <div className="csf-page">
      {/* 1. CLUTCH LABS ARSENAL TOP NAVIGATION BAR */}
      <CSGOSkinsHeaderNav
        searchQuery={gridSearch}
        onSearchChange={setGridSearch}
        onSelectWeapon={handleSelectWeapon}
        activeCategory={activeMegaCategory}
        activeWeapon={selectedSubWeapon}
        currency={currency}
        onCurrencyChange={setCurrency}
        onOpenAdvancedSearch={() => setIsAdvancedSearchOpen(true)}
      />

      {/* 2. WEAPON HERO SECTION (MATCHING PHOTO 2) */}
      <section className="csgoskins-hero-section">
        <div className="csgoskins-hero-inner">
          <div className="csgoskins-hero-left">
            <img
              src={activeHeroThumbnail}
              alt={activeHeroTitle}
              className="csgoskins-hero-thumb"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = getWeaponSilhouetteSvg(
                  selectedSubWeapon !== "All" ? selectedSubWeapon : activeMegaCategory || "AK-47"
                );
              }}
            />
            <div>
              <h1 className="csgoskins-hero-title">{activeHeroTitle}</h1>
              <p className="csgoskins-hero-desc">{activeHeroDescription}</p>
            </div>
          </div>

          <button
            type="button"
            className="csgoskins-adv-search-btn"
            onClick={() => setIsAdvancedSearchOpen(true)}
            title="Open Advanced Search Filter Modal"
          >
            <span>Advanced Search</span>
            <span style={{ fontSize: 14 }}>&gt;</span>
          </button>
        </div>
      </section>

      {/* 3. MAIN CATALOG & WEAPON GRID CONTAINER */}
      <div className="csgoskins-weapon-page-container" id="skins-grid-anchor">
        {/* 4-Column Responsive Skins Grid */}
        <section className="csgoskins-grid-section">
          {/* Grid Toolbar: Finishes count on left, search & sort on right */}
          <div className="csgoskins-grid-toolbar">
            <div className="csgoskins-grid-count">
              Showing{" "}
              <strong>
                {displayedSkins.length > 0
                  ? `${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, displayedSkins.length)} of ${displayedSkins.length}`
                  : "0"}
              </strong>{" "}
              {selectedSubWeapon !== "All" ? selectedSubWeapon : activeMegaCategory} finishes
            </div>
            <div className="csgoskins-grid-toolbar-right">
              <div className="csgoskins-grid-search">
                <span style={{ fontSize: 13, color: "#8f9995" }}>🔍</span>
                <input
                  type="text"
                  placeholder={`Search in ${selectedSubWeapon !== "All" ? selectedSubWeapon : activeMegaCategory}...`}
                  value={gridSearch}
                  onChange={(e) => setGridSearch(e.target.value)}
                  className="csgoskins-grid-search-input"
                />
                {gridSearch && (
                  <button
                    type="button"
                    onClick={() => setGridSearch("")}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#8f9995",
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    ✕
                  </button>
                )}
              </div>
              <select
                className="csgoskins-grid-sort-select"
                value={gridSort}
                onChange={(e) => setGridSort(e.target.value)}
              >
                <option value="popularity">Sort: Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Alphabetical: A-Z</option>
              </select>
            </div>
          </div>

          {/* Responsive 4-Column Grid */}
          <div className="csgoskins-catalog-grid">
            {paginatedSkins.map((item) => {
              const isSelected = selectedSkin?.id === item.id;
              const rarityColor = getRarityGlowColor(item.rarity, item.category);
              const rarityLabel = getRarityLabel(item);
              const hasStatTrak = item.statTrakMin !== undefined || item.isStatTrak;
              const hasSouvenir = item.isSouvenir;
              const priceRangeStr = formatPriceRange(
                item.minPrice ?? item.priceUsd,
                item.maxPrice ?? item.priceUsd,
                currency
              );
              const statTrakRangeStr = hasStatTrak
                ? formatPriceRange(
                    item.statTrakMin ?? Math.round((item.minPrice ?? item.priceUsd) * 1.6),
                    item.statTrakMax ?? Math.round((item.maxPrice ?? item.priceUsd) * 2.2),
                    currency
                  )
                : null;
              const containerName = item.collectionName || "The CS2 Armory & Major Cases";

              return (
                <article
                  key={item.id}
                  className={`csgoskins-card-item ${isSelected ? "selected-active" : ""}`}
                  onClick={() => {
                    setSelectedSkin(item);
                    setTimeout(() => {
                      const el = document.getElementById("chosen-skin-overview");
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                  title={`Click to view ${item.weaponName} | ${item.skinName} live details & active offers`}
                >
                  <h3 className="csgoskins-card-top-title">{item.skinName}</h3>
                  <div
                    className="csgoskins-card-rarity-bar"
                    style={{ backgroundColor: rarityColor }}
                  >
                    {rarityLabel}
                  </div>

                  <div className="csgoskins-card-badge-row">
                    {hasStatTrak && (
                      <span className="csgoskins-card-badge-stattrak">StatTrak</span>
                    )}
                    {hasSouvenir && (
                      <span className="csgoskins-card-badge-souvenir">Souvenir</span>
                    )}
                  </div>

                  <div className="csgoskins-card-img-stage">
                    <img
                      src={item.imageUrl}
                      alt={`${item.weaponName} | ${item.skinName}`}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = getWeaponSilhouetteSvg(item.weaponName);
                      }}
                    />
                  </div>

                  <div className="csgoskins-card-price-block">
                    <div className="csgoskins-card-price-range">{priceRangeStr}</div>
                    {hasStatTrak && (
                      <div className="csgoskins-card-stattrak-price">{statTrakRangeStr}</div>
                    )}
                  </div>

                  <div className="csgoskins-card-container-row">
                    <span style={{ fontSize: 13 }}>📦</span>
                    <span className="csgoskins-card-container-text">{containerName}</span>
                  </div>

                  <div className="csgoskins-card-analytics-footer">
                    <span>{item.offersCount || "14K OFFERS · 35 MARKETS"}</span>
                  </div>
                </article>
              );
            })}
          </div>

          {/* CSGOSKINS.GG 1:1 Pagination Controls */}
          {totalPages > 1 && (
            <nav className="csgoskins-pagination" aria-label="Skins Catalog Pagination">
              <button
                type="button"
                className="csgoskins-page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(1);
                  const el = document.getElementById("skins-grid-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                « First
              </button>
              <button
                type="button"
                className="csgoskins-page-nav-btn"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage((p) => Math.max(1, p - 1));
                  const el = document.getElementById("skins-grid-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                ‹ Prev
              </button>

              <div className="csgoskins-page-numbers">
                {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                  p === "..." ? (
                    <span key={`dots-${idx}`} className="csgoskins-page-dots">
                      ...
                    </span>
                  ) : (
                    <button
                      key={`page-${p}`}
                      type="button"
                      className={`csgoskins-page-btn ${currentPage === p ? "active" : ""}`}
                      onClick={() => {
                        setCurrentPage(Number(p));
                        const el = document.getElementById("skins-grid-anchor");
                        if (el) el.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      {p}
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                className="csgoskins-page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage((p) => Math.min(totalPages, p + 1));
                  const el = document.getElementById("skins-grid-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Next ›
              </button>
              <button
                type="button"
                className="csgoskins-page-nav-btn"
                disabled={currentPage === totalPages}
                onClick={() => {
                  setCurrentPage(totalPages);
                  const el = document.getElementById("skins-grid-anchor");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Last »
              </button>
            </nav>
          )}
        </section>

        {/* 4. CHOSEN SKIN DETAIL OVERVIEW (ONLY SHOWN AFTER CLICKING A SKIN IN THE GRID!) */}
        {selectedSkin && (
          <div id="chosen-skin-overview">
            <SkinDetailOverview
              skin={selectedSkin}
              currency={currency}
              notify={notify}
              onClose={() => setSelectedSkin(null)}
              onOpen3DModal={(s) => setInspect3DItem(s)}
              onSelectSkin={(s) => setSelectedSkin(s)}
              allSkins={items}
            />
          </div>
        )}
      </div>

      {/* 5. INTERACTIVE CSGOSKINS.GG MARKET COMPARISON & 3D INSPECTOR MODAL */}
      {inspect3DItem && (
        <CSGOSkinsModal
          item={inspect3DItem}
          currency={currency}
          onClose={() => setInspect3DItem(null)}
          notify={notify}
          onEquip={(side) => notify(`Equipped ${inspect3DItem.marketHashName} to ${side} Loadout`)}
        />
      )}

      {/* 6. ADVANCED SEARCH FILTER MODAL (CSGOSKINS.GG 1:1) */}
      <AdvancedSearchModal
        isOpen={isAdvancedSearchOpen}
        onClose={() => setIsAdvancedSearchOpen(false)}
        currentParams={advancedParams}
        currency={currency}
        onApply={handleApplyAdvancedSearch}
      />
    </div>
  );
}
