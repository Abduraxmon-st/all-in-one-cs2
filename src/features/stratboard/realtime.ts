/** STOMP destinations. Transport and connection lifecycle are added during integration. */
export const stratboardSocketPath = "/ws/stratboard";
export const roomTopic = (roomCode: string) => `/topic/stratboard/rooms/${roomCode}`;
export const roomEventDestination = (roomCode: string) => `/app/stratboard/rooms/${roomCode}/event`;
