import { IsOptional, IsString, MinLength } from "class-validator";

export class IssueCertificateDto {
  @IsString()
  @MinLength(2)
  userId!: string;

  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  courseId?: string;
}
