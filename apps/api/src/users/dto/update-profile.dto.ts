import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  lga?: string;

  @IsOptional()
  @IsString()
  community?: string;

  @IsOptional()
  @IsString()
  institution?: string;

  @IsOptional()
  @IsString()
  profession?: string;

  @IsOptional()
  @IsString()
  highestQualification?: string;

  @IsOptional()
  @IsString()
  preferredMode?: string;

  @IsOptional()
  @IsString()
  ageBand?: string;

  @IsOptional()
  @IsString()
  trainingCategory?: string;

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

  @IsOptional()
  @IsString()
  fontPreference?: string;

  @IsOptional()
  @IsString()
  appearanceMode?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  avatarUrl?: string;
}
