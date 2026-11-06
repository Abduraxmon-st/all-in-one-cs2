export const COLORS = [
  "RED",
  "ORANGE",
  "YELLOW",
  "GOLD",
  "GREEN",
  "BLUE",
  "CYAN",
  "PURPLE",
  "PINK",
  "BROWN",
  "BLACK",
  "GRAY",
  "WHITE",
] as const
export type Color = typeof COLORS[number]
export type TeamSide = "T" | "CT" | "BOTH"
export type Category = "PISTOLS" | "RIFLES" | "SMGS" | "HEAVY" | "KNIVES" | "GLOVES"
export type Wear = "FN" | "MW" | "FT" | "WW" | "BS"

export const SKIN_CLASSES = [
  { label: "All Classes", value: "ANY" },
  { label: "Covert Rifle", value: "COVERT_RIFLE", color: "#eb4b4b" },
  { label: "Classified Rifle", value: "CLASSIFIED_RIFLE", color: "#d32ce6" },
  { label: "Restricted Rifle", value: "RESTRICTED_RIFLE", color: "#8847ff" },
  { label: "Mil-Spec Rifle", value: "MIL_SPEC_RIFLE", color: "#4b69ff" },
  { label: "Covert Pistol", value: "COVERT_PISTOL", color: "#eb4b4b" },
  { label: "Classified Pistol", value: "CLASSIFIED_PISTOL", color: "#d32ce6" },
  { label: "All Covert", value: "ALL_COVERT", color: "#eb4b4b" },
  { label: "All Classified", value: "ALL_CLASSIFIED", color: "#d32ce6" },
] as const
export type SkinClassOption = (typeof SKIN_CLASSES)[number]
export type SkinClassValue = SkinClassOption["value"]

export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  pageable?: {
    pageNumber: number
    pageSize: number
  }
}

export interface Skin {
  id: string
  name: string
  weaponId: string
  weaponName: string
  category: Category
  teamSide: TeamSide
  rarity: string
  skinClass?: string
  primaryColor: Color
  secondaryColor: Color | null
  imageUrl: string | null
  minFloat: number | null
  maxFloat: number | null
  collectionName?: string
  statTrakAvailable?: boolean
  priceFn: number | null
  priceMw: number | null
  priceFt: number | null
  priceWw: number | null
  priceBs: number | null
  lowestPriceUsd: number
}

export interface Sticker {
  id: string
  name: string
  rarity: string
  primaryColor: Color
  imageUrl: string | null
  priceUsd: number
}

export interface SkinFilters {
  color?: Color
  weaponId?: string
  category?: Category
  teamSide?: TeamSide
  skinClass?: string
  rarity?: string
  maxPrice?: number
  q?: string
  page?: number
  size?: number
  sort?: string
}

export interface StickerFilters {
  color?: Color
  maxPrice?: number
  q?: string
  page?: number
  size?: number
  sort?: string
}

export interface GenerateRequest {
  budgetUsd: number
  themeColor: Color
  preferredCtRifle: string
  includeKnifeAndGloves: boolean
  skinClass?: string
  rarity?: string
}
export type GenerateLoadoutRequest = GenerateRequest

export interface GeneratedItem {
  slot: string
  weaponId: string
  weaponName: string
  skinId: string
  skinName: string
  wearCondition: Wear
  priceUsd: number
  primaryColor: Color
  imageUrl: string | null
  rarity?: string
  skinClass?: string
}
export type GeneratedLoadoutItem = GeneratedItem

export interface GeneratedLoadout {
  themeColor: Color
  budgetLimitUsd: number
  totalCostUsd: number
  remainingBudgetUsd: number
  items: GeneratedItem[]
}

export interface Author {
  userId: string
  steamId: string
  username: string
  avatarUrl: string | null
}

export interface CommunityLoadout {
  id: string
  userId: string
  title: string
  themeColor: Color
  budgetLimitUsd: number
  totalCostUsd: number
  upvotes: number
  isPublic: boolean
  itemsCount: number
  author: Author
  upvotedByCurrentUser: boolean
  createdAt: string
  updatedAt: string
}

export interface StickerPlacement {
  stickerId: string
  slotIndex: number
  offsetX: number
  offsetY: number
  rotation: number
  scale: number
  wear?: number
}

export interface CommunityItem {
  id: string
  weaponSlot: string
  skinId: string
  skinName: string
  weaponName: string
  wearCondition: Wear
  selectedPriceUsd: number
  primaryColor: Color
  imageUrl: string | null
  stickers: StickerPlacement[]
}

export interface CommunityDetail extends Omit<CommunityLoadout, "itemsCount"> {
  items: CommunityItem[]
}

export interface CreateCommunityLoadout {
  title: string
  themeColor: Color
  budgetLimitUsd: number
  isPublic: boolean
  items: {
    weaponSlot: string
    skinId: string
    wearCondition: Wear
    stickers: StickerPlacement[]
  }[]
}

export interface CommunityFilters {
  color?: Color
  maxBudget?: number
  sortBy?: "popular" | "latest"
  page?: number
  size?: number
}

export interface UpvoteResult {
  loadoutId: string
  upvotes: number
  upvoted: boolean
}

export interface SeedSummary {
  skinsCount: number
  stickersCount: number
  message: string
}
