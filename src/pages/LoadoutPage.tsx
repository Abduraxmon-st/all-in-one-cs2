import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { csfloatCatalogData, type CSFloatItem } from "../features/loadouts/csfloatCatalogData";
import {
  createCommunityLoadout,
  deleteCommunityLoadout,
  generateLoadout,
  getCommunity,
  getCommunityDetail,
  toggleUpvote,
} from "../features/loadouts/api";
import type {
  Color,
  CommunityDetail,
  CommunityLoadout,
  GeneratedItem,
  GeneratedLoadout,
  Page,
  SkinClassValue,
  Wear,
} from "../features/loadouts/types";
import "./LoadoutPage.css";

type Props = {
  budget: number;
  setBudget: (value: number) => void;
  notify: (message: string) => void;
};

type ViewTab = "all" | "stickers" | "unique" | "matrix" | "community";
type SortOption = "deals" | "lowest_float" | "lowest_price" | "highest_price";

const money = (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// 5-Color Spectrum Segment Definitions
const SPECTRUM_SEGMENTS = [
  { wear: "FN", width: "7%", color: "#22c55e", label: "0.00 - 0.07" },
  { wear: "MW", width: "8%", color: "#84cc16", label: "0.07 - 0.15" },
  { wear: "FT", width: "23%", color: "#eab308", label: "0.15 - 0.38" },
  { wear: "WW", width: "7%", color: "#f97316", label: "0.38 - 0.45" },
  { wear: "BS", width: "55%", color: "#ef4444", label: "0.45 - 1.00" },
];

function getRarityGlowColor(rarity: string, category: string): string {
  if (category === "KNIVES" || category === "GLOVES") return "#e4ae39";
  const r = (rarity || "").toLowerCase();
  if (r.includes("covert") || r.includes("contraband")) return "#eb4b4b";
  if (r.includes("classified")) return "#d32ce6";
  if (r.includes("restricted")) return "#8847ff";
  if (r.includes("mil-spec")) return "#4b69ff";
  return "#e4ae39";
}

export default function LoadoutPage({ budget, setBudget, notify }: Props) {
  const { user, token } = useAuth();

  // 1. Core Market Catalog State (0ms Instant Load)
  const [items, setItems] = useState<CSFloatItem[]>(csfloatCatalogData);
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("deals");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 2. Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [priceMin, setPriceMin] = useState<number | "">("");
  const [priceMax, setPriceMax] = useState<number | "">("");
  const [selectedTiers, setSelectedTiers] = useState<Set<Wear>>(new Set());
  const [filterStatTrak, setFilterStatTrak] = useState(false);
  const [filterSouvenir, setFilterSouvenir] = useState(false);
  const [filterHighlight, setFilterHighlight] = useState(false);
  const [filterNormal, setFilterNormal] = useState(false);
  const [filterSeed, setFilterSeed] = useState("");
  const [minFade, setMinFade] = useState(80);

  // Collapsible Sections
  const [openSections, setOpenSections] = useState({
    price: true,
    wear: true,
    special: true,
    patterns: true,
  });

  // Favorites & Equipped Loadouts
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [equippedCt, setEquippedCt] = useState<CSFloatItem[]>(() => {
    try {
      const raw = localStorage.getItem("csf_equipped_ct");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [equippedT, setEquippedT] = useState<CSFloatItem[]>(() => {
    try {
      const raw = localStorage.getItem("csf_equipped_t");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Modal / Zoom State
  const [zoomItem, setZoomItem] = useState<CSFloatItem | null>(null);

  // Save equipped items to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("csf_equipped_ct", JSON.stringify(equippedCt));
      localStorage.setItem("csf_equipped_t", JSON.stringify(equippedT));
    } catch {}
  }, [equippedCt, equippedT]);

  // Generator & Matrix state for CT/T Loadout Matrix view
  const [generatorBusy, setGeneratorBusy] = useState(false);
  const [generatorError, setGeneratorError] = useState("");
  const [generatedLoadout, setGeneratedLoadout] = useState<GeneratedLoadout | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color>("PURPLE");
  const [selectedSkinClass, setSelectedSkinClass] = useState<SkinClassValue>("ANY");

  // Community state
  const [communityData, setCommunityData] = useState<Page<CommunityLoadout> | null>(null);
  const [communityBusy, setCommunityBusy] = useState(false);
  const [communityDetail, setCommunityDetail] = useState<CommunityDetail | null>(null);

  // Equipment toggle
  function toggleEquip(item: CSFloatItem, side: "CT" | "T") {
    if (side === "CT") {
      setEquippedCt((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) {
          notify(`Removed ${item.marketHashName} from CT Loadout`);
          return prev.filter((i) => i.id !== item.id);
        } else {
          notify(`Equipped ${item.marketHashName} to CT Loadout!`);
          return [...prev, item];
        }
      });
    } else {
      setEquippedT((prev) => {
        const exists = prev.some((i) => i.id === item.id);
        if (exists) {
          notify(`Removed ${item.marketHashName} from T Loadout`);
          return prev.filter((i) => i.id !== item.id);
        } else {
          notify(`Equipped ${item.marketHashName} to T Loadout!`);
          return [...prev, item];
        }
      });
    }
  }

  // Favorite toggle
  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  // Wear tier toggle
  function toggleTier(tier: Wear) {
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  // Copy inspect link
  function copyInspect(item: CSFloatItem) {
    const link = item.inspectLink || `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${item.paintSeed}D0`;
    navigator.clipboard.writeText(link).then(
      () => notify(`Copied inspect link for ${item.skinName}!`),
      () => notify("Unable to access clipboard")
    );
  }

  // In-Game Preview
  function previewInGame(item: CSFloatItem) {
    notify(`Triggering CS2 server inspect for ${item.marketHashName}...`);
  }

  // Reset Filters
  function resetFilters() {
    setSearchQuery("");
    setPriceMin("");
    setPriceMax("");
    setSelectedTiers(new Set());
    setFilterStatTrak(false);
    setFilterSouvenir(false);
    setFilterHighlight(false);
    setFilterNormal(false);
    setFilterSeed("");
    setMinFade(80);
    notify("Market filters reset");
  }

  // Budget Generator Handler
  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setGeneratorBusy(true);
    setGeneratorError("");
    try {
      const result = await generateLoadout({
        budgetUsd: budget,
        themeColor: selectedColor,
        preferredCtRifle: "weapon_m4a1_silencer",
        includeKnifeAndGloves: true,
        skinClass: selectedSkinClass !== "ANY" ? selectedSkinClass : undefined,
      });
      setGeneratedLoadout(result);
      notify("Generated optimized CSFloat loadout!");
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : "Loadout generation failed");
    } finally {
      setGeneratorBusy(false);
    }
  }

  // Community Loadouts loader
  useEffect(() => {
    if (viewTab !== "community") return;
    setCommunityBusy(true);
    getCommunity({ page: 0, size: 20 })
      .then((data) => setCommunityData(data))
      .catch(() => {})
      .finally(() => setCommunityBusy(false));
  }, [viewTab]);

  // Filtered & Sorted CSFloat Items
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matches =
            item.marketHashName.toLowerCase().includes(q) ||
            item.weaponName.toLowerCase().includes(q) ||
            item.skinName.toLowerCase().includes(q);
          if (!matches) return false;
        }

        // View Tabs
        if (viewTab === "stickers" && (!item.stickers || item.stickers.length === 0)) {
          return false;
        }
        if (viewTab === "unique") {
          const isLowFloat = item.floatValue < 0.015;
          const isRank1 = (item.patternRank ?? 99) <= 2;
          const isRubyOrEmerald = item.skinName.includes("Ruby") || item.skinName.includes("Emerald");
          if (!isLowFloat && !isRank1 && !isRubyOrEmerald) return false;
        }

        // Price Filter
        if (priceMin !== "" && item.priceUsd < priceMin) return false;
        if (priceMax !== "" && item.priceUsd > priceMax) return false;

        // Wear Tiers
        if (selectedTiers.size > 0 && !selectedTiers.has(item.wearTier)) return false;

        // Specials
        if (filterStatTrak && !item.isStatTrak) return false;
        if (filterSouvenir && !item.isSouvenir) return false;
        if (filterHighlight && item.discountPercent > -20) return false;
        if (filterNormal && (item.isStatTrak || item.isSouvenir)) return false;

        // Paint Seed
        if (filterSeed.trim() && !String(item.paintSeed).includes(filterSeed.trim())) return false;

        // Fade %
        if (item.fadePercentage !== undefined && item.fadePercentage < minFade) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deals") return a.discountPercent - b.discountPercent; // more negative = bigger discount
        if (sortBy === "lowest_float") return a.floatValue - b.floatValue;
        if (sortBy === "lowest_price") return a.priceUsd - b.priceUsd;
        if (sortBy === "highest_price") return b.priceUsd - a.priceUsd;
        return 0;
      });
  }, [
    items,
    searchQuery,
    viewTab,
    priceMin,
    priceMax,
    selectedTiers,
    filterStatTrak,
    filterSouvenir,
    filterHighlight,
    filterNormal,
    filterSeed,
    minFade,
    sortBy,
  ]);

  const totalCtValue = equippedCt.reduce((acc, i) => acc + i.priceUsd, 0);
  const totalTValue = equippedT.reduce((acc, i) => acc + i.priceUsd, 0);

  return (
    <div className="csf-page">
      {/* 1. Top Toolbar */}
      <header className="csf-toolbar">
        <div className="csf-toolbar-left">
          <button
            type="button"
            className="csf-sidebar-toggle-btn"
            onClick={() => setSidebarOpen((v) => !v)}
            title="Toggle Left Sidebar Filters"
          >
            <span>Filters</span>
            <span style={{ fontSize: 13 }}>☰</span>
          </button>

          <button
            type="button"
            className="csf-refresh-btn"
            onClick={() => {
              setItems([...csfloatCatalogData]);
              notify("Market listings refreshed");
            }}
            title="Refresh active listings"
          >
            <span>↻ Refresh</span>
          </button>

          {/* View Tabs */}
          <div className="csf-view-tabs" role="tablist">
            <button
              type="button"
              className={`csf-tab-btn ${viewTab === "all" ? "active" : ""}`}
              onClick={() => setViewTab("all")}
            >
              All Items
            </button>
            <button
              type="button"
              className={`csf-tab-btn ${viewTab === "stickers" ? "active" : ""}`}
              onClick={() => setViewTab("stickers")}
            >
              Sticker Combos
            </button>
            <button
              type="button"
              className={`csf-tab-btn ${viewTab === "unique" ? "active" : ""}`}
              onClick={() => setViewTab("unique")}
            >
              Unique Items
            </button>
            <button
              type="button"
              className={`csf-tab-btn ${viewTab === "matrix" ? "active" : ""}`}
              onClick={() => setViewTab("matrix")}
            >
              CT / T Loadout Matrix
            </button>
            <button
              type="button"
              className={`csf-tab-btn ${viewTab === "community" ? "active" : ""}`}
              onClick={() => setViewTab("community")}
            >
              Community Builds
            </button>
          </div>
        </div>

        <div className="csf-toolbar-right">
          <div className="csf-items-count-badge">
            <strong>{filteredItems.length}</strong> Listings
          </div>

          <select
            className="csf-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort listings"
          >
            <option value="deals">Best Deals</option>
            <option value="lowest_float">Lowest Float</option>
            <option value="lowest_price">Lowest Price</option>
            <option value="highest_price">Highest Price</option>
          </select>
        </div>
      </header>

      {/* 2. CT / T Loadout Summary Drawer Bar */}
      <div className="csf-loadout-drawer-bar">
        <div className="csf-side-badge-group">
          <div className="csf-side-indicator">
            <span className="csf-side-pill-badge ct">CT LOADOUT</span>
            <strong>{money(totalCtValue)}</strong>
            <span style={{ color: "#9ca3af", fontSize: 10 }}>({equippedCt.length} items)</span>
          </div>
          <div className="csf-side-indicator">
            <span className="csf-side-pill-badge t">T LOADOUT</span>
            <strong>{money(totalTValue)}</strong>
            <span style={{ color: "#9ca3af", fontSize: 10 }}>({equippedT.length} items)</span>
          </div>
        </div>
        {(equippedCt.length > 0 || equippedT.length > 0) && (
          <button
            type="button"
            className="csf-quick-equip-btn"
            onClick={() => {
              setEquippedCt([]);
              setEquippedT([]);
              notify("Cleared equipped loadouts");
            }}
          >
            Clear Loadouts
          </button>
        )}
      </div>

      {/* 3. Main Market Layout (Sidebar + Cards Grid) */}
      {viewTab !== "matrix" && viewTab !== "community" && (
        <div className="csf-market-layout">
          {/* Left Sidebar (260px) */}
          {sidebarOpen && (
            <aside className="csf-sidebar">
              {/* Search with '/' Badge */}
              <div className="csf-search-box">
                <input
                  type="text"
                  className="csf-search-input"
                  placeholder="Search for items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label="Search items"
                />
                <span className="csf-search-badge">/</span>
              </div>

              {/* Price Collapsible Section */}
              <div className="csf-filter-section">
                <button
                  type="button"
                  className="csf-section-header"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, price: !prev.price }))
                  }
                >
                  <span>Price</span>
                  <span className={`csf-chevron ${openSections.price ? "open" : ""}`}>▼</span>
                </button>
                {openSections.price && (
                  <>
                    <div className="csf-price-chips">
                      <button
                        type="button"
                        className={`csf-price-chip ${priceMax === 10 ? "active" : ""}`}
                        onClick={() => {
                          setPriceMin(0);
                          setPriceMax(10);
                        }}
                      >
                        &lt;$10
                      </button>
                      <button
                        type="button"
                        className={`csf-price-chip ${priceMin === 10 && priceMax === 50 ? "active" : ""}`}
                        onClick={() => {
                          setPriceMin(10);
                          setPriceMax(50);
                        }}
                      >
                        $10 - $50
                      </button>
                      <button
                        type="button"
                        className={`csf-price-chip ${priceMin === 50 && priceMax === 250 ? "active" : ""}`}
                        onClick={() => {
                          setPriceMin(50);
                          setPriceMax(250);
                        }}
                      >
                        $50 - $250
                      </button>
                      <button
                        type="button"
                        className={`csf-price-chip ${priceMin === 250 && priceMax === "" ? "active" : ""}`}
                        onClick={() => {
                          setPriceMin(250);
                          setPriceMax("");
                        }}
                      >
                        &gt;$250
                      </button>
                    </div>
                    <div className="csf-minmax-row">
                      <input
                        type="number"
                        className="csf-minmax-input"
                        placeholder="From $0"
                        value={priceMin}
                        onChange={(e) =>
                          setPriceMin(e.target.value ? Number(e.target.value) : "")
                        }
                      />
                      <span style={{ color: "#6b7280" }}>–</span>
                      <input
                        type="number"
                        className="csf-minmax-input"
                        placeholder="To $∞"
                        value={priceMax}
                        onChange={(e) =>
                          setPriceMax(e.target.value ? Number(e.target.value) : "")
                        }
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Wear Collapsible Section */}
              <div className="csf-filter-section">
                <button
                  type="button"
                  className="csf-section-header"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, wear: !prev.wear }))
                  }
                >
                  <span>Wear</span>
                  <span className={`csf-chevron ${openSections.wear ? "open" : ""}`}>▼</span>
                </button>
                {openSections.wear && (
                  <>
                    <div className="csf-wear-filter-bar">
                      {SPECTRUM_SEGMENTS.map((s) => (
                        <div
                          key={s.wear}
                          style={{ width: s.width, backgroundColor: s.color }}
                          title={`${s.wear}: ${s.label}`}
                        />
                      ))}
                    </div>
                    <div className="csf-wear-btn-group">
                      {(["FN", "MW", "FT", "WW", "BS"] as Wear[]).map((tier) => (
                        <button
                          key={tier}
                          type="button"
                          className={`csf-wear-tier-btn ${selectedTiers.has(tier) ? "active" : ""}`}
                          onClick={() => toggleTier(tier)}
                        >
                          {tier}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Special Collapsible Section */}
              <div className="csf-filter-section">
                <button
                  type="button"
                  className="csf-section-header"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, special: !prev.special }))
                  }
                >
                  <span>Special</span>
                  <span className={`csf-chevron ${openSections.special ? "open" : ""}`}>▼</span>
                </button>
                {openSections.special && (
                  <div className="csf-checkbox-grid">
                    <label className="csf-checkbox-item stattrak">
                      <input
                        type="checkbox"
                        checked={filterStatTrak}
                        onChange={(e) => setFilterStatTrak(e.target.checked)}
                      />
                      <span>StatTrak™</span>
                    </label>
                    <label className="csf-checkbox-item souvenir">
                      <input
                        type="checkbox"
                        checked={filterSouvenir}
                        onChange={(e) => setFilterSouvenir(e.target.checked)}
                      />
                      <span>Souvenir</span>
                    </label>
                    <label className="csf-checkbox-item highlight">
                      <input
                        type="checkbox"
                        checked={filterHighlight}
                        onChange={(e) => setFilterHighlight(e.target.checked)}
                      />
                      <span>Highlight</span>
                    </label>
                    <label className="csf-checkbox-item">
                      <input
                        type="checkbox"
                        checked={filterNormal}
                        onChange={(e) => setFilterNormal(e.target.checked)}
                      />
                      <span>Normal</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Patterns Collapsible Section */}
              <div className="csf-filter-section">
                <button
                  type="button"
                  className="csf-section-header"
                  onClick={() =>
                    setOpenSections((prev) => ({ ...prev, patterns: !prev.patterns }))
                  }
                >
                  <span>Patterns</span>
                  <span className={`csf-chevron ${openSections.patterns ? "open" : ""}`}>▼</span>
                </button>
                {openSections.patterns && (
                  <>
                    <input
                      type="text"
                      className="csf-pattern-input"
                      placeholder="Paint Seed (e.g. 445)"
                      value={filterSeed}
                      onChange={(e) => setFilterSeed(e.target.value)}
                    />
                    <div className="csf-slider-row">
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Minimum Fade %</span>
                        <strong>{minFade}%</strong>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="100"
                        step="0.5"
                        className="csf-range-slider"
                        value={minFade}
                        onChange={(e) => setMinFade(Number(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Reset Filters Button */}
              <button
                type="button"
                className="csf-price-chip"
                style={{ marginTop: 8 }}
                onClick={resetFilters}
              >
                Reset All Filters
              </button>
            </aside>
          )}

          {/* Right Market Stage: Responsive CSFloat Card Grid */}
          <main className="csf-market-content">
            {filteredItems.length === 0 ? (
              <div className="csf-empty-state">
                <h3>No items match your active filters</h3>
                <p>Try adjusting your search query, price range, or wear filters.</p>
                <button
                  type="button"
                  className="csf-sidebar-toggle-btn"
                  onClick={resetFilters}
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="csf-cards-grid">
                {filteredItems.map((item) => {
                  const rarityGlow = getRarityGlowColor(item.rarity, item.category);
                  const isFav = favorites.has(item.id);
                  const isEquippedCtItem = equippedCt.some((i) => i.id === item.id);
                  const isEquippedTItem = equippedT.some((i) => i.id === item.id);
                  const needlePosition = Math.min(100, Math.max(0, item.floatValue * 100));

                  return (
                    <article key={item.id} className="csf-item-card">
                      {/* Header */}
                      <div className="csf-card-header">
                        <h4 className="csf-card-title" title={item.marketHashName}>
                          {item.marketHashName}
                        </h4>
                        <span
                          className={`csf-card-sub ${item.isStatTrak ? "st" : item.isSouvenir ? "souvenir" : ""}`}
                        >
                          {item.isStatTrak
                            ? `StatTrak™ ${item.wearName}`
                            : item.isSouvenir
                            ? `Souvenir ${item.wearName}`
                            : item.wearName}
                        </span>
                      </div>

                      {/* Image Area */}
                      <div className="csf-card-stage">
                        {/* Orange Fade % Badge */}
                        {item.fadePercentage !== undefined && (
                          <div className="csf-fade-badge">
                            {item.fadePercentage}% Fade
                          </div>
                        )}

                        {/* Right-Side Vertical Stack of 3 Icon Buttons */}
                        <div className="csf-stage-actions">
                          <button
                            type="button"
                            className="csf-stage-icon-btn"
                            onClick={() => copyInspect(item)}
                            title="Copy CS2 Inspect Link"
                          >
                            📋
                          </button>
                          <button
                            type="button"
                            className="csf-stage-icon-btn"
                            onClick={() => previewInGame(item)}
                            title="In-Game Preview"
                          >
                            🎮
                          </button>
                          <button
                            type="button"
                            className="csf-stage-icon-btn"
                            onClick={() => setZoomItem(item)}
                            title="Zoom & Details Modal"
                          >
                            🔍
                          </button>
                        </div>

                        {/* Main Skin PNG */}
                        <img
                          src={item.imageUrl}
                          alt={item.marketHashName}
                          className="csf-card-img"
                          loading="lazy"
                        />

                        {/* Bottom-Left Applied Sticker Icons */}
                        {item.stickers && item.stickers.length > 0 && (
                          <div className="csf-applied-stickers">
                            {item.stickers.map((st, sIdx) => (
                              <img
                                key={sIdx}
                                src={st.imageUrl}
                                alt={st.name}
                                title={st.name}
                                className="csf-mini-sticker"
                              />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Glowing Rarity Bottom Border */}
                      <div
                        className="csf-rarity-accent-bar"
                        style={{
                          backgroundColor: rarityGlow,
                          boxShadow: `0 0 8px ${rarityGlow}bb`,
                        }}
                      />

                      {/* Telemetry Body */}
                      <div className="csf-card-telemetry">
                        {/* Row 1: Price + Discount */}
                        <div className="csf-tele-row-1">
                          <div className="csf-price-val">{money(item.priceUsd)}</div>
                          <span className="csf-discount-pill">
                            • {item.discountPercent.toFixed(1)}%
                          </span>
                        </div>

                        {/* Row 2: 5-Color Spectrum Bar with White Needle */}
                        <div className="csf-wear-spectrum-wrapper">
                          {SPECTRUM_SEGMENTS.map((s) => (
                            <div
                              key={s.wear}
                              className="csf-spec-seg"
                              style={{ width: s.width, backgroundColor: s.color }}
                            />
                          ))}
                          <div
                            className="csf-needle"
                            style={{ left: `${needlePosition}%` }}
                            title={`Float: ${item.floatFormatted}`}
                          />
                        </div>

                        {/* Row 3: 12-Decimal Float + Paint Seed + Rank */}
                        <div className="csf-tele-row-3">
                          <span className="csf-float-text" title={item.floatFormatted}>
                            {item.floatFormatted.slice(0, 10)} (#{item.paintSeed})
                          </span>
                          {item.patternRank && (
                            <span className="csf-rank-badge">#{item.patternRank}</span>
                          )}
                        </div>

                        {/* Row 4: Status Indicator + Star Favorite */}
                        <div className="csf-tele-row-4">
                          <span
                            className={`csf-delivery-status ${item.deliveryType.toLowerCase()}`}
                          >
                            ● {item.deliveryType === "INSTANT" ? "Instant" : "Offline"}
                          </span>
                          <button
                            type="button"
                            className={`csf-fav-star-btn ${isFav ? "active" : ""}`}
                            onClick={() => toggleFavorite(item.id)}
                            title="Add to Favorites"
                          >
                            ★
                          </button>
                        </div>

                        {/* Row 5: Countdown + Quick Equip Button */}
                        <div className="csf-tele-row-5">
                          <span>Expires in {item.expiresIn}</span>
                          <div className="csf-equip-btn-group">
                            <button
                              type="button"
                              className={`csf-quick-equip-btn ${isEquippedCtItem ? "equipped" : ""}`}
                              onClick={() => toggleEquip(item, "CT")}
                              title="Toggle equip in CT loadout"
                            >
                              {isEquippedCtItem ? "✓ CT" : "+ CT"}
                            </button>
                            <button
                              type="button"
                              className={`csf-quick-equip-btn ${isEquippedTItem ? "equipped" : ""}`}
                              onClick={() => toggleEquip(item, "T")}
                              title="Toggle equip in T loadout"
                            >
                              {isEquippedTItem ? "✓ T" : "+ T"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </main>
        </div>
      )}

      {/* 4. CT / T Loadout Matrix View (When selected) */}
      {viewTab === "matrix" && (
        <section className="csf-matrix-layout" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Generator Bar */}
          <form
            onSubmit={handleGenerate}
            style={{
              background: "var(--csf-card-bg)",
              padding: 16,
              borderRadius: 8,
              border: "1px solid var(--csf-border)",
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              alignItems: "flex-end",
            }}
          >
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, color: "#9ca3af" }}>
              <span>BUDGET (USD)</span>
              <input
                type="number"
                min="10"
                max="50000"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="csf-minmax-input"
                style={{ width: 140 }}
              />
            </label>
            <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 10, color: "#9ca3af" }}>
              <span>THEME COLOR</span>
              <select
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value as Color)}
                className="csf-sort-select"
              >
                {(["PURPLE", "BLUE", "RED", "GREEN", "GOLD", "WHITE"] as Color[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              disabled={generatorBusy}
              className="csf-tab-btn active"
              style={{ padding: "8px 18px", fontSize: 12 }}
            >
              {generatorBusy ? "GENERATING..." : "⚡ GENERATE CSFLOAT MATRIX"}
            </button>
          </form>

          {generatorError && <p style={{ color: "#ef4444" }}>{generatorError}</p>}

          {/* 4-Column Matrix */}
          <div className="csf-matrix-grid">
            {(["PISTOLS", "SMGS & HEAVY", "RIFLES", "KNIVES & GLOVES"] as const).map((col) => {
              const colItems = items.filter((i) => {
                if (col === "PISTOLS") return i.category === "PISTOLS";
                if (col === "SMGS & HEAVY") return i.category === "SMGS" || i.category === "HEAVY";
                if (col === "RIFLES") return i.category === "RIFLES";
                return i.category === "KNIVES" || i.category === "GLOVES";
              });

              return (
                <div key={col} className="csf-matrix-column">
                  <div className="csf-col-header">{col} ({colItems.length})</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {colItems.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          background: "#0e1115",
                          padding: 8,
                          borderRadius: 6,
                          border: "1px solid #1f2730",
                        }}
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.skinName}
                          style={{ width: 48, height: 36, objectFit: "contain" }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ fontSize: 11, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.skinName}
                          </strong>
                          <span style={{ fontSize: 9, color: "#9ca3af" }}>{item.weaponName} · {money(item.priceUsd)}</span>
                        </div>
                        <button
                          type="button"
                          className="csf-quick-equip-btn"
                          onClick={() => toggleEquip(item, "CT")}
                        >
                          + CT
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. Community Builds View */}
      {viewTab === "community" && (
        <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {communityBusy && <p style={{ color: "#9ca3af" }}>Loading community crafts...</p>}
          {communityData && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
              {communityData.content.map((cb) => (
                <article
                  key={cb.id}
                  style={{
                    background: "var(--csf-card-bg)",
                    border: "1px solid var(--csf-border)",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <strong style={{ fontSize: 14 }}>{cb.title}</strong>
                  <span style={{ fontSize: 11, color: "#9ca3af" }}>
                    Author: {cb.author?.username || "Community Operator"} · Budget: {money(cb.budgetLimitUsd)}
                  </span>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                    <span style={{ color: "#eab308", fontSize: 11 }}>★ {cb.upvotes} upvotes</span>
                    <button
                      type="button"
                      className="csf-tab-btn active"
                      style={{ padding: "4px 10px", fontSize: 10 }}
                      onClick={() => {
                        if (!token) {
                          notify("Sign in to upvote this loadout");
                          return;
                        }
                        toggleUpvote(cb.id, token)
                          .then((res) => notify(`Upvoted! Total: ${res.upvotes}`))
                          .catch((err) => notify(err instanceof Error ? err.message : "Upvote failed"));
                      }}
                    >
                      ▲ Upvote
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 6. Zoom & Item Details Modal */}
      {zoomItem && (
        <div className="csf-modal-overlay" onClick={() => setZoomItem(null)}>
          <div className="csf-zoom-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="csf-modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: 16 }}>{zoomItem.marketHashName}</h3>
                <span style={{ color: "#9ca3af", fontSize: 11 }}>
                  {zoomItem.category} · {zoomItem.rarity}
                </span>
              </div>
              <button
                type="button"
                className="csf-modal-close-btn"
                onClick={() => setZoomItem(null)}
              >
                ✕
              </button>
            </div>

            <div className="csf-modal-stage">
              <img src={zoomItem.imageUrl} alt={zoomItem.marketHashName} />
            </div>

            <div className="csf-modal-specs-grid">
              <div className="csf-spec-item">
                <span>PRICE</span>
                <strong>{money(zoomItem.priceUsd)}</strong>
              </div>
              <div className="csf-spec-item">
                <span>FLOAT VALUE</span>
                <strong>{zoomItem.floatFormatted}</strong>
              </div>
              <div className="csf-spec-item">
                <span>PAINT SEED</span>
                <strong>#{zoomItem.paintSeed}</strong>
              </div>
              <div className="csf-spec-item">
                <span>PATTERN RANK</span>
                <strong>#{zoomItem.patternRank ?? "N/A"}</strong>
              </div>
              <div className="csf-spec-item">
                <span>DELIVERY</span>
                <strong style={{ color: zoomItem.deliveryType === "INSTANT" ? "#22c55e" : "#9ca3af" }}>
                  {zoomItem.deliveryType}
                </strong>
              </div>
              <div className="csf-spec-item">
                <span>DISCOUNT</span>
                <strong style={{ color: "#22c55e" }}>{zoomItem.discountPercent.toFixed(1)}%</strong>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                type="button"
                className="csf-sidebar-toggle-btn"
                onClick={() => copyInspect(zoomItem)}
              >
                📋 Copy Inspect Link
              </button>
              <button
                type="button"
                className="csf-tab-btn active"
                onClick={() => {
                  toggleEquip(zoomItem, "CT");
                  setZoomItem(null);
                }}
              >
                Equip to Loadout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
