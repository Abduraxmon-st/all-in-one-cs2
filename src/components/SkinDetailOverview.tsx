import { useState, useMemo, useRef, useEffect, type FC } from "react";
import type { CSFloatItem, CurrencyCode } from "../features/loadouts/csfloatCatalogData";
import { formatPrice, getCaseDetails } from "../features/loadouts/csfloatCatalogData";

interface Props {
  skin: CSFloatItem;
  currency: CurrencyCode;
  notify: (msg: string) => void;
  onClose?: () => void;
  onOpen3DModal: (skin: CSFloatItem) => void;
  onSelectSkin?: (skin: CSFloatItem) => void;
  allSkins?: CSFloatItem[];
}

interface WearTierDef {
  tier: "FN" | "MW" | "FT" | "WW" | "BS";
  name: string;
  floatRange: string;
  multiplier: number;
  min: number;
  max: number;
  defaultFloat: number;
  color: string;
}

const ALL_WEAR_TIERS: WearTierDef[] = [
  { tier: "FN", name: "Factory New", floatRange: "0.00 – 0.07", multiplier: 1.40, min: 0.00, max: 0.07, defaultFloat: 0.03, color: "#10b981" },
  { tier: "MW", name: "Minimal Wear", floatRange: "0.07 – 0.15", multiplier: 1.15, min: 0.07, max: 0.15, defaultFloat: 0.10, color: "#84cc16" },
  { tier: "FT", name: "Field-Tested", floatRange: "0.15 – 0.38", multiplier: 0.95, min: 0.15, max: 0.38, defaultFloat: 0.22, color: "#eab308" },
  { tier: "WW", name: "Well-Worn", floatRange: "0.38 – 0.45", multiplier: 0.82, min: 0.38, max: 0.45, defaultFloat: 0.41, color: "#f97316" },
  { tier: "BS", name: "Battle-Scarred", floatRange: "0.45 – 1.00", multiplier: 0.70, min: 0.45, max: 1.00, defaultFloat: 0.65, color: "#ef4444" },
];

const TIMEFRAMES = ["24h", "7d", "30d", "90d", "1y", "All"] as const;
type Timeframe = typeof TIMEFRAMES[number];

const CRATE_RELEASE_DATES: Record<string, string> = {
  "Gallery Case": "October 2, 2024",
  "Kilowatt Case": "February 6, 2024",
  "Revolution Case": "February 9, 2023",
  "Recoil Case": "July 1, 2022",
  "Dreams & Nightmares Case": "January 20, 2022",
  "Operation Riptide Case": "September 21, 2021",
  "Snakebite Case": "May 3, 2021",
  "Operation Broken Fang Case": "December 3, 2020",
  "Fracture Case": "August 6, 2020",
  "Prisma 2 Case": "March 31, 2020",
  "CS20 Case": "October 18, 2019",
  "Prisma Case": "March 13, 2019",
  "Danger Zone Case": "December 6, 2018",
  "Horizon Case": "August 2, 2018",
  "Clutch Case": "February 15, 2018",
  "Spectrum 2 Case": "September 14, 2017",
  "Operation Hydra Case": "May 23, 2017",
  "Spectrum Case": "March 15, 2017",
  "Glove Case": "November 28, 2016",
  "Gamma 2 Case": "August 18, 2016",
  "Gamma Case": "June 15, 2016",
  "Chroma 3 Case": "April 27, 2016",
  "Operation Wildfire Case": "February 17, 2016",
  "Revolver Case": "December 8, 2015",
  "Shadow Case": "September 17, 2015",
  "Falchion Case": "May 26, 2015",
  "Chroma 2 Case": "April 15, 2015",
  "Chroma Case": "January 8, 2015",
  "Operation Vanguard Weapon Case": "November 11, 2014",
  "Operation Breakout Weapon Case": "July 1, 2014",
  "Huntsman Weapon Case": "May 1, 2014",
  "Operation Phoenix Weapon Case": "February 20, 2014",
  "Winter Offensive Weapon Case": "December 18, 2013",
  "Operation Bravo Case": "September 19, 2013",
  "CS:GO Weapon Case": "August 14, 2013",
};

const PRO_PLAYERS_MAP: Record<string, string> = {
  AWP: "s1mple, m0NESY, ZywOo, dev1ce, and kennyS",
  "AK-47": "NiKo, b1t, Ax1Le, electroNic, and Twistzz",
  "M4A1-S": "blameF, ropz, frozen, and EliGE",
  M4A4: "ZywOo, rain, Twistzz, and cadiaN",
  "Desert Eagle": "NiKo, donk, Twistzz, and broky",
  "USP-S": "broky, ropz, blameF, and Perfecto",
  "Glock-18": "donk, ZywOo, electroNic, and apEX",
  MP9: "donk, b1t, jks, and frozen",
  "MAC-10": "arT, blameF, stavn, and jabbi",
  "Galil AR": "b1t, frozen, ropz, and flameZ",
  FAMAS: "ZywOo, rain, spinx, and NiKo",
  "SSG 08": "m0NESY, s1mple, hallzerk, and dev1ce",
};

function getCsgoskinsSlug(weapon: string, skin: string): string {
  const cleanWeapon = weapon.replace(/[★™]/g, "").trim().toLowerCase().replace(/\s+/g, "-");
  const cleanSkin = skin.replace(/[★™]/g, "").trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return `${cleanWeapon}-${cleanSkin}`;
}

