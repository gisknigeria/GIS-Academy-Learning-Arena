import { IsInt, IsOptional, IsString, Min } from "class-validator";

export class ImportLessonDto {
  @IsString()
  sourceLessonId!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}
