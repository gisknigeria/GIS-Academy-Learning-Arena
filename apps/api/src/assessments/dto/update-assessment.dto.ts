import { AssessmentScope } from "@prisma/client";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, MinLength } from "class-validator";

export class UpdateAssessmentDto {
  @IsOptional()
  @IsEnum(AssessmentScope)
  scope?: AssessmentScope;

  @IsOptional()
  @IsString()
  @MinLength(3)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  courseId?: string;

  @IsOptional()
  @IsString()
  lessonId?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  durationMin?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  passMark?: number;

  @IsOptional()
  @IsBoolean()
  shuffleQuestions?: boolean;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
