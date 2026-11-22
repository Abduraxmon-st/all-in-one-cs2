import { useState, useRef, useEffect, type FC } from "react";
import type { CurrencyCode } from "../features/loadouts/csfloatCatalogData";
import { getWeaponIconUrl } from "../features/loadouts/weaponIconResolver";
import { getWeaponSilhouetteSvg } from "./WeaponSilhouette";

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

interface MenuGroup {
  groupTitle?: string;
  items: string[];
}

interface NavMenu {
  id: string;
  label: string;
  category: string;
  groups: MenuGroup[];
}

const NAV_MENUS: NavMenu[] = [
  {
    id: "knives",
    label: "Knives",
    category: "Knives",
    groups: [
      {
        groupTitle: "POPULAR KNIVES",
        items: [
          "All Knives",
          "Karambit",
          "Butterfly Knife",
          "M9 Bayonet",
          "Bayonet",
          "Skeleton Knife",
          "Talon Knife",
          "Stiletto Knife",
        ],
      },
      {
        groupTitle: "ALL KNIVES",
        items: [
          "Bowie Knife",
          "Classic Knife",
          "Falchion Knife",
          "Flip Knife",
          "Gut Knife",
          "Huntsman Knife",
          "Kukri Knife",
          "Navaja Knife",
          "Nomad Knife",
          "Paracord Knife",
          "Shadow Daggers",
          "Survival Knife",
          "Ursus Knife",
        ],
      },
    ],
  },
  {
    id: "gloves",
    label: "Gloves",
    category: "Gloves",
    groups: [
      {
        groupTitle: "GLOVE TYPES",
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
    ],
  },
  {
    id: "rifles",
    label: "Rifles",
    category: "Rifles",
    groups: [
      {
        groupTitle: "ASSAULT RIFLES",
        items: [
          "AK-47",
          "AUG",
          "FAMAS",
          "Galil AR",
          "M4A1-S",
          "M4A4",
          "SG 553",
        ],
      },
      {
        groupTitle: "SNIPER RIFLES",
        items: [
          "AWP",
          "G3SG1",
          "SCAR-20",
          "SSG 08",
        ],
      },
    ],
  },
  {
    id: "pistols",
    label: "Pistols",
    category: "Pistols",
    groups: [
      {
        groupTitle: "PISTOLS",
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
    ],
  },
  {
    id: "mid-tier",
    label: "Mid-Tier",
    category: "SMGs",
    groups: [
      {
        groupTitle: "SUBMACHINE GUNS",
        items: [
          "All Mid-Tier",
          "MAC-10",
          "MP5-SD",
          "MP7",
          "MP9",
          "P90",
          "PP-Bizon",
          "UMP-45",
        ],
      },
      {
        groupTitle: "SHOTGUNS & HEAVY",
        items: [
          "MAG-7",
          "Nova",
          "Sawed-Off",
          "XM1014",
          "M249",
          "Negev",
        ],
      },
    ],
  },
  {
    id: "cases",
    label: "Cases",
    category: "Containers",
    groups: [
      {
        groupTitle: "POPULAR CS2 CASES",
        items: [
          "All Cases",
          "Gallery Case",
          "Kilowatt Case",
          "Dreams & Nightmares Case",
          "Revolution Case",
          "Recoil Case",
          "Fracture Case",
          "Snakebite Case",
          "Clutch Case",
          "Prisma 2 Case",
          "Danger Zone Case",
          "Horizon Case",
          "Glove Case",
          "Chroma 3 Case",
          "Operation Bravo Case",
          "CS:GO Weapon Case",
        ],
      },
    ],
  },
  {
    id: "collections",
    label: "Collections",
    category: "Collections",
    groups: [
      {
        groupTitle: "POPULAR COLLECTIONS",
        items: [
          "All Collections",
          "The Armory Collection",
          "The Mirage 2021 Collection",
          "The Dust 2 2021 Collection",
          "The Cobblestone Collection",
          "The Control Collection",
        ],
      },
    ],
  },
  {
    id: "stickers",
    label: "Stickers",
    category: "Stickers",
    groups: [
      {
        groupTitle: "MAJOR TOURNAMENTS",
        items: [
          "All Stickers",
          "Katowice 2014",
          "Cologne 2014",
          "Stockholm 2021",
          "Antwerp 2022",
          "Paris 2023",
          "Copenhagen 2024",
        ],
      },
    ],
  },
  {
    id: "other",
    label: "Other",
    category: "Other",
    groups: [
      {
        groupTitle: "CUSTOMIZATION",
        items: [
          "All Other",
          "Music Kits",
          "Storage Units",
          "Agents",
          "Patches",
          "Pins",
        ],
      },
    ],
  },
];

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
    <header className="clutch-main-nav csgoskins-main-nav" ref={navRef}>
      <div className="csgoskins-nav-inner">
        {/* Left: Clutch Labs Weapon Brand (Replacing third-party logo!) */}
        <div
          className="clutch-nav-brand"
          onClick={() => onSelectWeapon("Rifles", "All")}
          style={{ cursor: "pointer" }}
          title="Clutch Labs Loadout Arsenal"
        >
          <div className="clutch-nav-badge">
            <span className="clutch-nav-dot" />
            <span className="clutch-nav-tag">CLUTCH</span>
          </div>
          <span className="clutch-nav-title">LOADOUT ARSENAL</span>
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

                {/* Dropdown Panel with Grouped Categories matching Photo 4 */}
                {isOpen && (
                  <div className="csgoskins-dropdown-panel clutch-dropdown-panel">
                    {menu.groups.map((grp, gIdx) => (
                      <div key={gIdx} className="clutch-dropdown-group">
                        {grp.groupTitle && (
                          <div className="clutch-dropdown-group-title">
                            {grp.groupTitle}
                          </div>
                        )}
                        <div className="clutch-dropdown-group-items">
                          {grp.items.map((item) => {
                            const isItemActive = activeWeapon === item;
                            const iconUrl = getWeaponIconUrl(item, menu.category);
                            const fallbackSvg = getWeaponSilhouetteSvg(item);

                            return (
                              <div
                                key={item}
                                className={`csgoskins-dropdown-item clutch-dropdown-item ${isItemActive ? "active" : ""}`}
                                onClick={() => {
                                  onSelectWeapon(menu.category, item);
                                  setOpenDropdown(null);
                                }}
                              >
                                <img
                                  src={iconUrl}
                                  alt={item}
                                  className="csgoskins-dropdown-item-img"
                                  loading="lazy"
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = fallbackSvg;
                                  }}
                                />
                                <span className="csgoskins-item-name">{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
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
              className="csgoskins-settings-btn clutch-settings-btn"
              onClick={() => setShowSettings(!showSettings)}
              title="Display & Currency Settings"
            >
              ⚙
            </button>

            {showSettings && (
              <div className="csgoskins-settings-popover clutch-settings-popover">
                <div style={{ fontSize: 11, fontWeight: 800, color: "#bef264", marginBottom: 8, letterSpacing: "0.05em" }}>
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

          {/* Top Search Input */}
          <div className="csgoskins-header-search clutch-header-search">
            <span className="csgoskins-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search weapons or skins..."
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
