import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "../features/identity/AuthProvider"
import { navigate } from "../routes"
import {
  createCommunityLoadout,
  deleteCommunityLoadout,
  generateLoadout,
  getCommunity,
  getCommunityDetail,
  getSkin,
  getSticker,
  getSkins,
  getStickers,
  toggleUpvote,
} from "../features/loadouts/api"
import {
  COLORS,
  SKIN_CLASSES,
  type Category,
  type Color,
  type CommunityDetail,
  type CommunityLoadout,
  type GeneratedItem,
  type GeneratedLoadout,
  type Page,
  type Skin,
  type SkinClassValue,
  type Sticker,
  type StickerPlacement,
  type TeamSide,
  type Wear,
} from "../features/loadouts/types"
import { fallbackCatalog, type CatalogItem } from "../features/loadouts/fallbackCatalog"
import "./LoadoutPage.css"

type Props = {
  budget: number
  setBudget: (value: number) => void
  notify: (message: string) => void
}
type Tab = "builder" | "catalog" | "community"
type CatalogKind = "skins" | "stickers"
type SideFilter = "ALL" | "CT" | "T"
type EquipmentColumn = "PISTOLS" | "SMGS & HEAVY" | "RIFLES" | "KNIVES & GLOVES"

interface PictureProps {
  url: string | null
  label: string
}
const money = (value: number) => `$${value.toFixed(2)}`

function safeImage(url: string | null): string | undefined {
  if (!url) return undefined
  try {
    const parsed = new URL(url)
    return ["http:", "https:"].includes(parsed.protocol)
      ? parsed.href
      : undefined
  } catch {
    return undefined
  }
}

function Picture({ url, label }: PictureProps) {
  const src = safeImage(url)
  return src ? (
    <img src={src} alt={label} loading="lazy" />
  ) : (
    <div className="lo-image-empty">NO PREVIEW</div>
  )
}

function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number
  totalPages: number
  onChange: (page: number) => void
}) {
  if (totalPages < 2) return null
  return (
    <div className="lo-pager">
      <button disabled={page <= 0} onClick={() => onChange(page - 1)}>
        ← Previous
      </button>
      <span>
        Page {page + 1} / {totalPages}
      </span>
      <button
        disabled={page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  )
}

// 4-Column Equipment Classifier
function getEquipmentColumn(item: GeneratedItem): EquipmentColumn {
  const slot = (item.slot || "").toUpperCase()
  const weaponId = (item.weaponId || "").toLowerCase()
  const weaponName = (item.weaponName || "").toLowerCase()

  if (
    slot === "KNIFE" ||
    slot === "GLOVES" ||
    weaponName.includes("knife") ||
    weaponName.includes("bayonet") ||
    weaponName.includes("karambit") ||
    weaponName.includes("daggers") ||
    weaponName.includes("gloves") ||
    weaponName.includes("hand wraps")
  ) {
    return "KNIVES & GLOVES"
  }

  if (
    slot.includes("PISTOL") ||
    slot.includes("DEAGLE") ||
    weaponId.includes("glock") ||
    weaponId.includes("usp") ||
    weaponId.includes("deagle") ||
    weaponId.includes("p250") ||
    weaponId.includes("fiveseven") ||
    weaponId.includes("tec9") ||
    weaponId.includes("revolver") ||
    weaponId.includes("cz75") ||
    weaponId.includes("elite") ||
    weaponName.includes("glock") ||
    weaponName.includes("usp") ||
    weaponName.includes("desert eagle") ||
    weaponName.includes("p250") ||
    weaponName.includes("five-seven") ||
    weaponName.includes("tec-9") ||
    weaponName.includes("dual berettas")
  ) {
    return "PISTOLS"
  }

  if (
    slot.includes("SMG") ||
    weaponId.includes("mp9") ||
    weaponId.includes("mac10") ||
    weaponId.includes("ump") ||
    weaponId.includes("mp7") ||
    weaponId.includes("mp5") ||
    weaponId.includes("p90") ||
    weaponId.includes("bizon") ||
    weaponId.includes("nova") ||
    weaponId.includes("xm1014") ||
    weaponId.includes("mag7") ||
    weaponId.includes("sawedoff") ||
    weaponId.includes("m249") ||
    weaponId.includes("negev") ||
    weaponName.includes("mp9") ||
    weaponName.includes("mac-10") ||
    weaponName.includes("ump-45") ||
    weaponName.includes("mp7") ||
    weaponName.includes("p90") ||
    weaponName.includes("nova") ||
    weaponName.includes("xm1014") ||
    weaponName.includes("negev")
  ) {
    return "SMGS & HEAVY"
  }

  return "RIFLES"
}

// Side Classifier: CT vs T vs BOTH
function getItemTeamSide(item: GeneratedItem): "CT" | "T" | "BOTH" {
  const slot = (item.slot || "").toUpperCase()
  const weaponId = (item.weaponId || "").toLowerCase()

  if (
    slot.startsWith("CT_") ||
    weaponId.includes("m4a1") ||
    weaponId.includes("m4a4") ||
    weaponId.includes("usp") ||
    weaponId.includes("mp9") ||
    weaponId.includes("fiveseven") ||
    weaponId.includes("famas")
  ) {
    return "CT"
  }
  if (
    slot.startsWith("T_") ||
    weaponId.includes("ak47") ||
    weaponId.includes("glock") ||
    weaponId.includes("mac10") ||
    weaponId.includes("galil") ||
    weaponId.includes("tec9")
  ) {
    return "T"
  }
  return "BOTH"
}

function matchesSide(item: GeneratedItem, filter: SideFilter): boolean {
  if (filter === "ALL") return true
  const side = getItemTeamSide(item)
  return side === "BOTH" || side === filter
}

// Rarity Palette & Utilities
const RARITY_PALETTE: Record<string, { color: string; label: string }> = {
  Covert: { color: "#eb4b4b", label: "Covert" },
  Classified: { color: "#d32ce6", label: "Classified" },
  Restricted: { color: "#8847ff", label: "Restricted" },
  "Mil-Spec": { color: "#4b69ff", label: "Mil-Spec" },
  "Mil-Spec Grade": { color: "#4b69ff", label: "Mil-Spec" },
  "Industrial Grade": { color: "#5e98d9", label: "Industrial" },
  "Consumer Grade": { color: "#b0c3d9", label: "Consumer" },
  Extraordinary: { color: "#e4ae39", label: "Extraordinary" },
  Contraband: { color: "#e4ae39", label: "Contraband" },
}

function getRarityColor(rarity?: string, slot?: string): string {
  if (rarity && RARITY_PALETTE[rarity]) return RARITY_PALETTE[rarity].color
  if (rarity?.toLowerCase().includes("covert")) return "#eb4b4b"
  if (rarity?.toLowerCase().includes("classified")) return "#d32ce6"
  if (rarity?.toLowerCase().includes("restricted")) return "#8847ff"
  if (rarity?.toLowerCase().includes("mil")) return "#4b69ff"
  if (rarity?.toLowerCase().includes("extra") || rarity?.toLowerCase().includes("gold")) return "#e4ae39"
  if (slot === "KNIFE" || slot === "GLOVES") return "#e4ae39"
  if (slot === "T_RIFLE" || slot === "CT_RIFLE" || slot === "AWP") return "#eb4b4b"
  if (slot?.includes("SMG")) return "#8847ff"
  return "#4b69ff"
}

function getRarityLabel(rarity?: string, slot?: string): string {
  if (rarity && RARITY_PALETTE[rarity]) return RARITY_PALETTE[rarity].label
  if (rarity) return rarity
  if (slot === "KNIFE" || slot === "GLOVES") return "Extraordinary"
  if (slot === "T_RIFLE" || slot === "CT_RIFLE" || slot === "AWP") return "Covert"
  if (slot?.includes("SMG")) return "Restricted"
  return "Mil-Spec"
}

function getDefaultFloatForWear(wear: Wear): number {
  switch (wear) {
    case "FN":
      return 0.014285
    case "MW":
      return 0.089123
    case "FT":
      return 0.185204
    case "WW":
      return 0.41249
    case "BS":
      return 0.63412
    default:
      return 0.15
  }
}

function getDefaultPattern(slot: string): number {
  if (slot.includes("RIFLE")) return 661
  if (slot.includes("PISTOL") || slot.includes("DEAGLE")) return 387
  if (slot.includes("KNIFE")) return 412
  return 555
}

export const MEGA_CATEGORIES = [
  { label: "All Skins", kind: "skins" as const, category: "" },
  { label: "🔪 Knives", kind: "skins" as const, category: "KNIVES" },
  { label: "🧤 Gloves", kind: "skins" as const, category: "GLOVES" },
  { label: "🎯 Rifles", kind: "skins" as const, category: "RIFLES" },
  { label: "🔭 Sniper Rifles", kind: "skins" as const, category: "SNIPERS" },
  { label: "🔫 Pistols", kind: "skins" as const, category: "PISTOLS" },
  { label: "⚡ SMGs", kind: "skins" as const, category: "SMGS" },
  { label: "🛡️ Heavy", kind: "skins" as const, category: "HEAVY" },
  { label: "✨ Stickers", kind: "stickers" as const, category: "" },
] as const;

export const COLOR_SWATCHES = [
  { name: "Red", value: "RED", hex: "#ef4444" },
  { name: "Orange", value: "ORANGE", hex: "#f97316" },
  { name: "Yellow", value: "YELLOW", hex: "#eab308" },
  { name: "Gold", value: "GOLD", hex: "#e4ae39" },
  { name: "Green", value: "GREEN", hex: "#22c55e" },
  { name: "Blue", value: "BLUE", hex: "#3b82f6" },
  { name: "Cyan", value: "CYAN", hex: "#06b6d4" },
  { name: "Purple", value: "PURPLE", hex: "#a855f7" },
  { name: "Pink", value: "PINK", hex: "#ec4899" },
  { name: "Brown", value: "BROWN", hex: "#854d0e" },
  { name: "Black", value: "BLACK", hex: "#1e293b" },
  { name: "Gray", value: "GRAY", hex: "#64748b" },
  { name: "White", value: "WHITE", hex: "#f8fafc" },
] as const;

export function getFallbackPage(options: {
  category?: string;
  color?: string;
  side?: string;
  skinClass?: string;
  rarity?: string;
  maxPrice?: number;
  query?: string;
  page?: number;
  size?: number;
}): Page<Skin> {
  let list: Skin[] = [...fallbackCatalog];
  const q = (options.query || "").toLowerCase().trim();
  if (q) {
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.weaponName.toLowerCase().includes(q) ||
        (s.collectionName && s.collectionName.toLowerCase().includes(q))
    );
  }
  if (options.category) {
    if (options.category === "SNIPERS") {
      list = list.filter((s) => {
        const wn = s.weaponName.toLowerCase();
        return wn.includes("awp") || wn.includes("ssg") || wn.includes("scar") || wn.includes("g3sg1");
      });
    } else {
      list = list.filter((s) => s.category === options.category);
    }
  }
  if (options.color) {
    list = list.filter((s) => s.primaryColor === options.color);
  }
  if (options.side && options.side !== "BOTH") {
    list = list.filter((s) => !s.teamSide || s.teamSide === "BOTH" || s.teamSide === options.side);
  }
  if (options.skinClass && options.skinClass !== "ANY") {
    list = list.filter((s) => s.skinClass === options.skinClass);
  }
  if (options.rarity) {
    list = list.filter((s) => (s.rarity || "").toLowerCase() === options.rarity!.toLowerCase());
  }
  if (options.maxPrice && options.maxPrice > 0) {
    list = list.filter((s) => (s.lowestPriceUsd || 0) <= options.maxPrice!);
  }

  const page = options.page || 0;
  const size = options.size || 20;
  const totalElements = list.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = list.slice(start, start + size);

  return {
    content,
    totalElements,
    totalPages,
    pageable: {
      pageNumber: page,
      pageSize: size,
    },
  };
}

