import { IsObject } from "class-validator";

export class SubmitAttemptDto {
  /** Map of questionId → answer string */
  @IsObject()
  answers!: Record<string, string>;
}
