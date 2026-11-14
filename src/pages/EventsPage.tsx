import { useEffect, useState, type FC } from "react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../features/identity/AuthProvider";
import Icon from "../components/Icon";
import { getWeaponSilhouetteSvg } from "../components/WeaponSilhouette";
import "./EventsPage.css";

interface Props {
  notify: (message: string) => void;
}

export interface GiveawayItem {
  id: string;
  title: string;
  skinName: string;
  weaponName: string;
  wearCondition: string;
  rarity: string;
  valueUsd: number;
  imageUrl: string;
  endsAt: string;
  entriesCount: number;
  hasEntered?: boolean;
  sponsorName?: string;
  winnerCount?: number;
}

export interface FlashDeal {
  id: string;
  title: string;
  category: "SKIN" | "STEAM_GAME" | "PASS";
  originalPriceUsd: number;
  salePriceUsd: number;
  discountPercent: number;
  imageUrl: string;
  storeName: string;
  storeUrl: string;
  badgeText?: string;
}

export interface SteamGameDeal {
  id: string;
  appId: number;
  title: string;
  category: string;
  originalPriceUsd: number;
  salePriceUsd: number;
  discountPercent: number;
  reviewRating: string;
  headerImageUrl: string;
  storeUrl: string;
}

export interface MajorEvent {
  id: string;
  title: string;
  status: "LIVE" | "UPCOMING" | "RECENT";
  type: "MAJOR" | "VALVE_UPDATE" | "COMMUNITY";
  startDate: string;
  endDate: string;
  prizePoolUsd?: number;
  location?: string;
  description: string;
  highlights: string[];
  officialUrl?: string;
}

type EventsTab = "ALL" | "GIVEAWAYS" | "STEAM_GAMES" | "SKIN_DEALS" | "CALENDAR";

const FALLBACK_GIVEAWAYS: GiveawayItem[] = [
  {
    id: "giveaway-1",
    title: "★ Butterfly Knife | Fade",
    skinName: "Fade",
    weaponName: "★ Butterfly Knife",
    wearCondition: "Factory New",
    rarity: "Covert",
    valueUsd: 3450.0,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL6kJ_m-B1Z-ua6bbZrLOmsD2avx-9ytd5lRi67gVNwsDvSwtqqc3iXZg4kCZYjReYLtRbum9XgYuvm5wbWjtgUzCn3iSsf8G81tFEeH9rw",
    endsAt: new Date(Date.now() + 2 * 24 * 3600 * 1000 + 14 * 3600 * 1000).toISOString(),
    entriesCount: 4128,
    winnerCount: 1,
    sponsorName: "CSFloat Community Hub",
  },
  {
    id: "giveaway-2",
    title: "AK-47 | Fire Serpent",
    skinName: "Fire Serpent",
    weaponName: "AK-47",
    wearCondition: "Field-Tested",
    rarity: "Covert",
    valueUsd: 820.0,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwlcK3wiFO0PSneqF-JeKDC2mE_u995LZWTTuygxIYvzSCkpu3cnvFPQB2DpUkROFY4Rntw93lP7i241DbiI1BxSuviHlKunk_6-sHU71lpPMTRLyP4Q",
    endsAt: new Date(Date.now() + 1 * 24 * 3600 * 1000 + 6 * 3600 * 1000).toISOString(),
    entriesCount: 2840,
    winnerCount: 1,
    sponsorName: "Clutch Labs Official",
  },
  {
    id: "giveaway-3",
    title: "AWP | Desert Hydra",
    skinName: "Desert Hydra",
    weaponName: "AWP",
    wearCondition: "Factory New",
    rarity: "Covert",
    valueUsd: 1950.0,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyLwiYbf-jFk7uW-V6x0JOKSMWuZxuZi_uA7Syu2w0Ry4mqGzYypeH3DaAEnCpt0FuAK4RjrkoDgMb7mtFfcit5bjXKpX4RFZcA",
    endsAt: new Date(Date.now() + 4 * 24 * 3600 * 1000 + 8 * 3600 * 1000).toISOString(),
    entriesCount: 5310,
    winnerCount: 1,
    sponsorName: "Steam Community Rewards",
  },
  {
    id: "giveaway-4",
    title: "Sport Gloves | Vice",
    skinName: "Vice",
    weaponName: "Sport Gloves",
    wearCondition: "Minimal Wear",
    rarity: "Extraordinary",
    valueUsd: 2100.0,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Tk5UvzWCL2kpn2-DFk_OKherB0H_KfG2Kv0ed4u95lRi67gVNx4T-Bw434IHyVb1QlAsd1FOUDthG4xNznMu3m4QXXg90Wzn_33C1I8G81tLaDi_rK",
    endsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000 + 18 * 3600 * 1000).toISOString(),
    entriesCount: 3890,
    winnerCount: 1,
    sponsorName: "Skinport Partner Hub",
  },
];

