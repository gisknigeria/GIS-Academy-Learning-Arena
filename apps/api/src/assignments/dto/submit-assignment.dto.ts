import { IsOptional, IsString, IsUrl } from "class-validator";

export class SubmitAssignmentDto {
  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsUrl()
  fileUrl?: string;
}
