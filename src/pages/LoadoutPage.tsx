import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useAuth } from "../features/identity/AuthProvider";
import { csfloatCatalogData, type CSFloatItem } from "../features/loadouts/csfloatCatalogData";
import { Skin3DModal } from "../components/Skin3DModal";
import { getWeaponSilhouetteSvg } from "../components/WeaponSilhouette";
import {
  generateLoadout,
  getCommunity,
  toggleUpvote,
} from "../features/loadouts/api";
import type {
  Color,
  CommunityDetail,
  CommunityLoadout,
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

// 13 Top Categories
const MEGA_CATEGORIES = [
  "Rifles",
  "Pistols",
  "SMGs",
  "Heavy",
  "Knives",
  "Gloves",
  "Agents",
  "Containers",
  "Stickers",
  "Keychains",
  "Patches",
  "Collectibles",
  "Music Kits",
] as const;

type MegaCategory = (typeof MEGA_CATEGORIES)[number];

// Sub-Weapon Pills by Category
const SUB_WEAPONS: Record<string, string[]> = {
  Rifles: ["All", "AK-47", "AUG", "AWP", "FAMAS", "G3SG1", "Galil AR", "M4A1-S", "M4A4", "SCAR-20", "SG 553", "SSG 08"],
  Pistols: ["All", "USP-S", "Glock-18", "Desert Eagle", "P250", "Five-SeveN", "Tec-9", "CZ75-Auto", "Dual Berettas", "P2000", "R8 Revolver"],
  Knives: ["All", "Karambit", "Butterfly Knife", "M9 Bayonet", "Bayonet", "Skeleton Knife", "Talon Knife", "Stiletto Knife", "Nomad Knife"],
  Gloves: ["All", "Sport Gloves", "Specialist Gloves", "Moto Gloves", "Driver Gloves", "Hand Wraps", "Bloodhound Gloves"],
  SMGs: ["All", "MP9", "MAC-10", "MP7", "UMP-45", "P90", "MP5-SD", "PP-Bizon"],
  Heavy: ["All", "Negev", "M249", "MAG-7", "XM1014", "Nova", "Sawed-Off"],
  Containers: ["All", "Kilowatt Case", "Dreams & Nightmares Case", "Revolution Case", "Recoil Case", "Snakebite Case"],
  Stickers: ["All", "Katowice 2014", "Cologne 2014", "Stockholm 2021", "Antwerp 2022", "Paris 2023"],
};

// Showcase Cards Definition
const SHOWCASE_DATA: Record<string, { name: string; weapon: string; price: number; image: string; rarityColor: string }[]> = {
  Rifles: [
    { name: "AWP | Gungnir", weapon: "AWP", price: 5812.77, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#eb4b4b" },
    { name: "AWP | Dragon Lore", weapon: "AWP", price: 4237.17, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqYaF7IfysCnWRxuF4j-B-Xxa_nBovp3Pdwtj9cC_GaAd0DZdwQu9fuhS4kNy0NePntVTbjYpCyyT_3CgY5i9j_a9cBkcCWUKV", rarityColor: "#eb4b4b" },
    { name: "M4A4 | Howl", weapon: "M4A4", price: 4089.71, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB", rarityColor: "#eb4b4b" },
    { name: "AK-47 | Wild Lotus", weapon: "AK-47", price: 3981.43, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q", rarityColor: "#eb4b4b" },
    { name: "M4A1-S | Knight", weapon: "M4A1-S", price: 2429.79, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwiFO0P_6afVSKP-EAm6extF6ueZhW2exwkl2tmTXwt39eCiUPQR2DMN4TOVetUK8xoLgM-K341eM2otDnC6okGoXufBz_TAB", rarityColor: "#d32ce6" },
    { name: "AWP | Medusa", weapon: "AWP", price: 1661.21, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#eb4b4b" },
    { name: "AWP | The Prince", weapon: "AWP", price: 1449.42, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#eb4b4b" },
  ],
  Knives: [
    { name: "★ Karambit | Gamma Doppler (Emerald)", weapon: "Karambit", price: 11450.00, image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLu8JAllx8zJfAJH4dmklYyPqPr1Ibndk2JL7cFOhuDG_Zi73VG2qUQ_am36LNKWcwM2Ml3X_FS8wL3vhMC0vJXOn3ZkuSAl7HiOmwv3308XDHXucw", rarityColor: "#e4ae39" },
    { name: "★ Skeleton Knife | Doppler (Ruby)", weapon: "Skeleton Knife", price: 5900.00, image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPr1Ibndk1Rx5sB9teXI8oThxlKw-Ettam_zcNSSew86Z1vT-1W9k-y7hp65usnKzCExuCQ8pSGKFl39l6E", rarityColor: "#e4ae39" },
    { name: "★ Butterfly Knife | Fade", weapon: "Butterfly Knife", price: 4150.00, image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPr1Ibndk1Rx5sB9teXI8oThxlKw-Ettam_zcNSSew86Z1vT-1W9k-y7hp65usnKzCExuCQ8pSGKFl39l6E", rarityColor: "#e4ae39" },
    { name: "★ M9 Bayonet | Gamma Doppler", weapon: "M9 Bayonet", price: 2294.80, image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLu8JAllx8zJfAJH4dmklYyPqPr1Ibndk2JL7cFOhuDG_Zi73VG2qUQ_am36LNKWcwM2Ml3X_FS8wL3vhMC0vJXOn3ZkuSAl7HiOmwv3308XDHXucw", rarityColor: "#e4ae39" },
    { name: "★ Talon Knife | Fade", weapon: "Talon Knife", price: 2150.00, image: "https://community.akamai.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tCvq4GGqPr1Ibndk1Rx5sB9teXI8oThxlKw-Ettam_zcNSSew86Z1vT-1W9k-y7hp65usnKzCExuCQ8pSGKFl39l6E", rarityColor: "#e4ae39" },
  ],
  Gloves: [
    { name: "★ Moto Gloves | Spearmint", weapon: "Moto Gloves", price: 4890.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJvehnWxanhxQmvTqJn7D1KCzPKhgnW5UmRO4DsxXrlYbhPurmtAXai98UzS73in5I6S5p4OsAU_Zx-KHWkUifZsxBQgc2", rarityColor: "#e4ae39" },
    { name: "★ Specialist Gloves | Crimson Kimono", weapon: "Specialist Gloves", price: 3600.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuBtSha_nBovp3PQy42sdX6eagIjW5AlQOVetBXuk92xNLvg4gOMjd5AmC2ointB53w__a9cBqntWBk3", rarityColor: "#e4ae39" },
    { name: "★ Sport Gloves | Vice", weapon: "Sport Gloves", price: 3100.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu4r7_lb1QgTykpPf-i5U-fe9V6liNP-BDX6TzetJvehnWxanhxQmvTqJn7D1KCzPKhgnW5UmRO4DsxXrlYbhPurmtAXai98UzS73in5I6S5p4OsAU_Zx-KHWkUifZsxBQgc2", rarityColor: "#e4ae39" },
    { name: "★ Driver Gloves | King Snake", weapon: "Driver Gloves", price: 2200.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk71ruQBH4jYLf-i5U-fe9V7d9JfOaD2uZ0vpJtuBtSha_nBovp3PQy42sdX6eagIjW5AlQOVetBXuk92xNLvg4gOMjd5AmC2ointB53w__a9cBqntWBk3", rarityColor: "#e4ae39" },
  ],
  Pistols: [
    { name: "Glock-18 | Fade", weapon: "Glock-18", price: 1980.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#d32ce6" },
    { name: "Desert Eagle | Blaze", weapon: "Desert Eagle", price: 980.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#d32ce6" },
    { name: "USP-S | Kill Confirmed", weapon: "USP-S", price: 650.00, image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf_jdk4veqfbdsH_GEHlicyOl-pK85TC23wk12tWSGnNr6JXqRPVUnA5J5RLIKshS-l4HuYbji7lfajdgU02yg2bOcOBD3", rarityColor: "#eb4b4b" },
  ],
};

const money = (val: number) => `$${val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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

  // 1. Core State
  const [items, setItems] = useState<CSFloatItem[]>(csfloatCatalogData);
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [sortBy, setSortBy] = useState<SortOption>("deals");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Category Mega-Bar & Showcase
  const [activeMegaCategory, setActiveMegaCategory] = useState<MegaCategory | null>("Rifles");
  const [selectedSubWeapon, setSelectedSubWeapon] = useState<string>("All");
  const carouselScrollRef = useRef<HTMLDivElement>(null);

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

  // 3D Inspector Modal State
  const [inspect3DItem, setInspect3DItem] = useState<CSFloatItem | null>(null);

  // Save equipped items
  useEffect(() => {
    try {
      localStorage.setItem("csf_equipped_ct", JSON.stringify(equippedCt));
      localStorage.setItem("csf_equipped_t", JSON.stringify(equippedT));
    } catch {}
  }, [equippedCt, equippedT]);

  // Dynamic ByMykel API Enrichment on Client Load
  useEffect(() => {
    fetch("https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en/skins.json")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || !Array.isArray(data)) return;
        const lookup = new Map<string, string>();
        for (const s of data) {
          if (s.name && s.image) {
            lookup.set(s.name.toLowerCase().trim(), s.image);
            lookup.set(s.name.replace(/[★™\s|()]/g, "").toLowerCase(), s.image);
          }
        }
        setItems((current) =>
          current.map((item) => {
            const clean = item.marketHashName.replace(/[★™\s|()]/g, "").toLowerCase();
            const found = lookup.get(clean) || lookup.get(item.marketHashName.toLowerCase().trim());
            return found ? { ...item, imageUrl: found } : item;
          })
        );
      })
      .catch(() => {});
  }, []);

  // Generator & Matrix state
  const [generatorBusy, setGeneratorBusy] = useState(false);
  const [generatorError, setGeneratorError] = useState("");
  const [selectedColor, setSelectedColor] = useState<Color>("PURPLE");
  const [selectedSkinClass, setSelectedSkinClass] = useState<SkinClassValue>("ANY");

  // Community state
  const [communityData, setCommunityData] = useState<Page<CommunityLoadout> | null>(null);
  const [communityBusy, setCommunityBusy] = useState(false);

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

  function toggleFavorite(id: string) {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleTier(tier: Wear) {
    setSelectedTiers((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  function copyInspect(item: CSFloatItem) {
    const link =
      item.inspectLink ||
      `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${item.paintSeed}D${Math.floor(
        item.floatValue * 1000000
      )}`;
    navigator.clipboard.writeText(link).then(
      () => notify(`Copied CS2 inspect link for ${item.skinName}!`),
      () => notify("Unable to access clipboard")
    );
  }

  function scrollCarousel(direction: "left" | "right") {
    if (!carouselScrollRef.current) return;
    const offset = direction === "left" ? -350 : 350;
    carouselScrollRef.current.scrollBy({ left: offset, behavior: "smooth" });
  }

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
    setSelectedSubWeapon("All");
    notify("Market filters reset");
  }

  // Budget Generator Handler
  async function handleGenerate(e: FormEvent) {
    e.preventDefault();
    setGeneratorBusy(true);
    setGeneratorError("");
    try {
      await generateLoadout({
        budgetUsd: budget,
        themeColor: selectedColor,
        preferredCtRifle: "weapon_m4a1_silencer",
        includeKnifeAndGloves: true,
        skinClass: selectedSkinClass !== "ANY" ? selectedSkinClass : undefined,
      });
      notify("Generated optimized CSFloat loadout!");
    } catch (err) {
      setGeneratorError(err instanceof Error ? err.message : "Loadout generation failed");
    } finally {
      setGeneratorBusy(false);
    }
  }

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

        // Sub-Weapon Filter
        if (selectedSubWeapon !== "All") {
          const wepClean = item.weaponName.replace(/[★™\s]/g, "").toLowerCase();
          const targetClean = selectedSubWeapon.replace(/[★™\s]/g, "").toLowerCase();
          if (!wepClean.includes(targetClean) && !targetClean.includes(wepClean)) {
            return false;
          }
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
        if (sortBy === "deals") return a.discountPercent - b.discountPercent;
        if (sortBy === "lowest_float") return a.floatValue - b.floatValue;
        if (sortBy === "lowest_price") return a.priceUsd - b.priceUsd;
        if (sortBy === "highest_price") return b.priceUsd - a.priceUsd;
        return 0;
      });
  }, [
    items,
    searchQuery,
    selectedSubWeapon,
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

  const currentShowcaseItems = activeMegaCategory ? SHOWCASE_DATA[activeMegaCategory] || [] : [];
  const currentSubWeapons = activeMegaCategory ? SUB_WEAPONS[activeMegaCategory] || [] : [];

  return (
    <div className="csf-page">
      {/* 1. TOP CATEGORY MEGA-BAR */}
      <nav className="csf-category-megabar" aria-label="Weapon Categories">
        {MEGA_CATEGORIES.map((cat) => {
          const isActive = activeMegaCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              className={`csf-megabar-btn ${isActive ? "active" : ""}`}
              onClick={() => {
                if (isActive) {
                  setActiveMegaCategory(null);
                  setSelectedSubWeapon("All");
                } else {
                  setActiveMegaCategory(cat);
                  setSelectedSubWeapon("All");
                }
              }}
            >
              <span>{cat}</span>
              <span className="csf-megabar-chevron">⌄</span>
            </button>
          );
        })}
      </nav>

      {/* 2. EXPANDABLE SUB-WEAPON DRAWER & SHOWCASE CAROUSEL */}
      {activeMegaCategory && (
        <section className="csf-showcase-drawer">
          {/* Sub-Weapon Pills */}
          {currentSubWeapons.length > 0 && (
            <div className="csf-subweapon-pills">
              {currentSubWeapons.map((wep) => (
                <button
                  key={wep}
                  type="button"
                  className={`csf-subweapon-pill ${selectedSubWeapon === wep ? "active" : ""}`}
                  onClick={() => setSelectedSubWeapon(wep)}
                >
                  {wep}
                </button>
              ))}
            </div>
          )}

          {/* Horizontal Showcase Carousel */}
          {currentShowcaseItems.length > 0 && (
            <div className="csf-carousel-wrapper">
              <button
                type="button"
                className="csf-carousel-nav-btn left"
                onClick={() => scrollCarousel("left")}
                aria-label="Scroll left"
              >
                ‹
              </button>

              <div className="csf-carousel-scroll" ref={carouselScrollRef}>
                {/* First Card: Category / View All */}
                <div
                  className="csf-showcase-card csf-showcase-viewall"
                  onClick={() => setSelectedSubWeapon("All")}
                >
                  <div className="csf-showcase-header">
                    <h5 className="csf-showcase-title">{activeMegaCategory}</h5>
                    <span className="csf-showcase-price">View All Listings</span>
                  </div>
                  <div className="csf-showcase-img-stage">
                    <img
                      src={getWeaponSilhouetteSvg(activeMegaCategory)}
                      alt="View All"
                      className="csf-showcase-img"
                      style={{ opacity: 0.6 }}
                    />
                  </div>
                  <span style={{ fontSize: 10, color: "#3b82f6", fontWeight: 800 }}>EXPLORE →</span>
                </div>

                {/* Showcase Cards */}
                {currentShowcaseItems.map((sc, scIdx) => {
                  const matchingItem =
                    items.find((i) => i.skinName.toLowerCase().includes(sc.name.split("|")[1]?.trim().toLowerCase() || "")) ||
                    items[0];

                  return (
                    <div
                      key={scIdx}
                      className="csf-showcase-card"
                      onClick={() => setInspect3DItem(matchingItem)}
                      title={`Inspect ${sc.name} in 3D`}
                    >
                      <div className="csf-showcase-header">
                        <h5 className="csf-showcase-title" title={sc.name}>
                          {sc.name.split("|")[1]?.trim() || sc.name}
                        </h5>
                        <span className="csf-showcase-price">from {money(sc.price)}</span>
                      </div>

                      <div className="csf-showcase-img-stage">
                        <img
                          src={sc.image}
                          alt={sc.name}
                          className="csf-showcase-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getWeaponSilhouetteSvg(sc.weapon);
                          }}
                          loading="eager"
                        />
                      </div>

                      {/* 🧊 3D Button in bottom-right corner */}
                      <button
                        type="button"
                        className="csf-showcase-3d-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspect3DItem(matchingItem);
                        }}
                        title="Open Interactive 3D Inspector"
                      >
                        🧊 3D
                      </button>

                      {/* Bottom Rarity Glow Accent */}
                      <div
                        className="csf-showcase-glow"
                        style={{
                          backgroundColor: sc.rarityColor,
                          boxShadow: `0 0 10px ${sc.rarityColor}`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                className="csf-carousel-nav-btn right"
                onClick={() => scrollCarousel("right")}
                aria-label="Scroll right"
              >
                ›
              </button>
            </div>
          )}
        </section>
      )}

      {/* 3. TOP TOOLBAR */}
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

      {/* 4. CT / T LOADOUT SUMMARY DRAWER BAR */}
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

      {/* 5. MAIN MARKET LAYOUT (SIDEBAR + CARDS GRID) */}
      {viewTab !== "matrix" && viewTab !== "community" && (
        <div className="csf-market-layout">
          {/* Left Sidebar (260px) */}
          {sidebarOpen && (
            <aside className="csf-sidebar">
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

              {/* Price Section */}
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

              {/* Wear Section */}
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

              {/* Special Section */}
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

              {/* Patterns Section */}
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

          {/* Right Market Stage */}
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
                            onClick={() => {
                              const inspectUrl =
                                item.inspectLink ||
                                `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${item.paintSeed}D0`;
                              navigator.clipboard.writeText(inspectUrl).catch(() => {});
                              window.location.href = inspectUrl;
                              notify(`Launching CS2 inspect for ${item.skinName}...`);
                            }}
                            title="Inspect in CS2 Game"
                          >
                            🎮
                          </button>
                          <button
                            type="button"
                            className="csf-stage-icon-btn"
                            onClick={() => setInspect3DItem(item)}
                            title="Open 3D Inspector Modal"
                          >
                            🧊
                          </button>
                        </div>

                        {/* Main Skin PNG with fallback SVG */}
                        <img
                          src={item.imageUrl}
                          alt={item.skinName}
                          className="csf-card-img"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getWeaponSilhouetteSvg(item.weaponName);
                          }}
                          loading="eager"
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
                                onError={(e) => {
                                  e.currentTarget.style.display = "none";
                                }}
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
                        <div className="csf-tele-row-1">
                          <div className="csf-price-val">{money(item.priceUsd)}</div>
                          <span className="csf-discount-pill">
                            • {item.discountPercent.toFixed(1)}%
                          </span>
                        </div>

                        {/* 5-Color Spectrum Bar with Needle */}
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

                        <div className="csf-tele-row-3">
                          <span className="csf-float-text" title={item.floatFormatted}>
                            {item.floatFormatted.slice(0, 10)} (#{item.paintSeed})
                          </span>
                          {item.patternRank && (
                            <span className="csf-rank-badge">#{item.patternRank}</span>
                          )}
                        </div>

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

      {/* 6. CT / T LOADOUT MATRIX VIEW */}
      {viewTab === "matrix" && (
        <section className="csf-matrix-layout" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
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
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getWeaponSilhouetteSvg(item.weaponName);
                          }}
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

      {/* 7. COMMUNITY BUILDS VIEW */}
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

      {/* 8. INTERACTIVE 3D SKIN INSPECTOR MODAL */}
      {inspect3DItem && (
        <Skin3DModal
          item={inspect3DItem}
          onClose={() => setInspect3DItem(null)}
          notify={notify}
          onEquip={(side) => toggleEquip(inspect3DItem, side)}
        />
      )}
    </div>
  );
}
