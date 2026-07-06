import { IsInt, IsObject, IsOptional, Min } from "class-validator";

export class SubmitCompetitionAttemptDto {
  @IsObject()
  answers!: Record<string, string>;

  @IsOptional()
  @IsInt()
  @Min(0)
  durationSec?: number;
}
