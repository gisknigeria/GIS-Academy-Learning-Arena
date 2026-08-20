import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { UserRole, UserStatus } from "@prisma/client";
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
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly usersService: UsersService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    // Public registration only permits learners and trainers. Privileged
    // roles must continue to be assigned by an administrator.
    const requestedRole = createUserDto.role === UserRole.TRAINER ? UserRole.TRAINER : UserRole.STUDENT;
    const user = await this.usersService.create({
      ...createUserDto,
      role: requestedRole,
    });
    void this.emailService.sendWelcomeEmail(user.email, user.fullName).catch(() => undefined);
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return { user, ...tokens };
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

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException("This account has been suspended.");
    }

    const safeUser = this.usersService.toSafeUser(user);
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return { user: safeUser, ...tokens };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken);
      const user = await this.usersService.findSafeById(payload.sub);
      if (user.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException("This account has been suspended.");
      }
      const tokens = await this.signTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        paymentStatus: user.paymentStatus,
      });
      return { user, ...tokens };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException("Invalid or expired refresh token.");
    }
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
    const tokens = await this.signTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      paymentStatus: user.paymentStatus,
    });

    return {
      message: "Promo code accepted. Paid courses are now unlocked.",
      user,
      ...tokens,
    };
  }

  private async signTokens(payload: AuthTokenPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync({ ...payload, tokenType: "access" }),
      this.jwtService.signAsync(
        { ...payload, tokenType: "refresh" },
        { expiresIn: (this.configService.get<string>("JWT_REFRESH_EXPIRES_IN") ?? "30d") as never },
      ),
    ]);
    return { accessToken, refreshToken };
  }
}
