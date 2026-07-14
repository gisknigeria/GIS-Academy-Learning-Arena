import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateLiveSessionDto {
  @IsString()
  @MinLength(3)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  startsAt!: string;

  @IsOptional()
  @IsString()
  endsAt?: string;

  @IsOptional()
  @IsString()
  meetingUrl?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  presentationUrl?: string;

  @IsOptional()
  @IsString()
  bookUrl?: string;
}
