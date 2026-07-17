import { IsArray, IsOptional, IsString, IsUrl } from "class-validator";

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @IsOptional()
  @IsArray()
  evidence?: Array<{ name: string; url: string; type?: string }>;
}
