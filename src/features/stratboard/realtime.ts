import { Client } from "@stomp/stompjs";
import { API_BASE_URL } from "../../config/api";
import type { BoardEvent, RoomParticipant } from "./types";

export const stratboardSocketPath = "/ws/stratboard";
export const roomTopic = (roomCode: string) => `/topic/stratboard/rooms/${roomCode}`;
export const roomEventDestination = (roomCode: string) => `/app/stratboard/rooms/${roomCode}/event`;

export function connectRoom(options: {
  roomCode: string;
  participant: RoomParticipant;
  token?: string;
  onEvent: (event: BoardEvent) => void;
  onStatus: (status: "connecting" | "connected" | "disconnected" | "error") => void;
}) {
  const origin = new URL(API_BASE_URL || window.location.origin);
  origin.protocol = origin.protocol === "https:" ? "wss:" : "ws:";
  origin.pathname = stratboardSocketPath;
  origin.search = "";
  const client = new Client({
    brokerURL: origin.href,
    reconnectDelay: 3000,
    connectHeaders: options.token ? { Authorization: `Bearer ${options.token}` } : {},
    onConnect: () => {
      options.onStatus("connected");
      client.subscribe(roomTopic(options.roomCode), (message) => {
        try { options.onEvent(JSON.parse(message.body) as BoardEvent); }
        catch { options.onStatus("error"); }
      });
      client.publish({ destination: roomEventDestination(options.roomCode), body: JSON.stringify({ eventType: "PARTICIPANT_JOIN", participantId: options.participant.participantId, participant: options.participant }) });
    },
    onWebSocketClose: () => options.onStatus("disconnected"),
    onStompError: () => options.onStatus("error"),
  });
  options.onStatus("connecting");
  client.activate();
  return {
    publish(event: BoardEvent) {
      if (!client.connected) return false;
      client.publish({ destination: roomEventDestination(options.roomCode), body: JSON.stringify(event) });
      return true;
    },
    disconnect() {
      if (client.connected) client.publish({ destination: roomEventDestination(options.roomCode), body: JSON.stringify({ eventType: "PARTICIPANT_LEAVE", participantId: options.participant.participantId }) });
      void client.deactivate();
    },
  };
}
