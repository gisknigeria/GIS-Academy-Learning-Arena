import { IsOptional, IsString } from "class-validator";

export class JoinCompetitionDto {
  @IsOptional()
  @IsString()
  joinCode?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsOptional()
  @IsString()
  teamName?: string;

  @IsOptional()
  @IsString()
  teamCode?: string;
}
