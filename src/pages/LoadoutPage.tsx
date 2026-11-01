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
  type Category,
  type Color,
  type CommunityDetail,
  type CommunityLoadout,
  type GeneratedLoadout,
  type Page,
  type Skin,
  type Sticker,
  type StickerPlacement,
  type TeamSide,
} from "../features/loadouts/types"
import "./LoadoutPage.css"

type Props = {
  budget: number
  setBudget: (value: number) => void
  notify: (message: string) => void
}
type Tab = "builder" | "catalog" | "community"
type CatalogKind = "skins" | "stickers"
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
    <div className="lo-image-empty">NO IMAGE</div>
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

export default function LoadoutPage({ budget, setBudget, notify }: Props) {
  const { token, user } = useAuth()
  const [tab, setTab] = useState<Tab>("builder")
  const [color, setColor] = useState<Color>("PURPLE")
  const [ctRifle, setCtRifle] = useState("weapon_m4a1_silencer")
  const [includeKnife, setIncludeKnife] = useState(false)
  const [generated, setGenerated] = useState<GeneratedLoadout | null>(null)
  const [generatorBusy, setGeneratorBusy] = useState(false)
  const [generatorError, setGeneratorError] = useState("")
  const [stickerOptions, setStickerOptions] = useState<Sticker[]>([])
  const [crafts, setCrafts] = useState<Record<string, StickerPlacement[]>>({})
  const [activeSlot, setActiveSlot] = useState<Record<string, number>>({})
  const [title, setTitle] = useState("")
  const [isPublic, setIsPublic] = useState(true)
  const [publishing, setPublishing] = useState(false)

  const [catalogKind, setCatalogKind] = useState<CatalogKind>("skins")
  const [catalogSearch, setCatalogSearch] = useState("")
  const [catalogQuery, setCatalogQuery] = useState("")
  const [catalogColor, setCatalogColor] = useState<Color | "">("")
  const [catalogCategory, setCatalogCategory] = useState<Category | "">("")
  const [catalogSide, setCatalogSide] = useState<TeamSide | "">("")
  const [catalogMaxPrice, setCatalogMaxPrice] = useState("")
  const [catalogPage, setCatalogPage] = useState(0)
  const [catalogData, setCatalogData] = useState<Page<Skin | Sticker> | null>(
    null,
  )
  const [catalogBusy, setCatalogBusy] = useState(false)
  const [catalogError, setCatalogError] = useState("")
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null)
  const [selectedSticker, setSelectedSticker] = useState<Sticker | null>(null)

  const [communityColor, setCommunityColor] = useState<Color | "">("")
  const [communityBudget, setCommunityBudget] = useState("")
  const [communitySort, setCommunitySort] = useState<"popular" | "latest">(
    "popular",
  )
  const [communityPage, setCommunityPage] = useState(0)
  const [communityData, setCommunityData] =
    useState<Page<CommunityLoadout> | null>(null)
  const [communityBusy, setCommunityBusy] = useState(false)
  const [communityError, setCommunityError] = useState("")
  const [communityDetail, setCommunityDetail] =
    useState<CommunityDetail | null>(null)
  const [communityRevision, setCommunityRevision] = useState(0)

  useEffect(() => {
    if (tab !== "catalog") return
    const controller = new AbortController()
    setCatalogBusy(true)
    setCatalogData(null)
    setCatalogError("")
    const common = {
      color: catalogColor || undefined,
      maxPrice: catalogMaxPrice ? Number(catalogMaxPrice) : undefined,
      q: catalogQuery || undefined,
      page: catalogPage,
      size: 20,
    }
    const call =
      catalogKind === "skins"
        ? getSkins(
            {
              ...common,
              category: catalogCategory || undefined,
              teamSide: catalogSide || undefined,
            },
            controller.signal,
          )
        : getStickers(common, controller.signal)
    call
      .then((data) => setCatalogData(data))
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setCatalogError(
            cause instanceof Error ? cause.message : "Could not load catalog",
          )
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
    catalogMaxPrice,
    catalogQuery,
    catalogPage,
  ])

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
      })
      setGenerated(result)
      setCrafts({})
      setTitle(`${color[0]}${color.slice(1).toLowerCase()} loadout`)
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
      notify("Loadout saved")
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

  return (
    <div className="feature-page lo-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">CATALOG · GENERATOR · COMMUNITY</p>
          <h2>Loadout lab</h2>
          <p>
            Build a color-matched inventory from live catalog prices, then share
            it with the community.
          </p>
        </div>
      </div>
      <div className="lo-auth">
        <span>{user ? `SIGNED IN AS ${user.username}` : "GUEST MODE"}</span>
      </div>
      <div className="lo-tabs" role="tablist" aria-label="Loadout sections">
        {(["builder", "catalog", "community"] as Tab[]).map((item) => (
          <button
            key={item}
            role="tab"
            aria-selected={tab === item}
            className={tab === item ? "active" : ""}
            onClick={() => setTab(item)}
          >
            {item.toUpperCase()}
          </button>
        ))}
      </div>

      {tab === "builder" && (
        <section className="loadout-builder">
          <form
            className="filter-panel lo-builder-form"
            onSubmit={handleGenerate}
          >
            <label>
              Budget in USD
              <input
                type="number"
                min="1"
                max="100000"
                step="0.01"
                value={budget}
                onChange={(event) => setBudget(Number(event.target.value))}
                required
              />
            </label>
            <label>
              Color theme
              <select
                value={color}
                onChange={(event) => setColor(event.target.value as Color)}
              >
                {COLORS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Preferred CT rifle
              <select
                value={ctRifle}
                onChange={(event) => setCtRifle(event.target.value)}
              >
                <option value="weapon_m4a1_silencer">M4A1-S</option>
                <option value="weapon_m4a1">M4A4</option>
              </select>
            </label>
            <label className="lo-check">
              <input
                type="checkbox"
                checked={includeKnife}
                onChange={(event) => setIncludeKnife(event.target.checked)}
              />{" "}
              Include knife and gloves
            </label>
            <button className="generate" disabled={generatorBusy}>
              {generatorBusy ? "GENERATING…" : "GENERATE LOADOUT"}
            </button>
          </form>
          <div className="inventory lo-generated">
            <div className="inventory-head">
              <div>
                <span>
                  {generated
                    ? `${generated.themeColor} LOADOUT`
                    : "YOUR LOADOUT"}
                </span>
                <small>
                  {generated
                    ? `${generated.items.length} ITEMS`
                    : "GENERATE TO SEE LIVE RESULTS"}
                </small>
              </div>
              {generated && (
                <strong>
                  {money(generated.totalCostUsd)}
                  <small>TOTAL COST</small>
                </strong>
              )}
            </div>
            {generatorError && (
              <p className="lo-error" role="alert">
                {generatorError}
              </p>
            )}
            {!generated ? (
              <div className="lo-empty">
                Set a budget and color to generate a loadout from the API.
              </div>
            ) : (
              <>
                <div className="skin-grid lo-generated-grid">
                  {generated.items.map((item) => (
                    <article className="skin-card lo-item" key={item.slot}>
                      <div className="lo-item-image">
                        <Picture url={item.imageUrl} label={item.skinName} />
                      </div>
                      <span>
                        {item.slot.replace(/_/g, " ")} · {item.wearCondition}
                      </span>
                      <strong>{item.skinName}</strong>
                      <small>{money(item.priceUsd)}</small>
                      {/* 5-Slot Crafting Strip */}
                      {(() => {
                        const itemCrafts = crafts[item.slot] ?? []
                        const curSlot = activeSlot[item.slot] ?? 0
                        const currentPlacement = itemCrafts.find((p) => p.slotIndex === curSlot)
                        const weaponStickersCost = itemCrafts.reduce((sum, p) => {
                          const st = stickerOptions.find((s) => s.id === p.stickerId)
                          return sum + (st?.priceUsd ?? 0)
                        }, 0)

                        return (
                          <div className="lo-craft-container">
                            <div className="lo-craft-summary">
                              <span className="lo-craft-count-tag">
                                {itemCrafts.length}/5 STICKERS {weaponStickersCost > 0 ? `(+${money(weaponStickersCost)})` : ""}
                              </span>
                              <div className="lo-craft-batch-btns">
                                {currentPlacement && (
                                  <button
                                    type="button"
                                    className="lo-craft-mini-btn"
                                    onClick={() => applyStickerToAllSlots(item.slot, currentPlacement.stickerId)}
                                    title="Duplicate current sticker across all 5 slots"
                                  >
                                    5× ALL
                                  </button>
                                )}
                                {itemCrafts.length > 0 && (
                                  <button
                                    type="button"
                                    className="lo-craft-mini-btn danger"
                                    onClick={() => clearAllStickers(item.slot)}
                                    title="Remove all stickers from this weapon"
                                  >
                                    CLEAR
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* 5 Slot Selection Pills */}
                            <div className="lo-slot-pills-row" role="tablist" aria-label="Sticker slot selector">
                              {[0, 1, 2, 3, 4].map((sIdx) => {
                                const p = itemCrafts.find((craft) => craft.slotIndex === sIdx)
                                const isSelected = curSlot === sIdx
                                return (
                                  <button
                                    key={sIdx}
                                    type="button"
                                    role="tab"
                                    aria-selected={isSelected}
                                    className={`lo-slot-pill ${isSelected ? "selected" : ""} ${p ? "occupied" : ""}`}
                                    onClick={() => setActiveSlot((curr) => ({ ...curr, [item.slot]: sIdx }))}
                                  >
                                    <span className="lo-slot-pill-idx">{sIdx + 1}</span>
                                    <span className="lo-slot-pill-state">{p ? "★" : "+"}</span>
                                  </button>
                                )
                              })}
                            </div>

                            {/* Active Slot Configuration */}
                            <div className="lo-active-slot-panel">
                              <label>
                                Slot {curSlot + 1} Sticker
                                <select
                                  value={currentPlacement?.stickerId ?? ""}
                                  onChange={(event) => setSlotSticker(item.slot, curSlot, event.target.value)}
                                >
                                  <option value="">No Sticker (Empty Slot)</option>
                                  {stickerOptions.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.name} · {money(st.priceUsd)}
                                    </option>
                                  ))}
                                </select>
                              </label>

                              {currentPlacement && (
                                <div className="lo-craft-fields">
                                  <label>
                                    Position X ({currentPlacement.offsetX}px)
                                    <input
                                      type="number"
                                      step="any"
                                      value={currentPlacement.offsetX}
                                      onChange={(event) =>
                                        updateSlotPlacement(item.slot, curSlot, {
                                          offsetX: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label>
                                    Position Y ({currentPlacement.offsetY}px)
                                    <input
                                      type="number"
                                      step="any"
                                      value={currentPlacement.offsetY}
                                      onChange={(event) =>
                                        updateSlotPlacement(item.slot, curSlot, {
                                          offsetY: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label>
                                    Rotation ({currentPlacement.rotation}°)
                                    <input
                                      type="number"
                                      min="-180"
                                      max="180"
                                      step="any"
                                      value={currentPlacement.rotation}
                                      onChange={(event) =>
                                        updateSlotPlacement(item.slot, curSlot, {
                                          rotation: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label>
                                    Scale ({currentPlacement.scale}x)
                                    <input
                                      type="number"
                                      min="0.1"
                                      max="2"
                                      step="0.05"
                                      value={currentPlacement.scale}
                                      onChange={(event) =>
                                        updateSlotPlacement(item.slot, curSlot, {
                                          scale: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <label className="lo-scrape-field">
                                    Wear Scrape ({Math.round((currentPlacement.wear ?? 0) * 100)}%)
                                    <input
                                      type="range"
                                      min="0"
                                      max="1"
                                      step="0.05"
                                      value={currentPlacement.wear ?? 0}
                                      onChange={(event) =>
                                        updateSlotPlacement(item.slot, curSlot, {
                                          wear: Number(event.target.value),
                                        })
                                      }
                                    />
                                  </label>
                                  <button
                                    type="button"
                                    className="lo-slot-remove-btn"
                                    onClick={() => setSlotSticker(item.slot, curSlot, "")}
                                  >
                                    Remove Slot {curSlot + 1}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })()}
                    </article>
                  ))}
                </div>
                <div className="lo-totals">
                  <span>Budget limit: {money(generated.budgetLimitUsd)}</span>
                  <strong>
                    Remaining: {money(generated.remainingBudgetUsd)}
                  </strong>
                </div>
                {Object.values(crafts).some((arr) => arr.length > 0) && (
                  <p className="lo-craft-note">
                    🎨 {Object.values(crafts).reduce((sum, arr) => sum + arr.length, 0)} custom sticker craft
                    {Object.values(crafts).reduce((sum, arr) => sum + arr.length, 0) > 1 ? "s" : ""} configured across weapons.
                    Sticker prices are separate from the generator&apos;s budget estimate.
                  </p>
                )}
                <form className="lo-publish" onSubmit={handlePublish}>
                  <input
                    aria-label="Loadout title"
                    placeholder="Loadout title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    required
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(event) => setIsPublic(event.target.checked)}
                    />{" "}
                    Public
                  </label>
                  <button disabled={publishing}>
                    {publishing ? "SAVING…" : "SAVE TO COMMUNITY"}
                  </button>
                </form>
              </>
            )}
          </div>
        </section>
      )}

      {tab === "catalog" && (
        <section className="lo-section">
          <div className="lo-section-head">
            <h3>Catalog</h3>
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
              placeholder="Search by name"
              value={catalogSearch}
              onChange={(event) => setCatalogSearch(event.target.value)}
            />
            <button>SEARCH</button>
            <select
              aria-label="Color filter"
              value={catalogColor}
              onChange={(event) => {
                setCatalogColor(event.target.value as Color | "")
                setCatalogPage(0)
              }}
            >
              <option value="">All colors</option>
              {COLORS.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="0.01"
              aria-label="Maximum price"
              placeholder="Max price USD"
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
                  <option value="">All categories</option>
                  {[
                    "PISTOLS",
                    "RIFLES",
                    "SMGS",
                    "HEAVY",
                    "KNIVES",
                    "GLOVES",
                  ].map((item) => (
                    <option key={item}>{item}</option>
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
                  <option value="">All sides</option>
                  <option value="T">T</option>
                  <option value="CT">CT</option>
                  <option value="BOTH">Both</option>
                </select>
              </>
            )}
          </form>
          {catalogBusy && <p className="lo-status">Loading catalog…</p>}
          {catalogError && (
            <p className="lo-error" role="alert">
              {catalogError}
            </p>
          )}
          {catalogData && (
            <>
              <p className="lo-count">{catalogData.totalElements} items</p>
              <div className="lo-catalog-grid">
                {catalogData.content.map((item) => (
                  <button
                    className="lo-catalog-card"
                    key={item.id}
                    onClick={() => {
                      if (catalogKind === "skins") openSkin(item.id)
                      else openSticker(item.id)
                    }}
                  >
                    <div className="lo-catalog-image">
                      <Picture url={item.imageUrl} label={item.name} />
                    </div>
                    <span>
                      {item.primaryColor} · {item.rarity}
                    </span>
                    <strong>{item.name}</strong>
                    <small>
                      {money(
                        "lowestPriceUsd" in item
                          ? item.lowestPriceUsd
                          : item.priceUsd,
                      )}
                    </small>
                  </button>
                ))}
              </div>
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
              <button className="lo-close" onClick={() => setSelectedSticker(null)}>CLOSE ×</button>
              <h4>{selectedSticker.name}</h4>
              <p>{selectedSticker.primaryColor} · {selectedSticker.rarity}</p>
              <div className="lo-prices"><span>{money(selectedSticker.priceUsd)}</span></div>
            </div>
          )}
        </section>
      )}

      {tab === "community" && (
        <section className="lo-section">
          <div className="lo-section-head">
            <h3>Community loadouts</h3>
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
              <option value="">All colors</option>
              {COLORS.map((item) => (
                <option key={item}>{item}</option>
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
          {communityBusy && <p className="lo-status">Loading community…</p>}
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
                          🎯 {item.stickers.length} {item.stickers.length === 1 ? "Sticker Craft" : "Sticker Crafts"}
                        </small>
                        <div className="lo-detail-stickers-list">
                          {item.stickers.map((stk, i) => (
                            <span key={i} className="lo-detail-sticker-pill">
                              Slot {stk.slotIndex + 1}
                              {stk.wear !== undefined && stk.wear > 0 ? ` (${Math.round(stk.wear * 100)}% wear)` : ""}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <div className="lo-detail-actions">
                <button onClick={() => navigate(`/users/${communityDetail.author.userId}`)}>
                  VIEW AUTHOR PROFILE
                </button>
                <button onClick={handleUpvote}>
                  {communityDetail.upvotedByCurrentUser
                    ? "REMOVE UPVOTE"
                    : "UPVOTE"}{" "}
                  · {communityDetail.upvotes}
                </button>
                <button onClick={handleDelete} disabled={!token}>
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
