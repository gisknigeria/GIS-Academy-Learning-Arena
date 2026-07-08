import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PlayersService } from "./players.service";

@UseGuards(JwtAuthGuard)
@Controller("players")
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get("me/stats")
  meStats(@Req() req: any) {
    return this.playersService.getStatsForUser(req.user.sub);
  }

  @Post(":userId/points")
  addPoints(@Param("userId") userId: string, @Body() body: { amount: number; reason?: string; meta?: any }) {
    return this.playersService.addPoints(userId, body.amount, body.reason, body.meta);
  }

  @Post(":userId/reward")
  reward(@Param("userId") userId: string, @Body() body: { event: string; reason?: string; points?: number; xp?: number; streak?: number; meta?: any }) {
    return this.playersService.applyReward(userId, body);
  }

  @Post(":userId/award-badge")
  awardBadge(@Param("userId") userId: string, @Body() body: { badgeKey: string }) {
    return this.playersService.awardBadge(userId, body.badgeKey);
  }

  @Get("leaderboard/global")
  globalLeaderboard() {
    return this.playersService.getLeaderboard({ type: "global" });
  }

  @Get(":userId/history")
  history(@Param("userId") userId: string) {
    return this.playersService.getStatsForUser(userId);
  }
}
