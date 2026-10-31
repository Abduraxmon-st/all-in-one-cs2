export type TeamSide = "T" | "CT";
export type UtilityType = "SMOKE" | "FLASH" | "MOLOTOV" | "HE";
export type ElementType = "FREEHAND" | "ARROW" | "PLAYER_TOKEN" | "UTILITY_PIN";

export interface UtilityLineup {
  id: string;
  mapName: string;
  utilityType: UtilityType;
  teamSide: TeamSide;
  title: string;
  throwType: string;
  standX: number;
  standY: number;
  landX: number;
  landY: number;
  videoUrl: string | null;
  description: string | null;
  createdByUserId: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface TacticSummary {
  id: string;
  authorUserId: string;
  title: string;
  mapName: string;
  teamSide: TeamSide;
  description: string | null;
  isPublic: boolean;
  upvotes: number;
  shareCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface TacticDetail extends TacticSummary {
  canvasStateJson: string;
}

export interface Page<T> { content: T[]; totalElements: number; totalPages: number; }

export type CreateLineupRequest = Pick<UtilityLineup, "mapName" | "utilityType" | "teamSide" | "title" | "throwType" | "standX" | "standY" | "landX" | "landY" | "videoUrl" | "description">;

export interface CreateTacticRequest {
  title: string;
  mapName: string;
  teamSide: TeamSide;
  description: string;
  canvasStateJson: string;
  isPublic: boolean;
}

export interface CreateRoomRequest {
  mapName: string;
  teamSide: TeamSide;
  hostDisplayName: string;
  hostColorHex: string;
  initialTacticIdOrShareCode?: string;
}

export interface SaveRoomRequest { title: string; description: string; isPublic: boolean; }

export interface CanvasElement {
  elementId: string;
  elementType: ElementType;
  x: number;
  y: number;
  endX?: number;
  endY?: number;
  colorHex?: string;
  strokeWidth?: number;
  text?: string;
  label?: string;
  lineupId?: string;
  createdByParticipantId?: string;
}

export interface RoomParticipant {
  participantId: string;
  displayName: string;
  colorHex: string;
  userId: string | null;
  isHost: boolean;
}

export interface RoomSnapshot {
  roomCode: string;
  mapName: string;
  teamSide: TeamSide;
  hostUserId: string | null;
  hostParticipantId: string;
  participants: RoomParticipant[];
  canvasElements: CanvasElement[];
  createdAt: string;
  lastActivityAt: string;
}

export type BoardEvent =
  | { eventType: "PARTICIPANT_JOIN"; participantId: string; participant: RoomParticipant }
  | { eventType: "PARTICIPANT_LEAVE"; participantId: string }
  | { eventType: "CURSOR_MOVE"; participantId: string; cursor: { x: number; y: number } }
  | { eventType: "ELEMENT_UPSERT"; participantId: string; element: CanvasElement }
  | { eventType: "ELEMENT_DELETE"; participantId: string; elementId: string }
  | { eventType: "BOARD_CLEAR"; participantId: string }
  | { eventType: "MAP_CHANGE"; participantId: string; mapName: string; teamSide: TeamSide }
  | { eventType: "LOAD_TACTIC"; participantId: string; tacticIdOrShareCode: string };
