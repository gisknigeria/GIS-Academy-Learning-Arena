import { IsArray, IsOptional, IsString } from "class-validator";

export class CheckAnswerDto {
  @IsString()
  questionId!: string;

  @IsOptional()
  @IsString()
  answer?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  answers?: string[];
}
