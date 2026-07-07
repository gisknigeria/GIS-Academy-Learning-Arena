import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";
import { UserRole } from "@prisma/client";

export class QueryReportsDto {
  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  classId?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  competitionId?: string;
}
