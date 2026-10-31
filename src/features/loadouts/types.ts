export const COLORS = [
  "RED",
  "BLUE",
  "PURPLE",
  "GREEN",
  "YELLOW",
  "ORANGE",
  "WHITE",
  "BLACK",
  "PINK",
  "GOLD",
] as const
export type Color = typeof COLORS[number]
export type TeamSide = "T" | "CT" | "BOTH"
export type Category = "PISTOLS" | "RIFLES" | "SMGS" | "HEAVY" | "KNIVES" | "GLOVES"
export type Wear = "FN" | "MW" | "FT" | "WW" | "BS"

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
  primaryColor: Color
  secondaryColor: Color | null
  imageUrl: string | null
  minFloat: number | null
  maxFloat: number | null
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
}

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
}

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
