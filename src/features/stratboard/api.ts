/** Stratboard REST endpoint paths. Requests are added during integration. */
const base = "/api/v1/stratboard";

export const stratboardPaths = {
  lineups: `${base}/lineups`,
  lineup: (id: string) => `${base}/lineups/${encodeURIComponent(id)}`,
  tactics: `${base}/tactics`,
  myTactics: `${base}/tactics/my`,
  tactic: (idOrShareCode: string) => `${base}/tactics/${encodeURIComponent(idOrShareCode)}`,
  rooms: `${base}/rooms`,
  room: (roomCode: string) => `${base}/rooms/${encodeURIComponent(roomCode)}`,
  loadTactic: (roomCode: string, idOrShareCode: string) =>
    `${base}/rooms/${encodeURIComponent(roomCode)}/load-tactic/${encodeURIComponent(idOrShareCode)}`,
  saveRoomTactic: (roomCode: string) => `${base}/rooms/${encodeURIComponent(roomCode)}/save-tactic`,
} as const;
