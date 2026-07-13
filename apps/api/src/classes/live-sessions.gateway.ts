import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

type LiveParticipant = {
  socketId: string;
  sessionId: string;
  displayName?: string;
  role?: string;
};

@WebSocketGateway({ namespace: "/live-sessions", cors: { origin: true, credentials: true } })
export class LiveSessionsGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private participants = new Map<string, LiveParticipant>();

  @SubscribeMessage("join-session")
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { sessionId: string; displayName?: string; role?: string },
  ) {
    if (!payload?.sessionId) return;

    const room = this.roomName(payload.sessionId);
    const existing = Array.from(this.participants.values()).filter((item) => item.sessionId === payload.sessionId);
    const participant: LiveParticipant = {
      socketId: client.id,
      sessionId: payload.sessionId,
      displayName: payload.displayName,
      role: payload.role,
    };

    this.participants.set(client.id, participant);
    void client.join(room);
    client.emit("session-participants", existing);
    client.to(room).emit("participant-joined", participant);
  }

  @SubscribeMessage("webrtc-offer")
  relayOffer(@ConnectedSocket() client: Socket, @MessageBody() payload: { to: string; description: unknown }) {
    this.server.to(payload.to).emit("webrtc-offer", {
      from: client.id,
      participant: this.participants.get(client.id),
      description: payload.description,
    });
  }

  @SubscribeMessage("webrtc-answer")
  relayAnswer(@ConnectedSocket() client: Socket, @MessageBody() payload: { to: string; description: unknown }) {
    this.server.to(payload.to).emit("webrtc-answer", {
      from: client.id,
      description: payload.description,
    });
  }

  @SubscribeMessage("webrtc-ice")
  relayIce(@ConnectedSocket() client: Socket, @MessageBody() payload: { to: string; candidate: unknown }) {
    this.server.to(payload.to).emit("webrtc-ice", {
      from: client.id,
      candidate: payload.candidate,
    });
  }

  @SubscribeMessage("whiteboard-draw")
  relayWhiteboard(@ConnectedSocket() client: Socket, @MessageBody() payload: { sessionId: string; point: unknown }) {
    client.to(this.roomName(payload.sessionId)).emit("whiteboard-draw", payload.point);
  }

  @SubscribeMessage("whiteboard-clear")
  relayWhiteboardClear(@ConnectedSocket() client: Socket, @MessageBody() payload: { sessionId: string }) {
    client.to(this.roomName(payload.sessionId)).emit("whiteboard-clear");
  }

  handleDisconnect(client: Socket) {
    const participant = this.participants.get(client.id);
    this.participants.delete(client.id);

    if (participant) {
      client.to(this.roomName(participant.sessionId)).emit("participant-left", { socketId: client.id });
    }
  }

  private roomName(sessionId: string) {
    return `live-session:${sessionId}`;
  }
}