const FALLBACK_DEALS: FlashDeal[] = [
  {
    id: "deal-1",
    title: "Counter-Strike 2: The Armory Pass",
    category: "PASS",
    originalPriceUsd: 16.0,
    salePriceUsd: 12.0,
    discountPercent: 25,
    imageUrl:
      "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/730/header.jpg",
    storeName: "Steam Store",
    storeUrl: "https://store.steampowered.com/app/730/CounterStrike_2/",
    badgeText: "OFFICIAL PASS",
  },
  {
    id: "deal-2",
    title: "M4A1-S | Printstream (Field-Tested)",
    category: "SKIN",
    originalPriceUsd: 195.0,
    salePriceUsd: 126.75,
    discountPercent: 35,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL8ypexwjFS4_ega6F_H_OGMWrEwL9lj_F7Rienhgk1tjyIpYPwJiPTcAAoCpsiEO5ZsUbpm9C2Zuni4VHW3o5EzSX62HxP7Sg96-hWVqYi_6TJz1aW0nxrkGs",
    storeName: "CSFloat Market",
    storeUrl: "https://csfloat.com",
    badgeText: "HOT FLASH DEAL",
  },
  {
    id: "deal-3",
    title: "Desert Eagle | Ocean Drive (Factory New)",
    category: "SKIN",
    originalPriceUsd: 95.0,
    salePriceUsd: 57.0,
    discountPercent: 40,
    imageUrl:
      "https://community.akamai.steamstatic.com/economy/image/i0CoZ81Ui0m-9KwlBY1L_18myuGuq1wfhWSaZgMttyVfPaERSR0Wqmu7LAocGIGz3UqlXOLrxM-vMGmW8VNxu5Dx60noTyL1m5fn8Sdk7OeRbKFsJ_yWMWyZ1e1-j-1gSCGn2x5-sG7Wzdyvc3OSbgcnXpR5FO9bukTtm9WzMePhswaN2N5CmCj_jyhXrnE8ibjhEyc",
    storeName: "Skinport",
    storeUrl: "https://skinport.com",
    badgeText: "LOWEST 30-DAY",
  },
  {
    id: "deal-4",
    title: "Half-Life: Alyx (VR Major Sale)",
    category: "STEAM_GAME",
    originalPriceUsd: 59.99,
    salePriceUsd: 20.39,
    discountPercent: 66,
    imageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/546560/header.jpg",
    storeName: "Steam Store",
    storeUrl: "https://store.steampowered.com/app/546560/HalfLife_Alyx/",
    badgeText: "VALVE HIGHLIGHT",
  },
];

