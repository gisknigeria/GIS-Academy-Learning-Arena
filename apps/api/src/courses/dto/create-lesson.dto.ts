import { IsArray, IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from "class-validator";

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
  @IsUrl({ require_tld: false })
  videoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  resourceUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  subtitleUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  slideUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  mapUrl?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{ name: string; url: string; type?: string }>;
}
