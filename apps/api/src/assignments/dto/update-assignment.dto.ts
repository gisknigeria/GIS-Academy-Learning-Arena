import { AssignmentKind } from "@prisma/client";
import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";

export class UpdateAssignmentDto {
  @IsOptional()
  @IsString()
  moduleId?: string;

  @IsOptional()
  @IsEnum(AssignmentKind)
  kind?: AssignmentKind;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxScore?: number;

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;

  @IsOptional()
  @IsArray()
  acceptedEvidence?: string[];
}