function getSkinCollection(skin: Skin): string {
  if (skin.collectionName) return skin.collectionName;
  const name = skin.name.toLowerCase();
  if (name.includes("asiimov")) return "📦 Phoenix Case";
  if (name.includes("printstream")) return "📦 Fracture Case";
  if (name.includes("redline")) return "📦 Winter Offensive Case";
  if (name.includes("dragon lore")) return "📦 Cobblestone Collection";
  if (name.includes("howl")) return "📦 Huntsman Case";
  if (name.includes("fire serpent")) return "📦 Operation Bravo Case";
  if (name.includes("fade")) return "📦 CS:GO Weapon Case";
  if (name.includes("doppler") || name.includes("marble fade") || name.includes("tiger tooth")) return "📦 Chroma Case";
  if (name.includes("gamma")) return "📦 Gamma Case";
  if (name.includes("hyper beast")) return "📦 Chroma 2 Case";
  if (name.includes("bloodsport") || name.includes("neo-noir") || name.includes("the empress")) return "📦 Spectrum Case";
  if (name.includes("inheritance") || name.includes("olympus") || name.includes("jawbreaker") || name.includes("chrome cannon")) return "📦 Kilowatt Case";
  if (name.includes("vulcan") || name.includes("kill confirmed")) return "📦 Huntsman & Shadow Cases";
  if (name.includes("overpass")) return "📦 Overpass 2024 Collection";
  if (name.includes("anubis")) return "📦 Anubis Collection";
  if (name.includes("inferno")) return "📦 Inferno 2024 Collection";
  if (name.includes("mirage")) return "📦 Mirage 2024 Collection";
  if (name.includes("nuke")) return "📦 Nuke 2024 Collection";
  if (name.includes("dust")) return "📦 Dust II 2024 Collection";
  if (skin.category === "KNIVES") return "📦 Dreams & Nightmares Case";
  if (skin.category === "GLOVES") return "📦 Revolution Case";
  if (skin.category === "RIFLES") return "📦 Kilowatt Case";
  if (skin.category === "PISTOLS") return "📦 Recoil Case";
  return "📦 Kilowatt Case";
}

function getSkinClassDisplay(skin: Skin): string {
  if (skin.skinClass && skin.skinClass !== "ANY") {
    return skin.skinClass.replace(/_/g, " ");
  }
  const rarity = getRarityLabel(skin.rarity);
  if (skin.category === "KNIVES") return `${rarity} Knife`;
  if (skin.category === "GLOVES") return `Extraordinary Gloves`;
  if (skin.category === "RIFLES") return `${rarity} Rifle`;
  if (skin.category === "PISTOLS") return `${rarity} Pistol`;
  if (skin.category === "SMGS") return `${rarity} SMG`;
  if (skin.category === "HEAVY") return `${rarity} Heavy`;
  return `${rarity} ${skin.weaponName}`;
}

