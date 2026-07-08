import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PlayersService {
  constructor(private readonly prisma: PrismaService) {}

  async getStatsForUser(userId: string) {
    const stats = await this.prisma.playerStats.findUnique({ where: { userId } });
    if (!stats) throw new NotFoundException("Player stats not found.");
    return stats;
  }

  async ensureStats(userId: string) {
    const existing = await this.prisma.playerStats.findUnique({ where: { userId } });
    if (existing) return existing;
    return this.prisma.playerStats.create({ data: { userId } });
  }

  async addPoints(userId: string, amount: number, reason?: string, meta?: Record<string, unknown>) {
    await this.ensureStats(userId);
    await this.prisma.pointsTransaction.create({
      data: { userId, amount, reason, meta: meta as Prisma.InputJsonValue | undefined },
    });
    const updated = await this.prisma.playerStats.update({ where: { userId }, data: { points: { increment: amount } } as any });
    return updated;
  }

  async addXp(userId: string, xpAmount: number) {
    await this.ensureStats(userId);
    // simple level logic: every 100 xp = level up
    const stats = await this.prisma.playerStats.update({ where: { userId }, data: { xp: { increment: xpAmount } } as any });
    const newLevel = Math.floor(stats.xp / 100) + 1;
    if (newLevel > stats.level) {
      await this.prisma.playerStats.update({ where: { userId }, data: { level: newLevel } as any });
    }
    return this.prisma.playerStats.findUnique({ where: { userId } });
  }

  async applyReward(
    userId: string,
    payload: { event: string; reason?: string; points?: number; xp?: number; streak?: number; meta?: Record<string, unknown> },
  ) {
    await this.ensureStats(userId);

    const update: Record<string, any> = {};
    const current = await this.prisma.playerStats.findUnique({ where: { userId } });

    if (typeof payload.points === "number" && payload.points !== 0) {
      await this.prisma.pointsTransaction.create({
        data: {
          userId,
          amount: payload.points,
          reason: payload.reason ?? payload.event,
          meta: payload.meta as Prisma.InputJsonValue | undefined,
        },
      });
      update.points = { increment: payload.points };
    }

    if (typeof payload.xp === "number" && payload.xp !== 0) {
      await this.addXp(userId, payload.xp);
    }

    if (typeof payload.streak === "number" && current) {
      const nextStreak = Math.max(current.streak, payload.streak);
      const longestStreak = Math.max(current.longestStreak ?? 0, nextStreak);
      if (nextStreak !== current.streak || longestStreak !== current.longestStreak) {
        update.streak = nextStreak;
        update.longestStreak = longestStreak;
      }
    }

    if (Object.keys(update).length > 0) {
      await this.prisma.playerStats.update({ where: { userId }, data: update as any });
    }

    return this.prisma.playerStats.findUnique({ where: { userId } });
  }

  async awardBadge(userId: string, badgeKey: string) {
    const badge = await this.prisma.badge.findUnique({ where: { key: badgeKey } });
    if (!badge) throw new NotFoundException("Badge not found");

    await this.ensureStats(userId);

    await this.prisma.userBadge.upsert({
      where: { userId_badgeId: { userId, badgeId: badge.id } },
      create: { userId, badgeId: badge.id },
      update: {},
    });

    await this.prisma.playerStats.update({ where: { userId }, data: { achievementsCount: { increment: 1 }, points: { increment: badge.points } } as any });

    return this.prisma.userBadge.findUnique({ where: { userId_badgeId: { userId, badgeId: badge.id } }, include: { badge: true } });
  }

  async getLeaderboard(scope: { type: "global" | "weekly" | "national" | "school" | "corporate"; country?: string; school?: string; corporate?: string }, limit = 50) {
    // Basic implementation: global/top by points
    const where: any = {};
    if (scope.type === "national") where.country = scope.country;
    if (scope.type === "school") where.school = scope.school;
    if (scope.type === "corporate") where.corporate = scope.corporate;

    const rows = await this.prisma.playerStats.findMany({ where, orderBy: { points: "desc" }, take: limit });
    return rows;
  }

  async recordArenaHistory(userId: string, competitionId: string, attemptId?: string, score?: number, rank?: number, result?: unknown) {
    return this.prisma.arenaHistory.create({
      data: {
        userId,
        competitionId,
        attemptId,
        score,
        rank,
        result: result as Prisma.InputJsonValue | undefined,
      },
    });
  }
}
