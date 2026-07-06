import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  /**
   * Warm the Neon connection on startup using a lightweight query.
   * Neon free-tier suspends after inactivity — the first query after
   * suspension can take 5–30 seconds. We fire this in the background
   * so the API starts immediately and retries until Neon wakes up.
   */
  async onModuleInit() {
    void this.warmConnection();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private async warmConnection(maxAttempts = 10) {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        // A minimal query — just enough to wake Neon and confirm connectivity
        await this.$queryRaw`SELECT 1`;
        this.logger.log("Database ready.");
        return;
      } catch {
        const waitSec = Math.min(attempt * 4, 30);
        this.logger.warn(
          `DB warm-up attempt ${attempt}/${maxAttempts} — Neon may be waking from suspension. ` +
          `Retrying in ${waitSec}s…`,
        );

        if (attempt === maxAttempts) {
          this.logger.error(
            "Could not warm DB connection. API is live — DB calls will work once Neon resumes.",
          );
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, waitSec * 1000));
      }
    }
  }
}