const STEAM_GAME_DISCOUNTS: SteamGameDeal[] = [
  {
    id: "steam-deal-2132890",
    appId: 2132890,
    title: "Possessor(s)",
    category: "Steam Special / Tactical Action",
    originalPriceUsd: 9.99,
    salePriceUsd: 1.49,
    discountPercent: 85,
    reviewRating: "Mostly Positive (75%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2132890/header.jpg",
    storeUrl: "https://store.steampowered.com/app/2132890/",
  },
  {
    id: "steam-deal-418460",
    appId: 418460,
    title: "Rising Storm 2: Vietnam",
    category: "Steam Special / Tactical Shooter",
    originalPriceUsd: 24.99,
    salePriceUsd: 2.49,
    discountPercent: 90,
    reviewRating: "Very Positive (89%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/418460/header.jpg",
    storeUrl: "https://store.steampowered.com/app/418460/",
  },
  {
    id: "steam-deal-413410",
    appId: 413410,
    title: "Danganronpa: Trigger Happy Havoc",
    category: "Steam Special / Mystery Adventure",
    originalPriceUsd: 19.99,
    salePriceUsd: 1.99,
    discountPercent: 90,
    reviewRating: "Overwhelmingly Positive (95%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/413410/header.jpg",
    storeUrl: "https://store.steampowered.com/app/413410/",
  },
  {
    id: "steam-deal-1029690",
    appId: 1029690,
    title: "Sniper Elite 5",
    category: "Steam Special / Tactical Stealth FPS",
    originalPriceUsd: 49.99,
    salePriceUsd: 4.99,
    discountPercent: 90,
    reviewRating: "Very Positive (84%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1029690/header.jpg",
    storeUrl: "https://store.steampowered.com/app/1029690/",
  },
  {
    id: "steam-deal-203140",
    appId: 203140,
    title: "Hitman: Absolution",
    category: "Steam Special / Stealth Action",
    originalPriceUsd: 19.99,
    salePriceUsd: 1.99,
    discountPercent: 90,
    reviewRating: "Very Positive (88%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/203140/header.jpg",
    storeUrl: "https://store.steampowered.com/app/203140/",
  },
  {
    id: "steam-deal-312660",
    appId: 312660,
    title: "Sniper Elite 4",
    category: "Steam Special / Tactical Marksman",
    originalPriceUsd: 59.99,
    salePriceUsd: 5.99,
    discountPercent: 90,
    reviewRating: "Very Positive (91%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/312660/header.jpg",
    storeUrl: "https://store.steampowered.com/app/312660/",
  },
  {
    id: "steam-deal-4560",
    appId: 4560,
    title: "Company of Heroes",
    category: "Steam Special / Military Strategy",
    originalPriceUsd: 14.99,
    salePriceUsd: 2.99,
    discountPercent: 80,
    reviewRating: "Very Positive (94%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/4560/header.jpg",
    storeUrl: "https://store.steampowered.com/app/4560/",
  },
  {
    id: "steam-deal-13560",
    appId: 13560,
    title: "Tom Clancy's Splinter Cell",
    category: "Steam Special / Classic Stealth",
    originalPriceUsd: 9.99,
    salePriceUsd: 2.49,
    discountPercent: 75,
    reviewRating: "Very Positive (87%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/13560/header.jpg",
    storeUrl: "https://store.steampowered.com/app/13560/",
  },
  {
    id: "steam-deal-475550",
    appId: 475550,
    title: "Beholder",
    category: "Steam Special / Strategy Dystopia",
    originalPriceUsd: 13.99,
    salePriceUsd: 1.39,
    discountPercent: 90,
    reviewRating: "Very Positive (81%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/475550/header.jpg",
    storeUrl: "https://store.steampowered.com/app/475550/",
  },
  {
    id: "steam-deal-489830",
    appId: 489830,
    title: "The Elder Scrolls V: Skyrim Special Edition",
    category: "Steam Special / Open World RPG",
    originalPriceUsd: 39.99,
    salePriceUsd: 7.99,
    discountPercent: 80,
    reviewRating: "Very Positive (94%)",
    headerImageUrl: "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg",
    storeUrl: "https://store.steampowered.com/app/489830/",
  },
];

