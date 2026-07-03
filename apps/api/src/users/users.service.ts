import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { User, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";

export type SafeUser = Omit<User, "passwordHash">;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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

  async list(): Promise<SafeUser[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return users.map((user) => this.toSafeUser(user));
  }

  toSafeUser(user: User): SafeUser {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
