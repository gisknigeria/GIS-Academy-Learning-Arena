import { IsString, MaxLength, MinLength } from "class-validator";

export class CreateLessonDiscussionDto {
  @IsString()
  @MinLength(3)
  @MaxLength(1200)
  question!: string;
}
