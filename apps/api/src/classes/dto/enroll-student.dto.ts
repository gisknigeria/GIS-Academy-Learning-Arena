import { IsString, MinLength } from "class-validator";

export class EnrollStudentDto {
  @IsString()
  @MinLength(2)
  userId!: string;
}
