import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomBytes } from "crypto";
import { CompetitionMode, CompetitionStatus, QuestionType } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { EmailService } from "../email/email.service";
import { CreateCompetitionDto } from "./dto/create-competition.dto";
import { CreateTeamDto } from "./dto/create-team.dto";
import { JoinCompetitionDto } from "./dto/join-competition.dto";
import { JoinTeamDto } from "./dto/join-team.dto";
import { SubmitCompetitionAttemptDto } from "./dto/submit-competition-attempt.dto";
import { UpdateCompetitionDto } from "./dto/update-competition.dto";

@Injectable()
export class CompetitionsService {
  constructor(private readonly prisma: PrismaService, private readonly emailService: EmailService) {}

  // ---- Team invite + management helpers ----

  async createTeamInvite(
    competitionId: string,
    teamId: string,
    userId: string,
    options?: { expiresHours?: number; isAdmin?: boolean },
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.competitionId !== competitionId) throw new NotFoundException("Team not found.");

    if (!options?.isAdmin && team.createdById !== userId) {
      throw new ForbiddenException("Only the team creator or admins can create invites.");
    }

    const token = randomBytes(18).toString("base64url");
    const expiresAt = options?.expiresHours ? new Date(Date.now() + options.expiresHours * 3600 * 1000) : null;

    const invite = await this.prisma.teamInvite.create({
      data: {
        teamId,
        token,
        createdBy: userId,
        expiresAt: expiresAt ?? undefined,
      },
    });

