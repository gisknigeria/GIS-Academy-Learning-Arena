import { Module, forwardRef } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { EmailModule } from "../email/email.module";
import { UsersModule } from "../users/users.module";
import { AccessControlService } from "./access-control.service";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";

@Module({
  imports: [
    forwardRef(() => UsersModule),
    EmailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>("JWT_SECRET") ?? "dev-only-secret",
        signOptions: {
          expiresIn: (configService.get<string>("JWT_EXPIRES_IN") ?? "1d") as never,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, RolesGuard, AccessControlService],
  exports: [AuthService, JwtAuthGuard, RolesGuard, JwtModule, AccessControlService],
})
export class AuthModule {}
