import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AuthenticatedRequest } from "../auth/types/authenticated-request";
import { LearnService } from "./learn.service";

@UseGuards(JwtAuthGuard)
@Controller("learn")
export class LearnController {
  constructor(private readonly learnService: LearnService) {}

  /**
   * GET /api/learn/feed
   * Aggregated learning feed for the authenticated user:
   *  - enrolled courses with progress + next lesson
   *  - pending/returned assignment submissions
   *  - available assessments with attempt status
   *  - upcoming classes
   */
  @Get("feed")
  getFeed(@Req() req: AuthenticatedRequest) {
    return this.learnService.getFeed(req.user.sub);
  }
}
