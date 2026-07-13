import { ArrayUnique, IsArray, IsString } from "class-validator";

export class SetLessonUnlocksDto {
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  lessonIds!: string[];
}
