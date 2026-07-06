import { IsInt, IsOptional, IsString, IsUrl, Min, MinLength } from "class-validator";

export class CreateLessonDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsInt()
  @Min(1)
  order!: number;

  @IsOptional()
  @IsUrl({ require_tld: false })
  videoUrl?: string;

  @IsOptional()
  @IsUrl({ require_tld: false })
  resourceUrl?: string;
}
