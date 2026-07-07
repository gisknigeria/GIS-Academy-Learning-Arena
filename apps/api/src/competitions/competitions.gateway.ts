import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger, UnauthorizedException } from "@nestjs/common";
import { CompetitionsService } from "./competitions.service";
import { JwtService } from "@nestjs/jwt";

type RoomState = {
  players: Map<string, { socketId: string; userId?: string; displayName?: string; teamId?: string }>;
  timer?: NodeJS.Timeout | null;
  timerEndsAt?: number | null;
};

@WebSocketGateway({ namespace: "/competitions", cors: { origin: true, credentials: true } })
export class CompetitionsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(CompetitionsGateway.name);
  private readonly rooms = new Map<string, RoomState>();

  constructor(private readonly competitionsService: CompetitionsService, private readonly jwtService: JwtService) {}

  afterInit(): void {
    this.logger.log("Competitions gateway initialized");
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    // Try to authenticate token provided in handshake auth
    try {
      const token = (client.handshake.auth && (client.handshake.auth.token || client.handshake.auth.accessToken)) as string | undefined;
      if (token) {
        const payload = this.jwtService.verify(token, { ignoreExpiration: false });
        // attach minimal user info
        (client as any).data = { user: { id: payload.sub, role: payload.role, email: payload.email } };
        this.logger.log(`Socket ${client.id} authenticated as ${payload.sub}`);
      }
    } catch (err) {
      // don't disconnect immediately — allow anonymous sockets but restrict actions
      this.logger.debug(`Socket ${client.id} failed token verification`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    for (const [roomId, state] of this.rooms.entries()) {
      if (state.players.has(client.id)) {
        state.players.delete(client.id);
        this.server.to(roomId).emit("playerList", Array.from(state.players.values()));
        this.logger.log(`Removed ${client.id} from room ${roomId}`);
      }

      // cleanup empty rooms
      if (state.players.size === 0) {
        if (state.timer) {
          clearInterval(state.timer as any);
        }
        this.rooms.delete(roomId);
        this.logger.log(`Cleaned up empty room ${roomId}`);
      }
    }
  }

  @SubscribeMessage("joinRoom")
  async handleJoinRoom(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const { roomId, userId: payloadUserId, displayName: payloadDisplayName, teamId: payloadTeamId } = payload ?? {};
    if (!roomId) return client.emit("error", { message: "roomId required" });

    // Prefer authenticated user from socket, fall back to payload
    const authUser = (client as any).data?.user;
    const userId = authUser?.id ?? payloadUserId;
    const displayName = authUser?.email ?? payloadDisplayName;
    const teamId = payloadTeamId;
    if (!userId) {
      // allow anonymous join but mark as guest
      // optionally require auth depending on competition policy
    }

    client.join(roomId);

    let state = this.rooms.get(roomId);
    if (!state) {
      state = { players: new Map(), timer: null, timerEndsAt: null };
      this.rooms.set(roomId, state);
    }

    state.players.set(client.id, { socketId: client.id, userId, displayName, teamId });

    this.server.to(roomId).emit("playerList", Array.from(state.players.values()));

    try {
      const leaderboard = await this.competitionsService.getLeaderboard(roomId);
      this.server.to(roomId).emit("leaderboard", leaderboard);
    } catch (err) {
      // ignore if leaderboard can't be loaded yet
    }

    client.emit("joined", { roomId });
  }

  @SubscribeMessage("leaveRoom")
  handleLeaveRoom(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const { roomId } = payload ?? {};
    if (!roomId) return client.emit("error", { message: "roomId required" });

    client.leave(roomId);
    const state = this.rooms.get(roomId);
    if (!state) return;

    state.players.delete(client.id);
    this.server.to(roomId).emit("playerList", Array.from(state.players.values()));
  }

  @SubscribeMessage("startAttempt")
  async handleStartAttempt(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const { competitionId } = payload ?? {};
    const authUser = (client as any).data?.user;
    if (!competitionId || !authUser) return client.emit("error", { message: "authentication required to start attempt" });
    const userId = authUser.id as string;

    try {
      const session = await this.competitionsService.startAttempt(competitionId, userId);
      client.emit("attemptStarted", session);
    } catch (err: any) {
      client.emit("error", { message: err?.message ?? "Failed to start attempt" });
    }
  }

  @SubscribeMessage("startTimer")
  handleStartTimer(@MessageBody() payload: any) {
    const { roomId, durationSec } = payload ?? {};
    if (!roomId || typeof durationSec !== "number") return;

    const state = this.rooms.get(roomId);
    if (!state) return;

    if (state.timer) {
      clearInterval(state.timer as any);
      state.timer = null;
      state.timerEndsAt = null;
    }

    const endsAt = Date.now() + durationSec * 1000;
    state.timerEndsAt = endsAt;

    // broadcast every second
    state.timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      this.server.to(roomId).emit("timer", { remaining });
      if (remaining <= 0) {
        if (state?.timer) {
          clearInterval(state.timer as any);
          state.timer = null;
          state.timerEndsAt = null;
        }
        this.server.to(roomId).emit("timerEnded");
      }
    }, 1000);

    this.server.to(roomId).emit("timerStarted", { durationSec, endsAt });
  }

  @SubscribeMessage("submit")
  async handleSubmit(@MessageBody() payload: any, @ConnectedSocket() client: Socket) {
    const { competitionId, attemptId, answers, durationSec } = payload ?? {};
    const authUser = (client as any).data?.user;
    if (!competitionId || !attemptId || !authUser) return client.emit("error", { message: "authentication required to submit" });
    const userId = authUser.id as string;

    try {
      const result = await this.competitionsService.submitAttempt(competitionId, attemptId, userId, {
        answers: answers ?? {},
        durationSec,
      });

      // Broadcast the submission and updated leaderboards
      this.server.to(competitionId).emit("submission", { userId, result });

      const leaderboard = await this.competitionsService.getLeaderboard(competitionId);
      this.server.to(competitionId).emit("leaderboard", leaderboard);
    } catch (err: any) {
      client.emit("error", { message: err?.message ?? "submission failed" });
    }
  }
}
