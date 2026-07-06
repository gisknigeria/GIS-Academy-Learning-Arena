import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { PaymentStatus, Prisma, User, UserRole, UserStatus } from "@prisma/client";
import { hash, compare } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { QueryUsersDto } from "./dto/query-users.dto";

export type SafeUser = Omit<User, "passwordHash">;

/** Roles that cannot be assigned by an ADMIN (only SUPER_ADMIN may grant them). */
const SUPER_ADMIN_ONLY_ROLES: UserRole[] = [UserRole.SUPER_ADMIN];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Create ──────────────────────────────────────────────────────────────

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: createUserDto.email.toLowerCase() },
          ...(createUserDto.phone ? [{ phone: createUserDto.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException("A user with this email or phone already exists.");
    }

    const passwordHash = await hash(createUserDto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email.toLowerCase(),
        phone: createUserDto.phone,
        fullName: createUserDto.fullName,
        passwordHash,
        role: createUserDto.role ?? UserRole.STUDENT,
      },
    });

    return this.toSafeUser(user);
  }

  // ─── Read ─────────────────────────────────────────────────────────────────

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findSafeById(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return this.toSafeUser(user);
  }

  async markPaidByPromo(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.update({
      where: { id },
      data: { paymentStatus: PaymentStatus.PAID },
    });

    return this.toSafeUser(user);
  }

  /**
   * Paginated, searchable user list with optional role / status / paymentStatus
   * filters. Returns safe users (no passwordHash) plus `_count` for quick stats.
   */
  async list(query: QueryUsersDto = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 30;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: "insensitive" } },
        { email: { contains: query.search, mode: "insensitive" } },
        { phone: { contains: query.search, mode: "insensitive" } },
      ];
    }

    if (query.role) where.role = query.role;
    if (query.status) where.status = query.status;
    if (query.paymentStatus) where.paymentStatus = query.paymentStatus;

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { enrollments: true, lessonProgress: true },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // ─── Update ───────────────────────────────────────────────────────────────

  /**
   * Change a user's role.
   * SUPER_ADMIN can set any role.
   * ADMIN cannot elevate to SUPER_ADMIN.
   */
  async updateRole(targetId: string, newRole: UserRole, requesterId: string, requesterRole: UserRole): Promise<SafeUser> {
    if (targetId === requesterId) {
      throw new ForbiddenException("You cannot change your own role.");
    }

    if (requesterRole === UserRole.ADMIN && SUPER_ADMIN_ONLY_ROLES.includes(newRole)) {
      throw new ForbiddenException("Only a Super Admin can assign the SUPER_ADMIN role.");
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException("User not found.");

    // ADMIN cannot demote/change another SUPER_ADMIN
    if (requesterRole === UserRole.ADMIN && target.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException("You cannot modify a Super Admin account.");
    }

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { role: newRole },
    });

    return this.toSafeUser(updated);
  }

  async updatePaymentStatus(targetId: string, paymentStatus: PaymentStatus): Promise<SafeUser> {
    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException("User not found.");

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { paymentStatus },
    });

    return this.toSafeUser(updated);
  }

  async updateStatus(targetId: string, status: UserStatus, requesterId: string): Promise<SafeUser> {
    if (targetId === requesterId) {
      throw new ForbiddenException("You cannot change your own account status.");
    }

    const target = await this.prisma.user.findUnique({ where: { id: targetId } });
    if (!target) throw new NotFoundException("User not found.");

    const updated = await this.prisma.user.update({
      where: { id: targetId },
      data: { status },
    });

    return this.toSafeUser(updated);
  }

  // ─── Progress summary ─────────────────────────────────────────────────────

  /**
   * Returns a user's enrollment list with per-course progress and
   * total lesson completions — used in the admin user detail panel.
   */
  async getUserProgress(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true, email: true },
    });

    if (!user) throw new NotFoundException("User not found.");

    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          select: { id: true, code: true, title: true },
        },
      },
      orderBy: { enrolledAt: "desc" },
    });

    const totalCompleted = await this.prisma.lessonProgress.count({ where: { userId } });

    return {
      user,
      totalCompleted,
      enrollments: enrollments.map((e) => ({
        courseId: e.courseId,
        code: e.course.code,
        title: e.course.title,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      })),
    };
  }

  // ─── Profile ──────────────────────────────────────────────────────────────

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });
    if (!user) throw new NotFoundException("User not found.");
    const { passwordHash: _ph, ...safeUser } = user;
    return safeUser;
  }

  async updateMe(userId: string, dto: { fullName?: string; phone?: string }): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");

    if (dto.phone && dto.phone !== user.phone) {
      const conflict = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
      if (conflict) throw new ConflictException("Phone number already in use.");
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone || null } : {}),
      },
    });

    return this.toSafeUser(updated);
  }

  async updateProfile(userId: string, dto: {
    gender?: string;
    country?: string;
    state?: string;
    lga?: string;
    community?: string;
    institution?: string;
    profession?: string;
    highestQualification?: string;
    preferredMode?: string;
    avatarUrl?: string;
  }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });

    return profile;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException("User not found.");

    const ok = await compare(currentPassword, user.passwordHash);
    if (!ok) throw new ForbiddenException("Current password is incorrect.");

    const newHash = await hash(newPassword, 12);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash: newHash } });

    return { changed: true };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  toSafeUser(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
