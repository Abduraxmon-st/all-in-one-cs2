import { useEffect, useState, type FormEvent } from "react"
import { useAuth } from "../features/identity/AuthProvider"
import {
  getDailyChallenge,
  getLeaderboard,
  getMyClips,
  submitClip,
  submitGuess,
} from "../features/minigames/api"
import type {
  ChallengeRound,
  ClipSubmission,
  DailyChallenge,
  GuessResult,
  Leaderboard,
  SubmittedClip,
} from "../features/minigames/types"

type Props = { notify: (message: string) => void }

function videoEmbedUrl(round: ChallengeRound): string | null {
  if (round.videoProvider.toUpperCase() !== "YOUTUBE") return null
  try {
    const url = new URL(round.videoUrl)
    const host = url.hostname.toLowerCase()
    let id: string | null = null
    if (host === "youtu.be") id = url.pathname.slice(1)
    if (
      host === "youtube.com" ||
      host === "www.youtube.com" ||
      host === "m.youtube.com"
    ) {
      id =
        url.searchParams.get("v") ??
        url.pathname.match(/^\/(?:shorts|embed)\/([^/]+)/)?.[1] ??
        null
    }
    return id && /^[\w-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}`
      : null
  } catch {
    return null
  }
}

function ClipPlayer({ round }: { round: ChallengeRound }) {
  const embedUrl = videoEmbedUrl(round)
  const safeUrl = (() => {
    try {
      const url = new URL(round.videoUrl)
      return ["http:", "https:"].includes(url.protocol) ? url.href : null
    } catch {
      return null
    }
  })()
  const directVideo = safeUrl && /\.(mp4|webm|ogg)(\?|$)/i.test(safeUrl)
  return (
    <div className="big-clip minigame-video">
      {embedUrl ? (
        <iframe
          key={round.clipId}
          src={embedUrl}
          title={round.title}
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : directVideo ? (
        <video
          key={round.clipId}
          src={safeUrl ?? undefined}
          controls
          playsInline
        />
      ) : (
        <div className="minigame-video-link">
          <p>{round.title}</p>
          {safeUrl ? (
            <a href={safeUrl} target="_blank" rel="noopener noreferrer">
              Open gameplay clip ↗
            </a>
          ) : (
            <span>Video unavailable</span>
          )}
        </div>
      )}
    </div>
  )
}

const emptyClip: ClipSubmission = {
  title: "",
  videoUrl: "",
  mapName: "",
  actualPremierRating: 1000,
  actualFaceitLevel: 1,
}

export default function DailyGamesPage({ notify }: Props) {
  const { token, user } = useAuth()
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [roundIndex, setRoundIndex] = useState(0)
  const [guess, setGuess] = useState(15000)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<GuessResult | null>(null)
  const [period, setPeriod] = useState<"DAILY" | "ALL_TIME">("DAILY")
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null)
  const [leaderboardError, setLeaderboardError] = useState("")
  const [showSubmission, setShowSubmission] = useState(false)
  const [clip, setClip] = useState<ClipSubmission>(emptyClip)
  const [clipBusy, setClipBusy] = useState(false)
  const [clipError, setClipError] = useState("")
  const [myClips, setMyClips] = useState<SubmittedClip[]>([])

  useEffect(() => {
    const controller = new AbortController()
    setChallenge(null)
    setResult(null)
    setLoading(true)
    getDailyChallenge(controller.signal, token || undefined)
      .then((data) => {
        setChallenge(data)
        const pendingIndex = data.rounds.findIndex(
          (round) => round.userGuess === null,
        )
        setRoundIndex(
          pendingIndex < 0 ? Math.max(0, data.rounds.length - 1) : pendingIndex,
        )
        setError("")
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setError(
            cause instanceof Error
              ? cause.message
              : "Could not load today's challenge",
          )
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [token])

  useEffect(() => {
    const controller = new AbortController()
    setLeaderboard(null)
    setLeaderboardError("")
    getLeaderboard(period, controller.signal)
      .then(setLeaderboard)
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
          setLeaderboardError(
            cause instanceof Error
              ? cause.message
              : "Could not load leaderboard",
          )
      })
    return () => controller.abort()
  }, [period])

  const rounds = challenge?.rounds ?? []
  const round = rounds[roundIndex]
  const guessed = round?.userGuess !== null && round?.userGuess !== undefined
  const nextRound = rounds
    .slice(roundIndex + 1)
    .findIndex((item) => item.userGuess === null)

  async function handleGuess() {
    if (!round || submitting || guessed) return
    if (!Number.isInteger(guess) || guess < 1000 || guess > 35000) {
      notify("Choose a rating from 1,000 to 35,000")
      return
    }
    setSubmitting(true)
    try {
      const data = await submitGuess(round.clipId, guess, token || undefined)
      setResult(data)
      setChallenge(
        (current) =>
          current && {
            ...current,
            rounds: current.rounds.map((item) =>
              item.clipId === data.clipId
                ? {
                    ...item,
                    userGuess: data.guessedPremierRating,
                    actualPremierRating: data.actualPremierRating,
                    actualFaceitLevel: data.actualFaceitLevel,
                  }
                : item,
            ),
            totalScore: data.totalChallengeScore,
            completed: data.completed,
            shareText: data.shareText,
          },
      )
    } catch (cause) {
      notify(
        cause instanceof Error ? cause.message : "Guess could not be submitted",
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleShare() {
    if (!challenge?.shareText) return
    try {
      await navigator.clipboard.writeText(challenge.shareText)
      notify("Challenge summary copied")
    } catch {
      notify("Could not copy challenge summary")
    }
  }

  async function handleClipSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!token) {
      setClipError("Sign in to submit a clip.")
      return
    }
    setClipBusy(true)
    setClipError("")
    try {
      await submitClip(clip, token)
      setClip(emptyClip)
      notify("Clip submitted for review")
      try {
        setMyClips(await getMyClips(token))
      } catch {
        /* Submission succeeded; the list can be loaded later. */
      }
    } catch (cause) {
      setClipError(
        cause instanceof Error ? cause.message : "Clip could not be submitted",
      )
    } finally {
      setClipBusy(false)
    }
  }

  async function handleLoadMyClips() {
    if (!token) {
      setClipError("Sign in to view submissions.")
      return
    }
    setClipBusy(true)
    setClipError("")
    try {
      setMyClips(await getMyClips(token))
    } catch (cause) {
      setClipError(
        cause instanceof Error ? cause.message : "Could not load submissions",
      )
    } finally {
      setClipBusy(false)
    }
  }

  return (
    <div className="feature-page minigame-page">
      <div className="page-intro">
        <div>
          <p className="eyebrow">
            DAILY CHALLENGE {challenge?.challengeDate ?? ""}
          </p>
          <h2>Guess the Elo</h2>
          <p>
            Watch three CS2 clips and estimate each player's Premier rating.
          </p>
        </div>
        {challenge?.shareText && (
          <button onClick={handleShare}>Share results ↗</button>
        )}
      </div>
      <div className="minigame-auth"><span>{user ? `SIGNED IN AS ${user.username}` : "PLAYING AS GUEST"}</span></div>

      <section className="game-layout">
        <div className="daily-stage">
          {loading && (
            <p className="minigame-message">Loading today's challenge…</p>
          )}
          {!loading && error && (
            <div className="minigame-message error">
              <p>{error}</p>
              <p>The game is unavailable until its backend is connected.</p>
              <button onClick={() => window.location.reload()}>Retry</button>
            </div>
          )}
          {!loading && !error && !round && (
            <p className="minigame-message">
              No clips are available for today's challenge yet.
            </p>
          )}
          {round && (
            <>
              <div className="game-progress">
                {rounds.map((item, index) => (
                  <button
                    key={item.clipId}
                    className={
                      index === roundIndex
                        ? "current"
                        : item.userGuess !== null
                          ? "done"
                          : ""
                    }
                    onClick={() => {
                      setRoundIndex(index)
                      setResult(null)
                    }}
                    aria-label={`Round ${item.roundOrder}`}
                  >
                    {String(item.roundOrder).padStart(2, "0")}
                  </button>
                ))}
              </div>
              <div className="minigame-round-heading">
                <span>
                  ROUND {round.roundOrder} / {rounds.length}
                </span>
                <strong>{round.title}</strong>
                <small>{round.mapName.replace(/^de_/, "").toUpperCase()}</small>
              </div>
              <ClipPlayer round={round} />
              {guessed ? (
                <div className="minigame-result">
                  <span>
                    {result?.tierEmoji ?? "✓"}{" "}
                    {result
                      ? `+${result.pointsAwarded} POINTS`
                      : "GUESS SUBMITTED"}
                  </span>
                  <strong>
                    Actual rating:{" "}
                    {round.actualPremierRating?.toLocaleString() ?? "—"}
                  </strong>
                  <p>
                    Your guess: {round.userGuess?.toLocaleString()}
                    {result
                      ? ` · Difference: ${result.difference.toLocaleString()}`
                      : ""}
                  </p>
                  {nextRound >= 0 && (
                    <button
                      onClick={() => {
                        setRoundIndex(roundIndex + nextRound + 1)
                        setResult(null)
                      }}
                    >
                      Next round →
                    </button>
                  )}
                </div>
              ) : (
                <div className="elo-picker">
                  <p>WHAT'S THEIR PREMIER RATING?</p>
                  <div className="minigame-guess-control">
                    <input
                      type="range"
                      min="1000"
                      max="35000"
                      step="100"
                      value={guess}
                      onChange={(event) => setGuess(Number(event.target.value))}
                      aria-label="Premier rating guess"
                    />
                    <input
                      type="number"
                      min="1000"
                      max="35000"
                      value={guess}
                      onChange={(event) => setGuess(Number(event.target.value))}
                      aria-label="Exact Premier rating guess"
                    />
                  </div>
                  <button
                    className="lock-guess"
                    onClick={handleGuess}
                    disabled={submitting}
                  >
                    {submitting ? "SUBMITTING…" : "LOCK IN GUESS →"}
                  </button>
                </div>
              )}
              <p className="minigame-score">
                TOTAL SCORE{" "}
                <strong>
                  {challenge?.totalScore.toLocaleString() ?? 0} / 3,000
                </strong>
              </p>
            </>
          )}
        </div>

        <aside className="daily-side">
          <div className="leaderboard">
            <div className="panel-title">
              <span>LEADERBOARD</span>
            </div>
            <div className="minigame-period">
              <button
                className={period === "DAILY" ? "active" : ""}
                onClick={() => setPeriod("DAILY")}
              >
                TODAY
              </button>
              <button
                className={period === "ALL_TIME" ? "active" : ""}
                onClick={() => setPeriod("ALL_TIME")}
              >
                ALL TIME
              </button>
            </div>
            {leaderboardError ? (
              <p className="minigame-side-message">{leaderboardError}</p>
            ) : !leaderboard ? (
              <p className="minigame-side-message">Loading…</p>
            ) : leaderboard.entries.length ? (
              leaderboard.entries.map((entry) => (
                <div
                  className="minigame-leader"
                  key={`${entry.userId}-${entry.rank}`}
                >
                  <em>{entry.rank}</em>
                  <span>{entry.username}</span>
                  <strong>{entry.score.toLocaleString()} pts</strong>
                </div>
              ))
            ) : (
              <p className="minigame-side-message">No scores yet.</p>
            )}
          </div>
          <div className="minigame-guest-note">
            {token
              ? "Signed-in scores are eligible for the leaderboard."
              : "Guests can play now. A signed-in account is required to appear on the leaderboard."}
          </div>
          <button
            className="submit-clip"
            onClick={() => setShowSubmission((open) => !open)}
          >
            {showSubmission ? "CLOSE SUBMISSION" : "+ SUBMIT YOUR CLIP"}
          </button>
        </aside>
      </section>

      {showSubmission && (
        <section className="clip-submission-panel">
          <h3>Submit a community clip</h3>
          <p>
            Clips are reviewed before they appear in a daily challenge. Connect
            Sign in with Steam before submitting.
          </p>
          <form onSubmit={handleClipSubmit}>
            <label>
              Clip title
              <input
                value={clip.title}
                onChange={(event) =>
                  setClip({ ...clip, title: event.target.value })
                }
                required
                maxLength={120}
              />
            </label>
            <label>
              Video URL
              <input
                type="url"
                value={clip.videoUrl}
                onChange={(event) =>
                  setClip({ ...clip, videoUrl: event.target.value })
                }
                required
              />
            </label>
            <label>
              Map name
              <input
                value={clip.mapName}
                onChange={(event) =>
                  setClip({ ...clip, mapName: event.target.value })
                }
                placeholder="de_mirage"
                required
              />
            </label>
            <label>
              Actual Premier rating
              <input
                type="number"
                min="1000"
                max="35000"
                value={clip.actualPremierRating}
                onChange={(event) =>
                  setClip({
                    ...clip,
                    actualPremierRating: Number(event.target.value),
                  })
                }
                required
              />
            </label>
            <label>
              Faceit level
              <input
                type="number"
                min="1"
                max="10"
                value={clip.actualFaceitLevel}
                onChange={(event) =>
                  setClip({
                    ...clip,
                    actualFaceitLevel: Number(event.target.value),
                  })
                }
                required
              />
            </label>
            <button disabled={clipBusy}>
              {clipBusy ? "SUBMITTING…" : "SUBMIT CLIP"}
            </button>
          </form>
          <button
            className="minigame-load-clips"
            onClick={handleLoadMyClips}
            disabled={clipBusy}
          >
            VIEW MY SUBMISSIONS
          </button>
          {clipError && (
            <p className="minigame-form-error" role="alert">
              {clipError}
            </p>
          )}
          {myClips.length > 0 && (
            <div className="minigame-my-clips">
              <h4>My submissions</h4>
              {myClips.map((item, index) => (
                <p key={item.clipId ?? item.id ?? index}>
                  {item.title} · {item.status}
                </p>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