    return invite;
  }

  async acceptTeamInvite(token: string, userId: string) {
    const invite = await this.prisma.teamInvite.findUnique({ where: { token }, include: { team: true } });
    if (!invite) throw new NotFoundException("Invite not found.");
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) throw new BadRequestException("Invite expired.");

    const team = invite.team;

    // Check team capacity / locked
    if (team.locked && team.maxMembers) {
      const count = await this.prisma.teamMember.count({ where: { teamId: team.id } });
      if (count >= team.maxMembers) throw new BadRequestException("Team is full.");
    }

    // Idempotent add
    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: team.id, userId } },
      create: { teamId: team.id, userId },
      update: {},
    });

    // Ensure competition participant record is present and linked to this team
    await this.prisma.competitionParticipant.upsert({
      where: { competitionId_userId: { competitionId: team.competitionId, userId } },
      create: { competitionId: team.competitionId, userId, teamId: team.id },
      update: { teamId: team.id },
    });

    return this.prisma.team.findUnique({ where: { id: team.id }, include: this.teamInclude() });
  }

  async setTeamLock(
    competitionId: string,
    teamId: string,
    userId: string,
    locked: boolean,
    maxMembers?: number,
    isAdmin = false,
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.competitionId !== competitionId) throw new NotFoundException("Team not found.");
    if (!isAdmin && team.createdById !== userId) throw new ForbiddenException("Only team creator or admin can change lock.");

    return this.prisma.team.update({ where: { id: teamId }, data: { locked, maxMembers } });
  }

  async setTeamCaptain(competitionId: string, teamId: string, captainId: string, userId: string, isAdmin = false) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.competitionId !== competitionId) throw new NotFoundException("Team not found.");
    if (!isAdmin && team.createdById !== userId) throw new ForbiddenException("Only team creator or admin can set captain.");

    // Ensure captain is a member
    const membership = await this.prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId: captainId } } });
    if (!membership) throw new BadRequestException("Captain must be a member of the team.");

    return this.prisma.team.update({ where: { id: teamId }, data: { captainId } });
  }

  async moveMember(competitionId: string, userIdToMove: string, targetTeamId: string) {
    const target = await this.prisma.team.findUnique({ where: { id: targetTeamId } });
    if (!target || target.competitionId !== competitionId) throw new NotFoundException("Target team not found.");

    // ensure user is participant
    const participant = await this.prisma.competitionParticipant.findUnique({ where: { competitionId_userId: { competitionId, userId: userIdToMove } } });
    if (!participant) throw new NotFoundException("User is not a participant in this competition.");

    // Check capacity
    if (target.locked && target.maxMembers) {
      const count = await this.prisma.teamMember.count({ where: { teamId: target.id } });
      if (count >= target.maxMembers) throw new BadRequestException("Target team is full.");
    }

    // Remove from old team membership if any
    await this.prisma.teamMember.deleteMany({ where: { userId: userIdToMove, team: { competitionId } } });

    // Add to new team
    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId: target.id, userId: userIdToMove } },
      create: { teamId: target.id, userId: userIdToMove },
      update: {},
    });

    // Update competition participant record
    await this.prisma.competitionParticipant.update({
      where: { competitionId_userId: { competitionId, userId: userIdToMove } },
      data: { teamId: target.id },
    });

    return this.prisma.team.findUnique({ where: { id: target.id }, include: this.teamInclude() });
  }

  async getTeamMembers(competitionId: string, teamId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId }, include: this.teamInclude() });
    if (!team || team.competitionId !== competitionId) throw new NotFoundException("Team not found.");
    return team;
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async create(dto: CreateCompetitionDto) {
    if (dto.assessmentId) {
      const a = await this.prisma.assessment.findUnique({ where: { id: dto.assessmentId } });
      if (!a) throw new NotFoundException(`Assessment "${dto.assessmentId}" not found.`);
    }

    return this.prisma.competition.create({
      data: {
        title: dto.title,
        description: dto.description,
        mode: dto.mode,
        assessmentId: dto.assessmentId,
        durationMin: dto.durationMin ?? 30,
        maxParticipants: dto.maxParticipants,
        isPublic: dto.isPublic ?? true,
        joinCode: dto.joinCode,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: this.defaultInclude(),
    });
  }

  async findAll(includeAll = false) {
    const where = includeAll
      ? {}
      : { status: { in: [CompetitionStatus.OPEN, CompetitionStatus.LIVE] as CompetitionStatus[] } };

    return this.prisma.competition.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: this.defaultInclude(),
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.competition.findUnique({
      where: { id },
      include: {
        ...this.defaultInclude(),
        assessment: {
          include: { questions: { orderBy: { order: "asc" } } },
        },
      },
    });
    if (!c) throw new NotFoundException(`Competition "${id}" not found.`);
    return c;
  }

  async update(id: string, dto: UpdateCompetitionDto) {
    await this.findOne(id);
    return this.prisma.competition.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        mode: dto.mode,
        status: dto.status,
        assessmentId: dto.assessmentId,
        durationMin: dto.durationMin,
        maxParticipants: dto.maxParticipants,
        isPublic: dto.isPublic,
        joinCode: dto.joinCode,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
      },
      include: this.defaultInclude(),
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.competition.delete({ where: { id } });
    return { deleted: true };
  }

  // ─── Join ─────────────────────────────────────────────────────────────────

  async join(competitionId: string, userId: string, dto: JoinCompetitionDto) {
    const competition = await this.findOne(competitionId);

    if (
      competition.status !== CompetitionStatus.OPEN &&
      competition.status !== CompetitionStatus.LIVE
    ) {
      throw new BadRequestException("This competition is not open for joining.");
    }

    // Check join code for private competitions
    if (!competition.isPublic) {
      if (!dto.joinCode || dto.joinCode !== competition.joinCode) {
        throw new ForbiddenException("Invalid join code.");
      }
    }

    const teamId = await this.resolveTeamForJoin(competitionId, userId, dto);

    // Check capacity
    if (competition.maxParticipants) {
      const count = await this.prisma.competitionParticipant.count({
        where: { competitionId },
      });
      if (count >= competition.maxParticipants) {
        throw new BadRequestException("This competition is full.");
      }
    }

    // Idempotent — return existing participant record if already joined
    const existing = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });

    if (existing) {
      if (teamId && existing.teamId !== teamId) {
        await this.ensureUserCanJoinTeam(competitionId, teamId, userId);
        await this.prisma.teamMember.upsert({
          where: { teamId_userId: { teamId, userId } },
          create: { teamId, userId },
          update: {},
        });
        return this.prisma.competitionParticipant.update({
          where: { competitionId_userId: { competitionId, userId } },
          data: { teamId },
          include: this.participantInclude(),
        });
      }
      return existing;
    }

    return this.prisma.competitionParticipant.create({
      data: { competitionId, userId, teamId },
      include: this.participantInclude(),
    });
  }

  async createTeam(competitionId: string, userId: string, dto: CreateTeamDto) {
    const competition = await this.findOne(competitionId);
    this.assertTeamCompetition(competition.mode);
    this.assertCompetitionJoinable(competition.status);

    const existingTeam = await this.prisma.team.findUnique({
      where: { competitionId_name: { competitionId, name: dto.name.trim() } },
    });
    if (existingTeam) throw new BadRequestException("A team with this name already exists.");

    await this.ensureUserHasNoOtherTeam(competitionId, userId);

    const team = await this.prisma.team.create({
      data: {
        competitionId,
        name: dto.name.trim(),
        code: dto.code?.trim() || undefined,
        createdById: userId,
        members: { create: { userId } },
      },
      include: this.teamInclude(),
    });

    await this.prisma.competitionParticipant.upsert({
      where: { competitionId_userId: { competitionId, userId } },
      create: { competitionId, userId, teamId: team.id },
      update: { teamId: team.id },
    });

    return team;
  }

  async joinTeam(competitionId: string, teamId: string, userId: string, dto: JoinTeamDto) {
    const competition = await this.findOne(competitionId);
    this.assertTeamCompetition(competition.mode);
    this.assertCompetitionJoinable(competition.status);
    await this.ensureUserCanJoinTeam(competitionId, teamId, userId, dto.code);

    await this.prisma.teamMember.upsert({
      where: { teamId_userId: { teamId, userId } },
      create: { teamId, userId },
      update: {},
    });

    await this.prisma.competitionParticipant.upsert({
      where: { competitionId_userId: { competitionId, userId } },
      create: { competitionId, userId, teamId },
      update: { teamId },
    });

    return this.prisma.team.findUniqueOrThrow({
      where: { id: teamId },
      include: this.teamInclude(),
    });
  }

  async listTeams(competitionId: string) {
    await this.findOne(competitionId);
    await this.rerankTeams(competitionId);

    // Default behavior: return full teams. Controller may pass viewerId/isAdmin and post-process.
    return this.prisma.team.findMany({
      where: { competitionId },
      orderBy: [{ score: "desc" }, { createdAt: "asc" }],
      include: this.teamInclude(),
    });
  }

  // ─── Attempt ──────────────────────────────────────────────────────────────

  /**
   * Start or return an in-flight attempt. Returns the competition questions
   * without correct answers.
   */
  async startAttempt(competitionId: string, userId: string) {
    const competition = await this.findOne(competitionId);

    if (competition.status !== CompetitionStatus.LIVE) {
      throw new BadRequestException("The competition is not live yet.");
    }

    // Must be a registered participant
    const participant = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });
    if (!participant) {
      throw new ForbiddenException("You have not joined this competition.");
    }

    // Only one attempt per participant
    const existing = await this.prisma.competitionAttempt.findFirst({
      where: { competitionId, userId },
    });
    if (existing) {
      return this.buildSession(competition, existing);
    }

    const attempt = await this.prisma.competitionAttempt.create({
      data: { competitionId, userId },
    });

    return this.buildSession(competition, attempt);
  }

  async submitAttempt(
    competitionId: string,
    attemptId: string,
    userId: string,
    dto: SubmitCompetitionAttemptDto,
  ) {
    const attempt = await this.prisma.competitionAttempt.findUnique({
      where: { id: attemptId },
      include: {
        competition: {
          include: { assessment: { include: { questions: true } } },
        },
      },
    });

    if (!attempt) throw new NotFoundException("Attempt not found.");
    if (attempt.userId !== userId) throw new ForbiddenException("Not your attempt.");
    if (attempt.submittedAt) throw new BadRequestException("Already submitted.");

    const questions = attempt.competition.assessment?.questions ?? [];
    let score = 0;
    let maxScore = 0;

    for (const q of questions) {
      maxScore += q.points;
      if (q.type === QuestionType.SHORT_ANSWER) continue;

      const given = (dto.answers[q.id] ?? "").trim().toLowerCase();
      const correct = (q.correctAnswer ?? "").trim().toLowerCase();
      if (given === correct && given !== "") score += q.points;
    }

    const percentage = maxScore === 0 ? 0 : Math.round((score / maxScore) * 100);

    const updated = await this.prisma.competitionAttempt.update({
      where: { id: attemptId },
      data: {
        answers: dto.answers,
        score,
        maxScore,
        percentage,
        durationSec: dto.durationSec,
        submittedAt: new Date(),
      },
    });

    // Update participant score (take best score if re-attempted)
    const participant = await this.prisma.competitionParticipant.findUnique({
      where: { competitionId_userId: { competitionId, userId } },
    });

    if (participant && score > participant.score) {
      await this.prisma.competitionParticipant.update({
        where: { competitionId_userId: { competitionId, userId } },
        data: { score },
      });
    }

    // Re-rank
    await this.rerank(competitionId);
    await this.rerankTeams(competitionId);

    return { ...updated, score, maxScore, percentage };
  }

  // ─── Leaderboard ──────────────────────────────────────────────────────────

  async getLeaderboard(competitionId: string) {
    await this.findOne(competitionId);

    return this.prisma.competitionParticipant.findMany({
      where: { competitionId },
      orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
      include: {
        ...this.participantInclude(),
      },
    });
  }

  async getMyParticipations(userId: string) {
    return this.prisma.competitionParticipant.findMany({
      where: { userId },
      orderBy: { joinedAt: "desc" },
      include: {
        competition: {
          select: {
            id: true,
            title: true,
            mode: true,
            status: true,
            durationMin: true,
            startsAt: true,
          },
        },
      },
    });
  }

  // ─── Status transitions ───────────────────────────────────────────────────

  async setStatus(id: string, status: CompetitionStatus) {
    await this.findOne(id);
    const updated = await this.prisma.competition.update({
      where: { id },
      data: { status },
      include: this.defaultInclude(),
    });

    // If competition goes live, notify participants (best-effort)
    if (status === CompetitionStatus.LIVE) {
      try {
        const participants = await this.prisma.competitionParticipant.findMany({
          where: { competitionId: id },
          include: { user: { select: { id: true, fullName: true, email: true } } },
        });

        for (const p of participants) {
          if (p.user?.email) {
            // Fire and forget
            void this.emailService.sendCompetitionLive(p.user.email, p.user.fullName, updated.title, updated.startsAt ?? undefined);
          }
        }
      } catch (err) {
        // ignore
      }
    }

    return updated;
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private defaultInclude() {
    return {
      _count: { select: { participants: true, teams: true } },
      assessment: { select: { id: true, title: true } },
    } as const;
  }

  private participantInclude() {
    return {
      user: { select: { id: true, fullName: true, email: true } },
      team: { select: { id: true, name: true, score: true, rank: true } },
    } as const;
  }

  private teamInclude() {
    return {
      _count: { select: { members: true, participants: true } },
      members: {
        include: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
    } as const;
  }

  private buildSession(
    competition: Awaited<ReturnType<typeof this.findOne>>,
    attempt: { id: string; answers: unknown },
  ) {
    const questions = (competition.assessment?.questions ?? []).map(
      ({ correctAnswer: _ca, explanation: _exp, ...q }) => q,
    );

    return {
      attemptId: attempt.id,
      competitionId: competition.id,
      title: competition.title,
      description: competition.description,
      durationMin: competition.durationMin,
      questions,
      savedAnswers: (attempt.answers as Record<string, string>) ?? {},
    };
  }

  private async rerank(competitionId: string) {
    const participants = await this.prisma.competitionParticipant.findMany({
      where: { competitionId },
      orderBy: [{ score: "desc" }, { joinedAt: "asc" }],
    });

    await this.prisma.$transaction(
      participants.map((p, i) =>
        this.prisma.competitionParticipant.update({
          where: { id: p.id },
          data: { rank: i + 1 },
        }),
      ),
    );
  }

  private isTeamMode(mode: CompetitionMode) {
    const teamModes: CompetitionMode[] = [
      CompetitionMode.TEAM,
      CompetitionMode.SCHOOL,
      CompetitionMode.CORPORATE,
      CompetitionMode.OLYMPIAD,
    ];
    return teamModes.includes(mode);
  }

  private assertTeamCompetition(mode: CompetitionMode) {
    if (!this.isTeamMode(mode)) {
      throw new BadRequestException("Teams are only available for team, school, corporate, and olympiad competitions.");
    }
  }

  private assertCompetitionJoinable(status: CompetitionStatus) {
    if (status !== CompetitionStatus.OPEN && status !== CompetitionStatus.LIVE) {
      throw new BadRequestException("This competition is not open for joining.");
    }
  }

  private async resolveTeamForJoin(competitionId: string, userId: string, dto: JoinCompetitionDto) {
    const competition = await this.prisma.competition.findUnique({
      where: { id: competitionId },
      select: { mode: true },
    });
    if (!competition || !this.isTeamMode(competition.mode)) return undefined;

    if (dto.teamId) {
      await this.ensureUserCanJoinTeam(competitionId, dto.teamId, userId, dto.teamCode);
      await this.prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: dto.teamId, userId } },
        create: { teamId: dto.teamId, userId },
        update: {},
      });
      return dto.teamId;
    }

    if (dto.teamName?.trim()) {
      await this.ensureUserHasNoOtherTeam(competitionId, userId);
      const team = await this.prisma.team.upsert({
        where: { competitionId_name: { competitionId, name: dto.teamName.trim() } },
        create: {
          competitionId,
          name: dto.teamName.trim(),
          createdById: userId,
          members: { create: { userId } },
        },
        update: {},
      });

      await this.prisma.teamMember.upsert({
        where: { teamId_userId: { teamId: team.id, userId } },
        create: { teamId: team.id, userId },
        update: {},
      });

      return team.id;
    }

    throw new BadRequestException("Choose or create a team to join this competition.");
  }

  private async ensureUserCanJoinTeam(competitionId: string, teamId: string, userId: string, code?: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { id: true, competitionId: true, code: true },
    });
    if (!team || team.competitionId !== competitionId) {
      throw new NotFoundException("Team not found for this competition.");
    }
    if (team.code && team.code !== code) {
      throw new ForbiddenException("Invalid team code.");
    }
    await this.ensureUserHasNoOtherTeam(competitionId, userId, teamId);
  }

  private async ensureUserHasNoOtherTeam(competitionId: string, userId: string, allowedTeamId?: string) {
    const membership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        team: {
          competitionId,
          ...(allowedTeamId ? { id: { not: allowedTeamId } } : {}),
        },
      },
    });
    if (membership) {
      throw new BadRequestException("You already belong to a team in this competition.");
    }
  }

  private async rerankTeams(competitionId: string) {
    const teams = await this.prisma.team.findMany({
      where: { competitionId },
      include: { participants: true },
      orderBy: { createdAt: "asc" },
    });

    const ranked = teams
      .map((team) => ({
        id: team.id,
        score: team.participants.reduce((sum, participant) => sum + participant.score, 0),
        createdAt: team.createdAt,
      }))
      .sort((a, b) => b.score - a.score || a.createdAt.getTime() - b.createdAt.getTime());

    await this.prisma.$transaction(
      ranked.map((team, index) =>
        this.prisma.team.update({
          where: { id: team.id },
          data: { score: team.score, rank: index + 1 },
        }),
      ),
    );
  }
}
