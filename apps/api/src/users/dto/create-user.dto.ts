import { UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  ageBand?: string;

  @IsOptional()
  @IsString()
  organisation?: string;

  @IsOptional()
  @IsString()
  trainingCategory?: string;

  @IsOptional()
  @IsString()
  learningMode?: string;

  @IsOptional()
  @IsString()
  learningGoal?: string;

  @IsOptional()
  @IsString()
  fanCategory?: string;

  @IsOptional()
  @IsString()
  favorite?: string;

  @IsOptional()
  @IsString()
  learningStyle?: string;

  @IsOptional()
  @IsString()
  competitionType?: string;

  @IsOptional()
  @IsString()
  courseInterest?: string;

  @IsOptional()
  @IsString()
  notificationPreference?: string;

  @IsOptional()
  @IsString()
  languagePreference?: string;
}
