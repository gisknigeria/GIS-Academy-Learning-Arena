import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { SubmissionStatus } from "@prisma/client";

export class GradeSubmissionDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  score?: number;

  @IsOptional()
  @IsString()
  feedback?: string;

  @IsEnum(SubmissionStatus)
  status!: SubmissionStatus;
}
