import { useState, type FC, type FormEvent } from "react";
import type { CurrencyCode } from "../features/loadouts/csfloatCatalogData";

export interface AdvancedSearchParams {
  query: string;
  minPrice: number | "";
  maxPrice: number | "";
  color: string;
  weapon: string;
  exterior: string;
  variant: string;
  orderBy: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApply: (params: AdvancedSearchParams) => void;
  currentParams: AdvancedSearchParams;
  currency: CurrencyCode;
}

const WEAPONS_LIST = [
  "Any",
  // Knives
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
  // Gloves
  "Bloodhound Gloves",
  "Broken Fang Gloves",
  "Driver Gloves",
  "Hand Wraps",
  "Hydra Gloves",
  "Moto Gloves",
  "Specialist Gloves",
  "Sport Gloves",
  // Rifles
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
  // Pistols
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
  // SMGs
  "MAC-10",
  "MP5-SD",
  "MP7",
  "MP9",
  "P90",
  "PP-Bizon",
  "UMP-45",
  // Heavy
  "MAG-7",
  "Nova",
  "Sawed-Off",
  "XM1014",
  "M249",
  "Negev",
  // Containers
  "Fracture Case",
  "Clutch Case",
  "Kilowatt Case",
  "Dreams & Nightmares Case",
  "Recoil Case",
  "Snakebite Case",
];

const COLORS_LIST = [
  "Any",
  "Red",
  "Blue",
  "Green",
  "Purple",
  "Gold",
  "White",
  "Black",
  "Orange",
  "Pink",
];

const EXTERIORS_LIST = [
  "Any",
  "Factory New",
  "Minimal Wear",
  "Field-Tested",
  "Well-Worn",
  "Battle-Scarred",
];

const VARIANTS_LIST = ["Any", "Normal", "StatTrak", "Souvenir"];

const ORDER_BY_LIST = [
  { id: "popularity", label: "Popularity" },
  { id: "price-asc", label: "Price: Low to High" },
  { id: "price-desc", label: "Price: High to Low" },
  { id: "discount-desc", label: "Discount: High to Low" },
  { id: "float-asc", label: "Float: Low to High" },
  { id: "newest", label: "Newest" },
];

export const AdvancedSearchModal: FC<Props> = ({
  isOpen,
  onClose,
  onApply,
  currentParams,
  currency,
}) => {
  const [query, setQuery] = useState(currentParams.query);
  const [minPrice, setMinPrice] = useState<number | "">(currentParams.minPrice);
  const [maxPrice, setMaxPrice] = useState<number | "">(currentParams.maxPrice);
  const [color, setColor] = useState(currentParams.color);
  const [weapon, setWeapon] = useState(currentParams.weapon);
  const [exterior, setExterior] = useState(currentParams.exterior);
  const [variant, setVariant] = useState(currentParams.variant);
  const [orderBy, setOrderBy] = useState(currentParams.orderBy);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onApply({
      query,
      minPrice,
      maxPrice,
      color,
      weapon,
      exterior,
      variant,
      orderBy,
    });
    onClose();
  };

  return (
    <div
      className="csgoskins-adv-modal-overlay"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(5, 8, 14, 0.85)",
        backdropFilter: "blur(12px)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div
        className="csgoskins-adv-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: "#16202c",
          border: "1px solid #233144",
          borderRadius: 14,
          maxWidth: 620,
          width: "100%",
          boxShadow: "0 25px 60px rgba(0,0,0,0.85), 0 0 40px rgba(37, 99, 235, 0.15)",
          overflow: "hidden",
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "20px 24px 16px",
            borderBottom: "1px solid #202b3a",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, color: "#f8fafc", fontWeight: 800 }}>
            Advanced Search
          </h3>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              fontSize: 18,
              cursor: "pointer",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Row 1: Search Query */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Search</label>
            <input
              type="text"
              placeholder="Search..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                background: "#0e1520",
                border: "1px solid #243245",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
              }}
            />
          </div>

          {/* Row 2: Min & Max Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Minimum Price</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <input
                  type="number"
                  placeholder="Any"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value ? Number(e.target.value) : "")}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "10px 14px",
                    color: "#f8fafc",
                    fontSize: 13,
                    width: "100%",
                    outline: "none",
                  }}
                />
                <span style={{ padding: "0 14px", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                  {currency}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Maximum Price</label>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <input
                  type="number"
                  placeholder="Any"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value ? Number(e.target.value) : "")}
                  style={{
                    background: "transparent",
                    border: "none",
                    padding: "10px 14px",
                    color: "#f8fafc",
                    fontSize: 13,
                    width: "100%",
                    outline: "none",
                  }}
                />
                <span style={{ padding: "0 14px", color: "#64748b", fontSize: 12, fontWeight: 700 }}>
                  {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Color & Weapon */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Color</label>
              <select
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f8fafc",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {COLORS_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Weapon</label>
              <select
                value={weapon}
                onChange={(e) => setWeapon(e.target.value)}
                style={{
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f8fafc",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {WEAPONS_LIST.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 4: Exterior & Pattern Variants */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Exterior</label>
              <select
                value={exterior}
                onChange={(e) => setExterior(e.target.value)}
                style={{
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f8fafc",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {EXTERIORS_LIST.map((ex) => (
                  <option key={ex} value={ex}>
                    {ex}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Pattern Variants</label>
              <select
                value={variant}
                onChange={(e) => setVariant(e.target.value)}
                style={{
                  background: "#0e1520",
                  border: "1px solid #243245",
                  borderRadius: 8,
                  padding: "10px 14px",
                  color: "#f8fafc",
                  fontSize: 13,
                  outline: "none",
                  cursor: "pointer",
                }}
              >
                {VARIANTS_LIST.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 5: Order By */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: "#94a3b8" }}>Order By</label>
            <select
              value={orderBy}
              onChange={(e) => setOrderBy(e.target.value)}
              style={{
                background: "#0e1520",
                border: "1px solid #243245",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#f8fafc",
                fontSize: 13,
                outline: "none",
                cursor: "pointer",
              }}
            >
              {ORDER_BY_LIST.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Footer Actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 16,
              marginTop: 10,
              paddingTop: 16,
              borderTop: "1px solid #202b3a",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                padding: "8px 16px",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                background: "#bef264",
                color: "#0b0f17",
                border: "none",
                borderRadius: 6,
                padding: "10px 24px",
                fontSize: 13,
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "0 2px 14px rgba(190, 242, 100, 0.35)",
              }}
            >
              Search &gt;
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
