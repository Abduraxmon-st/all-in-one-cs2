import { useState, useRef, useEffect, type FC } from "react";
import type { CurrencyCode } from "../features/loadouts/csfloatCatalogData";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectWeapon: (category: string, weapon: string) => void;
  activeCategory: string | null;
  activeWeapon: string;
  currency: CurrencyCode;
  onCurrencyChange: (c: CurrencyCode) => void;
  onOpenAdvancedSearch: () => void;
}

interface NavMenu {
  id: string;
  label: string;
  category: string;
  items: string[];
}

const NAV_MENUS: NavMenu[] = [
  {
    id: "knives",
    label: "Knives",
    category: "Knives",
    items: [
      "All Knives",
      "Bayonet",
      "Bowie Knife",
      "Butterfly Knife",
      "Classic Knife",
      "Falchion Knife",
      "Flip Knife",
      "Gut Knife",
      "Huntsman Knife",
      "Karambit",
      "Kukri Knife",
      "M9 Bayonet",
      "Navaja Knife",
      "Nomad Knife",
      "Paracord Knife",
      "Shadow Daggers",
      "Skeleton Knife",
      "Stiletto Knife",
      "Survival Knife",
      "Talon Knife",
      "Ursus Knife",
    ],
  },
  {
    id: "gloves",
    label: "Gloves",
    category: "Gloves",
    items: [
      "All Gloves",
      "Bloodhound Gloves",
      "Broken Fang Gloves",
      "Driver Gloves",
      "Hand Wraps",
      "Hydra Gloves",
      "Moto Gloves",
      "Specialist Gloves",
      "Sport Gloves",
    ],
  },
  {
    id: "rifles",
    label: "Rifles",
    category: "Rifles",
    items: [
      "All Rifles",
      "AK-47",
      "AUG",
      "AWP",
      "FAMAS",
      "G3SG1",
      "Galil AR",
      "M4A1-S",
      "M4A4",
      "SCAR-20",
      "SG 553",
      "SSG 08",
    ],
  },
  {
    id: "pistols",
    label: "Pistols",
    category: "Pistols",
    items: [
      "All Pistols",
      "CZ75-Auto",
      "Desert Eagle",
      "Dual Berettas",
      "Five-SeveN",
      "Glock-18",
      "P2000",
      "P250",
      "R8 Revolver",
      "Tec-9",
      "USP-S",
    ],
  },
  {
    id: "mid-tier",
    label: "Mid-Tier",
    category: "SMGs",
    items: [
      "All Mid-Tier",
      "MAC-10",
      "MP5-SD",
      "MP7",
      "MP9",
      "P90",
      "PP-Bizon",
      "UMP-45",
      "MAG-7",
      "Nova",
      "Sawed-Off",
      "XM1014",
      "M249",
      "Negev",
    ],
  },
  {
    id: "cases",
    label: "Cases",
    category: "Containers",
    items: [
      "All Cases",
      "Fracture Case",
      "Clutch Case",
      "Kilowatt Case",
      "Dreams & Nightmares Case",
      "Recoil Case",
      "Snakebite Case",
      "Glove Case",
      "Revolution Case",
    ],
  },
  {
    id: "collections",
    label: "Collections",
    category: "Collections",
    items: [
      "All Collections",
      "The Armory Collection",
      "The Mirage 2021 Collection",
      "The Dust 2 2021 Collection",
      "The Cobblestone Collection",
      "The Control Collection",
    ],
  },
  {
    id: "stickers",
    label: "Stickers",
    category: "Stickers",
    items: [
      "All Stickers",
      "Katowice 2014",
      "Cologne 2014",
      "Stockholm 2021",
      "Antwerp 2022",
      "Paris 2023",
    ],
  },
  {
    id: "other",
    label: "Other",
    category: "Other",
    items: [
      "All Other",
      "Music Kits",
      "Storage Units",
      "Agents",
      "Patches",
      "Pins",
    ],
  },
];

// Clean miniature silhouette icon for dropdown entries
function getMiniIcon(menuId: string): string {
  if (menuId === "knives") return "🗡️";
  if (menuId === "gloves") return "🧤";
  if (menuId === "rifles") return "🎯";
  if (menuId === "pistols") return "🔫";
  if (menuId === "mid-tier") return "⚡";
  if (menuId === "cases") return "📦";
  if (menuId === "collections") return "🛡️";
  if (menuId === "stickers") return "🏷️";
  return "📦";
}

export const CSGOSkinsHeaderNav: FC<Props> = ({
  searchQuery,
  onSearchChange,
  onSelectWeapon,
  activeCategory,
  activeWeapon,
  currency,
  onCurrencyChange,
  onOpenAdvancedSearch,
}) => {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setShowSettings(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="csgoskins-main-nav" ref={navRef}>
      <div className="csgoskins-nav-inner">
        {/* Left: Brand Logo */}
        <div
          className="csgoskins-brand"
          onClick={() => onSelectWeapon("Rifles", "All")}
          style={{ cursor: "pointer" }}
        >
          <span className="brand-csgo">CSGO</span>
          <span className="brand-skins">SKINS</span>
          <span className="brand-gg">.GG</span>
        </div>

        {/* Center: Dropdown Navigation Menus */}
        <nav className="csgoskins-menu-bar">
          {NAV_MENUS.map((menu) => {
            const isOpen = openDropdown === menu.id;
            const isCategoryActive = activeCategory === menu.category;

            return (
              <div
                key={menu.id}
                className="csgoskins-menu-dropdown-wrapper"
                onMouseEnter={() => setOpenDropdown(menu.id)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  type="button"
                  className={`csgoskins-menu-btn ${isCategoryActive ? "active" : ""}`}
                  onClick={() => {
                    setOpenDropdown(isOpen ? null : menu.id);
                    onSelectWeapon(menu.category, "All");
                  }}
                >
                  <span>{menu.label}</span>
                  <span className="csgoskins-caret">⌄</span>
                </button>

                {/* Dropdown Panel with Weapon Silhouette Icons */}
                {isOpen && (
                  <div className="csgoskins-dropdown-panel">
                    {menu.items.map((item) => {
                      const isItemActive = activeWeapon === item;
                      const icon = getMiniIcon(menu.id);

                      return (
                        <div
                          key={item}
                          className={`csgoskins-dropdown-item ${isItemActive ? "active" : ""}`}
                          onClick={() => {
                            onSelectWeapon(menu.category, item);
                            setOpenDropdown(null);
                          }}
                        >
                          <span className="csgoskins-item-icon">{icon}</span>
                          <span className="csgoskins-item-name">{item}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Right: Currency Settings Cog & Header Search */}
        <div className="csgoskins-nav-right">
          {/* Settings Cog */}
          <div className="csgoskins-settings-wrapper" style={{ position: "relative" }}>
            <button
              type="button"
              className="csgoskins-settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Display & Currency Settings"
            >
              ⚙
            </button>

            {showSettings && (
              <div className="csgoskins-settings-popover">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", marginBottom: 8 }}>
                  SELECT CURRENCY
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                  {(["USD", "EUR", "GBP", "CNY", "CAD", "AUD"] as CurrencyCode[]).map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`csgoskins-curr-select-btn ${currency === c ? "active" : ""}`}
                      onClick={() => {
                        onCurrencyChange(c);
                        setShowSettings(false);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Search Input matching Screenshot 1 */}
          <div className="csgoskins-header-search">
            <span className="csgoskins-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="csgoskins-search-input"
            />
          </div>
        </div>
      </div>
    </header>
  );
};