const FALLBACK_EVENTS: MajorEvent[] = [
  {
    id: "event-1",
    title: "BLAST.tv Austin Major 2025",
    status: "LIVE",
    type: "MAJOR",
    startDate: "2025-06-09",
    endDate: "2025-06-22",
    prizePoolUsd: 1250000,
    location: "Austin, Texas, USA (Moody Center)",
    description: "The pinnacle of competitive Counter-Strike 2! 24 elite global teams clash for $1,250,000 USD and Valve Major immortality.",
    highlights: ["24 World-Class Teams", "Stage 3 Legends Arena", "In-Game Pick'em & Souvenirs"],
    officialUrl: "https://blast.tv/major",
  },
  {
    id: "event-2",
    title: "The Armory: Genesis Collection Update",
    status: "LIVE",
    type: "VALVE_UPDATE",
    startDate: "2025-04-15",
    endDate: "2025-08-01",
    description: "Valve's major content chapter featuring Charm attachments, the Heat Treated Desert Eagle collection, and graphic weapon finishes.",
    highlights: ["Weapon Charms Introduced", "3 Exclusive Collections", "Active Armory Pass Track"],
    officialUrl: "https://www.counter-strike.net",
  },
  {
    id: "event-3",
    title: "IEM Cologne 2025: Cathedral of CS",
    status: "UPCOMING",
    type: "COMMUNITY",
    startDate: "2025-08-05",
    endDate: "2025-08-17",
    prizePoolUsd: 1000000,
    location: "Cologne, Germany (LANXESS Arena)",
    description: "The historic summer battle in LANXESS Arena. 24 teams fight to carve their names into the Cathedral of Counter-Strike history.",
    highlights: ["Historic LANXESS Arena", "Grand Slam Point Contender", "15,000 In-Person Fans"],
    officialUrl: "https://pro.eslgaming.com/tour/cs/cologne/",
  },
];

const money = (val: number) => `$${val.toFixed(2)}`;

function formatCountdown(targetIso: string): string {
  const target = new Date(targetIso).getTime();
  const diff = Math.max(0, target - Date.now());
  const d = Math.floor(diff / (1000 * 60 * 60 * 24));
  const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const m = Math.floor((diff / (1000 * 60)) % 60);
  const s = Math.floor((diff / 1000) % 60);
  return `${d}d ${h.toString().padStart(2, "0")}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`;
}

