import { IsArray, IsInt, IsOptional, IsString, Min, MinLength } from "class-validator";

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  resourceUrl?: string;

  @IsOptional()
  @IsString()
  subtitleUrl?: string;

  @IsOptional()
  @IsString()
  slideUrl?: string;

  @IsOptional()
  @IsString()
  mapUrl?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{ name: string; url: string; type?: string }>;
}
