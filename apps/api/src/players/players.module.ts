import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PlayersService } from "./players.service";
import { PlayersController } from "./players.controller";

@Module({
  imports: [PrismaModule],
  providers: [PlayersService],
  controllers: [PlayersController],
  exports: [PlayersService],
})
export class PlayersModule {}