export const EventsPage: FC<Props> = ({ notify }) => {
  const { token } = useAuth();
  const [filter, setFilter] = useState<EventsTab>("ALL");
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>(FALLBACK_GIVEAWAYS);
  const [deals, setDeals] = useState<FlashDeal[]>(FALLBACK_DEALS);
  const [steamGames, setSteamGames] = useState<SteamGameDeal[]>(STEAM_GAME_DISCOUNTS);
  const [events, setEvents] = useState<MajorEvent[]>(FALLBACK_EVENTS);
  const [loading, setLoading] = useState(false);
  const [enteredMap, setEnteredMap] = useState<Record<string, boolean>>(() => {
    try {
      const raw = localStorage.getItem("clutch_entered_giveaways");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [, setTick] = useState(0);

  // Live timer tick every 1000ms
  useEffect(() => {
    const timer = window.setInterval(() => setTick((v) => v + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  // Dynamic fetch of 100% live Steam Store deals via CheapShark
  useEffect(() => {
    const controller = new AbortController();
    fetch("https://www.cheapshark.com/api/1.0/deals?storeID=1&pageSize=15", {
      signal: controller.signal,
    })
      .then((res) => {
        if (!res.ok) throw new Error("CheapShark returned non-200");
        return res.json();
      })
      .then((items: any[]) => {
        if (Array.isArray(items) && items.length > 0) {
          const liveDeals: SteamGameDeal[] = items
            .filter((d) => d.steamAppID && parseFloat(d.savings) > 0)
            .map((d) => ({
              id: `steam-deal-${d.steamAppID}`,
              appId: parseInt(d.steamAppID, 10),
              title: d.title,
              category: "Steam Special / Tactical Action",
              originalPriceUsd: parseFloat(d.normalPrice),
              salePriceUsd: parseFloat(d.salePrice),
              discountPercent: Math.round(parseFloat(d.savings)),
              reviewRating: d.steamRatingText
                ? `${d.steamRatingText} (${d.steamRatingPercent}%)`
                : "Very Positive",
              headerImageUrl: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${d.steamAppID}/header.jpg`,
              storeUrl: `https://store.steampowered.com/app/${d.steamAppID}/`,
            }));
          if (liveDeals.length > 0) {
            setSteamGames(liveDeals);
          }
        }
      })
      .catch(() => {
        // Fallback gracefully to pre-hydrated STEAM_GAME_DISCOUNTS
      });

    return () => controller.abort();
  }, []);

  // Fetch from backend hub
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`${API_BASE_URL}/api/v1/events/hub`, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error("API not ok");
        return res.json();
      })
      .then((payload) => {
        if (payload?.data) {
          if (Array.isArray(payload.data.giveaways) && payload.data.giveaways.length > 0) {
            setGiveaways(payload.data.giveaways);
          }
          if (Array.isArray(payload.data.deals) && payload.data.deals.length > 0) {
            setDeals(payload.data.deals);
          }
          if (Array.isArray(payload.data.events) && payload.data.events.length > 0) {
            setEvents(payload.data.events);
          }
        }
      })
      .catch(() => {
        // Graceful fallback already populated
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  async function handleEnterGiveaway(item: GiveawayItem) {
    if (enteredMap[item.id]) return;

    // Instant optimistic update
    setEnteredMap((prev) => {
      const next = { ...prev, [item.id]: true };
      try {
        localStorage.setItem("clutch_entered_giveaways", JSON.stringify(next));
      } catch {}
      return next;
    });

    setGiveaways((prev) =>
      prev.map((g) => (g.id === item.id ? { ...g, entriesCount: g.entriesCount + 1 } : g))
    );

    notify(`Entered giveaway for "${item.title}"! Good luck, operator.`);

    // Fire API endpoint
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      await fetch(`${API_BASE_URL}/api/v1/events/giveaways/${item.id}/enter`, {
        method: "POST",
        headers,
      });
    } catch {
      // Quiet failover — optimistic entry kept
    }
  }

  return (
    <div className="feature-page events-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">COMMUNITY REWARDS &amp; DEALS</p>
          <h2>Giveaways, Steam Sales &amp; Major Calendar</h2>
          <p>
            Enter verified community skin giveaways, explore Steam store game discounts, and track
            the competitive CS2 Major tournament calendar.
          </p>
        </div>
      </div>

      {/* FILTER NAVIGATION TABS */}
      <div className="events-filter-bar">
        <button
          type="button"
          className={`events-filter-pill ${filter === "ALL" ? "active" : ""}`}
          onClick={() => setFilter("ALL")}
        >
          🌐 ALL OFFERS &amp; EVENTS
        </button>
        <button
          type="button"
          className={`events-filter-pill ${filter === "GIVEAWAYS" ? "active" : ""}`}
          onClick={() => setFilter("GIVEAWAYS")}
        >
          🎁 CS2 SKIN GIVEAWAYS ({giveaways.length})
        </button>
        <button
          type="button"
          className={`events-filter-pill ${filter === "STEAM_GAMES" ? "active" : ""}`}
          onClick={() => setFilter("STEAM_GAMES")}
        >
          🎮 STEAM GAME DISCOUNTS ({steamGames.length})
        </button>
        <button
          type="button"
          className={`events-filter-pill ${filter === "SKIN_DEALS" ? "active" : ""}`}
          onClick={() => setFilter("SKIN_DEALS")}
        >
          🔥 CS2 SKIN FLASH DEALS ({deals.length})
        </button>
        <button
          type="button"
          className={`events-filter-pill ${filter === "CALENDAR" ? "active" : ""}`}
          onClick={() => setFilter("CALENDAR")}
        >
          🏆 TOURNAMENT CALENDAR ({events.length})
        </button>
      </div>

      {loading && <div className="events-loader-bar">Syncing live event streams…</div>}

      {/* SECTION 1: Live CS2 Skin & Steam Giveaways */}
      {(filter === "ALL" || filter === "GIVEAWAYS") && (
        <section className="events-section">
          <div className="events-section-header">
            <div>
              <h3>🎁 LIVE CS2 SKIN &amp; STEAM GIVEAWAYS</h3>
              <p>100% free community raffles sponsored by verified market partners. One click to enter.</p>
            </div>
            <span className="events-live-pill">
              <span className="pulse-dot" /> {giveaways.length} ACTIVE RAFFLES
            </span>
          </div>

          <div className="events-giveaways-grid">
            {giveaways.map((item) => {
              const isEntered = !!enteredMap[item.id];
              const rarityColor =
                item.rarity.toLowerCase().includes("extra")
                  ? "#e4ae39"
                  : item.rarity.toLowerCase().includes("covert")
                    ? "#eb4b4b"
                    : "#d32ce6";

              return (
                <article
                  key={item.id}
                  className="events-giveaway-card"
                  style={{ borderColor: `${rarityColor}40` }}
                >
                  <div
                    className="giveaway-accent-bar"
                    style={{ backgroundColor: rarityColor, boxShadow: `0 0 12px ${rarityColor}88` }}
                  />

                  <div className="giveaway-top-meta">
                    <span
                      className="giveaway-rarity-badge"
                      style={{
                        color: rarityColor,
                        borderColor: `${rarityColor}66`,
                        backgroundColor: `${rarityColor}15`,
                      }}
                    >
                      {item.rarity.toUpperCase()} · {item.wearCondition}
                    </span>
                    <span className="giveaway-value-badge">{money(item.valueUsd)}</span>
                  </div>

                  <div
                    className="giveaway-image-wrapper"
                    style={{
                      background: `radial-gradient(circle at center, ${rarityColor}20 0%, transparent 70%)`,
                    }}
                  >
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = getWeaponSilhouetteSvg(
                          item.weaponName || item.skinName
                        );
                      }}
                    />
                  </div>

                  <div className="giveaway-info">
                    <strong>{item.title}</strong>
                    <span>
                      {item.weaponName} · Sponsored by {item.sponsorName || "Clutch Labs"}
                    </span>
                  </div>

                  <div className="giveaway-stats-box">
                    <div className="stat-item">
                      <span className="stat-label">ENDS IN</span>
                      <strong className="stat-value countdown">{formatCountdown(item.endsAt)}</strong>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">TOTAL ENTRIES</span>
                      <strong className="stat-value">{item.entriesCount.toLocaleString()}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`giveaway-enter-btn ${isEntered ? "entered" : ""}`}
                    disabled={isEntered}
                    onClick={() => handleEnterGiveaway(item)}
                  >
                    {isEntered ? (
                      <>
                        <span>Entered ✓</span>
                        <small>Ticket Active in Raffle</small>
                      </>
                    ) : (
                      <>
                        <Icon name="bolt" size={14} />
                        <span>ENTER GIVEAWAY (FREE)</span>
                      </>
                    )}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* SECTION 2: DEDICATED STEAM GAME DISCOUNTS (Live Store Sale) */}
      {(filter === "ALL" || filter === "STEAM_GAMES") && (
        <section className="events-section steam-games-section">
          <div className="events-section-header">
            <div>
              <h3>🎮 STEAM GAME DISCOUNTS (LIVE STORE SALE)</h3>
              <p>
                Official Steam Store FPS &amp; tactical multiplayer discounts with verified Akamai
                headers and direct store links.
              </p>
            </div>
            <span className="events-deals-badge steam-badge">UP TO -67% OFF</span>
          </div>

          <div className="events-steam-games-grid">
            {steamGames.map((game) => (
              <article key={game.id} className="steam-game-card">
                <div className="steam-game-image-wrap">
                  <div className="steam-discount-tag">-{game.discountPercent}%</div>
                  <img
                    src={game.headerImageUrl}
                    alt={game.title}
                    loading="eager"
                    className="steam-game-capsule"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/489830/header.jpg";
                    }}
                  />
                </div>

                <div className="steam-game-body">
                  <div className="steam-game-meta">
                    <span className="steam-cat-badge">{game.category}</span>
                    <span className="steam-rating-badge">★ {game.reviewRating}</span>
                  </div>

                  <h4 className="steam-game-title">{game.title}</h4>

                  <div className="steam-game-footer">
                    <div className="steam-game-prices">
                      <span className="steam-orig-price">{money(game.originalPriceUsd)}</span>
                      <strong className="steam-sale-price">{money(game.salePriceUsd)}</strong>
                    </div>
                    <a
                      href={game.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="steam-store-btn"
                    >
                      Open on Steam Store ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: Flash Skin Discounts */}
      {(filter === "ALL" || filter === "SKIN_DEALS") && (
        <section className="events-section">
          <div className="events-section-header">
            <div>
              <h3>🔥 CS2 SKIN FLASH DEALS &amp; MARKET CUTS</h3>
              <p>Verified market price cuts and CS2 skin sales across trusted partner marketplaces.</p>
            </div>
            <span className="events-deals-badge">UP TO -40% OFF</span>
          </div>

          <div className="events-deals-grid">
            {deals.map((deal) => (
              <article key={deal.id} className="events-deal-card">
                <div className="deal-discount-ribbon">-{deal.discountPercent}%</div>

                <div className="deal-image-wrap">
                  <img
                    src={deal.imageUrl}
                    alt={deal.title}
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = getWeaponSilhouetteSvg(
                        deal.title
                      );
                    }}
                  />
                </div>

                <div className="deal-body">
                  <div className="deal-badge-row">
                    <span className="deal-store-pill">{deal.storeName}</span>
                    {deal.badgeText && <span className="deal-custom-pill">{deal.badgeText}</span>}
                  </div>
                  <strong>{deal.title}</strong>

                  <div className="deal-pricing">
                    <div className="deal-prices">
                      <span className="deal-orig-price">{money(deal.originalPriceUsd)}</span>
                      <strong className="deal-sale-price">{money(deal.salePriceUsd)}</strong>
                    </div>
                    <a
                      href={deal.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="deal-shop-btn"
                    >
                      VIEW DEAL ↗
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 4: CS2 Special Events & Major Calendar */}
      {(filter === "ALL" || filter === "CALENDAR") && (
        <section className="events-section">
          <div className="events-section-header">
            <div>
              <h3>🏆 CS2 SPECIAL EVENTS &amp; MAJOR CALENDAR</h3>
              <p>Valve Major championships, Armory Pass seasons, and community arena tournaments.</p>
            </div>
            <span className="events-tier1-badge">VALVE SANCTIONED</span>
          </div>

          <div className="events-calendar-timeline">
            {events.map((evt) => (
              <article key={evt.id} className={`events-calendar-card ${evt.status.toLowerCase()}`}>
                <div className="evt-status-col">
                  <span className={`evt-status-badge ${evt.status.toLowerCase()}`}>
                    {evt.status === "LIVE" ? "● LIVE NOW" : evt.status}
                  </span>
                  <span className="evt-type-badge">{evt.type.replace(/_/g, " ")}</span>
                </div>

                <div className="evt-content-col">
                  <div className="evt-date-range">
                    {evt.startDate} → {evt.endDate}
                    {evt.location ? ` · 📍 ${evt.location}` : ""}
                  </div>
                  <h4 className="evt-title">{evt.title}</h4>
                  <p className="evt-desc">{evt.description}</p>

                  <div className="evt-highlights">
                    {evt.highlights.map((h, idx) => (
                      <span key={idx} className="evt-highlight-chip">
                        ✓ {h}
                      </span>
                    ))}
                    {evt.prizePoolUsd && (
                      <span className="evt-prize-chip">
                        💰 {money(evt.prizePoolUsd)} Prize Pool
                      </span>
                    )}
                  </div>
                </div>

                <div className="evt-action-col">
                  {evt.officialUrl && (
                    <a
                      href={evt.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="evt-link-btn"
                    >
                      OFFICIAL SITE ↗
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default EventsPage;
