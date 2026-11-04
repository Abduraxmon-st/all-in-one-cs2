import { useEffect, useState, type FC } from "react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../features/identity/AuthProvider";
import Icon from "../components/Icon";
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

const FALLBACK_GIVEAWAYS: GiveawayItem[] = [
  {
    id: "giveaway-1",
    title: "★ Butterfly Knife | Fade",
    skinName: "Fade",
    weaponName: "★ Butterfly Knife",
    wearCondition: "Factory New",
    rarity: "Covert",
    valueUsd: 3450.0,
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/weapon_knife_butterfly_am_fade.png",
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
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/weapon_ak47_cu_fireserpent_ak47_bravo.png",
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
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/weapon_awp_gs_awp_desert_hydra.png",
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
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/slick_gloves_slick_vice.png",
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
    imageUrl: "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXX7gNPRV454wtRRFzVTej24eDYVkZ4LRFpv7y3LgJh3vn3cTB94M63l4XdwvWhY7-JkzME7pwpjLiUpY2hjAW3qUtrNW3xcoWcIwc6YguD8VPqku_n0MW8vcmamnZq6XUi53zcnEa-1RtLauZxxavJ4L0w7V4/360fx360f",
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
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/weapon_m4a1_silencer_cu_m4a1_s_printstream.png",
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
    imageUrl: "https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/images/skins/weapon_deagle_cu_deag_oceandrive.png",
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
  const [giveaways, setGiveaways] = useState<GiveawayItem[]>(FALLBACK_GIVEAWAYS);
  const [deals, setDeals] = useState<FlashDeal[]>(FALLBACK_DEALS);
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
          <h2>Giveaways, Deals &amp; Major Calendar</h2>
          <p>
            Enter verified community skin giveaways, explore flash steam discounts, and track the
            live competitive CS2 Major tournament calendar.
          </p>
        </div>
      </div>

      {loading && <div className="events-loader-bar">Syncing live event streams…</div>}

      {/* SECTION 1: Live CS2 Skin & Steam Giveaways */}
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
                  <img src={item.imageUrl} alt={item.title} loading="lazy" />
                </div>

                <div className="giveaway-info">
                  <strong>{item.title}</strong>
                  <span>{item.weaponName} · Sponsored by {item.sponsorName || "Clutch Labs"}</span>
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

      {/* SECTION 2: Flash Discounts */}
      <section className="events-section">
        <div className="events-section-header">
          <div>
            <h3>🔥 FLASH DISCOUNTS &amp; STEAM DEALS</h3>
            <p>Verified market price cuts and Steam FPS community sales.</p>
          </div>
          <span className="events-deals-badge">UP TO -66% OFF</span>
        </div>

        <div className="events-deals-grid">
          {deals.map((deal) => (
            <article key={deal.id} className="events-deal-card">
              <div className="deal-discount-ribbon">-{deal.discountPercent}%</div>

              <div className="deal-image-wrap">
                <img src={deal.imageUrl} alt={deal.title} loading="lazy" />
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

      {/* SECTION 3: CS2 Special Events & Major Calendar */}
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
    </div>
  );
};

export default EventsPage;
