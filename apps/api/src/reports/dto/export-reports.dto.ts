import { IsDateString, IsEnum, IsIn, IsOptional, IsString } from "class-validator";
import { UserRole } from "@prisma/client";

const REPORT_TYPES = [
  "overview",
  "courses",
  "learners",
  "competitions",
  "certificates",
  "payments",
  "teams",
] as const;

const REPORT_FORMATS = ["csv", "pdf"] as const;

export class ExportReportsDto {
  @IsString()
  @IsIn(REPORT_TYPES)
  reportType!: typeof REPORT_TYPES[number];

  @IsString()
  @IsIn(REPORT_FORMATS)
  format!: typeof REPORT_FORMATS[number];

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
