import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserRole } from "@prisma/client";
import { compare } from "bcryptjs";
import { EmailService } from "../email/email.service";
import { CreateUserDto } from "../users/dto/create-user.dto";
import { UsersService } from "../users/users.service";
import { LoginDto } from "./dto/login.dto";
import { RedeemPromoDto } from "./dto/redeem-promo.dto";
import { AuthTokenPayload } from "./types/authenticated-request";

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create({
      ...createUserDto,
      role: UserRole.STUDENT,
    });
    void this.emailService.sendWelcomeEmail(user.email, user.fullName).catch(() => undefined);
    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return { user, accessToken };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const passwordMatches = await compare(loginDto.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password.");
    }

    const safeUser = this.usersService.toSafeUser(user);
    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return { user: safeUser, accessToken };
  }

  async getCurrentUser(userId: string) {
    return this.usersService.findSafeById(userId);
  }

  async redeemPromo(userId: string, redeemPromoDto: RedeemPromoDto) {
    const normalizedCode = redeemPromoDto.code.trim().toUpperCase();

    if (normalizedCode !== "1234GIS") {
      throw new BadRequestException("Invalid promo code.");
    }

    const user = await this.usersService.markPaidByPromo(userId);
    const accessToken = await this.signToken({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return {
      message: "Promo code accepted. Paid courses are now unlocked.",
      user,
      accessToken,
    };
  }

  private signToken(payload: AuthTokenPayload) {
    return this.jwtService.signAsync(payload);
  }
}
