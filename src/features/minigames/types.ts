export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
}

export interface ChallengeRound {
  roundOrder: number
  clipId: string
  title: string
  videoUrl: string
  videoProvider: string
  mapName: string
  actualPremierRating: number | null
  actualFaceitLevel: number | null
  userGuess: {
    guessedPremierRating: number
    pointsAwarded: number
    tierEmoji: string
    difference: number
  } | null
}

export interface DailyChallenge {
  challengeId: string
  challengeDate: string
  rounds: ChallengeRound[]
  totalScore: number
  completed: boolean
  shareText: string | null
}

export interface GuessResult {
  clipId: string
  roundOrder: number
  actualPremierRating: number
  actualFaceitLevel: number | null
  guessedPremierRating: number
  difference: number
  pointsAwarded: number
  tierEmoji: string
  totalChallengeScore: number
  completed: boolean
  shareText: string | null
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  score: number
  roundsPlayed: number
}

export interface Leaderboard {
  period: "DAILY" | "ALL_TIME"
  date?: string
  entries: LeaderboardEntry[]
}

export interface ClipSubmission {
  title: string
  videoUrl: string
  mapName: string
  actualPremierRating: number
  actualFaceitLevel: number
}

export interface SubmittedClip extends ClipSubmission {
  id?: string
  clipId?: string
  status: "PENDING" | "APPROVED" | "REJECTED" | "USED"
  submittedBy?: { userId: string; username: string; avatarUrl: string | null }
  videoProvider?: string
  createdAt?: string
}