export default function LoadoutPage({ budget, setBudget, notify }: Props) {
  const { token, user } = useAuth()
  const [tab, setTab] = useState<Tab>("builder")
  const [color, setColor] = useState<Color>("PURPLE")
  const [skinClass, setSkinClass] = useState<SkinClassValue>("ANY")
  const [ctRifle, setCtRifle] = useState("weapon_m4a1_silencer")
  const [includeKnife, setIncludeKnife] = useState(false)
  const [sideFilter, setSideFilter] = useState<SideFilter>("ALL")

  // csgoskins.gg Loadout Lab state
  const [cardSelectedWear, setCardSelectedWear] = useState<Record<string, Wear | undefined>>({});
  const [equippedCt, setEquippedCt] = useState<Skin[]>(() => {
    try {
      const raw = localStorage.getItem("clutch_equipped_ct");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [equippedT, setEquippedT] = useState<Skin[]>(() => {
    try {
      const raw = localStorage.getItem("clutch_equipped_t");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [showEquippedDrawer, setShowEquippedDrawer] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("clutch_equipped_ct", JSON.stringify(equippedCt));
    } catch {}
  }, [equippedCt]);

  useEffect(() => {
    try {
      localStorage.setItem("clutch_equipped_t", JSON.stringify(equippedT));
    } catch {}
  }, [equippedT]);

  function toggleEquipSkin(skin: Skin, side: "CT" | "T") {
    if (side === "CT") {
      setEquippedCt((current) => {
        const exists = current.some((s) => s.id === skin.id);
        if (exists) {
          notify(`Removed ${skin.name} from CT Loadout`);
          return current.filter((s) => s.id !== skin.id);
        }
        notify(`Equipped ${skin.name} to CT Loadout`);
        return [...current, skin];
      });
    } else {
      setEquippedT((current) => {
        const exists = current.some((s) => s.id === skin.id);
        if (exists) {
          notify(`Removed ${skin.name} from T Loadout`);
          return current.filter((s) => s.id !== skin.id);
        }
        notify(`Equipped ${skin.name} to T Loadout`);
        return [...current, skin];
      });
    }
  }

  const totalCtLoadoutValue = equippedCt.reduce((sum, s) => sum + (s.lowestPriceUsd || 0), 0);
  const totalTLoadoutValue = equippedT.reduce((sum, s) => sum + (s.lowestPriceUsd || 0), 0);

  const [generated, setGenerated] = useState<GeneratedLoadout | null>(null)
  const [generatorBusy, setGeneratorBusy] = useState(false)
  const [generatorError, setGeneratorError] = useState("")
  const [stickerOptions, setStickerOptions] = useState<Sticker[]>([])

  // CSFloat interactive custom crafts & floats
  const [crafts, setCrafts] = useState<Record<string, StickerPlacement[]>>({})
  const [activeSlot, setActiveSlot] = useState<Record<string, number>>({})
  const [openStickerDrawer, setOpenStickerDrawer] = useState<Record<string, boolean>>({})
  const [itemFloats, setItemFloats] = useState<Record<string, number>>({})
  const [itemPatterns, setItemPatterns] = useState<Record<string, number>>({})
  const [statTrakSlots, setStatTrakSlots] = useState<Record<string, boolean>>({})

  // Publishing
  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [publishing, setPublishing] = useState(false)

  // Catalog
  const [catalogKind, setCatalogKind] = useState<CatalogKind>("skins")
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [catalogColor, setCatalogColor] = useState<Color | "">("")
  const [catalogCategory, setCatalogCategory] = useState<Category | "SNIPERS" | "">("")
  const [catalogSide, setCatalogSide] = useState<TeamSide | "">("")
  const [catalogSkinClass, setCatalogSkinClass] = useState<string>("")
  const [catalogRarity, setCatalogRarity] = useState<string>("")
  const [catalogMaxPrice, setCatalogMaxPrice] = useState("")
  const [catalogPage, setCatalogPage] = useState(0)
  const [catalogData, setCatalogData] = useState<Page<Skin | Sticker>>(() =>
    getFallbackPage({ page: 0, size: 20 })
  )
  const [catalogBusy, setCatalogBusy] = useState(false)
  const [catalogError, setCatalogError] = useState("")
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)

  // Community
  const [communityColor, setCommunityColor] = useState<Color | "">("")
  const [communityBudget, setCommunityBudget] = useState("")
  const [communitySort, setCommunitySort] = useState<"popular" | "latest">("popular")
  const [communityPage, setCommunityPage] = useState(0)
  const [communityData, setCommunityData] = useState<Page<CommunityLoadout> | null>(null)
  const [communityBusy, setCommunityBusy] = useState(false)
  const [communityError, setCommunityError] = useState("")
  const [communityDetail, setCommunityDetail] = useState<CommunityDetail | null>(null)
  const [communityRevision, setCommunityRevision] = useState(0)

  // Fetch Catalog
  useEffect(() => {
    if (tab !== "catalog") return
    const controller = new AbortController()
    setCatalogBusy(true)
    setCatalogError("")

    // 0ms instant display from fallback catalog
    if (catalogKind === "skins") {
      const immediate = getFallbackPage({
        category: catalogCategory || undefined,
        color: catalogColor || undefined,
        side: catalogSide || undefined,
        skinClass: catalogSkinClass || undefined,
        rarity: catalogRarity || undefined,
        maxPrice: catalogMaxPrice ? Number(catalogMaxPrice) : undefined,
        query: catalogQuery || undefined,
        page: catalogPage,
        size: 20,
      });
      if (immediate.content.length > 0) {
        setCatalogData(immediate);
      }
    }

    const common = {
      color: catalogColor || undefined,
      maxPrice: catalogMaxPrice ? Number(catalogMaxPrice) : undefined,
      q: catalogQuery || undefined,
      page: catalogPage,
      size: 20,
    }
    const backendCategory = catalogCategory === "SNIPERS" ? "RIFLES" : (catalogCategory || undefined);
    const call =
      catalogKind === "skins"
        ? getSkins(
            {
              ...common,
              category: backendCategory as Category | undefined,
              teamSide: catalogSide || undefined,
              skinClass: catalogSkinClass || undefined,
              rarity: catalogRarity || undefined,
            },
            controller.signal,
          )
        : getStickers(common, controller.signal)
    call
      .then((data) => {
        if (!controller.signal.aborted && data && data.content && data.content.length > 0) {
          setCatalogData(data);
        }
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          console.warn("Backend catalog sync notice:", cause);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCatalogBusy(false)
      })
    return () => controller.abort()
  }, [
    tab,
    catalogKind,
    catalogColor,
    catalogCategory,
    catalogSide,
    catalogSkinClass,
    catalogRarity,
    catalogMaxPrice,
    catalogQuery,
    catalogPage,
  ])

  // Fetch Community
  useEffect(() => {
    if (tab !== "community") return
    const controller = new AbortController()
    setCommunityBusy(true)
    setCommunityError("")
    getCommunity(
      {
        color: communityColor || undefined,
        maxBudget: communityBudget ? Number(communityBudget) : undefined,
        sortBy: communitySort,
        page: communityPage,
        size: 20,
      },
      token || undefined,
      controller.signal,
    )
      .then(setCommunityData)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setCommunityError(
            cause instanceof Error
              ? cause.message
              : "Could not load community feed",
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setCommunityBusy(false)
      })
    return () => controller.abort()
  }, [
    tab,
    communityColor,
    communityBudget,
    communitySort,
    communityPage,
    token,
    communityRevision,
  ])

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!Number.isFinite(budget) || budget <= 0) {
      setGeneratorError("Enter a valid budget.")
      return
    }
    setGeneratorBusy(true)
    setGeneratorError("")
    try {
      const result = await generateLoadout({
        budgetUsd: budget,
        themeColor: color,
        preferredCtRifle: ctRifle,
        includeKnifeAndGloves: includeKnife,
        skinClass: skinClass !== "ANY" ? skinClass : undefined,
      })
      setGenerated(result)
      setCrafts({})
      setItemFloats({})
      setItemPatterns({})
      setStatTrakSlots({})
      setOpenStickerDrawer({})
      setTitle(`${color[0]}${color.slice(1).toLowerCase()} CSFloat Loadout`)
      getStickers({ color, page: 0, size: 50 })
        .then((data) => setStickerOptions(data.content))
        .catch(() => setStickerOptions([]))
    } catch (cause) {
      setGeneratorError(
        cause instanceof Error ? cause.message : "Could not generate loadout",
      )
    } finally {
      setGeneratorBusy(false)
    }
  }

  function setSlotSticker(weaponSlot: string, slotIndex: number, stickerId: string) {
    setCrafts((current) => {
      const existing = current[weaponSlot] ?? []
      if (!stickerId) {
        return {
          ...current,
          [weaponSlot]: existing.filter((p) => p.slotIndex !== slotIndex),
        }
      }
      const filtered = existing.filter((p) => p.slotIndex !== slotIndex)
      const placement: StickerPlacement = {
        stickerId,
        slotIndex,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        scale: 1,
        wear: 0,
      }
      return {
        ...current,
        [weaponSlot]: [...filtered, placement].sort((a, b) => a.slotIndex - b.slotIndex),
      }
    })
  }

  function updateSlotPlacement(
    weaponSlot: string,
    slotIndex: number,
    patch: Partial<StickerPlacement>,
  ) {
    setCrafts((current) => {
      const existing = current[weaponSlot] ?? []
      return {
        ...current,
        [weaponSlot]: existing.map((p) =>
          p.slotIndex === slotIndex ? { ...p, ...patch } : p,
        ),
      }
    })
  }

  function applyStickerToAllSlots(weaponSlot: string, stickerId: string) {
    if (!stickerId) return
    setCrafts((current) => {
      const allFive: StickerPlacement[] = [0, 1, 2, 3, 4].map((i) => ({
        stickerId,
        slotIndex: i,
        offsetX: 0,
        offsetY: 0,
        rotation: 0,
        scale: 1,
        wear: 0,
      }))
      return { ...current, [weaponSlot]: allFive }
    })
  }

  function clearAllStickers(weaponSlot: string) {
    setCrafts((current) => {
      const next = { ...current }
      delete next[weaponSlot]
      return next
    })
  }

  async function handlePublish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!generated) return
    if (!token) {
      setGeneratorError("Sign in to save this loadout.")
      return
    }
    setPublishing(true)
    setGeneratorError("")
    try {
      const saved = await createCommunityLoadout(
        {
          title: title.trim(),
          themeColor: generated.themeColor,
          budgetLimitUsd: generated.budgetLimitUsd,
          isPublic,
          items: generated.items.map((item) => ({
            weaponSlot: item.slot,
            skinId: item.skinId,
            wearCondition: item.wearCondition,
            stickers: (crafts[item.slot] ?? []).sort((a, b) => a.slotIndex - b.slotIndex),
          })),
        },
        token,
      )
      setCommunityDetail(saved)
      setCommunityRevision((value) => value + 1)
      setTab("community")
      notify("Loadout saved to community")
    } catch (cause) {
      setGeneratorError(
        cause instanceof Error ? cause.message : "Could not save loadout",
      )
    } finally {
      setPublishing(false)
    }
  }

  async function openSkin(id: string) {
    try {
      setSelectedSkin(await getSkin(id))
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not load skin")
    }
  }

  async function openSticker(id: string) {
    try {
      setSelectedSticker(await getSticker(id))
    } catch (cause) {
      notify(cause instanceof Error ? cause.message : "Could not load sticker")
    }
  }

  async function openCommunity(id: string) {
    try {
      setCommunityDetail(await getCommunityDetail(id, token || undefined))
    } catch (cause) {
      setCommunityError(
        cause instanceof Error ? cause.message : "Could not load loadout",
      )
    }
  }

  async function handleUpvote() {
    if (!communityDetail) return
    if (!token) {
      setCommunityError("Sign in to upvote.")
      return
    }
    try {
      const result = await toggleUpvote(communityDetail.id, token)
      setCommunityDetail({
        ...communityDetail,
        upvotes: result.upvotes,
        upvotedByCurrentUser: result.upvoted,
      })
      setCommunityRevision((value) => value + 1)
    } catch (cause) {
      setCommunityError(
        cause instanceof Error ? cause.message : "Could not update upvote",
      )
    }
  }

  async function handleDelete() {
    if (!communityDetail || !token || !window.confirm("Delete this loadout?"))
      return
    try {
      await deleteCommunityLoadout(communityDetail.id, token)
      setCommunityDetail(null)
      setCommunityRevision((value) => value + 1)
      notify("Loadout deleted")
    } catch (cause) {
      setCommunityError(
        cause instanceof Error ? cause.message : "Could not delete loadout",
      )
    }
  }

  // Filter items by side
  const displayedItems = (generated?.items ?? []).filter((item) => matchesSide(item, sideFilter))

  // Categorize items into 4 CSFloat columns
  const columnMatrix: Record<EquipmentColumn, GeneratedItem[]> = {
    PISTOLS: displayedItems.filter((item) => getEquipmentColumn(item) === "PISTOLS"),
    "SMGS & HEAVY": displayedItems.filter((item) => getEquipmentColumn(item) === "SMGS & HEAVY"),
    RIFLES: displayedItems.filter((item) => getEquipmentColumn(item) === "RIFLES"),
    "KNIVES & GLOVES": displayedItems.filter((item) => getEquipmentColumn(item) === "KNIVES & GLOVES"),
  }

  // Calculate dynamic sticker craft additions and market value
  const totalStickerCost = Object.values(crafts).reduce((sum, itemCrafts) => {
    return (
      sum +
      itemCrafts.reduce((slotSum, p) => {
        const st = stickerOptions.find((s) => s.id === p.stickerId)
        return slotSum + (st?.priceUsd ?? 0)
      }, 0)
    )
  }, 0)
  const totalMarketValue = (generated?.totalCostUsd ?? 0) + totalStickerCost

  return (
    <div className="feature-page lo-page csf-theme">
      {/* Page Header */}
      <div className="page-intro">
        <div>
          <p className="eyebrow">CSFLOAT DATABASE & LOADOUT LAB</p>
          <h2>Loadout lab & Equipment Matrix</h2>
          <p>
            Build, inspect, and fine-tune your color-synchronized CS2 inventory
            with authentic CSFloat wear floats, pattern seeds, and 5-slot sticker crafts.
          </p>
        </div>
      </div>

      <div className="lo-auth">
        <span>{user ? `OPERATOR: ${user.username}` : "GUEST MODE (SIGN IN FOR CLOUD SAVES)"}</span>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="lo-tabs" role="tablist" aria-label="Loadout sections">
        {(["builder", "catalog", "community"] as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item === "builder"
              ? "🎯 LOADOUT LAB & MATRIX"
              : item === "catalog"
                ? "📚 SKIN CATALOG"
                : "🌐 COMMUNITY BUILDS"}
          </button>
        ))}
      </div>

      {tab === "builder" && (
        <section className="csf-builder-layout">
          {/* Top Generator Control Bar */}
          <form className="csf-control-card" onSubmit={handleGenerate}>
            <div className="csf-form-grid">
              <label>
                <span>Budget (USD)</span>
                <input
                  type="number"
                  min="5"
                  max="100000"
                  step="0.01"
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  required
                />
              </label>

              <label>
                <span>Theme Color</span>
                <select
                  value={color}
                  onChange={(event) => setColor(event.target.value as Color)}
                >
                  {COLORS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Preferred CT Rifle</span>
                <select
                  value={ctRifle}
                  onChange={(event) => setCtRifle(event.target.value)}
                >
                  <option value="weapon_m4a1_silencer">M4A1-S (Silenced)</option>
                  <option value="weapon_m4a1">M4A4</option>
                </select>
              </label>

              <label>
                <span>Skin Class Filter</span>
                <select
                  value={skinClass}
                  onChange={(event) => setSkinClass(event.target.value as SkinClassValue)}
                >
                  {SKIN_CLASSES.map((sc) => (
                    <option key={sc.value} value={sc.value}>
                      {sc.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="csf-checkbox-label">
                <input
                  type="checkbox"
                  checked={includeKnife}
                  onChange={(event) => setIncludeKnife(event.target.checked)}
                />
                <span>Include Knife & Gloves</span>
              </label>

              <button className="csf-gen-btn" disabled={generatorBusy}>
                {generatorBusy ? "GENERATING LOADOUT…" : "⚡ GENERATE CSFLOAT MATRIX"}
              </button>
            </div>
          </form>

          {/* CSFloat Equipment Matrix View */}
          <div className="csf-matrix-container">
            {/* Top Bar with Side Filter Tabs, Value Badge, and Skin Class Selector */}
            <div className="csf-topbar">
              {/* Equipment Side Filter Tabs */}
              <div className="csf-side-tabs" role="tablist" aria-label="Equipment side filter">
                {(["ALL", "CT", "T"] as SideFilter[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={sideFilter === s}
                    className={`csf-side-tab ${sideFilter === s ? "active" : ""}`}
                    onClick={() => setSideFilter(s)}
                  >
                    {s === "ALL" ? "ALL EQUIPMENT" : s === "CT" ? "CT SIDE" : "T SIDE"}
                  </button>
                ))}
              </div>

              {/* Skin Class Quick Pills */}
              <div className="csf-class-pills">
                <span className="csf-class-label">CLASS:</span>
                {SKIN_CLASSES.slice(0, 5).map((sc) => (
                  <button
                    key={sc.value}
                    type="button"
                    className={`csf-class-chip ${skinClass === sc.value ? "active" : ""}`}
                    onClick={() => setSkinClass(sc.value)}
                  >
                    {"color" in sc && (
                      <span className="csf-dot" style={{ backgroundColor: sc.color }} />
                    )}
                    {sc.label}
                  </button>
                ))}
              </div>

              {/* Total Market Value & Item Count Badge */}
              <div className="csf-val-badge">
                <div className="csf-val-main">
                  <small>TOTAL LOADOUT MARKET VALUE</small>
                  <strong>{money(totalMarketValue)}</strong>
                </div>
                <div className="csf-val-meta">
                  <span className="csf-count-pill">
                    {displayedItems.length} {displayedItems.length === 1 ? "ITEM" : "ITEMS"}
                  </span>
                  {generated && (
                    <span className="csf-rem-pill">
                      REMAINING: {money(generated.remainingBudgetUsd)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {generatorError && (
              <p className="lo-error" role="alert">
                {generatorError}
              </p>
            )}

            {!generated ? (
              <div className="csf-empty-hero">
                <div className="csf-empty-icon">🛡️</div>
                <h3>CSFloat Equipment Matrix Ready</h3>
                <p>
                  Set your budget ceiling, color theme, and preferred weapon classes above,
                  then click <strong>Generate CSFloat Matrix</strong> to populate your 4-column loadout.
                </p>
              </div>
            ) : (
              <>
                {/* 4-Column CS2 Equipment Matrix */}
                <div className="csf-equipment-matrix">
                  {([
                    {
                      key: "PISTOLS",
                      title: "1. PISTOLS",
                      desc: "Glock-18 · USP-S · Desert Eagle · P250 · Five-SeveN",
                    },
                    {
                      key: "SMGS & HEAVY",
                      title: "2. SMGS & HEAVY",
                      desc: "MP9 · MAC-10 · UMP-45 · MP7 · P90 · Nova · XM1014",
                    },
                    {
                      key: "RIFLES",
                      title: "3. RIFLES",
                      desc: "AK-47 · M4A4 · M4A1-S · AWP · Galil AR · FAMAS",
                    },
                    {
                      key: "KNIVES & GLOVES",
                      title: "4. KNIVES & GLOVES",
                      desc: "Specialist & Rare Melee Equipment",
                    },
                  ] as const).map((col) => {
                    const items = columnMatrix[col.key]
                    return (
                      <div className="csf-column" key={col.key}>
                        <div className="csf-col-header">
                          <div className="csf-col-title-row">
                            <h4>{col.title}</h4>
                            <span className="csf-col-count">{items.length}</span>
                          </div>
                          <span className="csf-col-desc">{col.desc}</span>
                        </div>

                        <div className="csf-col-body">
                          {items.length === 0 ? (
                            <div className="csf-col-empty">
                              <span>No equipment in this category</span>
                              {col.key === "KNIVES & GLOVES" && !includeKnife && (
                                <small>Enable &quot;Include Knife & Gloves&quot; above to add luxury items.</small>
                              )}
                            </div>
                          ) : (
                            items.map((item) => {
                              const rarityColor = getRarityColor(item.rarity, item.slot)
                              const rarityLabel = getRarityLabel(item.rarity, item.slot)
                              const skinClassDisplay = item.skinClass
                                ? item.skinClass.replace(/_/g, " ")
                                : `${rarityLabel.toUpperCase()} ${getEquipmentColumn(item).replace(" & HEAVY", "").replace("S & GLOVES", "")}`

                              const curFloat =
                                itemFloats[item.slot] ?? getDefaultFloatForWear(item.wearCondition)
                              const curPattern =
                                itemPatterns[item.slot] ?? getDefaultPattern(item.slot)
                              const isStatTrak = !!statTrakSlots[item.slot]

                              const itemCrafts = crafts[item.slot] ?? []
                              const curSlotIdx = activeSlot[item.slot] ?? 0
                              const activePlacement = itemCrafts.find((p) => p.slotIndex === curSlotIdx)
                              const isDrawerOpen = !!openStickerDrawer[item.slot]

                              return (
                                <article
                                  className="csf-card"
                                  key={item.slot}
                                  style={{
                                    borderColor: `${rarityColor}40`,
                                  }}
                                >
                                  {/* Top Rarity Accent Bar & Subtle Glow */}
                                  <div
                                    className="csf-rarity-bar"
                                    style={{
                                      backgroundColor: rarityColor,
                                      boxShadow: `0 0 10px ${rarityColor}aa`,
                                    }}
                                  />

                                  {/* Card Top Pill Row */}
                                  <div className="csf-card-top-row">
                                    <span
                                      className="csf-rarity-pill"
                                      style={{
                                        borderColor: rarityColor,
                                        color: rarityColor,
                                      }}
                                    >
                                      <span
                                        className="csf-dot"
                                        style={{ backgroundColor: rarityColor }}
                                      />
                                      {skinClassDisplay}
                                    </span>

                                    {/* StatTrak™ Toggle Badge */}
                                    <button
                                      type="button"
                                      className={`csf-stattrak-badge ${isStatTrak ? "active" : ""}`}
                                      onClick={() =>
                                        setStatTrakSlots((prev) => ({
                                          ...prev,
                                          [item.slot]: !prev[item.slot],
                                        }))
                                      }
                                      title="Toggle StatTrak™"
                                    >
                                      ★ StatTrak™
                                    </button>
                                  </div>

                                  {/* Weapon Image with Subtle Ambient Glow */}
                                  <div
                                    className="csf-image-wrapper"
                                    style={{
                                      background: `radial-gradient(circle, ${rarityColor}15 0%, transparent 70%)`,
                                    }}
                                  >
                                    <Picture url={item.imageUrl} label={item.skinName} />
                                  </div>

                                  {/* Weapon Title & Slot */}
                                  <div className="csf-info-row">
                                    <div>
                                      <h5 className="csf-item-title">
                                        {isStatTrak && (
                                          <span className="csf-st-tag">StatTrak™ </span>
                                        )}
                                        {item.skinName}
                                      </h5>
                                      <span className="csf-slot-sub">
                                        {item.weaponName} · {item.slot.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                    <div className="csf-item-price">{money(item.priceUsd)}</div>
                                  </div>

                                  {/* Interactive CSFloat Wear Spectrum Bar (0.0000 - 1.0000) */}
                                  <div className="csf-wear-block">
                                    <div
                                      className="csf-spectrum-track"
                                      onClick={(e) => {
                                        const rect = e.currentTarget.getBoundingClientRect()
                                        const clickX = e.clientX - rect.left
                                        const newFloat = Math.max(
                                          0.000001,
                                          Math.min(0.999999, clickX / rect.width),
                                        )
                                        setItemFloats((prev) => ({
                                          ...prev,
                                          [item.slot]: Number(newFloat.toFixed(6)),
                                        }))
                                      }}
                                      title="Click anywhere along the spectrum to adjust exact float wear"
                                    >
                                      <div
                                        className="csf-seg seg-fn"
                                        style={{ width: "7%" }}
                                        title="FN: 0.00 - 0.07"
                                      />
                                      <div
                                        className="csf-seg seg-mw"
                                        style={{ width: "8%" }}
                                        title="MW: 0.07 - 0.15"
                                      />
                                      <div
                                        className="csf-seg seg-ft"
                                        style={{ width: "23%" }}
                                        title="FT: 0.15 - 0.38"
                                      />
                                      <div
                                        className="csf-seg seg-ww"
                                        style={{ width: "7%" }}
                                        title="WW: 0.38 - 0.45"
                                      />
                                      <div
                                        className="csf-seg seg-bs"
                                        style={{ width: "55%" }}
                                        title="BS: 0.45 - 1.00"
                                      />
                                      {/* Float Needle Indicator */}
                                      <div
                                        className="csf-needle"
                                        style={{
                                          left: `${Math.min(Math.max(curFloat, 0), 1) * 100}%`,
                                        }}
                                      />
                                    </div>

                                    {/* Float Meta Info Row */}
                                    <div className="csf-wear-meta">
                                      <span className="csf-wear-float">
                                        FLOAT: <code>{curFloat.toFixed(6)}</code>
                                      </span>
                                      <span className="csf-wear-tag">{item.wearCondition}</span>
                                      <div className="csf-pattern-chip">
                                        <span>Pattern #</span>
                                        <input
                                          type="number"
                                          min="1"
                                          max="1000"
                                          value={curPattern}
                                          onChange={(e) => {
                                            const v = Number(e.target.value)
                                            setItemPatterns((prev) => ({
                                              ...prev,
                                              [item.slot]: v,
                                            }))
                                          }}
                                          title="Pattern seed template (#1 - #1000)"
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  {/* Inline 5-Slot Sticker Craft Dock */}
                                  <div className="csf-craft-dock">
                                    <div className="csf-craft-head">
                                      <span className="csf-craft-slots-label">
                                        STICKER CRAFT ({itemCrafts.length}/5)
                                      </span>
                                      <div className="csf-craft-quick-btns">
                                        {activePlacement && (
                                          <button
                                            type="button"
                                            className="csf-mini-action"
                                            onClick={() =>
                                              applyStickerToAllSlots(
                                                item.slot,
                                                activePlacement.stickerId,
                                              )
                                            }
                                            title="Apply active sticker to all 5 slots"
                                          >
                                            5× ALL
                                          </button>
                                        )}
                                        {itemCrafts.length > 0 && (
                                          <button
                                            type="button"
                                            className="csf-mini-action danger"
                                            onClick={() => clearAllStickers(item.slot)}
                                            title="Clear all stickers on this weapon"
                                          >
                                            CLEAR
                                          </button>
                                        )}
                                      </div>
                                    </div>

                                    {/* 5-Slot Thumbnails Row */}
                                    <div
                                      className="csf-slot-row"
                                      role="tablist"
                                      aria-label="5-Slot sticker crafts"
                                    >
                                      {[0, 1, 2, 3, 4].map((sIdx) => {
                                        const p = itemCrafts.find((c) => c.slotIndex === sIdx)
                                        const stObj = p
                                          ? stickerOptions.find((s) => s.id === p.stickerId)
                                          : null
                                        const isSelected = curSlotIdx === sIdx && isDrawerOpen
                                        return (
                                          <button
                                            key={sIdx}
                                            type="button"
                                            className={`csf-slot-box ${p ? "occupied" : ""} ${isSelected ? "selected" : ""}`}
                                            onClick={() => {
                                              setActiveSlot((prev) => ({
                                                ...prev,
                                                [item.slot]: sIdx,
                                              }))
                                              setOpenStickerDrawer((prev) => ({
                                                ...prev,
                                                [item.slot]: !prev[item.slot] || curSlotIdx !== sIdx,
                                              }))
                                            }}
                                            title={
                                              stObj
                                                ? `${stObj.name} (Slot ${sIdx + 1}) - Click to customize`
                                                : `Slot ${sIdx + 1} (Empty) - Click to apply sticker`
                                            }
                                          >
                                            {stObj?.imageUrl ? (
                                              <img
                                                src={stObj.imageUrl}
                                                alt={stObj.name}
                                                className="csf-slot-img"
                                              />
                                            ) : (
                                              <span className="csf-slot-empty-num">
                                                {sIdx + 1}
                                              </span>
                                            )}
                                          </button>
                                        )
                                      })}
                                    </div>

                                    {/* Expandable Sticker Drawer for Current Slot */}
                                    {isDrawerOpen && (
                                      <div className="csf-drawer">
                                        <div className="csf-drawer-header">
                                          <span>Configuring Slot {curSlotIdx + 1}</span>
                                          <button
                                            type="button"
                                            className="csf-drawer-close"
                                            onClick={() =>
                                              setOpenStickerDrawer((prev) => ({
                                                ...prev,
                                                [item.slot]: false,
                                              }))
                                            }
                                          >
                                            ×
                                          </button>
                                        </div>

                                        <label className="csf-drawer-field">
                                          <span>Select Sticker</span>
                                          <select
                                            value={activePlacement?.stickerId ?? ""}
                                            onChange={(e) =>
                                              setSlotSticker(item.slot, curSlotIdx, e.target.value)
                                            }
                                          >
                                            <option value="">No Sticker (Empty Slot)</option>
                                            {stickerOptions.map((st) => (
                                              <option key={st.id} value={st.id}>
                                                {st.name} · {money(st.priceUsd)}
                                              </option>
                                            ))}
                                          </select>
                                        </label>

                                        {activePlacement && (
                                          <div className="csf-drawer-grid">
                                            <label>
                                              <span>Offset X ({activePlacement.offsetX}px)</span>
                                              <input
                                                type="number"
                                                step="any"
                                                value={activePlacement.offsetX}
                                                onChange={(e) =>
                                                  updateSlotPlacement(item.slot, curSlotIdx, {
                                                    offsetX: Number(e.target.value),
                                                  })
                                                }
                                              />
                                            </label>
                                            <label>
                                              <span>Offset Y ({activePlacement.offsetY}px)</span>
                                              <input
                                                type="number"
                                                step="any"
                                                value={activePlacement.offsetY}
                                                onChange={(e) =>
                                                  updateSlotPlacement(item.slot, curSlotIdx, {
                                                    offsetY: Number(e.target.value),
                                                  })
                                                }
                                              />
                                            </label>
                                            <label>
                                              <span>Rotation ({activePlacement.rotation}°)</span>
                                              <input
                                                type="number"
                                                min="-180"
                                                max="180"
                                                step="any"
                                                value={activePlacement.rotation}
                                                onChange={(e) =>
                                                  updateSlotPlacement(item.slot, curSlotIdx, {
                                                    rotation: Number(e.target.value),
                                                  })
                                                }
                                              />
                                            </label>
                                            <label>
                                              <span>Scale ({activePlacement.scale}x)</span>
                                              <input
                                                type="number"
                                                min="0.1"
                                                max="2"
                                                step="0.05"
                                                value={activePlacement.scale}
                                                onChange={(e) =>
                                                  updateSlotPlacement(item.slot, curSlotIdx, {
                                                    scale: Number(e.target.value),
                                                  })
                                                }
                                              />
                                            </label>
                                            <label className="csf-wear-scrape">
                                              <span>
                                                Scrape Wear (
                                                {Math.round((activePlacement.wear ?? 0) * 100)}%)
                                              </span>
                                              <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={activePlacement.wear ?? 0}
                                                onChange={(e) =>
                                                  updateSlotPlacement(item.slot, curSlotIdx, {
                                                    wear: Number(e.target.value),
                                                  })
                                                }
                                              />
                                            </label>
                                            <button
                                              type="button"
                                              className="csf-slot-clear-btn"
                                              onClick={() =>
                                                setSlotSticker(item.slot, curSlotIdx, "")
                                              }
                                            >
                                              Remove Sticker
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </article>
                              )
                            })
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Save to Community Bar */}
                <div className="csf-publish-bar">
                  <div className="csf-publish-info">
                    <h4>Save & Publish Loadout</h4>
                    <p>
                      Save your {displayedItems.length}-item {generated.themeColor.toLowerCase()}{" "}
                      equipment setup to the community feed.
                    </p>
                  </div>
                  <form className="lo-publish" onSubmit={handlePublish}>
                    <input
                      aria-label="Loadout title"
                      placeholder="Loadout title (e.g. Neon Royalty 2026)"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      required
                    />
                    <label>
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={(event) => setIsPublic(event.target.checked)}
                      />
                      <span>Make Public</span>
                    </label>
                    <button disabled={publishing} type="submit">
                      {publishing ? "SAVING LOADOUT…" : "PUBLISH TO COMMUNITY"}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* Catalog Section */}
      {tab === "catalog" && (
        <section className="lo-section">
          {/* csgoskins.gg Loadout Summary Header */}
          <div className="csg-loadout-header-bar">
            <div className="csg-side-summary ct">
              <span className="csg-side-pill ct">CT LOADOUT</span>
              <div className="csg-side-meta">
                <span className="csg-side-label">TOTAL VALUE</span>
                <strong className="csg-side-val">{money(totalCtLoadoutValue)}</strong>
              </div>
              <span className="csg-side-items-badge">{equippedCt.length} equipped</span>
            </div>

            <div className="csg-summary-sep" />

            <div className="csg-side-summary t">
              <span className="csg-side-pill t">T LOADOUT</span>
              <div className="csg-side-meta">
                <span className="csg-side-label">TOTAL VALUE</span>
                <strong className="csg-side-val">{money(totalTLoadoutValue)}</strong>
              </div>
              <span className="csg-side-items-badge">{equippedT.length} equipped</span>
            </div>

            <div className="csg-header-actions">
              <button
                type="button"
                className={`csg-view-drawer-btn ${showEquippedDrawer ? "active" : ""}`}
                onClick={() => setShowEquippedDrawer((v) => !v)}
              >
                {showEquippedDrawer ? "HIDE EQUIPPED" : "VIEW EQUIPPED"} ({equippedCt.length + equippedT.length})
              </button>
              {(equippedCt.length > 0 || equippedT.length > 0) && (
                <button
                  type="button"
                  className="csg-clear-btn"
                  onClick={() => {
                    if (window.confirm("Clear all equipped CT & T items?")) {
                      setEquippedCt([]);
                      setEquippedT([]);
                      notify("Equipped loadout reset");
                    }
                  }}
                >
                  RESET
                </button>
              )}
            </div>
          </div>

          {/* Equipped Drawer */}
          {showEquippedDrawer && (
            <div className="csg-equipped-drawer">
              <div className="csg-drawer-col">
                <div className="csg-drawer-title ct">CT EQUIPPED ({equippedCt.length}) · {money(totalCtLoadoutValue)}</div>
                {equippedCt.length === 0 ? (
                  <p className="csg-drawer-empty">No CT skins equipped yet. Click &quot;+ EQUIP TO CT&quot; on any skin card below!</p>
                ) : (
                  <div className="csg-drawer-list">
                    {equippedCt.map((item) => (
                      <div key={`ct-${item.id}`} className="csg-drawer-item">
                        <Picture url={item.imageUrl} label={item.name} />
                        <div className="csg-drawer-item-info">
                          <strong>{item.name}</strong>
                          <small>{item.weaponName} · {money(item.lowestPriceUsd)}</small>
                        </div>
                        <button type="button" onClick={() => toggleEquipSkin(item, "CT")} title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="csg-drawer-col">
                <div className="csg-drawer-title t">T EQUIPPED ({equippedT.length}) · {money(totalTLoadoutValue)}</div>
                {equippedT.length === 0 ? (
                  <p className="csg-drawer-empty">No T skins equipped yet. Click &quot;+ EQUIP TO T&quot; on any skin card below!</p>
                ) : (
                  <div className="csg-drawer-list">
                    {equippedT.map((item) => (
                      <div key={`t-${item.id}`} className="csg-drawer-item">
                        <Picture url={item.imageUrl} label={item.name} />
                        <div className="csg-drawer-item-info">
                          <strong>{item.name}</strong>
                          <small>{item.weaponName} · {money(item.lowestPriceUsd)}</small>
                        </div>
                        <button type="button" onClick={() => toggleEquipSkin(item, "T")} title="Remove">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top Category Navigation Bar: Mega-Category Pills */}
          <div className="csg-mega-category-bar">
            {MEGA_CATEGORIES.map((cat) => {
              const isActive =
                cat.kind === catalogKind &&
                (cat.kind === "stickers"
                  ? catalogKind === "stickers"
                  : catalogCategory === cat.category);
              return (
                <button
                  key={cat.label}
                  type="button"
                  className={`csg-mega-pill ${isActive ? "active" : ""}`}
                  onClick={() => {
                    setCatalogKind(cat.kind);
                    setCatalogCategory(cat.category as Category | "SNIPERS" | "");
                    setCatalogPage(0);
                    setSelectedSkin(null);
                    setSelectedSticker(null);
                  }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* 13-Color Swatches filter bar */}
          <div className="csg-color-swatches-bar">
            <span className="csg-swatches-label">🎨 Filter by Color:</span>
            <button
              type="button"
              className={`csg-swatch-chip ${!catalogColor ? "active" : ""}`}
              onClick={() => {
                setCatalogColor("");
                setCatalogPage(0);
              }}
            >
              All Colors
            </button>
            {COLOR_SWATCHES.map((sw) => {
              const isSelected = catalogColor === sw.value;
              return (
                <button
                  key={sw.value}
                  type="button"
                  className={`csg-swatch-chip ${isSelected ? "active" : ""}`}
                  onClick={() => {
                    setCatalogColor(isSelected ? "" : (sw.value as Color));
                    setCatalogPage(0);
                  }}
                  title={sw.name}
                >
                  <span
                    className="csg-swatch-dot"
                    style={{ backgroundColor: sw.hex }}
                  />
                  <span>{sw.name}</span>
                </button>
              );
            })}
          </div>

          <div className="lo-section-head">
            <h3>CS2 Item Database & Catalog</h3>
            <div className="lo-switch">
              <button
                className={catalogKind === "skins" ? "active" : ""}
                onClick={() => {
                  setCatalogKind("skins")
                  setCatalogPage(0)
                  setSelectedSkin(null)
                  setSelectedSticker(null)
                }}
              >
                SKINS
              </button>
              <button
                className={catalogKind === "stickers" ? "active" : ""}
                onClick={() => {
                  setCatalogKind("stickers")
                  setCatalogPage(0)
                  setSelectedSkin(null)
                  setSelectedSticker(null)
                }}
              >
                STICKERS
              </button>
            </div>
          </div>

          {/* Catalog Filter Controls */}
          <form
            className="lo-filters"
            onSubmit={(event) => {
              event.preventDefault()
              setCatalogQuery(catalogSearch.trim())
              setCatalogPage(0)
            }}
          >
            <input
              aria-label="Catalog search"
              placeholder="Search by name (e.g. Asiimov, Redline)"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
            />
            <button type="submit">SEARCH</button>

            <select
              aria-label="Color filter"
              value={catalogColor}
              onChange={(event) => {
                setCatalogColor(event.target.value as Color | "")
                setCatalogPage(0)
              }}
            >
              <option value="">All Colors</option>
              {COLORS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>

            <input
              type="number"
              min="0"
              step="0.01"
              aria-label="Maximum price"
              placeholder="Max Price (USD)"
              value={catalogMaxPrice}
              onChange={(event) => {
                setCatalogMaxPrice(event.target.value)
                setCatalogPage(0)
              }}
            />

            {catalogKind === "skins" && (
              <>
                <select
                  aria-label="Category filter"
                  value={catalogCategory}
                  onChange={(event) => {
                    setCatalogCategory(event.target.value as Category | "")
                    setCatalogPage(0)
                  }}
                >
                  <option value="">All Categories</option>
                  {[
                    "PISTOLS",
                    "RIFLES",
                    "SMGS",
                    "HEAVY",
                    "KNIVES",
                    "GLOVES",
                  ].map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>

                <select
                  aria-label="Team side filter"
                  value={catalogSide}
                  onChange={(event) => {
                    setCatalogSide(event.target.value as TeamSide | "")
                    setCatalogPage(0)
                  }}
                >
                  <option value="">All Sides</option>
                  <option value="T">T Side</option>
                  <option value="CT">CT Side</option>
                  <option value="BOTH">Both Sides</option>
                </select>

                {/* Skin Class Filter */}
                <select
                  aria-label="Skin Class filter"
                  value={catalogSkinClass}
                  onChange={(event) => {
                    setCatalogSkinClass(event.target.value)
                    setCatalogPage(0)
                  }}
                >
                  <option value="">All Skin Classes</option>
                  {SKIN_CLASSES.filter((c) => c.value !== "ANY").map((sc) => (
                    <option key={sc.value} value={sc.value}>
                      {sc.label}
                    </option>
                  ))}
                </select>

                {/* Rarity Filter */}
                <select
                  aria-label="Rarity filter"
                  value={catalogRarity}
                  onChange={(event) => {
                    setCatalogRarity(event.target.value)
                    setCatalogPage(0)
                  }}
                >
                  <option value="">All Rarities</option>
                  <option value="Covert">Covert (Crimson)</option>
                  <option value="Classified">Classified (Magenta)</option>
                  <option value="Restricted">Restricted (Violet)</option>
                  <option value="Mil-Spec Grade">Mil-Spec (Cobalt)</option>
                  <option value="Industrial Grade">Industrial</option>
                  <option value="Consumer Grade">Consumer</option>
                  <option value="Extraordinary">Extraordinary (Gold)</option>
                </select>
              </>
            )}
          </form>

          {catalogBusy && (
            <div className="lo-sync-pill-bar">
              <span className="lo-sync-dot">●</span> Syncing live market catalog from backend…
            </div>
          )}
          {catalogError && (
            <p className="lo-error" role="alert">
              {catalogError}
            </p>
          )}

          {catalogData && (
            <>
              <p className="lo-count">{catalogData.totalElements} items found</p>
              {catalogKind === "skins" ? (
                <div className="csg-skins-grid">
                  {(catalogData.content as Skin[]).map((skin) => {
                    const rarityColor = getRarityColor(skin.rarity, skin.category);
                    const skinClassDisplay = getSkinClassDisplay(skin);
                    const collectionName = getSkinCollection(skin);
                    const hasStatTrak = skin.category !== "GLOVES";
                    const hasSouvenir =
                      skin.category !== "GLOVES" &&
                      skin.category !== "KNIVES" &&
                      (collectionName.includes("Collection") || (skin.rarity && !skin.rarity.toLowerCase().includes("covert")));

                    const wearPrices: { wear: Wear; price: number | null }[] = [
                      { wear: "FN", price: skin.priceFn },
                      { wear: "MW", price: skin.priceMw },
                      { wear: "FT", price: skin.priceFt },
                      { wear: "WW", price: skin.priceWw },
                      { wear: "BS", price: skin.priceBs },
                    ];
                    const validPrices = wearPrices
                      .map((w) => w.price)
                      .filter((p): p is number => p !== null && p > 0);
                    const minPrice = validPrices.length ? Math.min(...validPrices) : skin.lowestPriceUsd;
                    const maxPrice = validPrices.length ? Math.max(...validPrices) : skin.lowestPriceUsd;

                    const activeWear = cardSelectedWear[skin.id];
                    const activeWearPrice = activeWear
                      ? wearPrices.find((w) => w.wear === activeWear)?.price
                      : undefined;

                    const minFloat = skin.minFloat ?? 0.00;
                    const maxFloat = skin.maxFloat ?? 1.00;

                    const isEquippedCt = equippedCt.some((s) => s.id === skin.id);
                    const isEquippedT = equippedT.some((s) => s.id === skin.id);

                    return (
                      <article
                        key={skin.id}
                        className="csg-skin-card"
                        style={{ borderColor: `${rarityColor}40` }}
                      >
                        {/* 1. Top Rarity Color Bar */}
                        <div
                          className="csg-card-rarity-bar"
                          style={{
                            backgroundColor: rarityColor,
                            boxShadow: `0 0 10px ${rarityColor}88`,
                          }}
                        />

                        {/* Rarity Ribbon (csgoskins.gg style corner ribbon) */}
                        <div
                          className="csg-card-rarity-ribbon"
                          style={{ backgroundColor: rarityColor }}
                        >
                          {getRarityLabel(skin.rarity, skin.category)}
                        </div>

                        {/* 2. Top Pill Row: skinClass badge + StatTrak / Souvenir tags */}
                        <div className="csg-card-top-pills">
                          <span
                            className="csg-skinclass-chip"
                            style={{
                              color: rarityColor,
                              borderColor: `${rarityColor}55`,
                              backgroundColor: `${rarityColor}15`,
                            }}
                          >
                            {skinClassDisplay}
                          </span>

                          <div className="csg-tags-wrap">
                            {hasStatTrak && (
                              <span className="csg-tag stattrak" title="StatTrak™ Available">
                                ★ StatTrak™
                              </span>
                            )}
                            {hasSouvenir && (
                              <span className="csg-tag souvenir" title="Souvenir Edition Available">
                                Souvenir
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 3. Skin Weapon Image */}
                        <div
                          className="csg-card-thumb"
                          style={{
                            background: `radial-gradient(circle at center, ${rarityColor}1a 0%, transparent 72%)`,
                          }}
                          onClick={() => openSkin(skin.id)}
                        >
                          <Picture url={skin.imageUrl} label={skin.name} />
                        </div>

                        {/* 4. Name & Weapon Info */}
                        <div className="csg-card-meta" onClick={() => openSkin(skin.id)}>
                          <strong className="csg-skin-title">{skin.name}</strong>
                          <span className="csg-weapon-sub">
                            {skin.weaponName} · {skin.rarity}
                          </span>
                        </div>

                        {/* 5. Collection / Case Pill */}
                        <div className="csg-collection-wrap">
                          <span className="csg-collection-badge" title={collectionName}>
                            {collectionName}
                          </span>
                        </div>

                        {/* 6. Float Range Spectrum Bar */}
                        <div className="csg-float-wrap">
                          <div className="csg-float-track">
                            <div
                              className="csg-float-indicator"
                              style={{
                                left: `${Math.min(95, Math.max(0, minFloat * 100))}%`,
                                width: `${Math.min(100, Math.max(6, (maxFloat - minFloat) * 100))}%`,
                              }}
                            />
                          </div>
                          <div className="csg-float-text-row">
                            <span>Float Spectrum</span>
                            <strong>
                              {minFloat.toFixed(2)} – {maxFloat.toFixed(2)}
                            </strong>
                          </div>
                        </div>

                        {/* 7. Price Range across Exteriors & Interactive Wear Tabs */}
                        <div className="csg-price-box">
                          <div className="csg-price-row">
                            <span className="csg-price-label">
                              {activeWear ? `${activeWear} PRICE` : "PRICE RANGE"}
                            </span>
                            <strong className="csg-price-val">
                              {activeWear
                                ? activeWearPrice !== null && activeWearPrice !== undefined
                                  ? money(activeWearPrice)
                                  : "— (Out of stock)"
                                : minPrice === maxPrice
                                  ? money(minPrice)
                                  : `${money(minPrice)} – ${money(maxPrice)}`}
                            </strong>
                          </div>

                          {/* Wear Tabs: FN, MW, FT, WW, BS */}
                          <div className="csg-wear-pill-row">
                            {(["FN", "MW", "FT", "WW", "BS"] as Wear[]).map((w) => {
                              const wp = wearPrices.find((x) => x.wear === w)?.price;
                              const isSelected = activeWear === w;
                              const isAvail = wp !== null && wp !== undefined;
                              return (
                                <button
                                  key={w}
                                  type="button"
                                  className={`csg-wear-btn ${isSelected ? "active" : ""} ${!isAvail ? "dim" : ""}`}
                                  title={isAvail ? `${w}: ${money(wp)}` : `${w}: Not available`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setCardSelectedWear((prev) => ({
                                      ...prev,
                                      [skin.id]: prev[skin.id] === w ? undefined : w,
                                    }));
                                  }}
                                >
                                  {w}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* 8. 1-Click Equip to CT / Equip to T */}
                        <div className="csg-equip-actions">
                          {(skin.teamSide === "CT" || skin.teamSide === "BOTH") && (
                            <button
                              type="button"
                              className={`csg-equip-btn ct ${isEquippedCt ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEquipSkin(skin, "CT");
                              }}
                            >
                              {isEquippedCt ? "✓ CT EQUIPPED" : "+ EQUIP TO CT"}
                            </button>
                          )}
                          {(skin.teamSide === "T" || skin.teamSide === "BOTH") && (
                            <button
                              type="button"
                              className={`csg-equip-btn t ${isEquippedT ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleEquipSkin(skin, "T");
                              }}
                            >
                              {isEquippedT ? "✓ T EQUIPPED" : "+ EQUIP TO T"}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="lo-catalog-grid">
                  {catalogData.content.map((item) => {
                    const itemRarity = "rarity" in item ? item.rarity : "Standard";
                    const rarityColor = getRarityColor(itemRarity);
                    return (
                      <button
                        className="lo-catalog-card csf-cat-card"
                        key={item.id}
                        onClick={() => openSticker(item.id)}
                        style={{
                          borderTop: `3px solid ${rarityColor}`,
                        }}
                      >
                        <div className="lo-catalog-image">
                          <Picture url={item.imageUrl} label={item.name} />
                        </div>
                        <span style={{ color: rarityColor }}>
                          {item.primaryColor} · {itemRarity}
                        </span>
                        <strong>{item.name}</strong>
                        <small>
                          {money("priceUsd" in item ? item.priceUsd : ("lowestPriceUsd" in item ? item.lowestPriceUsd : 0))}
                        </small>
                      </button>
                    );
                  })}
                </div>
              )}
              <Pager
                page={catalogPage}
                totalPages={catalogData.totalPages}
                onChange={setCatalogPage}
              />
            </>
          )}

          {selectedSkin && (
            <div className="lo-detail">
              <button
                className="lo-close"
                onClick={() => setSelectedSkin(null)}
              >
                CLOSE ×
              </button>
              <h4>{selectedSkin.name}</h4>
              <p>
                {selectedSkin.weaponName} · {selectedSkin.category} ·{" "}
                {selectedSkin.teamSide} · {selectedSkin.rarity}
                {selectedSkin.skinClass ? ` · ${selectedSkin.skinClass}` : ""}
              </p>
              <div className="lo-prices">
                {([
                  ["FN", selectedSkin.priceFn],
                  ["MW", selectedSkin.priceMw],
                  ["FT", selectedSkin.priceFt],
                  ["WW", selectedSkin.priceWw],
                  ["BS", selectedSkin.priceBs],
                ] as const).map(([wear, price]) => (
                  <span key={wear}>
                    {wear}: {price === null ? "—" : money(price)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {selectedSticker && (
            <div className="lo-detail">
              <button className="lo-close" onClick={() => setSelectedSticker(null)}>
                CLOSE ×
              </button>
              <h4>{selectedSticker.name}</h4>
              <p>{selectedSticker.primaryColor} · {selectedSticker.rarity}</p>
              <div className="lo-prices">
                <span>{money(selectedSticker.priceUsd)}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Community Section */}
      {tab === "community" && (
        <section className="lo-section">
          <div className="lo-section-head">
            <h3>Community Loadouts</h3>
            <span>Browse and upvote player builds</span>
          </div>
          <div className="lo-filters">
            <select
              aria-label="Community color"
              value={communityColor}
              onChange={(event) => {
                setCommunityColor(event.target.value as Color | "")
                setCommunityPage(0)
              }}
            >
              <option value="">All Colors</option>
              {COLORS.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              aria-label="Maximum budget"
              placeholder="Max budget USD"
              value={communityBudget}
              onChange={(event) => {
                setCommunityBudget(event.target.value)
                setCommunityPage(0)
              }}
            />
            <select
              aria-label="Community sort"
              value={communitySort}
              onChange={(event) => {
                setCommunitySort(event.target.value as "popular" | "latest")
                setCommunityPage(0)
              }}
            >
              <option value="popular">Most popular</option>
              <option value="latest">Latest</option>
            </select>
          </div>
          {communityBusy && <p className="lo-status">Loading community builds…</p>}
          {communityError && (
            <p className="lo-error" role="alert">
              {communityError}
            </p>
          )}
          {communityData && (
            <>
              <div className="lo-community-grid">
                {communityData.content.map((item) => (
                  <button
                    className="lo-community-card"
                    key={item.id}
                    onClick={() => openCommunity(item.id)}
                  >
                    <span>
                      {item.themeColor} · {item.itemsCount} ITEMS
                    </span>
                    <strong>{item.title}</strong>
                    <small>by {item.author.username}</small>
                    <div>
                      {money(item.totalCostUsd)} <em>▲ {item.upvotes}</em>
                    </div>
                  </button>
                ))}
              </div>
              {communityData.content.length === 0 && (
                <p className="lo-status">No community loadouts yet.</p>
              )}
              <Pager
                page={communityPage}
                totalPages={communityData.totalPages}
                onChange={setCommunityPage}
              />
            </>
          )}
          {communityDetail && (
            <div className="lo-detail">
              <button
                className="lo-close"
                onClick={() => setCommunityDetail(null)}
              >
                CLOSE ×
              </button>
              <h4>{communityDetail.title}</h4>
              <p>
                by {communityDetail.author.username} ·{" "}
                {communityDetail.themeColor} ·{" "}
                {money(communityDetail.totalCostUsd)} /{" "}
                {money(communityDetail.budgetLimitUsd)}
              </p>
              <div className="lo-detail-items">
                {communityDetail.items.map((item) => (
                  <div key={item.id}>
                    <div className="lo-detail-image">
                      <Picture url={item.imageUrl} label={item.skinName} />
                    </div>
                    <strong>{item.skinName}</strong>
                    <small>
                      {item.weaponSlot} · {item.wearCondition} ·{" "}
                      {money(item.selectedPriceUsd)}
                    </small>
                    {item.stickers && item.stickers.length > 0 && (
                      <div className="lo-detail-craft-box">
                        <small className="lo-detail-craft-title">
                          🎯 {item.stickers.length}{" "}
                          {item.stickers.length === 1 ? "Sticker Craft" : "Sticker Crafts"}
                        </small>
                        <div className="lo-detail-stickers-list">
                          {item.stickers.map((stk, i) => (
                            <span key={i} className="lo-detail-sticker-pill">
                              Slot {stk.slotIndex + 1}
                              {stk.wear !== undefined && stk.wear > 0
                                ? ` (${Math.round(stk.wear * 100)}% wear)`
                                : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="lo-detail-actions">
                <button
                  type="button"
                  onClick={() => navigate(`/users/${communityDetail.author.userId}`)}
                >
                  VIEW AUTHOR PROFILE
                </button>
                <button type="button" onClick={handleUpvote}>
                  {communityDetail.upvotedByCurrentUser
                    ? "REMOVE UPVOTE"
                    : "UPVOTE"}{" "}
                  · {communityDetail.upvotes}
                </button>
                <button type="button" onClick={handleDelete} disabled={!token}>
                  DELETE (AUTHOR / ADMIN)
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
