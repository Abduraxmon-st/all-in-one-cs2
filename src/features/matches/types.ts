export type MatchStatus = "QUEUED" | "PARSING" | "COMPLETED" | "FAILED";

export interface Award {
  badgeCode: string;
  badgeTitle: string;
  badgeCategory: "FLEX" | "TROLL" | "UTILITY" | "NEUTRAL";
  badgeIcon: string;
  description: string;
}

export interface PlayerStats {
  id: string;
  steamId: string;
  userId: string | null;
  playerName: string;
  teamSide: "TEAM_A" | "TEAM_B";
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  headshotPct: number;
  kastPct: number;
  impactRating: number;
  headlineTitle: string | null;
  headlineRoast: string | null;
  awards: Award[];
}

export interface MatchDetail {
  id: string;
  shareCode: string | null;
  demoUrl: string | null;
  submittedByUserId: string | null;
  status: MatchStatus;
  mapName: string | null;
  teamAScore: number;
  teamBScore: number;
  totalRounds: number;
  durationSeconds: number;
  errorMessage: string | null;
  shareSlug: string;
  teamAPlayers: PlayerStats[];
  teamBPlayers: PlayerStats[];
  createdAt: string;
  completedAt: string | null;
}

export interface MatchSummary {
  id: string;
  shareCode: string | null;
  status: MatchStatus;
  mapName: string | null;
  teamAScore: number;
  teamBScore: number;
  totalRounds: number;
  durationSeconds: number;
  shareSlug: string;
  createdAt: string;
  completedAt: string | null;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export interface RoastCard {
  matchId: string;
  playerName: string;
  steamId: string;
  mapName: string;
  scoreLine: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  headshotPct: number;
  impactRating: number;
  headlineTitle: string;
  headlineRoast: string;
  shareSlug: string;
  shareUrl: string;
  badges: Award[];
}

export interface MatchHistoryEntry {
  matchId: string;
  shareSlug: string;
  mapName: string;
  scoreLine: string;
  won: boolean;
  kills: number;
  deaths: number;
  adr: number;
  impactRating: number;
  headlineTitle: string;
  headlineRoast: string;
  badges: Award[];
  matchDate: string;
}