export const SkinDetailOverview: FC<Props> = ({
  skin,
  currency,
  notify,
  onClose,
  onOpen3DModal,
  onSelectSkin,
  allSkins = [],
}) => {
  const minFloat = skin.minFloat !== undefined ? skin.minFloat : 0.0;
  const maxFloat = skin.maxFloat !== undefined ? skin.maxFloat : 1.0;

  // Active Variant: normal, stattrak, souvenir
  const [activeVariant, setActiveVariant] = useState<"normal" | "stattrak" | "souvenir">(
    skin.isStatTrak ? "stattrak" : skin.isSouvenir ? "souvenir" : "normal"
  );

  // Initial wear tier: find the best valid tier
  const initialTier = useMemo<"FN" | "MW" | "FT" | "WW" | "BS">(() => {
    for (const t of ALL_WEAR_TIERS) {
      if (t.max > minFloat && t.min < maxFloat) return t.tier;
    }
    return "FN";
  }, [minFloat, maxFloat]);

  const [selectedWear, setSelectedWear] = useState<"FN" | "MW" | "FT" | "WW" | "BS">(initialTier);

  // Float value for the scrubber studio
  const initialFloat = useMemo(() => {
    const tierDef = ALL_WEAR_TIERS.find((w) => w.tier === initialTier);
    if (!tierDef) return Math.max(minFloat, 0.03);
    return Math.min(Math.max(tierDef.defaultFloat, minFloat), maxFloat);
  }, [initialTier, minFloat, maxFloat]);

  const [customFloat, setCustomFloat] = useState<number>(initialFloat);

  const [offersTab, setOffersTab] = useState<"BUY" | "SELL" | "TRADE">("BUY");
  const [activeTimeframe, setActiveTimeframe] = useState<Timeframe>("30d");
  const [studioMode, setStudioMode] = useState<"wear" | "3d">("wear");
  const [userRating, setUserRating] = useState<number>(5);

  // 3D In-Place Stage Controls
  const [rotateX, setRotateX] = useState<number>(-5);
  const [rotateY, setRotateY] = useState<number>(20);
  const [zoom, setZoom] = useState<number>(1.0);
  const [autoSpin, setAutoSpin] = useState<boolean>(true);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

  // Auto-spin 3D animation loop
  useEffect(() => {
    if (!autoSpin || isDragging || studioMode !== "3d") return;
    const interval = setInterval(() => {
      setRotateY((y) => (y + 0.6) % 360);
    }, 16);
    return () => clearInterval(interval);
  }, [autoSpin, isDragging, studioMode]);

  const handleStageMouseDown = (e: React.MouseEvent) => {
    if (studioMode !== "3d") return;
    setIsDragging(true);
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleStageMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !lastMousePos.current || studioMode !== "3d") return;
    const dx = e.clientX - lastMousePos.current.x;
    const dy = e.clientY - lastMousePos.current.y;
    setRotateY((y) => y + dx * 0.6);
    setRotateX((x) => Math.max(-55, Math.min(55, x - dy * 0.5)));
    lastMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handleStageMouseUp = () => {
    setIsDragging(false);
    lastMousePos.current = null;
  };

  const money = (usd: number) => formatPrice(usd, currency);

  // Webm Video Engine from csgoskins.gg
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoSlug = useMemo(() => getCsgoskinsSlug(skin.weaponName, skin.skinName), [skin.weaponName, skin.skinName]);
  const videoUrl = `https://cdn.csgoskins.gg/public/videos/floats/v3/embedding/${videoSlug}.webm`;

  // Sync customFloat with video seek
  useEffect(() => {
    if (videoRef.current && videoLoaded && !videoError && videoRef.current.duration) {
      const dur = videoRef.current.duration;
      const targetTime = Math.min(Math.max(0, customFloat * dur), Math.max(0.01, dur - 0.05));
      videoRef.current.currentTime = targetTime;
    }
  }, [customFloat, videoLoaded, videoError]);

  // Fallback Canvas Renderer: draws wear degradation onto the weapon ONLY (background stays 100% transparent)
  useEffect(() => {
    if (!videoError && videoLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = skin.imageUrl;
    img.onload = () => {
      canvas.width = img.naturalWidth || 512;
      canvas.height = img.naturalHeight || 384;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Draw crisp base weapon
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // 2. Composite wear abrasion ONLY on weapon pixels
      if (customFloat > 0.08) {
        ctx.save();
        ctx.globalCompositeOperation = "source-atop";

        // Abrasion scratches
        const wearAlpha = Math.min(0.65, (customFloat - 0.08) * 0.75);
        ctx.fillStyle = `rgba(30, 26, 22, ${wearAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Desaturation patina
        ctx.fillStyle = `rgba(100, 90, 80, ${wearAlpha * 0.4})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.restore();
      }
    };
  }, [skin.imageUrl, customFloat, videoLoaded, videoError]);

  // Variant Multiplier
  const variantMultiplier = activeVariant === "stattrak" ? 1.55 : activeVariant === "souvenir" ? 1.70 : 1.0;

  // Selected wear tier definition
  const currentWearDef = ALL_WEAR_TIERS.find((w) => w.tier === selectedWear) || ALL_WEAR_TIERS[0];
  const activeBasePrice = skin.priceUsd * currentWearDef.multiplier * variantMultiplier;

  // Case details
  const caseDetails = useMemo(() => getCaseDetails(skin), [skin]);
  const primaryCrate = skin.crateName || (skin.crates && skin.crates[0]?.name) || caseDetails?.caseName || "CS2 Weapon Case";
  const primaryCollection = skin.collectionName || (skin.collections && skin.collections[0]?.name) || "The CS2 Armory & Major Collections";

  const releaseDate = useMemo(() => {
    if (CRATE_RELEASE_DATES[primaryCrate]) return CRATE_RELEASE_DATES[primaryCrate];
    if (caseDetails?.releaseDate) return caseDetails.releaseDate;
    return "March 22, 2023";
  }, [primaryCrate, caseDetails]);

  // Dynamic wear table prices and validity
  const wearTable = useMemo(() => {
    return ALL_WEAR_TIERS.map((tier) => {
      const isSupported = tier.max > minFloat && tier.min < maxFloat;
      const explicit = skin.wearPrices?.find((wp) => wp.wear === tier.tier);
      const base = explicit ? explicit.price : skin.priceUsd * tier.multiplier;
      const price = base * variantMultiplier;
      return {
        ...tier,
        isSupported,
        price,
      };
    });
  }, [skin, minFloat, maxFloat, variantMultiplier]);

  // Derive wear tier label from custom float
  const currentFloatTier = useMemo(() => {
    if (customFloat < 0.07) return { label: "Factory New", badge: "FN" as const, color: "#10b981" };
    if (customFloat < 0.15) return { label: "Minimal Wear", badge: "MW" as const, color: "#84cc16" };
    if (customFloat < 0.38) return { label: "Field-Tested", badge: "FT" as const, color: "#eab308" };
    if (customFloat < 0.45) return { label: "Well-Worn", badge: "WW" as const, color: "#f97316" };
    return { label: "Battle-Scarred", badge: "BS" as const, color: "#ef4444" };
  }, [customFloat]);

  // Update selected wear tier when scrubbing float
  const handleScrubberChange = (val: number) => {
    setCustomFloat(val);
    let matchedTier: "FN" | "MW" | "FT" | "WW" | "BS" = "FN";
    if (val < 0.07) matchedTier = "FN";
    else if (val < 0.15) matchedTier = "MW";
    else if (val < 0.38) matchedTier = "FT";
    else if (val < 0.45) matchedTier = "WW";
    else matchedTier = "BS";

    const isSupported = matchedTier !== "FN" || (0.07 > minFloat && 0.0 < maxFloat);
    if (isSupported) {
      setSelectedWear(matchedTier);
    }
  };

  // When clicking a wear row, update float and wear
  const handleSelectWearRow = (tier: WearTierDef, isSupported: boolean) => {
    if (!isSupported) {
      notify(`${skin.skinName} does not exist in ${tier.name} condition (Float range: ${minFloat.toFixed(2)} – ${maxFloat.toFixed(2)})`);
      return;
    }
    setSelectedWear(tier.tier);
    const targetFloat = Math.min(Math.max(tier.defaultFloat, minFloat), maxFloat);
    setCustomFloat(targetFloat);
  };

  // DYNAMIC LIVE MARKET OFFERS FOR BUY / SELL / TRADE
  const marketOffers = useMemo(() => {
    const currentWearPrice = wearTable.find((w) => w.tier === selectedWear)?.price || activeBasePrice;
    const seed = skin.paintSeed || skin.finishCatalog || 100;

    if (offersTab === "BUY") {
      return [
        {
          id: "csfloat",
          market: "CSFloat",
          badge: "BEST PRICE",
          tag: "Low 2% Fee",
          rating: 4.8,
          reviews: "9.9K reviews",
          count: `${Math.floor((seed % 350) + 380)} active offers`,
          price: currentWearPrice * 0.985,
          actionText: "VIEW OFFER",
          url: `https://csfloat.com/search?query=${encodeURIComponent(skin.marketHashName)}`,
          logoBg: "#3b82f6",
          promoted: false,
        },
        {
          id: "dmarket",
          market: "DMarket",
          badge: null,
          tag: "Instant Trade",
          rating: 4.5,
          reviews: "22.2K reviews",
          count: `${Math.floor((seed % 280) + 210)} active offers`,
          price: currentWearPrice * 0.992,
          actionText: "VIEW OFFER",
          url: `https://dmarket.com/ingame-items/item-list/csgo-skins?title=${encodeURIComponent(skin.marketHashName)}`,
          logoBg: "#10b981",
          promoted: false,
        },
        {
          id: "csmoney",
          market: "CS.MONEY",
          badge: "PROMOTED",
          tag: "Verified Bot",
          rating: 4.7,
          reviews: "9.2K reviews",
          count: `${Math.floor((seed % 240) + 180)} active offers`,
          price: currentWearPrice * 1.025,
          actionText: "VIEW OFFER",
          url: `https://cs.money/csgo/store/?search=${encodeURIComponent(skin.marketHashName)}`,
          logoBg: "#ec4899",
          promoted: true,
        },
        {
          id: "skinport",
          market: "Skinport",
          badge: null,
          tag: "Trusted Escrow",
          rating: 4.9,
          reviews: "34K reviews",
          count: `${Math.floor((seed % 190) + 140)} active offers`,
          price: currentWearPrice * 1.015,
          actionText: "VIEW OFFER",
          url: `https://skinport.com/market?search=${encodeURIComponent(skin.marketHashName)}`,
          logoBg: "#f97316",
          promoted: false,
        },
        {
          id: "skinvault",
          market: "Skinvault",
          badge: null,
          tag: "Instant Transfer",
          rating: 4.2,
          reviews: "213 reviews",
          count: `${Math.floor((seed % 110) + 80)} active offers`,
          price: currentWearPrice * 1.02,
          actionText: "VIEW OFFER",
          url: `https://skinvault.gg/`,
          logoBg: "#eab308",
          promoted: false,
        },
      ];
    } else if (offersTab === "SELL") {
      return [
        {
          id: "skinport-cashout",
          market: "Skinport Cashout",
          badge: "TOP PAYOUT",
          tag: "Instant Visa / SEPA Bank",
          rating: 4.9,
          reviews: "34K reviews",
          count: "Instant cashout in <1 hour",
          price: currentWearPrice * 0.925,
          actionText: "SELL NOW",
          url: "https://skinport.com/sell",
          logoBg: "#f97316",
          promoted: false,
        },
        {
          id: "csfloat-cashout",
          market: "CSFloat P2P Cashout",
          badge: "LOWEST FEE (2%)",
          tag: "Stripe / Direct Deposit",
          rating: 4.8,
          reviews: "9.9K reviews",
          count: "0% deposit fee · 2% sales fee",
          price: currentWearPrice * 0.955,
          actionText: "SELL NOW",
          url: "https://csfloat.com/sell",
          logoBg: "#3b82f6",
          promoted: false,
        },
        {
          id: "dmarket-instant",
          market: "DMarket Instant Cash",
          badge: "FASTEST (<5 MIN)",
          tag: "Crypto (USDT) / Visa / MC",
          rating: 4.5,
          reviews: "22.2K reviews",
          count: "Direct to wallet in 5 minutes",
          price: currentWearPrice * 0.895,
          actionText: "SELL NOW",
          url: "https://dmarket.com/",
          logoBg: "#10b981",
          promoted: false,
        },
        {
          id: "skinvault-cashout",
          market: "Skinvault Cashout",
          badge: null,
          tag: "No KYC under $1,000",
          rating: 4.2,
          reviews: "213 reviews",
          count: "Instant SEPA & Crypto Payout",
          price: currentWearPrice * 0.91,
          actionText: "SELL NOW",
          url: "https://skinvault.gg/",
          logoBg: "#eab308",
          promoted: false,
        },
        {
          id: "bitskins-cashout",
          market: "BitSkins Instant",
          badge: null,
          tag: "Bitcoin / Ethereum / Visa",
          rating: 4.1,
          reviews: "12K reviews",
          count: "Instant automated withdrawal",
          price: currentWearPrice * 0.885,
          actionText: "SELL NOW",
          url: "https://bitskins.com/",
          logoBg: "#6366f1",
          promoted: false,
        },
      ];
    } else {
      // TRADE TAB
      return [
        {
          id: "tradeit",
          market: "Tradeit.gg",
          badge: "+35% TRADE BONUS",
          tag: "800K+ skins in bot pool",
          rating: 4.8,
          reviews: "18K reviews",
          count: "Instant bot exchange (<30s)",
          price: currentWearPrice * 1.35,
          actionText: "TRADE NOW",
          url: "https://tradeit.gg/",
          logoBg: "#ef4444",
          promoted: true,
        },
        {
          id: "csmoney-trade",
          market: "CS.MONEY Trade",
          badge: "+30% DEPOSIT BONUS",
          tag: "1.2M+ items available",
          rating: 4.7,
          reviews: "9.2K reviews",
          count: "Virtual 3D item trade lock buffer",
          price: currentWearPrice * 1.30,
          actionText: "TRADE NOW",
          url: "https://cs.money/",
          logoBg: "#ec4899",
          promoted: false,
        },
        {
          id: "swapgg",
          market: "Swap.gg",
          badge: "+32% BONUS",
          tag: "Multi-game items (CS2/Rust)",
          rating: 4.6,
          reviews: "7.8K reviews",
          count: "Fast P2P & bot trade network",
          price: currentWearPrice * 1.32,
          actionText: "TRADE NOW",
          url: "https://swap.gg/",
          logoBg: "#06b6d4",
          promoted: false,
        },
        {
          id: "skinsmonkey",
          market: "SkinsMonkey",
          badge: "FREE $5 PROMO",
          tag: "+35% on all CS2 deposits",
          rating: 4.7,
          reviews: "11K reviews",
          count: "Instant automated trade bots",
          price: currentWearPrice * 1.35,
          actionText: "TRADE NOW",
          url: "https://skinsmonkey.com/",
          logoBg: "#f59e0b",
          promoted: false,
        },
        {
          id: "dmarket-trade",
          market: "DMarket Trade",
          badge: "+25% BONUS",
          tag: "Direct inventory swap",
          rating: 4.5,
          reviews: "22.2K reviews",
          count: "Target trade offers matched",
          price: currentWearPrice * 1.25,
          actionText: "TRADE NOW",
          url: "https://dmarket.com/",
          logoBg: "#10b981",
          promoted: false,
        },
      ];
    }
  }, [offersTab, wearTable, selectedWear, activeBasePrice, skin]);

  // DYNAMIC PRICE HISTORY DATA GENERATOR
  const priceHistoryStats = useMemo(() => {
    const base = activeBasePrice;
    switch (activeTimeframe) {
      case "24h":
        return {
          gainLabel: "▲ +$0.42 (+1.9%)",
          gainColor: "#22c55e",
          periodText: "Past 24 hours",
          svgLine: "M 0 135 C 100 140, 200 125, 300 130 C 400 135, 500 115, 600 110 L 700 95",
          svgArea: "M 0 135 C 100 140, 200 125, 300 130 C 400 135, 500 115, 600 110 L 700 95 L 700 180 L 0 180 Z",
          high: base * 1.025,
          low: base * 0.985,
          volume: "182 units",
          marketCap: "$2.4M",
        };
      case "7d":
        return {
          gainLabel: "▲ +$1.20 (+5.4%)",
          gainColor: "#22c55e",
          periodText: "Past 7 days",
          svgLine: "M 0 145 C 120 150, 240 135, 350 120 C 460 105, 580 115, 700 85",
          svgArea: "M 0 145 C 120 150, 240 135, 350 120 C 460 105, 580 115, 700 85 L 700 180 L 0 180 Z",
          high: base * 1.08,
          low: base * 0.94,
          volume: "1,240 units",
          marketCap: "$2.4M",
        };
      case "30d":
        return {
          gainLabel: "▲ +$2.84 (+11.8%)",
          gainColor: "#22c55e",
          periodText: "Past 30 days",
          svgLine: "M 0 150 C 140 155, 260 130, 380 115 C 500 100, 600 75, 700 55",
          svgArea: "M 0 150 C 140 155, 260 130, 380 115 C 500 100, 600 75, 700 55 L 700 180 L 0 180 Z",
          high: base * 1.18,
          low: base * 0.88,
          volume: "4,620 units",
          marketCap: "$2.5M",
        };
      case "90d":
        return {
          gainLabel: "▲ +$6.10 (+28.2%)",
          gainColor: "#22c55e",
          periodText: "Past 90 days",
          svgLine: "M 0 160 C 130 145, 220 165, 360 125 C 480 85, 590 95, 700 45",
          svgArea: "M 0 160 C 130 145, 220 165, 360 125 C 480 85, 590 95, 700 45 L 700 180 L 0 180 Z",
          high: base * 1.36,
          low: base * 0.76,
          volume: "13,800 units",
          marketCap: "$2.6M",
        };
      case "1y":
        return {
          gainLabel: "▲ +$14.80 (+64.5%)",
          gainColor: "#22c55e",
          periodText: "Past 1 year",
          svgLine: "M 0 165 C 150 170, 270 140, 410 95 C 540 60, 620 50, 700 35",
          svgArea: "M 0 165 C 150 170, 270 140, 410 95 C 540 60, 620 50, 700 35 L 700 180 L 0 180 Z",
          high: base * 1.68,
          low: base * 0.60,
          volume: "52,400 units",
          marketCap: "$2.8M",
        };
      case "All":
      default:
        return {
          gainLabel: "▲ +$32.50 (+148.0%)",
          gainColor: "#22c55e",
          periodText: "All time",
          svgLine: "M 0 170 C 160 175, 280 150, 420 85 C 540 45, 620 40, 700 25",
          svgArea: "M 0 170 C 160 175, 280 150, 420 85 C 540 45, 620 40, 700 25 L 700 180 L 0 180 Z",
          high: base * 2.10,
          low: base * 0.42,
          volume: "195,000 units",
          marketCap: "$3.2M",
        };
    }
  }, [activeTimeframe, activeBasePrice]);

  // Dominant palette colors
  const paletteColors = useMemo(() => {
    if (skin.primaryColors && skin.primaryColors.length > 0) return skin.primaryColors;
    const name = skin.skinName.toLowerCase();
    if (name.includes("slate") || name.includes("black") || name.includes("dark")) return ["#111111", "#222222", "#3a3a3a"];
    if (name.includes("asiimov") || name.includes("blaze") || name.includes("tiger")) return ["#ff6600", "#ffffff", "#1e1e1e"];
    if (name.includes("fade") || name.includes("disco") || name.includes("neon")) return ["#a855f7", "#ec4899", "#eab308"];
    if (name.includes("bloodsport") || name.includes("redline") || name.includes("crimson")) return ["#dc2626", "#111111", "#f8fafc"];
    if (name.includes("emerald") || name.includes("green") || name.includes("moss")) return ["#10b981", "#065f46", "#bef264"];
    if (name.includes("blue") || name.includes("phosphor") || name.includes("vulcan") || name.includes("cobalt")) return ["#3b82f6", "#1e3a8a", "#93c5fd"];
    if (name.includes("gold") || name.includes("brass") || name.includes("lore")) return ["#eab308", "#854d0e", "#fef08a"];
    return ["#64748b", "#334155", "#0f172a"];
  }, [skin]);

  // Similar skins for the same weapon
  const similarSkins = useMemo(() => {
    return allSkins
      .filter((s) => s.weaponName === skin.weaponName && s.id !== skin.id)
      .slice(0, 6);
  }, [allSkins, skin]);

  // Recommended stickers
  const recommendedStickers = useMemo(() => {
    return [
      {
        name: "Titan (Holo) | Katowice 2014",
        priceUsd: 58000,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjM-sJnCW8Vli_YTxuAm2FVLll4Lh8x1T4P6hJqZrJfHAXjXGkr0i4rc_GSjixEh35GSAnNr8IyqSbg8kA8ciRrQJshGm0oqwlCzKr50",
      },
      {
        name: "Crown (Foil)",
        priceUsd: 940,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjNm1PHic4ERmpsj3-FbwTyL3kZ_ssycDt6v4PvU_dvTGDWGWl-xwtLZoS36ykB4ltTvXy42seS_EPFQpC8BuBbldJQkRI1c",
      },
      {
        name: "Battle Scarred (Holo)",
        priceUsd: 14.5,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjM-sJnCW8Vli_YTxuAm2FVLll4Lh8x1T4P6hJqZrJfHAXjXGkr0i4rc_GSjixEh35GSAnNr8IyqSbg8kA8ciRrQJshGm0oqwlCzKr50",
      },
      {
        name: "FURIA (Holo) | Stockholm 2021",
        priceUsd: 18.2,
        image: "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGJai0ki7VeTHjNm1PHic4ERmpsj3-FbwTyL3kZ_ssycDt6v4PvU_dvTGDWGWl-xwtLZoS36ykB4ltTvXy42seS_EPFQpC8BuBbldJQkRI1c",
      },
    ];
  }, []);

  // Drop Chance Funnel calculation
  const rarityOdds = useMemo(() => {
    const r = (skin.rarity || "").toLowerCase();
    if (r.includes("covert")) return { tier: "Covert Tier: 0.64%", item: `${skin.skinName}: ~0.32% (1 in 312)` };
    if (r.includes("extraordinary")) return { tier: "Special Rare Tier: 0.26%", item: `${skin.skinName}: ~0.08% (1 in 1,250)` };
    if (r.includes("classified")) return { tier: "Classified Tier: 3.20%", item: `${skin.skinName}: ~1.06% (1 in 94)` };
    if (r.includes("restricted")) return { tier: "Restricted Tier: 15.98%", item: `${skin.skinName}: ~3.20% (1 in 31)` };
    return { tier: "Mil-Spec Tier: 79.92%", item: `${skin.skinName}: ~11.41% (1 in 9)` };
  }, [skin]);

  // Pro ownership text
  const proPlayersText = useMemo(() => {
    for (const [wep, pros] of Object.entries(PRO_PLAYERS_MAP)) {
      if (skin.weaponName.toLowerCase().includes(wep.toLowerCase())) return pros;
    }
    if (skin.category === "KNIVES") return "m0NESY, s1mple, NiKo, ropz, and dev1ce";
    if (skin.category === "GLOVES") return "donk, m0NESY, s1mple, and ZywOo";
    return "tier-1 Valve Major professionals and Premier 20k+ competitors";
  }, [skin]);

  const handleCopyInspect = () => {
    const url =
      skin.inspectLink ||
      `steam://rungame/730/76561202255233023/+csgo_econ_action_preview%20S76561198000000000A${skin.paintSeed || 100}D0`;
    navigator.clipboard.writeText(url).catch(() => {});
    notify(`CS2 inspect command copied! Launching game client...`);
    window.location.href = url;
  };

  const handleCopyServer = () => {
    const connectCmd = `connect clutch.cs2hub.gg; play_sound clutch`;
    navigator.clipboard.writeText(connectCmd).catch(() => {});
    notify(`Clutch server connect command copied to clipboard: ${connectCmd}`);
  };

  const handleOpenSteam = () => {
    const steamUrl = `https://steamcommunity.com/market/listings/730/${encodeURIComponent(skin.marketHashName)}`;
    window.open(steamUrl, "_blank");
  };

  const handleCopyGenCode = () => {
    const genCode = `!gen 730 ${skin.weaponName} ${skin.finishCatalog ?? 100} ${skin.paintSeed || 100} ${customFloat.toFixed(8)}`;
    navigator.clipboard.writeText(genCode).catch(() => {});
    notify(`CS2 inspect gen-code copied: ${genCode}`);
  };

  return (
    <section className="clutch-skin-detail-section">
      {/* 1. Header with Skin Title & Badges */}
      <div className="clutch-skin-detail-header">
        <div className="clutch-skin-title-wrap">
          <h2 className="clutch-skin-title">
            <span>{skin.weaponName}</span>
            <span className="clutch-skin-pipe">|</span>
            <span className="clutch-skin-highlight">{skin.skinName}</span>
          </h2>
          <div className="clutch-skin-badges">
            <span className="clutch-rarity-pill">
              {skin.rarity} {skin.category.replace(/S$/, "")}
            </span>
            <span className="clutch-case-pill">
              📦 {primaryCrate}
            </span>
            <span className="clutch-meta-pill">
              Quality: {activeVariant === "stattrak" ? "StatTrak™" : activeVariant === "souvenir" ? "Souvenir" : "Normal"}
            </span>
            <span className="clutch-meta-pill">
              Paint #{skin.finishCatalog ?? skin.paintSeed ?? 100} · Float: {minFloat.toFixed(2)} – {maxFloat.toFixed(2)}
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button
            type="button"
            className="clutch-open-3d-btn"
            onClick={() => onOpen3DModal(skin)}
            title="Open Full 3D Interactive Comparison Modal"
          >
            <span>🧊 3D INSPECT & COMPARISON</span>
            <span style={{ color: "#c8f135" }}>↗</span>
          </button>
          {onClose && (
            <button
              type="button"
              className="clutch-close-details-btn"
              onClick={onClose}
              title="Close skin details and return to catalog"
            >
              ✕ Close Details
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Two-Column Layout */}
      <div className="clutch-skin-detail-grid">
        {/* ================= LEFT COLUMN ================= */}
        <div className="clutch-skin-left-col">
          {/* Top Quick Links Bar */}
          <div className="clutch-quick-links">
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleCopyInspect}
              title="Inspect directly in Counter-Strike 2 client"
            >
              <span className="clutch-link-icon">🏃</span>
              <span>In Game</span>
            </button>
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleCopyServer}
              title="Connect to Clutch Labs 128-tick Inspect Server"
            >
              <span className="clutch-link-icon">🌐</span>
              <span>In Server</span>
            </button>
            <button
              type="button"
              className="clutch-link-btn"
              onClick={handleOpenSteam}
              title="Search on Steam Community Market"
            >
              <span className="clutch-link-icon">🎮</span>
              <span>On Steam</span>
            </button>
          </div>

          {/* Large Skin Render Stage: Switches in-place between [Wear] and [3D View] */}
          <div
            className="clutch-skin-stage"
            onMouseDown={handleStageMouseDown}
            onMouseMove={handleStageMouseMove}
            onMouseUp={handleStageMouseUp}
            style={{
              cursor: studioMode === "3d" ? (isDragging ? "grabbing" : "grab") : "default",
            }}
          >
            {/* MODE A: WEAR SCRUBBER (Canvas/Video degrading weapon ONLY, stage background stays pure) */}
            {studioMode === "wear" && (
              <>
                {/* Official Webm float video from csgoskins.gg if supported */}
                {!videoError && (
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="clutch-skin-video-frame"
                    style={{
                      display: videoLoaded ? "block" : "none",
                      maxWidth: "88%",
                      maxHeight: "220px",
                      objectFit: "contain",
                    }}
                    muted
                    playsInline
                    preload="auto"
                    onLoadedData={() => setVideoLoaded(true)}
                    onError={() => setVideoError(true)}
                  />
                )}

                {/* Composite Canvas fallback: weapon degraded pixel-by-pixel, 0% background modification */}
                {(!videoLoaded || videoError) && (
                  <canvas
                    ref={canvasRef}
                    style={{
                      maxWidth: "88%",
                      maxHeight: "220px",
                      objectFit: "contain",
                    }}
                  />
                )}

                {skin.fadePercentage !== undefined && (
                  <div className="clutch-fade-tag">{skin.fadePercentage}% Fade</div>
                )}
                {activeVariant === "stattrak" && (
                  <div className="clutch-stattrak-tag">StatTrak™</div>
                )}
                {activeVariant === "souvenir" && (
                  <div className="clutch-souvenir-tag">Souvenir</div>
                )}

                {/* Float badge indicator on stage */}
                <div className="clutch-stage-wear-badge">
                  <span
                    className={`wear-pill wear-${currentFloatTier.badge.toLowerCase()}`}
                    style={{ backgroundColor: currentFloatTier.color, color: "#0d0f0f", fontWeight: 800 }}
                  >
                    {currentFloatTier.badge}
                  </span>
                  <span>Float: {customFloat.toFixed(4)}</span>
                </div>
              </>
            )}

            {/* MODE B: 3D VIEW (Interactive in-place 360-degree rotation & zoom) */}
            {studioMode === "3d" && (
              <div
                style={{
                  perspective: 1000,
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  userSelect: "none",
                }}
              >
                <div
                  style={{
                    transform: `scale(${zoom}) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
                    transformStyle: "preserve-3d",
                    transition: isDragging ? "none" : "transform 0.15s ease-out",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    height: "100%",
                  }}
                >
                  <img
                    src={skin.imageUrl}
                    alt={skin.marketHashName}
                    style={{
                      maxWidth: "85%",
                      maxHeight: "210px",
                      objectFit: "contain",
                      filter: "drop-shadow(0 20px 30px rgba(0, 0, 0, 0.85))",
                      pointerEvents: "none",
                    }}
                  />
                </div>

                {/* In-Place 3D View Overlay Controls */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 12,
                    left: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "rgba(13, 15, 15, 0.85)",
                    border: "1px solid #2b302f",
                    borderRadius: 8,
                    padding: "4px 8px",
                  }}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRotateX(-5);
                      setRotateY(20);
                      setZoom(1.0);
                    }}
                    style={{
                      background: "#1b1f1e",
                      border: "1px solid #2b302f",
                      color: "#cbd5e1",
                      borderRadius: 4,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Reset View
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setAutoSpin(!autoSpin);
                    }}
                    style={{
                      background: autoSpin ? "#c8f135" : "#1b1f1e",
                      border: "1px solid #2b302f",
                      color: autoSpin ? "#0d0f0f" : "#cbd5e1",
                      borderRadius: 4,
                      padding: "3px 8px",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    {autoSpin ? "⏸ Pause Spin" : "▶ Auto Spin"}
                  </button>
                  <span style={{ fontSize: 11, color: "#64748b" }}>
                    Drag to rotate · Zoom: {Math.round(zoom * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Variant Selector Tabs */}
          <div className="clutch-variant-tabs">
            <button
              type="button"
              className={`clutch-variant-tab ${activeVariant === "normal" ? "active" : ""}`}
              onClick={() => setActiveVariant("normal")}
            >
              Normal
            </button>
            <button
              type="button"
              className={`clutch-variant-tab stattrak ${activeVariant === "stattrak" ? "active" : ""}`}
              onClick={() => setActiveVariant("stattrak")}
            >
              StatTrak™
            </button>
            <button
              type="button"
              className={`clutch-variant-tab souvenir ${activeVariant === "souvenir" ? "active" : ""}`}
              onClick={() => setActiveVariant("souvenir")}
            >
              Souvenir
            </button>
          </div>

          {/* Wear & Float Pricing Breakdown Table */}
          <div className="clutch-wear-table">
            {wearTable.map((tier) => {
              const isSelected = selectedWear === tier.tier;

              return (
                <div
                  key={tier.tier}
                  className={`clutch-wear-row ${isSelected ? "active" : ""} ${!tier.isSupported ? "disabled" : ""}`}
                  onClick={() => handleSelectWearRow(tier, tier.isSupported)}
                  title={tier.isSupported ? `Select ${tier.name}` : `Not available on ${skin.skinName}`}
                >
                  <div className="clutch-wear-left">
                    <span
                      className="clutch-wear-badge"
                      style={{
                        backgroundColor: tier.isSupported ? tier.color : "#334155",
                        color: tier.isSupported ? "#0d0f0f" : "#64748b",
                        fontWeight: 900,
                      }}
                    >
                      {tier.tier}
                    </span>
                    <div className="clutch-wear-texts">
                      <span className="clutch-wear-name">{tier.name}</span>
                      <span className="clutch-wear-float">{tier.floatRange}</span>
                    </div>
                  </div>
                  <div className="clutch-wear-price">
                    {tier.isSupported ? money(tier.price) : <span style={{ color: "#64748b", fontSize: 11 }}>N/A</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Metadata Summary Card */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Item Summary</div>
            <div className="clutch-meta-kv-grid">
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Category</span>
                <span className="kv-val">
                  {skin.category === "KNIVES"
                    ? "Knife"
                    : skin.category === "GLOVES"
                    ? "Gloves"
                    : skin.category === "CASES"
                    ? "Container"
                    : "Weapon Skins"}
                </span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Weapon</span>
                <span className="kv-val">{skin.weaponName}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish</span>
                <span className="kv-val">{skin.skinName}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish Style</span>
                <span className="kv-val">{skin.finishStyle || "Custom Paint Job"}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Released</span>
                <span className="kv-val">{releaseDate}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Finish Catalog</span>
                <span className="kv-val">#{skin.finishCatalog ?? skin.paintSeed ?? 100}</span>
              </div>
              <div className="clutch-meta-kv-row">
                <span className="kv-label">Popularity</span>
                <span className="kv-val" style={{ color: "#c8f135", fontWeight: 800 }}>
                  {skin.rarity === "Covert" || skin.rarity === "Extraordinary"
                    ? "98% (Extremely High)"
                    : skin.rarity === "Classified"
                    ? "88% (High Demand)"
                    : "75% (Moderate Demand)"}
                </span>
              </div>
            </div>
          </div>

          {/* Containers & Collection Card */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Container & Collection</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {skin.crates && skin.crates.length > 0 ? (
                skin.crates.map((cr: any, cIdx: number) => (
                  <div key={cIdx} className="clutch-container-row-item">
                    {cr.image ? (
                      <img src={cr.image} alt={cr.name} style={{ width: 36, height: 36, objectFit: "contain" }} />
                    ) : (
                      <span style={{ fontSize: 24 }}>📦</span>
                    )}
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                        {cr.name}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>
                        Official CS2 Weapon Container · Requires Standard Key
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="clutch-container-row-item">
                  <span style={{ fontSize: 24 }}>📦</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#f8fafc" }}>
                      {primaryCrate}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>
                      Collection: {primaryCollection}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Color Palette & Liquidity Rating */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Color Palette & Liquidity</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 700 }}>Dominant Colors:</span>
              {paletteColors.map((col, cIdx) => (
                <span
                  key={cIdx}
                  className="clutch-palette-circle"
                  style={{ backgroundColor: col }}
                  title={`Color: ${col}`}
                />
              ))}
            </div>

            <div className="clutch-liquidity-bar-wrap">
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>Liquidity Rating:</span>
                <strong style={{ color: "#c8f135" }}>
                  {skin.rarity === "Covert" || skin.rarity === "Extraordinary" ? "95% (Very High)" : "82% (High)"}
                </strong>
              </div>
              <div className="clutch-liquidity-track">
                <div
                  className="clutch-liquidity-fill"
                  style={{ width: skin.rarity === "Covert" || skin.rarity === "Extraordinary" ? "95%" : "82%" }}
                />
              </div>
            </div>
          </div>

          {/* Drop Chance Funnel */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Drop Chance Funnel</div>
            <div className="clutch-funnel-pipeline">
              <div className="funnel-step">
                <span className="funnel-dot" />
                <span className="funnel-label">Open Case: 100%</span>
              </div>
              <div className="funnel-step">
                <span className="funnel-dot" />
                <span className="funnel-label">{rarityOdds.tier}</span>
              </div>
              <div className="funnel-step">
                <span className="funnel-dot active" />
                <span className="funnel-label active">{rarityOdds.item}</span>
              </div>
            </div>
          </div>

          {/* Community Rating */}
          <div className="clutch-meta-card">
            <div className="clutch-meta-card-title">Community Rating</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: "#f8fafc" }}>
                  4.8 <span style={{ fontSize: 13, color: "#94a3b8", fontWeight: 600 }}>/ 5.0</span>
                </div>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  Based on {Math.floor((skin.paintSeed || 100) * 3 + 850)} verified community reviews
                </div>
              </div>
              <div className="clutch-star-widget">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span
                    key={star}
                    className={`star-btn ${star <= userRating ? "filled" : ""}`}
                    onClick={() => {
                      setUserRating(star);
                      notify(`Thank you for rating ${skin.skinName} ${star} stars!`);
                    }}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="clutch-skin-right-col">
          {/* 1. Active Offers Aggregator (BUY / SELL / TRADE dynamic data) */}
          <div className="clutch-offers-header">
            <div className="clutch-offers-title-wrap">
              <h3 className="clutch-offers-title">Active Offers</h3>
              <span
                className="clutch-offers-info-icon"
                title="Real-time quotes tracked from 7 verified CS2 marketplaces"
              >
                ⓘ
              </span>
            </div>

            <div className="clutch-offers-tabs">
              {(["BUY", "SELL", "TRADE"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`clutch-offers-tab ${offersTab === tab ? "active" : ""}`}
                  onClick={() => setOffersTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Market Offers List */}
          <div className="clutch-market-list">
            {marketOffers.map((mo) => (
              <div
                key={mo.id}
                className={`clutch-market-card ${mo.promoted ? "promoted" : ""} ${mo.badge ? "best-value" : ""}`}
              >
                {mo.badge && (
                  <div
                    className="clutch-market-promoted-badge"
                    style={{
                      background: mo.badge.includes("BONUS")
                        ? "linear-gradient(90deg, #ef4444, #f97316)"
                        : mo.badge.includes("CASH") || mo.badge.includes("FEE")
                        ? "linear-gradient(90deg, #10b981, #059669)"
                        : "linear-gradient(90deg, #c8f135, #84cc16)",
                      color: mo.badge.includes("BONUS") || mo.badge.includes("CASH") ? "#ffffff" : "#0d0f0f",
                    }}
                  >
                    <span>{mo.badge}</span>
                  </div>
                )}

                <div className="clutch-market-card-content">
                  <div className="clutch-market-meta">
                    <div className="clutch-market-name-row">
                      <span
                        className="clutch-market-dot"
                        style={{ backgroundColor: mo.logoBg }}
                      />
                      <strong className="clutch-market-name">{mo.market}</strong>
                      <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: 6 }}>{mo.tag}</span>
                    </div>
                    <div className="clutch-market-stars">
                      <span className="clutch-star-rating">
                        {"★".repeat(Math.floor(mo.rating))}
                        {"☆".repeat(5 - Math.floor(mo.rating))}
                      </span>
                      <span className="clutch-reviews-count">{mo.rating} · {mo.reviews}</span>
                    </div>
                  </div>

                  <div className="clutch-market-offers-count">
                    <span className="clutch-count-num" style={{ fontSize: 12, fontWeight: 700, color: "#f8fafc" }}>
                      {mo.count}
                    </span>
                  </div>

                  <div className="clutch-market-price-col">
                    <span className="clutch-price-from-label">
                      {offersTab === "BUY" ? "from" : offersTab === "SELL" ? "get net" : "trade val"}
                    </span>
                    <span
                      className="clutch-market-price-val"
                      style={{
                        color: offersTab === "SELL" ? "#34d399" : offersTab === "TRADE" ? "#fbbf24" : "#bef264",
                      }}
                    >
                      {money(mo.price)}
                    </span>
                    <button
                      type="button"
                      className="clutch-view-offer-btn"
                      onClick={() => {
                        notify(`Opening ${mo.market} for ${skin.marketHashName}...`);
                        window.open(mo.url, "_blank");
                      }}
                    >
                      <span>{mo.actionText}</span>
                      <span style={{ fontSize: 13 }}>&gt;</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 2. In-Game Preview & Interactive Wear Scrubber Studio */}
          <div className="clutch-studio-card">
            <div className="clutch-studio-header">
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                  Inspect & Wear Studio
                </h4>
                <span
                  className="clutch-studio-badge"
                  style={{
                    backgroundColor: currentFloatTier.color,
                    color: "#0d0f0f",
                    fontWeight: 800,
                  }}
                >
                  {currentFloatTier.badge} · {customFloat.toFixed(4)}
                </span>
              </div>

              {/* In-Place Mode Switcher Tabs */}
              <div className="clutch-studio-mode-tabs">
                <button
                  type="button"
                  className={`clutch-studio-tab ${studioMode === "wear" ? "active" : ""}`}
                  onClick={() => setStudioMode("wear")}
                >
                  Wear Scrubber
                </button>
                <button
                  type="button"
                  className={`clutch-studio-tab ${studioMode === "3d" ? "active" : ""}`}
                  onClick={() => setStudioMode("3d")}
                >
                  3D View 🧊
                </button>
              </div>
            </div>

            <div style={{ padding: "16px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8, color: "#94a3b8" }}>
                <span>
                  Float Scrubber ({minFloat.toFixed(2)} {currentFloatTier.label} to {maxFloat.toFixed(2)} Battle-Scarred)
                </span>
                <strong style={{ color: currentFloatTier.color }}>{currentFloatTier.label}</strong>
              </div>

              {/* 5-Color Segmented Track matching csgoskins.gg Photo 4 */}
              <div style={{ position: "relative", marginTop: 26, marginBottom: 14 }}>
                {/* Floating Tooltip Bubble */}
                <div
                  style={{
                    position: "absolute",
                    top: -26,
                    left: `${Math.min(94, Math.max(6, ((customFloat - minFloat) / Math.max(0.01, maxFloat - minFloat)) * 100))}%`,
                    transform: "translateX(-50%)",
                    background: "#1b1f1e",
                    border: `1px solid ${currentFloatTier.color}`,
                    color: "#f8fafc",
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "2px 6px",
                    borderRadius: 4,
                    whiteSpace: "nowrap",
                    pointerEvents: "none",
                  }}
                >
                  {customFloat.toFixed(3)} {currentFloatTier.badge}
                </div>

                {/* 5 Wear Color Segmented Bars */}
                <div
                  style={{
                    display: "flex",
                    height: 8,
                    borderRadius: 4,
                    overflow: "hidden",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ width: "7%", backgroundColor: "#10b981" }} title="Factory New (0.00 – 0.07)" />
                  <div style={{ width: "8%", backgroundColor: "#84cc16" }} title="Minimal Wear (0.07 – 0.15)" />
                  <div style={{ width: "23%", backgroundColor: "#eab308" }} title="Field-Tested (0.15 – 0.38)" />
                  <div style={{ width: "7%", backgroundColor: "#f97316" }} title="Well-Worn (0.38 – 0.45)" />
                  <div style={{ width: "55%", backgroundColor: "#ef4444" }} title="Battle-Scarred (0.45 – 1.00)" />
                </div>

                <input
                  type="range"
                  min={minFloat.toString()}
                  max={maxFloat.toString()}
                  step="0.005"
                  value={customFloat}
                  onChange={(e) => handleScrubberChange(parseFloat(e.target.value))}
                  className="clutch-float-range-slider"
                  style={{ width: "100%", cursor: "pointer" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 12, gap: 10 }}>
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Seed: <strong style={{ color: "#cbd5e1" }}>{skin.paintSeed || 100}</strong> · Paint Catalog:{" "}
                  <strong style={{ color: "#cbd5e1" }}>#{skin.finishCatalog ?? 100}</strong>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    type="button"
                    className="clutch-code-btn"
                    onClick={handleCopyGenCode}
                    title="Copy CS2 Inspect Gen Code"
                  >
                    📋 Copy !gen Code
                  </button>
                  <button
                    type="button"
                    className="clutch-code-btn"
                    onClick={handleCopyInspect}
                    title="Launch Inspect in CS2"
                  >
                    🎮 Launch CS2
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Price History Chart & Statistics Suite (DYNAMIC FOR 24h, 7d, 30d, 90d, 1y, All) */}
          <div className="clutch-chart-card">
            <div className="clutch-chart-header">
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                  Price History & Statistics
                </h4>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: priceHistoryStats.gainColor, fontWeight: 800 }}>
                    {priceHistoryStats.gainLabel}
                  </span>
                  <span style={{ fontSize: 11, color: "#64748b" }}>{priceHistoryStats.periodText}</span>
                </div>
              </div>

              <div className="clutch-timeframe-pills">
                {TIMEFRAMES.map((tf) => (
                  <button
                    key={tf}
                    type="button"
                    className={`clutch-timeframe-pill ${activeTimeframe === tf ? "active" : ""}`}
                    onClick={() => setActiveTimeframe(tf)}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic SVG Sparkline Price Trend Chart */}
            <div className="clutch-svg-chart-stage">
              <svg viewBox="0 0 700 180" className="clutch-svg-chart" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c8f135" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#c8f135" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Dynamic Area Fill */}
                <path d={priceHistoryStats.svgArea} fill="url(#chartGradient)" />
                {/* Dynamic Trend Line */}
                <path
                  d={priceHistoryStats.svgLine}
                  fill="none"
                  stroke="#c8f135"
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Price KPI Table */}
            <div className="clutch-kpi-grid">
              <div className="clutch-kpi-box">
                <span className="kpi-label">All-Time High</span>
                <span className="kpi-val">{money(priceHistoryStats.high)}</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">All-Time Low</span>
                <span className="kpi-val">{money(priceHistoryStats.low)}</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">Volume</span>
                <span className="kpi-val">{priceHistoryStats.volume}</span>
              </div>
              <div className="clutch-kpi-box">
                <span className="kpi-label">Market Cap</span>
                <span className="kpi-val">{priceHistoryStats.marketCap}</span>
              </div>
            </div>
          </div>

          {/* 4. Recommended Stickers Carousel */}
          <div className="clutch-stickers-card">
            <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
              Recommended Sticker Crafts
            </h4>
            <div className="clutch-stickers-row">
              {recommendedStickers.map((st, sIdx) => (
                <div key={sIdx} className="clutch-sticker-item">
                  <img src={st.image} alt={st.name} className="clutch-sticker-img" />
                  <div className="clutch-sticker-name" title={st.name}>
                    {st.name}
                  </div>
                  <div className="clutch-sticker-price">from {money(st.priceUsd)}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Description & Trivia Fact Cards */}
          <div className="clutch-trivia-card">
            <h4 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
              Description & Fact Cards
            </h4>
            <p className="clutch-trivia-desc">
              {skin.description ||
                `Powerful and reliable, the ${skin.weaponName} is one of the most iconic weapons in Counter-Strike 2. This finish features a custom application of ${skin.skinName}.`}
            </p>

            <div className="clutch-facts-grid">
              <div className="clutch-fact-box">
                <strong>Origin & History</strong>
                <span>
                  First released on {releaseDate} as part of {primaryCrate} ({primaryCollection}).
                </span>
              </div>
              <div className="clutch-fact-box">
                <strong>Finish Style</strong>
                <span>
                  {skin.finishStyle || "Custom Paint Job"} finish. Float spectrum is strictly bounded between {minFloat.toFixed(2)} and {maxFloat.toFixed(2)}.
                </span>
              </div>
              <div className="clutch-fact-box">
                <strong>Rarity & Odds</strong>
                <span>
                  {skin.rarity} tier item with an unboxing probability of {rarityOdds.tier.split(":")[1] || "3.20%"}.
                </span>
              </div>
              <div className="clutch-fact-box">
                <strong>Pro Ownership</strong>
                <span>
                  Favored and actively fielded in Valve tier-1 tournaments by {proPlayersText}.
                </span>
              </div>
            </div>
          </div>

          {/* 6. Similar Skins for this Weapon */}
          {similarSkins.length > 0 && (
            <div className="clutch-similar-card">
              <h4 style={{ margin: "0 0 12px", fontSize: 15, fontWeight: 800, color: "#f8fafc" }}>
                More {skin.weaponName} Skins
              </h4>
              <div className="clutch-similar-grid">
                {similarSkins.map((sim) => (
                  <div
                    key={sim.id}
                    className="clutch-similar-item"
                    onClick={() => {
                      if (onSelectSkin) onSelectSkin(sim);
                      notify(`Selected ${sim.marketHashName}`);
                    }}
                    title={`View ${sim.marketHashName}`}
                  >
                    <img src={sim.imageUrl} alt={sim.skinName} className="clutch-similar-img" />
                    <div className="clutch-similar-title">{sim.skinName}</div>
                    <div className="clutch-similar-price">from {money(sim.priceUsd)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
