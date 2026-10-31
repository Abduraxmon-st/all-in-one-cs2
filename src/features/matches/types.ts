export type MatchStatus = "QUEUED" | "PARSING" | "COMPLETED" | "FAILED";

export interface Award {
  badge: string;
  displayName: string;
  category: "FLEX" | "TROLL" | "UTILITY" | "NEUTRAL";
  emoji: string;
  description: string;
}

export interface PlayerStats {
  id: string;
  steamId: string;
  playerName: string;
  teamSide: "TEAM_A" | "TEAM_B";
  kills: number;
  deaths: number;
  assists: number;
  adr: number;
  headshotPct: number;
  kastPct: number;
  impactRating: number;
  awards: Award[];
}

export interface MatchDetail {
  id: string;
  shareCode: string | null;
  shareSlug: string;
  mapName: string | null;
  status: MatchStatus;
  teamAScore: number;
  teamBScore: number;
  durationSeconds: number;
  players?: PlayerStats[];
  createdAt: string;
  failureReason?: string | null;
}

export interface RoastCard {
  matchId: string;
  steamId: string;
  playerName: string;
  teamSide: string;
  mapName: string;
  kills: number;
  deaths: number;
  adr: number;
  headshotPct: number;
  kastPct: number;
  impactRating: number;
  primaryBadge: Award;
  allAwards: Award[];
  roastQuote: string;
  shareUrl: string;
}

export interface MatchHistoryEntry {
  matchId: string;
  shareSlug: string;
  mapName: string;
  teamSide: string;
  teamAScore: number;
  teamBScore: number;
  won: boolean;
  kills: number;
  deaths: number;
  adr: number;
  impactRating: number;
  primaryBadge: Award | null;
  playedAt: string;
}
