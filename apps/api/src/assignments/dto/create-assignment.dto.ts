import { IsBoolean, IsDateString, IsInt, IsOptional, IsString, Min } from "class-validator";

export class CreateAssignmentDto {
  @IsString()
  title!: string;

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
}
